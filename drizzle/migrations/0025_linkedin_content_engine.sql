CREATE TABLE public.linkedin_content_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  body text NOT NULL,
  keywords text[] NOT NULL DEFAULT '{}',
  hashtags text[] NOT NULL DEFAULT '{}',
  topic text,
  cta_url text NOT NULL DEFAULT 'https://botvio.live',
  target text NOT NULL DEFAULT 'organization',
  status text NOT NULL DEFAULT 'approved' CHECK (status IN ('draft','approved','scheduled','publishing','published','failed')),
  scheduled_at timestamptz,
  published_at timestamptz,
  linkedin_post_id text,
  error text,
  attempts integer NOT NULL DEFAULT 0,
  generation_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.linkedin_content_posts TO authenticated;
GRANT ALL ON public.linkedin_content_posts TO service_role;
ALTER TABLE public.linkedin_content_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage linkedin content posts"
ON public.linkedin_content_posts
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));