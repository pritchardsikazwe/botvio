-- Allow admins to view signal_manager roles
CREATE POLICY "Admins can view signal_manager roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (is_admin() AND role = 'signal_manager'::app_role);

-- Allow admins to insert signal_manager role
CREATE POLICY "Admins can insert signal_manager role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (is_admin() AND role = 'signal_manager'::app_role);

-- Allow admins to delete signal_manager role
CREATE POLICY "Admins can delete signal_manager role"
ON public.user_roles
FOR DELETE
TO authenticated
USING (is_admin() AND role = 'signal_manager'::app_role);