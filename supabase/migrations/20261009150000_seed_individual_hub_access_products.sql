-- Seed individually assignable subscription products for each Botvio signal source/hub.
-- Admin Control Center > Users > Manage User Access reads active rows from public.products.
-- Keep these as separate products so access can be granted/revoked per source.

INSERT INTO public.products (
  name, slug, type, description, short_description,
  price_usd, is_active, is_featured, billing_type, billing_interval, affiliate_percent
)
VALUES
  (
    'MT5 Direct Signals', 'mt5-direct-signals', 'signal_pack',
    'Access to the MT5 Direct Signals feed and its published trading signals.',
    'MT5 Direct signal feed access', 0, true, false, 'recurring', 'monthly', 0
  ),
  (
    'Botvio Gold Robot', 'botvio-gold-robot', 'bot',
    'Access to signals and features published by the Botvio Gold Robot.',
    'Gold Robot signals access', 0, true, false, 'recurring', 'monthly', 0
  ),
  (
    'Botvio Synthetic Robot', 'botvio-synthetic-robot', 'bot',
    'Access to signals and features published by the Botvio Synthetic Robot.',
    'Synthetic Robot signals access', 0, true, false, 'recurring', 'monthly', 0
  ),
  (
    'Synthetic Hub', 'synthetic-hub', 'signal_pack',
    'Subscription access to the Synthetic Hub signal feed.',
    'Synthetic Hub signals access', 0, true, false, 'recurring', 'monthly', 0
  ),
  (
    'Weltrade Hub', 'weltrade-hub', 'signal_pack',
    'Subscription access to the Weltrade Hub signal feed.',
    'Weltrade Hub signals access', 0, true, false, 'recurring', 'monthly', 0
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  description = EXCLUDED.description,
  short_description = EXCLUDED.short_description,
  is_active = true;
