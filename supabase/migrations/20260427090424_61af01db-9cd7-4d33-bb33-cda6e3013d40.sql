CREATE TABLE public.user_mt5_terminals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  terminal_uid text NOT NULL,
  nickname text,
  default_lot numeric NOT NULL DEFAULT 0.01,
  auto_execute boolean NOT NULL DEFAULT false,
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, terminal_uid)
);

CREATE INDEX idx_user_mt5_terminals_user_id ON public.user_mt5_terminals(user_id);
CREATE INDEX idx_user_mt5_terminals_terminal_uid ON public.user_mt5_terminals(terminal_uid);

ALTER TABLE public.user_mt5_terminals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mt5 terminals"
ON public.user_mt5_terminals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mt5 terminals"
ON public.user_mt5_terminals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mt5 terminals"
ON public.user_mt5_terminals FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mt5 terminals"
ON public.user_mt5_terminals FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all mt5 terminals"
ON public.user_mt5_terminals FOR SELECT
USING (public.is_admin());

CREATE TRIGGER update_user_mt5_terminals_updated_at
BEFORE UPDATE ON public.user_mt5_terminals
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();