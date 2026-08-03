
-- Create site_settings singleton table for SEO & webmaster config
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_name TEXT NOT NULL DEFAULT 'Botvio',
  site_url TEXT NOT NULL DEFAULT 'https://botvio.live',
  meta_title_default TEXT DEFAULT 'Botvio – AI Trading Bots & Signals Platform',
  meta_description_default TEXT DEFAULT 'Automate your trading on Deriv, Exness & Binance. Deploy AI bots, copy top traders, and receive real-time signals.',
  og_image_url TEXT,
  logo_url TEXT,
  google_verification_code TEXT,
  bing_verification_code TEXT,
  robots_index BOOLEAN NOT NULL DEFAULT true,
  robots_follow BOOLEAN NOT NULL DEFAULT true,
  canonical_base_url TEXT DEFAULT 'https://botvio.live',
  meta_keywords TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read site settings (needed for SEO injection)
CREATE POLICY "Anyone can read site settings"
  ON public.site_settings FOR SELECT
  USING (true);

-- Only admins can update
CREATE POLICY "Admins can update site settings"
  ON public.site_settings FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can insert site settings"
  ON public.site_settings FOR INSERT
  WITH CHECK (public.is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert singleton row
INSERT INTO public.site_settings (site_name, site_url) VALUES ('Botvio', 'https://botvio.live');

-- Add onboarding_complete to profiles if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false;

-- Add affiliate links table for dynamic partner links
CREATE TABLE public.partner_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT DEFAULT 'broker',
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read partner links"
  ON public.partner_links FOR SELECT USING (true);

CREATE POLICY "Admins can manage partner links"
  ON public.partner_links FOR ALL USING (public.is_admin());

-- Seed initial partner links from hardcoded data
INSERT INTO public.partner_links (name, url, description, icon, category, sort_order) VALUES
  ('Deriv', 'https://track.deriv.com/_a_gq1w0BG0D1hit6RV3zsGNd7ZgqdRLk/1/', 'Binary options & CFDs', 'TrendingUp', 'broker', 1),
  ('Exness', 'https://one.exness-track.com/a/ts1kvs1k', 'Forex, Gold, Crypto', 'TrendingUp', 'broker', 2),
  ('Binance', 'https://www.binance.com/activity/referral-entry/CPA?ref=CPA_0047GJ3KHU', 'Crypto exchange', 'Target', 'broker', 3),
  ('WhatsApp', 'https://chat.whatsapp.com/KInahrKam85BTyFbIgC3zJ', 'Trading community', 'MessageCircle', 'community', 4),
  ('Telegram', 'https://t.me/+AZjYpDncHEA5OTM0', 'Trading community', 'Send', 'community', 5);
