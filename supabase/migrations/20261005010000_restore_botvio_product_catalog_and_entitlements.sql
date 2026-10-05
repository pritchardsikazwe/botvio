-- Restore the Botvio product catalog and entitlement tables on the current Supabase project.
-- This migration is intentionally additive and safe to re-run.

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  type text NOT NULL,
  short_description text,
  description text,
  cover_image_url text,
  price_usd numeric(12,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  billing_type text NOT NULL DEFAULT 'one_time' CHECK (billing_type IN ('one_time','recurring')),
  billing_interval text CHECK (billing_interval IN ('month','year')),
  affiliate_percent numeric(5,2) NOT NULL DEFAULT 0,
  bot_id uuid,
  strategy_id uuid,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products"
  ON public.products FOR SELECT
  USING (is_active = true OR auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_products_active_featured
  ON public.products(is_active, is_featured);

CREATE TABLE IF NOT EXISTS public.entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','canceled','revoked')),
  started_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  source_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own entitlements" ON public.entitlements;
CREATE POLICY "Users can view own entitlements"
  ON public.entitlements FOR SELECT
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own entitlements" ON public.entitlements;
CREATE POLICY "Users can insert own entitlements"
  ON public.entitlements FOR INSERT
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage entitlements" ON public.entitlements;
CREATE POLICY "Admins can manage entitlements"
  ON public.entitlements FOR ALL
  USING (public.is_admin());

ALTER TABLE public.payment_requests
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.trading_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_payment_requests_product_id
  ON public.payment_requests(product_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_order_id
  ON public.payment_requests(order_id);

INSERT INTO public.products
  (name, slug, type, short_description, description, price_usd, is_active, is_featured, billing_type, billing_interval, affiliate_percent)
VALUES
  ('Synthetic Hub','synthetic-hub','strategy','Deriv synthetic indices, signals, charts and analysis.','Separate access to Botvio Synthetic Hub.',19,true,true,'recurring','month',10),
  ('Weltrade Hub','weltrade-hub','strategy','Weltrade SyntX markets, signals, charts and MT5 workflows.','Separate access to Botvio Weltrade Hub.',19,true,true,'recurring','month',10),
  ('Botvio Gold Robot','gold-robot','bot','MT5 automation for Botvio Gold strategies.','Licensed Botvio Gold Robot access with updates.',39,true,true,'recurring','month',10),
  ('Botvio Synthetic Robot','synthetic-robot','bot','MT5 automation for Deriv synthetic strategies.','Licensed Botvio Synthetic Robot access with updates.',39,true,true,'recurring','month',10),
  ('MT5 Direct Signals','mt5-direct','bot','Send Botvio signals directly to one connected MT5 account.','Separate paid execution entitlement; TradeCopy provider slots are not required.',29,true,true,'recurring','month',10)
ON CONFLICT (slug) DO UPDATE SET
  short_description=EXCLUDED.short_description,
  description=EXCLUDED.description,
  is_active=EXCLUDED.is_active,
  is_featured=EXCLUDED.is_featured,
  billing_type=EXCLUDED.billing_type,
  billing_interval=EXCLUDED.billing_interval,
  affiliate_percent=EXCLUDED.affiliate_percent;

INSERT INTO public.products
  (name, slug, type, short_description, description, price_usd, is_active, is_featured, billing_type, billing_interval, affiliate_percent)
SELECT
  'Botvio AI Robot','botvio-ai-robot','bot',
  'Botvio AI trading robot and automated strategy workspace.',
  'Botvio AI Robot product access.',39,true,true,'recurring','month',10
WHERE NOT EXISTS (
  SELECT 1 FROM public.products WHERE slug='botvio-ai-robot'
);
