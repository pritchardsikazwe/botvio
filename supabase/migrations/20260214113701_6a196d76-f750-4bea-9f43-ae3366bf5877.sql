
-- Deactivate old plans: starter, free, pro, affiliate_partner, elite
UPDATE public.pricing_plans SET is_active = false WHERE code IN ('starter', 'free', 'pro', 'affiliate_partner', 'elite');

-- Update Trial plan: 3 accounts, 5 bots, copy trading, provider listing, NO premium bots
UPDATE public.pricing_plans SET 
  max_accounts = 3,
  max_bot_instances = 5,
  allow_copy_trading = true,
  allow_premium_bots = false,
  allow_provider_listing = true,
  price_usd = 0
WHERE code = 'trial';

-- Update Basic plan: 3 accounts, 5 bots, copy trading, premium bots, provider listing
UPDATE public.pricing_plans SET
  max_accounts = 3,
  max_bot_instances = 5,
  allow_copy_trading = true,
  allow_premium_bots = true,
  allow_provider_listing = true,
  price_usd = 9.99
WHERE code = 'basic';

-- Update Standard plan: 5 accounts, 10 bots, all features
UPDATE public.pricing_plans SET
  max_accounts = 5,
  max_bot_instances = 10,
  allow_copy_trading = true,
  allow_premium_bots = true,
  allow_provider_listing = true,
  price_usd = 19.99
WHERE code = 'standard';

-- Update VIP plan: unlimited everything
UPDATE public.pricing_plans SET
  max_accounts = 999,
  max_bot_instances = 999,
  allow_copy_trading = true,
  allow_premium_bots = true,
  allow_provider_listing = true,
  price_usd = 25
WHERE code = 'vip';

-- Fix subscription status constraint to include 'trial' status
ALTER TABLE public.user_plan_subscriptions DROP CONSTRAINT IF EXISTS user_plan_subscriptions_status_check;
ALTER TABLE public.user_plan_subscriptions ADD CONSTRAINT user_plan_subscriptions_status_check 
  CHECK (status = ANY (ARRAY['active', 'cancelled', 'expired', 'trial', 'pending']));
