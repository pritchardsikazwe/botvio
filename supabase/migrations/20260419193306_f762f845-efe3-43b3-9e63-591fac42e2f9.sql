-- ──────────────────────────────────────────────────────────────────────
-- Botvio Auto-Trade Engine — settings, executions, daily PnL tracking
-- ──────────────────────────────────────────────────────────────────────

-- 1) Per-user auto-trade settings
CREATE TABLE public.auto_trade_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  account_type TEXT NOT NULL DEFAULT 'demo' CHECK (account_type IN ('demo','real')),
  enabled_assets TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  min_confidence INTEGER NOT NULL DEFAULT 80 CHECK (min_confidence BETWEEN 50 AND 100),
  daily_loss_limit_pct NUMERIC NOT NULL DEFAULT 5.0 CHECK (daily_loss_limit_pct BETWEEN 1 AND 50),
  stake_usd NUMERIC NOT NULL DEFAULT 1.0 CHECK (stake_usd BETWEEN 0.5 AND 1000),
  multiplier INTEGER NOT NULL DEFAULT 100 CHECK (multiplier IN (10, 20, 30, 50, 100, 200, 300, 500, 1000)),
  max_open_per_asset INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.auto_trade_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own auto-trade settings"
  ON public.auto_trade_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own auto-trade settings"
  ON public.auto_trade_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all auto-trade settings"
  ON public.auto_trade_settings FOR SELECT
  USING (public.is_admin());

CREATE TRIGGER update_auto_trade_settings_updated_at
  BEFORE UPDATE ON public.auto_trade_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) Execution log — every signal → order attempt
CREATE TABLE public.auto_trade_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  display_symbol TEXT NOT NULL,
  deriv_symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('BUY','SELL')),
  signal_type TEXT NOT NULL,
  signal_tf TEXT NOT NULL CHECK (signal_tf IN ('1m','5m')),
  confidence INTEGER NOT NULL,
  entry_price NUMERIC,
  stop_loss NUMERIC,
  take_profit NUMERIC,
  stake_usd NUMERIC NOT NULL,
  multiplier INTEGER NOT NULL,
  account_type TEXT NOT NULL,
  contract_id BIGINT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','filled','rejected','failed','closed')),
  outcome TEXT CHECK (outcome IN ('win','loss','breakeven')),
  pnl_usd NUMERIC,
  error_message TEXT,
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ
);

ALTER TABLE public.auto_trade_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own auto-trade executions"
  ON public.auto_trade_executions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all auto-trade executions"
  ON public.auto_trade_executions FOR SELECT
  USING (public.is_admin());

CREATE INDEX idx_auto_trade_executions_user_date
  ON public.auto_trade_executions (user_id, created_at DESC);

CREATE INDEX idx_auto_trade_executions_open
  ON public.auto_trade_executions (user_id, display_symbol, status)
  WHERE status IN ('pending','filled');

-- 3) Helper: get today's realized PnL for kill-switch
CREATE OR REPLACE FUNCTION public.get_auto_trade_today_pnl(_user_id UUID)
RETURNS TABLE (realized_pnl_usd NUMERIC, trade_count INTEGER, win_count INTEGER, loss_count INTEGER)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    COALESCE(SUM(pnl_usd) FILTER (WHERE status = 'closed'), 0)::NUMERIC AS realized_pnl_usd,
    COUNT(*)::INTEGER AS trade_count,
    COUNT(*) FILTER (WHERE outcome = 'win')::INTEGER AS win_count,
    COUNT(*) FILTER (WHERE outcome = 'loss')::INTEGER AS loss_count
  FROM public.auto_trade_executions
  WHERE user_id = _user_id
    AND created_at >= (now() AT TIME ZONE 'UTC')::date;
$$;

-- 4) Helper: check if user has open auto-trade for an asset
CREATE OR REPLACE FUNCTION public.has_open_auto_trade(_user_id UUID, _display_symbol TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.auto_trade_executions
    WHERE user_id = _user_id
      AND display_symbol = _display_symbol
      AND status IN ('pending','filled')
  );
$$;