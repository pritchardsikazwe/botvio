-- Botvio product monetization foundation.
-- Products remain admin-editable; launch prices are defaults and can be changed from Admin.

ALTER TABLE public.payment_requests
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.trading_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_payment_requests_product_id ON public.payment_requests(product_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_order_id ON public.payment_requests(order_id);

INSERT INTO public.products
  (name, slug, type, short_description, description, price_usd, is_active, is_featured, billing_type, billing_interval, affiliate_percent)
VALUES
  ('Synthetic Hub', 'synthetic-hub', 'strategy', 'Deriv synthetic indices, signals, charts and analysis.', 'Separate access to Botvio Synthetic Hub.', 19, true, true, 'recurring', 'month', 10),
  ('Weltrade Hub', 'weltrade-hub', 'strategy', 'Weltrade SyntX markets, signals, charts and MT5 workflows.', 'Separate access to Botvio Weltrade Hub.', 19, true, true, 'recurring', 'month', 10),
  ('Botvio Gold Robot', 'gold-robot', 'bot', 'MT5 automation for Botvio Gold strategies.', 'Licensed Botvio Gold Robot access with updates.', 39, true, true, 'recurring', 'month', 10),
  ('Botvio Synthetic Robot', 'synthetic-robot', 'bot', 'MT5 automation for Deriv synthetic strategies.', 'Licensed Botvio Synthetic Robot access with updates.', 39, true, true, 'recurring', 'month', 10),
  ('MT5 Direct Signals', 'mt5-direct', 'bot', 'Send Botvio signals directly to one connected MT5 account.', 'Separate paid execution entitlement; TradeCopy provider slots are not required.', 29, true, true, 'recurring', 'month', 10)
ON CONFLICT (slug) DO UPDATE SET
  short_description = EXCLUDED.short_description,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured,
  billing_type = EXCLUDED.billing_type,
  billing_interval = EXCLUDED.billing_interval,
  affiliate_percent = EXCLUDED.affiliate_percent;

