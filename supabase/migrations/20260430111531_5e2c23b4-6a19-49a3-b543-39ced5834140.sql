CREATE TABLE IF NOT EXISTS public.managed_mt5_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  mt5_login TEXT NOT NULL,
  mt5_server TEXT NOT NULL,
  password_encrypted TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'real' CHECK (account_type IN ('real','demo')),
  broker_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','provisioned','failed','revoked')),
  assigned_terminal_uid TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.managed_mt5_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own managed mt5 requests"
  ON public.managed_mt5_requests FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users create own managed mt5 requests"
  ON public.managed_mt5_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users cancel own pending requests"
  ON public.managed_mt5_requests FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status IN ('pending','revoked'));

CREATE POLICY "Admins manage managed mt5 requests"
  ON public.managed_mt5_requests FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER managed_mt5_requests_set_updated
  BEFORE UPDATE ON public.managed_mt5_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_managed_mt5_requests_user ON public.managed_mt5_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_managed_mt5_requests_status ON public.managed_mt5_requests(status);