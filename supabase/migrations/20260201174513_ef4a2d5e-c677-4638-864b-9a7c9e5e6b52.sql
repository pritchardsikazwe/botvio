-- Fix chart_analyses RLS policies for anonymous and authenticated users
DROP POLICY IF EXISTS "Users can insert their own chart analyses" ON public.chart_analyses;
DROP POLICY IF EXISTS "Users can view their own chart analyses" ON public.chart_analyses;

-- Service role can insert (for edge function with anonymous users)
CREATE POLICY "Service role can insert chart analyses"
ON public.chart_analyses
FOR INSERT
TO service_role
WITH CHECK (true);

-- Authenticated users can insert their own analyses
CREATE POLICY "Authenticated users can insert own chart analyses"
ON public.chart_analyses
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Authenticated users can view their own analyses
CREATE POLICY "Authenticated users can view own chart analyses"
ON public.chart_analyses
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Fix user_roles policies to ensure proper super_admin access
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Super admins can view all roles (using security definer function)
CREATE POLICY "Super admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_super_admin());

-- Super admins can insert roles
CREATE POLICY "Super admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin());

-- Super admins can update roles
CREATE POLICY "Super admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.is_super_admin());

-- Super admins can delete roles
CREATE POLICY "Super admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.is_super_admin());