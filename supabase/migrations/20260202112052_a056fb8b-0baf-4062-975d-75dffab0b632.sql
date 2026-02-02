-- Allow admins/super_admins to read ALL profiles for admin dashboard
CREATE POLICY "Admins can read all profiles"
ON public.profiles
FOR SELECT
USING (is_admin());

-- Allow admins to read all user_plan_subscriptions
CREATE POLICY "Admins can read all subscriptions"
ON public.user_plan_subscriptions
FOR SELECT
USING (is_admin());

-- Allow admins to read all user_settings
CREATE POLICY "Admins can read all user settings"
ON public.user_settings
FOR SELECT
USING (is_admin());