
CREATE TABLE public.auto_trade_instruments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  instrument_key TEXT NOT NULL,
  display_symbol TEXT NOT NULL,
  route TEXT NOT NULL DEFAULT 'deriv',
  deriv_connection_id UUID,
  stake NUMERIC NOT NULL DEFAULT 1,
  multiplier NUMERIC DEFAULT 100,
  contract_family TEXT NOT NULL DEFAULT 'MULTIPLIERS',
  min_confidence INTEGER NOT NULL DEFAULT 70,
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_signal_at TIMESTAMPTZ,
  last_trade_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, instrument_key),
  CHECK (route IN ('deriv','mt5')),
  CHECK (min_confidence BETWEEN 50 AND 100)
);

ALTER TABLE public.auto_trade_instruments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own auto-trade instruments"
  ON public.auto_trade_instruments FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all auto-trade instruments"
  ON public.auto_trade_instruments FOR SELECT
  USING (public.is_admin());

CREATE TRIGGER auto_trade_instruments_updated
  BEFORE UPDATE ON public.auto_trade_instruments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_auto_trade_instruments_enabled
  ON public.auto_trade_instruments (user_id, enabled) WHERE enabled = true;

CREATE TABLE public.auto_trade_user_limits (
  user_id UUID NOT NULL PRIMARY KEY,
  max_trades_per_day INTEGER NOT NULL DEFAULT 20,
  max_daily_loss_usd NUMERIC NOT NULL DEFAULT 50,
  max_open_positions INTEGER NOT NULL DEFAULT 3,
  target_profit_usd NUMERIC,
  paused BOOLEAN NOT NULL DEFAULT false,
  paused_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.auto_trade_user_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own auto-trade limits"
  ON public.auto_trade_user_limits FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all auto-trade limits"
  ON public.auto_trade_user_limits FOR SELECT
  USING (public.is_admin());

CREATE TRIGGER auto_trade_user_limits_updated
  BEFORE UPDATE ON public.auto_trade_user_limits
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.auto_trade_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running',
  candidates_scanned INTEGER NOT NULL DEFAULT 0,
  trades_placed INTEGER NOT NULL DEFAULT 0,
  trades_skipped INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  details JSONB
);

ALTER TABLE public.auto_trade_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view auto-trade runs"
  ON public.auto_trade_runs FOR SELECT
  USING (public.is_admin());

SELECT cron.schedule(
  'auto-trade-worker-2min',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://tqqkzeblmjapgbnsbtgw.supabase.co/functions/v1/auto-trade-worker',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxcWt6ZWJsbWphcGdibnNidGd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MDY2NTUsImV4cCI6MjA4NDk4MjY1NX0.xMkMJa1fHiSowNkmOmbSWtd1vhAAaHe7V7GCK7Bayt0"}'::jsonb,
    body := jsonb_build_object('triggered_at', now())
  );
  $$
);
