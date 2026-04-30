-- Track per-user daily test sends to the shared Demo MT5 terminal
CREATE TABLE IF NOT EXISTS public.demo_mt5_test_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('BUY','SELL')),
  command_id uuid,
  sent_on date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_demo_mt5_test_sends_user_day
  ON public.demo_mt5_test_sends(user_id, sent_on);

ALTER TABLE public.demo_mt5_test_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own demo sends"
  ON public.demo_mt5_test_sends FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all demo sends"
  ON public.demo_mt5_test_sends FOR SELECT
  USING (public.is_admin());
