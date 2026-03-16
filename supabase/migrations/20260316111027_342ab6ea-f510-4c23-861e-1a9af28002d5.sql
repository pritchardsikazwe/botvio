
-- Fix payment_requests: drop old admin policy and recreate with is_admin()
DROP POLICY IF EXISTS "Admins can manage payment requests" ON public.payment_requests;
CREATE POLICY "Admins can manage payment requests" ON public.payment_requests
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Fix user_plan_subscriptions: drop old admin ALL policy and recreate with is_admin()
DROP POLICY IF EXISTS "Admins can manage subscriptions" ON public.user_plan_subscriptions;
CREATE POLICY "Admins can manage subscriptions" ON public.user_plan_subscriptions
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
