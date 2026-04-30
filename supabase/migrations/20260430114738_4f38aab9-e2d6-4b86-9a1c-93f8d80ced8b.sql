-- Per-user demo MT5 opt-in
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS use_demo_mt5 boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.user_settings.use_demo_mt5 IS
  'When true, hub auto-send routes signals to the shared admin demo MT5 terminal instead of failing.';

-- Paper-trade simulation table
CREATE TABLE IF NOT EXISTS public.paper_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('BUY','SELL')),
  lot numeric NOT NULL DEFAULT 0.01,
  entry_price numeric NOT NULL,
  sl numeric,
  tp numeric,
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','CLOSED')),
  outcome text CHECK (outcome IN ('win','loss','break_even')),
  exit_price numeric,
  pnl_usd numeric,
  source text,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_paper_trades_user_status ON public.paper_trades (user_id, status);
CREATE INDEX IF NOT EXISTS idx_paper_trades_user_opened ON public.paper_trades (user_id, opened_at DESC);

ALTER TABLE public.paper_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own paper trades"
  ON public.paper_trades FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users insert own paper trades"
  ON public.paper_trades FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own paper trades"
  ON public.paper_trades FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own paper trades"
  ON public.paper_trades FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Seed Demo MT5 admin settings (off by default — admin sets terminal_uid)
INSERT INTO public.app_settings (key, value, description)
VALUES (
  'demo_mt5',
  jsonb_build_object(
    'enabled', false,
    'terminal_uid', '',
    'max_lot', 0.01,
    'note', 'Shared demo MT5 terminal running on Botvio VPS'
  ),
  'Shared demo MT5 terminal config — when enabled, opted-in users route auto-send signals here.'
)
ON CONFLICT (key) DO NOTHING;