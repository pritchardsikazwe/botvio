
-- Flipping challenges table
CREATE TABLE public.flipping_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  challenge_type text NOT NULL,
  title text NOT NULL,
  duration_days integer NOT NULL DEFAULT 7,
  starting_balance numeric NOT NULL DEFAULT 10,
  target_balance numeric NOT NULL DEFAULT 50,
  current_balance numeric NOT NULL DEFAULT 10,
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  day_number integer NOT NULL DEFAULT 1,
  total_trades integer NOT NULL DEFAULT 0,
  winning_trades integer NOT NULL DEFAULT 0,
  discipline_score integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.flipping_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own challenges" ON public.flipping_challenges
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own challenges" ON public.flipping_challenges
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own challenges" ON public.flipping_challenges
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all challenges" ON public.flipping_challenges
  FOR SELECT TO authenticated USING (public.is_admin());

-- Admin permissions table for granular admin rights
CREATE TABLE public.admin_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  permission text NOT NULL,
  granted_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, permission)
);

ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage permissions" ON public.admin_permissions
  FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Admins can view own permissions" ON public.admin_permissions
  FOR SELECT TO authenticated USING (user_id = auth.uid());
