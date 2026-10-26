CREATE TABLE public.linkedin_org_connection (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  org_urn text,
  org_name text,
  oauth_state text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.linkedin_org_connection TO service_role;
ALTER TABLE public.linkedin_org_connection ENABLE ROW LEVEL SECURITY;