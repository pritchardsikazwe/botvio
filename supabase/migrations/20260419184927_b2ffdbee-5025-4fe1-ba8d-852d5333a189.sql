-- Add daily generation limit for manually-granted sports betting access
ALTER TABLE public.sports_betting_access
  ADD COLUMN IF NOT EXISTS daily_slip_limit integer NOT NULL DEFAULT 5;

-- Track per-day slip generations for enforcement
CREATE TABLE IF NOT EXISTS public.slip_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generated_on date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, generated_on)
);

ALTER TABLE public.slip_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own generations"
  ON public.slip_generations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins view all generations"
  ON public.slip_generations FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins manage generations"
  ON public.slip_generations FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Atomic increment + check helper
CREATE OR REPLACE FUNCTION public.increment_slip_generation(_user_id uuid)
RETURNS TABLE(allowed boolean, used integer, daily_limit integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit integer;
  v_used integer;
  v_today date := (now() AT TIME ZONE 'UTC')::date;
  v_is_vip boolean;
  v_is_admin boolean;
BEGIN
  -- Admins: unlimited
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','super_admin'))
    INTO v_is_admin;

  -- VIP plan: unlimited
  SELECT EXISTS (
    SELECT 1 FROM public.user_plan_subscriptions ups
    JOIN public.pricing_plans pp ON pp.id = ups.pricing_plan_id
    WHERE ups.user_id = _user_id AND ups.status = 'active' AND pp.code = 'vip'
  ) INTO v_is_vip;

  IF v_is_admin OR v_is_vip THEN
    v_limit := 9999;
  ELSE
    SELECT daily_slip_limit INTO v_limit
    FROM public.sports_betting_access
    WHERE user_id = _user_id AND is_active = true
    LIMIT 1;
    IF v_limit IS NULL THEN
      RETURN QUERY SELECT false, 0, 0;
      RETURN;
    END IF;
  END IF;

  INSERT INTO public.slip_generations (user_id, generated_on, count)
  VALUES (_user_id, v_today, 0)
  ON CONFLICT (user_id, generated_on) DO NOTHING;

  SELECT count INTO v_used
  FROM public.slip_generations
  WHERE user_id = _user_id AND generated_on = v_today
  FOR UPDATE;

  IF v_used >= v_limit THEN
    RETURN QUERY SELECT false, v_used, v_limit;
    RETURN;
  END IF;

  UPDATE public.slip_generations
  SET count = count + 1, updated_at = now()
  WHERE user_id = _user_id AND generated_on = v_today;

  RETURN QUERY SELECT true, v_used + 1, v_limit;
END;
$$;