
CREATE TABLE IF NOT EXISTS public.bridge_connection_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  broker text NOT NULL,
  account_login text NOT NULL,
  server_name text NOT NULL,
  investor_password text NOT NULL,
  account_type text NOT NULL DEFAULT 'demo',
  notes text,
  contact_whatsapp text,
  contact_email text,
  status text NOT NULL DEFAULT 'pending',
  terminal_uid text,
  admin_note text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bcr_user ON public.bridge_connection_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_bcr_status ON public.bridge_connection_requests(status);

ALTER TABLE public.bridge_connection_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can view own bridge requests"
  ON public.bridge_connection_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "users can create own bridge requests"
  ON public.bridge_connection_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own pending requests"
  ON public.bridge_connection_requests FOR UPDATE
  TO authenticated
  USING ((auth.uid() = user_id AND status = 'pending') OR public.is_admin())
  WITH CHECK ((auth.uid() = user_id AND status = 'pending') OR public.is_admin());

CREATE POLICY "admins delete bridge requests"
  ON public.bridge_connection_requests FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE TRIGGER trg_bcr_updated_at
  BEFORE UPDATE ON public.bridge_connection_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
