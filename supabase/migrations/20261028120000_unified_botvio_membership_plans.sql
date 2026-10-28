-- Align existing plan records with Botvio Starter / All-Access / VIP pricing.
-- Additive only: preserve user_plan_subscriptions, payment records, and entitlement history.
ALTER TABLE public.pricing_plans
  ADD COLUMN IF NOT EXISTS customer_visible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS features jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS maps_to_tier text;

UPDATE public.pricing_plans SET
  name = 'Starter Access', price_usd = 9, maps_to_tier = 'starter', display_order = 10, customer_visible = true,
  features = '["Synthetic Hub","Weltrade Hub","Signals included with both hubs","Free courses and platform features"]'::jsonb,
  allow_copy_trading = false, allow_premium_bots = false, allow_premium_signals = true, allow_all_courses = false, allow_trading_hubs = true
WHERE lower(code) IN ('starter', 'entry');

UPDATE public.pricing_plans SET
  name = 'All-Access', price_usd = 29, maps_to_tier = 'basic', display_order = 20, customer_visible = true,
  features = '["All trading hubs","Included signals","Botvio AI Robot","Botvio Gold Robot","Premium tools and eligible courses"]'::jsonb,
  allow_copy_trading = false, allow_premium_bots = true, allow_premium_signals = true, allow_all_courses = true, allow_trading_hubs = true
WHERE lower(code) IN ('basic', 'standard', 'all_access', 'all-access');

UPDATE public.pricing_plans SET
  name = 'VIP All-Access', price_usd = 39, maps_to_tier = 'vip', display_order = 30, customer_visible = true,
  features = '["Everything in All-Access","MT5 TradeCopy","Eligible master and follower connections","Copy-trading controls and history"]'::jsonb,
  allow_copy_trading = true, allow_premium_bots = true, allow_premium_signals = true, allow_all_courses = true, allow_trading_hubs = true
WHERE lower(code) IN ('vip', 'pro', 'elite');

COMMENT ON COLUMN public.pricing_plans.maps_to_tier IS 'Canonical Botvio entitlement tier granted by this plan.';
COMMENT ON COLUMN public.pricing_plans.features IS 'Customer-facing feature list for plan cards.';

-- Plan rows are updated by their existing canonical codes; unmatched legacy codes remain unchanged for review.