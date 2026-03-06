
-- SEO pages table for admin-managed content
CREATE TABLE public.seo_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  page_type TEXT NOT NULL DEFAULT 'seo_traffic', -- seo_traffic, signal_pair, bot, country_traffic
  meta_title TEXT NOT NULL DEFAULT '',
  meta_description TEXT NOT NULL DEFAULT '',
  h1 TEXT NOT NULL DEFAULT '',
  content_json JSONB NOT NULL DEFAULT '[]'::jsonb, -- sections array
  faqs_json JSONB NOT NULL DEFAULT '[]'::jsonb, -- FAQ array
  keywords TEXT[] NOT NULL DEFAULT '{}',
  broker_cta TEXT DEFAULT 'exness', -- exness, deriv, binance
  is_active BOOLEAN NOT NULL DEFAULT true,
  country TEXT, -- for country_traffic pages
  country_flag TEXT, -- emoji flag
  market TEXT, -- for signal/bot pages
  strategy TEXT, -- for bot pages
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seo_pages ENABLE ROW LEVEL SECURITY;

-- Public read for active pages
CREATE POLICY "Anyone can read active SEO pages"
  ON public.seo_pages FOR SELECT
  USING (is_active = true);

-- Admin full access
CREATE POLICY "Admins can manage SEO pages"
  ON public.seo_pages FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Affiliate links table for admin control
CREATE TABLE public.seo_affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_key TEXT NOT NULL UNIQUE, -- exness, deriv, binance
  url TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_affiliate_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active affiliate links"
  ON public.seo_affiliate_links FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage affiliate links"
  ON public.seo_affiliate_links FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Seed default affiliate links
INSERT INTO public.seo_affiliate_links (broker_key, url, label) VALUES
  ('exness', 'https://one.exness-track.com/a/ts1kvs1k', 'Open Exness Account'),
  ('deriv', 'https://deriv.partners/rx?sidi=F9C8D3BF-5854-499A-8497-F5C370F804DC&utm_campaign=dynamicworks&utm_medium=affiliate&utm_source=CU23827', 'Open Deriv Account'),
  ('binance', 'https://www.binance.com/activity/referral-entry/CPA?ref=CPA_0047GJ3KHU', 'Open Binance Account');

-- Updated at trigger
CREATE TRIGGER set_seo_pages_updated_at
  BEFORE UPDATE ON public.seo_pages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_seo_affiliate_links_updated_at
  BEFORE UPDATE ON public.seo_affiliate_links
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
