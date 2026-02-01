-- ==============================================================
-- Clean up hardcoded data and setup demo super admin (v2 - safe approach)
-- ==============================================================

-- 1) Remove pritchardsikazwe@gmail.com from super_admin role (user can re-add themselves later)
DELETE FROM public.user_roles 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE lower(email) = 'pritchardsikazwe@gmail.com'
)
AND role = 'super_admin';

-- 2) Deactivate all old plans (keep for foreign key references) and add Trial + VIP
-- First deactivate existing plans
UPDATE public.pricing_plans SET is_active = false;

-- Add unique constraint on code if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pricing_plans_code_key'
  ) THEN
    ALTER TABLE public.pricing_plans ADD CONSTRAINT pricing_plans_code_key UNIQUE (code);
  END IF;
END $$;

-- Insert or update Trial plan (1 week free)
INSERT INTO public.pricing_plans (code, name, price_usd, price_zmw, max_bot_instances, max_accounts, allow_copy_trading, allow_premium_bots, allow_provider_listing, is_active)
VALUES ('trial', 'Trial', 0, 0, 5, 3, true, true, false, true)
ON CONFLICT (code) DO UPDATE SET
  name = 'Trial',
  price_usd = 0,
  price_zmw = 0,
  max_bot_instances = 5,
  max_accounts = 3,
  allow_copy_trading = true,
  allow_premium_bots = true,
  allow_provider_listing = false,
  is_active = true;

-- Insert or update VIP plan ($25/month)
INSERT INTO public.pricing_plans (code, name, price_usd, price_zmw, max_bot_instances, max_accounts, allow_copy_trading, allow_premium_bots, allow_provider_listing, is_active)
VALUES ('vip', 'VIP', 25, 650, 999, 999, true, true, true, true)
ON CONFLICT (code) DO UPDATE SET
  name = 'VIP',
  price_usd = 25,
  price_zmw = 650,
  max_bot_instances = 999,
  max_accounts = 999,
  allow_copy_trading = true,
  allow_premium_bots = true,
  allow_provider_listing = true,
  is_active = true;

-- 3) Create function to auto-assign super_admin role to demo admin on signup
CREATE OR REPLACE FUNCTION public.handle_demo_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auto-assign super_admin to the demo admin account
  IF lower(NEW.email) = 'admin@botvio.demo' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to assign super_admin on signup
DROP TRIGGER IF EXISTS on_auth_user_created_demo_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_demo_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_demo_admin_role();

-- 4) Update trial_grants table to support 1-week trials
ALTER TABLE public.trial_grants 
  ADD COLUMN IF NOT EXISTS duration_days integer DEFAULT 7;

-- 5) Clean up any test/seeded products
DELETE FROM public.products WHERE name ILIKE '%test%' OR name ILIKE '%sample%';

-- 6) Add comment for product types
COMMENT ON COLUMN public.products.type IS 'Product type: strategy, course, bot, signal_pack';