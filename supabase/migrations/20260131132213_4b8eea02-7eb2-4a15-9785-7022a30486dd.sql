-- Create is_admin function (checks for admin or super_admin)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin'::app_role, 'super_admin'::app_role)
  )
$$;

-- Create is_super_admin function
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'super_admin'::app_role
  )
$$;

-- Create is_affiliate function
CREATE OR REPLACE FUNCTION public.is_affiliate()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'affiliate'::app_role
  )
$$;

-- Add useful indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_subscription_requests_status ON public.subscription_requests(status);
CREATE INDEX IF NOT EXISTS idx_subscription_requests_user_id ON public.subscription_requests(user_id);

-- Update user_roles RLS to allow admins to manage roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Update subscription_requests policies for proper admin access
DROP POLICY IF EXISTS "Admins can manage all requests" ON public.subscription_requests;
CREATE POLICY "Admins can manage all requests"
ON public.subscription_requests
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Update pricing_plans to allow admin management
DROP POLICY IF EXISTS "Admins can manage all plans" ON public.pricing_plans;
CREATE POLICY "Admins can manage all plans"
ON public.pricing_plans
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());