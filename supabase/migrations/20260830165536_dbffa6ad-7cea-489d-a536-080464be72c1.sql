
CREATE TABLE IF NOT EXISTS public.bridge_request_secrets (
  request_id uuid PRIMARY KEY REFERENCES public.bridge_connection_requests(id) ON DELETE CASCADE,
  investor_password text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.bridge_request_secrets TO service_role;
ALTER TABLE public.bridge_request_secrets ENABLE ROW LEVEL SECURITY;
-- No policies for anon/authenticated: reachable only via security-definer functions.

INSERT INTO public.bridge_request_secrets (request_id, investor_password)
SELECT id, investor_password FROM public.bridge_connection_requests
ON CONFLICT (request_id) DO NOTHING;

ALTER TABLE public.bridge_connection_requests DROP COLUMN IF EXISTS investor_password;

CREATE OR REPLACE FUNCTION public.get_bridge_investor_password(_request_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_pwd text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT investor_password INTO v_pwd
  FROM public.bridge_request_secrets WHERE request_id = _request_id;

  INSERT INTO public.security_audit_log (user_id, action, details)
  VALUES (auth.uid(), 'bridge_investor_password_viewed', jsonb_build_object('request_id', _request_id));

  RETURN v_pwd;
END;
$$;

REVOKE ALL ON FUNCTION public.get_bridge_investor_password(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_bridge_investor_password(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.submit_bridge_connection_request(
  _broker text,
  _account_login text,
  _server_name text,
  _investor_password text,
  _account_type text,
  _contact_whatsapp text DEFAULT NULL,
  _contact_email text DEFAULT NULL,
  _notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF coalesce(length(_investor_password), 0) < 4 THEN
    RAISE EXCEPTION 'Investor password is too short';
  END IF;

  INSERT INTO public.bridge_connection_requests
    (user_id, broker, account_login, server_name, account_type, contact_whatsapp, contact_email, notes, status)
  VALUES
    (auth.uid(), _broker, _account_login, _server_name, _account_type, _contact_whatsapp, _contact_email, _notes, 'pending')
  RETURNING id INTO v_id;

  INSERT INTO public.bridge_request_secrets (request_id, investor_password)
  VALUES (v_id, _investor_password);

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_bridge_connection_request(text,text,text,text,text,text,text,text) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_bridge_connection_request(text,text,text,text,text,text,text,text) TO authenticated, service_role;
