
-- Table for manual admin grants of sports betting access
CREATE TABLE public.sports_betting_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by uuid NOT NULL REFERENCES auth.users(id),
  reason text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.sports_betting_access ENABLE ROW LEVEL SECURITY;

-- Users can read their own access
CREATE POLICY "Users can view own access"
  ON public.sports_betting_access FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can manage all access
CREATE POLICY "Admins can manage access"
  ON public.sports_betting_access FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Function to check sports betting access (VIP plan OR manual grant)
CREATE OR REPLACE FUNCTION public.has_sports_betting_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Check VIP subscription
    SELECT 1 FROM public.user_plan_subscriptions ups
    JOIN public.pricing_plans pp ON pp.id = ups.pricing_plan_id
    WHERE ups.user_id = _user_id
      AND ups.status = 'active'
      AND pp.code = 'vip'
  )
  OR EXISTS (
    -- Check manual admin grant
    SELECT 1 FROM public.sports_betting_access
    WHERE user_id = _user_id AND is_active = true
  )
  OR EXISTS (
    -- Admins always have access
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin'::app_role, 'super_admin'::app_role)
  )
$$;
