
-- Fix RLS: Add INSERT and UPDATE policies for authenticated users on user_plan_subscriptions
CREATE POLICY "Users can insert own subscription"
ON public.user_plan_subscriptions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
ON public.user_plan_subscriptions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create a free pricing plan
INSERT INTO public.pricing_plans (code, name, price_usd, price_zmw, is_active, max_accounts, max_bot_instances, allow_copy_trading, allow_premium_bots, allow_provider_listing)
VALUES ('free', 'Free', 0, 0, true, 1, 1, false, false, false)
ON CONFLICT DO NOTHING;

-- Auto-assign free plan to new users via trigger
CREATE OR REPLACE FUNCTION public.assign_free_plan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  free_plan_id uuid;
BEGIN
  SELECT id INTO free_plan_id FROM public.pricing_plans WHERE code = 'free' AND is_active = true LIMIT 1;
  IF free_plan_id IS NOT NULL THEN
    INSERT INTO public.user_plan_subscriptions (user_id, pricing_plan_id, status, current_period_start)
    VALUES (NEW.id, free_plan_id, 'active', now())
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Drop if exists to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created_assign_plan ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_plan
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.assign_free_plan();
