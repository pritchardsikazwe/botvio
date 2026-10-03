CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
CREATE TABLE IF NOT EXISTS private.automation_secrets (
  name text PRIMARY KEY,
  secret text NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON private.automation_secrets FROM PUBLIC, anon, authenticated;
INSERT INTO private.automation_secrets(name) VALUES ('botvio') ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_botvio_automation_secret()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = private, public AS $$
  SELECT secret FROM private.automation_secrets WHERE name = 'botvio'
$$;
REVOKE ALL ON FUNCTION public.get_botvio_automation_secret() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_botvio_automation_secret() TO service_role;