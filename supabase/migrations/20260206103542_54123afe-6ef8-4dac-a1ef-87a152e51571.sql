
-- Activate the VIP plan for monetization
UPDATE public.pricing_plans SET is_active = true WHERE code = 'vip';

-- Update free plan features: allow viewing limited signals but no premium features
UPDATE public.pricing_plans SET 
  allow_copy_trading = false, 
  allow_premium_bots = false, 
  allow_provider_listing = false,
  max_accounts = 1, 
  max_bot_instances = 0
WHERE code = 'free';

-- Update Basic to allow premium bots
UPDATE public.pricing_plans SET allow_premium_bots = true WHERE code = 'basic';

-- Update Standard to allow provider listing
UPDATE public.pricing_plans SET allow_premium_bots = true, allow_provider_listing = true WHERE code = 'standard';
