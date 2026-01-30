-- Update pricing plans: Free (2 accounts, 2 days trial), Pro ($10/15 days), VIP ($25 all features)
-- Starter: 2 accounts, copy trading allowed (for free as provider with 3 accounts), 2 days trial
UPDATE public.pricing_plans 
SET 
  max_accounts = 2,
  allow_copy_trading = true,
  allow_provider_listing = true,
  max_bot_instances = 3,
  price_usd = 0,
  price_zmw = 0
WHERE code = 'starter';

-- Pro: $10 for 15 days, 5 accounts, all features except provider listing
UPDATE public.pricing_plans 
SET 
  max_accounts = 5,
  max_bot_instances = 10,
  allow_copy_trading = true,
  allow_premium_bots = true,
  allow_provider_listing = false,
  price_usd = 10,
  price_zmw = 270
WHERE code = 'pro';

-- VIP: $25 all features unlimited
UPDATE public.pricing_plans 
SET 
  max_accounts = 999,
  max_bot_instances = 999,
  allow_copy_trading = true,
  allow_premium_bots = true,
  allow_provider_listing = true,
  price_usd = 25,
  price_zmw = 680
WHERE code = 'vip';

-- Create payment_methods table for user payment options
CREATE TABLE IF NOT EXISTS public.payment_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  method_type TEXT NOT NULL, -- 'crypto', 'mobile_money', 'card'
  provider_name TEXT NOT NULL,
  provider_code TEXT NOT NULL,
  display_name TEXT NOT NULL,
  icon_url TEXT,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 10,
  min_amount NUMERIC DEFAULT 1,
  max_amount NUMERIC DEFAULT 10000,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_options ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view payment options
CREATE POLICY "Anyone can view payment options" ON public.payment_options
  FOR SELECT USING (is_active = true);

-- Insert popular payment methods by region
-- Crypto (Global)
INSERT INTO public.payment_options (country_code, country_name, method_type, provider_name, provider_code, display_name, priority) VALUES
('GLOBAL', 'Global', 'crypto', 'Bitcoin', 'btc', 'Bitcoin (BTC)', 1),
('GLOBAL', 'Global', 'crypto', 'USDT TRC20', 'usdt_trc20', 'USDT (TRC20)', 2),
('GLOBAL', 'Global', 'crypto', 'USDT ERC20', 'usdt_erc20', 'USDT (ERC20)', 3),
('GLOBAL', 'Global', 'crypto', 'Ethereum', 'eth', 'Ethereum (ETH)', 4),
('GLOBAL', 'Global', 'crypto', 'Litecoin', 'ltc', 'Litecoin (LTC)', 5);

-- Card payments (Global)
INSERT INTO public.payment_options (country_code, country_name, method_type, provider_name, provider_code, display_name, priority) VALUES
('GLOBAL', 'Global', 'card', 'Visa', 'visa', 'Visa Card', 1),
('GLOBAL', 'Global', 'card', 'Mastercard', 'mastercard', 'Mastercard', 2);

-- Africa Mobile Money
INSERT INTO public.payment_options (country_code, country_name, method_type, provider_name, provider_code, display_name, currency, priority) VALUES
('ZM', 'Zambia', 'mobile_money', 'Airtel Money', 'airtel_zm', 'Airtel Money', 'ZMW', 1),
('ZM', 'Zambia', 'mobile_money', 'MTN MoMo', 'mtn_zm', 'MTN Mobile Money', 'ZMW', 2),
('ZM', 'Zambia', 'mobile_money', 'Zamtel Kwacha', 'zamtel', 'Zamtel Kwacha', 'ZMW', 3),
('KE', 'Kenya', 'mobile_money', 'M-Pesa', 'mpesa_ke', 'M-Pesa Kenya', 'KES', 1),
('KE', 'Kenya', 'mobile_money', 'Airtel Money', 'airtel_ke', 'Airtel Money', 'KES', 2),
('TZ', 'Tanzania', 'mobile_money', 'M-Pesa', 'mpesa_tz', 'M-Pesa Tanzania', 'TZS', 1),
('TZ', 'Tanzania', 'mobile_money', 'Tigo Pesa', 'tigo_tz', 'Tigo Pesa', 'TZS', 2),
('UG', 'Uganda', 'mobile_money', 'MTN MoMo', 'mtn_ug', 'MTN Mobile Money', 'UGX', 1),
('UG', 'Uganda', 'mobile_money', 'Airtel Money', 'airtel_ug', 'Airtel Money', 'UGX', 2),
('GH', 'Ghana', 'mobile_money', 'MTN MoMo', 'mtn_gh', 'MTN Mobile Money', 'GHS', 1),
('GH', 'Ghana', 'mobile_money', 'Vodafone Cash', 'vodafone_gh', 'Vodafone Cash', 'GHS', 2),
('NG', 'Nigeria', 'mobile_money', 'OPay', 'opay_ng', 'OPay', 'NGN', 1),
('NG', 'Nigeria', 'mobile_money', 'PalmPay', 'palmpay_ng', 'PalmPay', 'NGN', 2),
('ZA', 'South Africa', 'mobile_money', 'FNB eWallet', 'fnb_za', 'FNB eWallet', 'ZAR', 1),
('ZA', 'South Africa', 'mobile_money', 'Standard Bank Instant Money', 'sbsa_za', 'Instant Money', 'ZAR', 2),
('MW', 'Malawi', 'mobile_money', 'Airtel Money', 'airtel_mw', 'Airtel Money', 'MWK', 1),
('ZW', 'Zimbabwe', 'mobile_money', 'EcoCash', 'ecocash_zw', 'EcoCash', 'ZWL', 1);