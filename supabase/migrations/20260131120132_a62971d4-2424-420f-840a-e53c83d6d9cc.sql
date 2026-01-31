-- Insert 6 pricing plans (Starter, Basic, Standard, Pro, Elite, Affiliate Partner)
INSERT INTO pricing_plans (code, name, price_usd, price_zmw, max_accounts, max_bot_instances, allow_copy_trading, allow_premium_bots, allow_provider_listing, is_active)
VALUES 
  ('starter', 'Starter', 0, 0, 1, 1, false, false, false, true),
  ('basic', 'Basic', 9.99, 250, 2, 2, true, false, false, true),
  ('standard', 'Standard', 19.99, 500, 3, 3, true, false, false, true),
  ('pro', 'Pro', 39.99, 1000, 5, 5, true, true, false, true),
  ('elite', 'Elite', 79.99, 2000, 999, 999, true, true, true, true),
  ('affiliate_partner', 'Affiliate Partner', 49.99, 1250, 10, 10, true, true, true, true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  price_usd = EXCLUDED.price_usd,
  price_zmw = EXCLUDED.price_zmw,
  max_accounts = EXCLUDED.max_accounts,
  max_bot_instances = EXCLUDED.max_bot_instances,
  allow_copy_trading = EXCLUDED.allow_copy_trading,
  allow_premium_bots = EXCLUDED.allow_premium_bots,
  allow_provider_listing = EXCLUDED.allow_provider_listing;

-- Add primary_market column to providers if not exists (will fail silently if exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'providers' 
                 AND column_name = 'primary_market') THEN
    ALTER TABLE public.providers ADD COLUMN primary_market text[];
  END IF;
END$$;

-- Insert sample P2P offers
INSERT INTO p2p_offers (user_id, type, price, currency, min_amount, max_amount, payment_methods, terms, is_active, completion_rate, avg_release_time)
SELECT 
  (SELECT user_id FROM profiles LIMIT 1),
  'sell',
  27.5,
  'ZMW',
  50,
  50000,
  ARRAY['Mobile Money', 'Bank Transfer'],
  'Fast release within 5 minutes. WhatsApp: +260970000001',
  true,
  98.5,
  5
WHERE EXISTS (SELECT 1 FROM profiles);

INSERT INTO p2p_offers (user_id, type, price, currency, min_amount, max_amount, payment_methods, terms, is_active, completion_rate, avg_release_time)
SELECT 
  (SELECT user_id FROM profiles LIMIT 1),
  'buy',
  26.5,
  'ZMW',
  100,
  25000,
  ARRAY['Airtel Money'],
  'Quick payment guaranteed. Telegram: @trader001',
  true,
  100,
  3
WHERE EXISTS (SELECT 1 FROM profiles);