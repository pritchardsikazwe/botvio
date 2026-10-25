CREATE TABLE public.telegram_posts (
  slug text PRIMARY KEY,
  title text NOT NULL,
  url text NOT NULL,
  status text NOT NULL DEFAULT 'posted',
  telegram_message_id bigint,
  error text,
  posted_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.telegram_posts TO service_role;

ALTER TABLE public.telegram_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role manages telegram posts" ON public.telegram_posts
  FOR ALL TO service_role USING (true) WITH CHECK (true);