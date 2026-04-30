CREATE TABLE IF NOT EXISTS public.scalp_mt5_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  display_symbol text NOT NULL,
  side text NOT NULL CHECK (side IN ('BUY','SELL')),
  signal_id text NOT NULL,
  tf text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_scalp_mt5_sends_user_symbol_time
  ON public.scalp_mt5_sends (user_id, display_symbol, sent_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_scalp_mt5_sends_signal
  ON public.scalp_mt5_sends (user_id, signal_id);
ALTER TABLE public.scalp_mt5_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own scalp mt5 sends"
  ON public.scalp_mt5_sends FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Admins view all scalp mt5 sends"
  ON public.scalp_mt5_sends FOR SELECT
  USING (public.is_admin());