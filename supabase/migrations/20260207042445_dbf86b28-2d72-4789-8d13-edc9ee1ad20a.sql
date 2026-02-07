-- Drop existing admin policy on trading_signals
DROP POLICY IF EXISTS "Admins can manage signals" ON public.trading_signals;

-- Create new policy that allows both admin and super_admin to manage signals
CREATE POLICY "Admins and super_admins can manage signals"
ON public.trading_signals
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  )
);