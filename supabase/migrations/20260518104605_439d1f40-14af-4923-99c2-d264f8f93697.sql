
-- Allow admins to view all API-connected Deriv accounts and trades
CREATE POLICY "Admins can view all deriv tokens"
ON public.user_deriv_tokens
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can view all deriv trades"
ON public.deriv_trades
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can view all active tokens"
ON public.user_active_tokens
FOR SELECT
TO authenticated
USING (public.is_admin());
