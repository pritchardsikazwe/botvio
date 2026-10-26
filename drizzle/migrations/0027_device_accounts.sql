CREATE TABLE public.device_accounts (
  device_id text NOT NULL,
  user_id uuid NOT NULL,
  first_seen timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (device_id, user_id)
);
GRANT SELECT ON public.device_accounts TO authenticated;
GRANT ALL ON public.device_accounts TO service_role;
ALTER TABLE public.device_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read device accounts" ON public.device_accounts FOR SELECT TO authenticated USING (public.is_admin());

-- Registers the caller on this device; returns how many OTHER accounts were first seen on it earlier.
CREATE OR REPLACE FUNCTION public.register_device(p_device_id text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_first timestamptz; v_count integer;
BEGIN
  IF auth.uid() IS NULL OR p_device_id IS NULL OR length(p_device_id) < 8 OR length(p_device_id) > 100 THEN RETURN 0; END IF;
  INSERT INTO device_accounts(device_id, user_id) VALUES (p_device_id, auth.uid())
  ON CONFLICT (device_id, user_id) DO UPDATE SET last_seen = now()
  RETURNING first_seen INTO v_first;
  SELECT count(*) INTO v_count FROM device_accounts WHERE device_id = p_device_id AND user_id <> auth.uid() AND first_seen < v_first;
  RETURN v_count;
END $$;
REVOKE ALL ON FUNCTION public.register_device(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.register_device(text) TO authenticated;