
-- 1. Singleton settings table for chart upload limits
CREATE TABLE IF NOT EXISTS public.chart_limit_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  free_trial_days integer NOT NULL DEFAULT 3,
  free_daily_uploads integer NOT NULL DEFAULT 1,
  basic_uploads integer NOT NULL DEFAULT 50,
  basic_period_days integer NOT NULL DEFAULT 7,
  standard_uploads integer NOT NULL DEFAULT 100,
  standard_period_days integer NOT NULL DEFAULT 30,
  vip_daily_uploads integer NOT NULL DEFAULT 10,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

-- Seed singleton row
INSERT INTO public.chart_limit_settings (id) 
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM public.chart_limit_settings);

-- Updated_at trigger
DROP TRIGGER IF EXISTS trg_chart_limit_settings_updated_at ON public.chart_limit_settings;
CREATE TRIGGER trg_chart_limit_settings_updated_at
BEFORE UPDATE ON public.chart_limit_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.chart_limit_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can read chart limits" ON public.chart_limit_settings;
CREATE POLICY "Anyone authenticated can read chart limits"
ON public.chart_limit_settings FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Anon can read chart limits" ON public.chart_limit_settings;
CREATE POLICY "Anon can read chart limits"
ON public.chart_limit_settings FOR SELECT
TO anon
USING (true);

DROP POLICY IF EXISTS "Admins can update chart limits" ON public.chart_limit_settings;
CREATE POLICY "Admins can update chart limits"
ON public.chart_limit_settings FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert chart limits" ON public.chart_limit_settings;
CREATE POLICY "Admins can insert chart limits"
ON public.chart_limit_settings FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- 2. Atomic slot claim function: per-user advisory lock prevents parallel uploads from racing the cap
CREATE OR REPLACE FUNCTION public.claim_chart_upload_slot(_user_id uuid)
RETURNS TABLE(
  allowed boolean,
  reason text,
  plan_code text,
  remaining integer,
  daily_max integer,
  trial_expired boolean,
  trial_days integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings public.chart_limit_settings%ROWTYPE;
  v_plan text := 'free';
  v_is_admin boolean := false;
  v_signup timestamptz;
  v_signup_date date;
  v_today date := (now() AT TIME ZONE 'UTC')::date;
  v_trial_end date;
  v_used_today integer := 0;
  v_used_period integer := 0;
  v_max integer;
  v_period_start timestamptz;
BEGIN
  IF _user_id IS NULL THEN
    RETURN QUERY SELECT false, 'unauthenticated'::text, 'free'::text, 0, 0, false, 3;
    RETURN;
  END IF;

  -- Per-user advisory lock so concurrent uploads serialize through this function
  PERFORM pg_advisory_xact_lock(hashtextextended('chart_upload:' || _user_id::text, 0));

  -- Load settings (singleton)
  SELECT * INTO v_settings FROM public.chart_limit_settings LIMIT 1;
  IF v_settings.id IS NULL THEN
    -- Defaults if somehow missing
    v_settings.free_trial_days := 3;
    v_settings.free_daily_uploads := 1;
    v_settings.vip_daily_uploads := 10;
    v_settings.basic_uploads := 50;
    v_settings.basic_period_days := 7;
    v_settings.standard_uploads := 100;
    v_settings.standard_period_days := 30;
  END IF;

  -- Admin bypass
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin'::app_role, 'super_admin'::app_role, 'signal_manager'::app_role)
  ) INTO v_is_admin;

  IF v_is_admin THEN
    RETURN QUERY SELECT true, 'admin_bypass'::text, 'admin'::text, 9999, 9999, false, v_settings.free_trial_days;
    RETURN;
  END IF;

  -- Plan
  SELECT pp.code INTO v_plan
  FROM public.user_plan_subscriptions ups
  JOIN public.pricing_plans pp ON pp.id = ups.pricing_plan_id
  WHERE ups.user_id = _user_id AND ups.status = 'active'
  LIMIT 1;
  v_plan := COALESCE(v_plan, 'free');

  -- Signup timestamp
  SELECT created_at INTO v_signup FROM auth.users WHERE id = _user_id;
  v_signup_date := COALESCE((v_signup AT TIME ZONE 'UTC')::date, v_today);

  -- Trial logic — only meaningful for free/starter
  IF v_plan IN ('free', 'starter') THEN
    -- Trial ends at start of (signup_date + trial_days). Day 0 = signup day.
    v_trial_end := v_signup_date + v_settings.free_trial_days;
    IF v_today >= v_trial_end THEN
      RETURN QUERY SELECT false, 'trial_expired'::text, v_plan, 0, v_settings.free_daily_uploads, true, v_settings.free_trial_days;
      RETURN;
    END IF;

    -- Daily count for free user (UTC day)
    SELECT COUNT(*) INTO v_used_today
    FROM public.chart_analyses
    WHERE user_id = _user_id
      AND (created_at AT TIME ZONE 'UTC')::date = v_today;

    IF v_used_today >= v_settings.free_daily_uploads THEN
      RETURN QUERY SELECT false, 'daily_limit'::text, v_plan, 0, v_settings.free_daily_uploads, false, v_settings.free_trial_days;
      RETURN;
    END IF;

    RETURN QUERY SELECT true, 'ok'::text, v_plan, GREATEST(0, v_settings.free_daily_uploads - v_used_today - 1), v_settings.free_daily_uploads, false, v_settings.free_trial_days;
    RETURN;
  END IF;

  -- VIP: per-day cap
  IF v_plan = 'vip' THEN
    SELECT COUNT(*) INTO v_used_today
    FROM public.chart_analyses
    WHERE user_id = _user_id
      AND (created_at AT TIME ZONE 'UTC')::date = v_today;

    IF v_used_today >= v_settings.vip_daily_uploads THEN
      RETURN QUERY SELECT false, 'daily_limit'::text, v_plan, 0, v_settings.vip_daily_uploads, false, v_settings.free_trial_days;
      RETURN;
    END IF;

    RETURN QUERY SELECT true, 'ok'::text, v_plan, GREATEST(0, v_settings.vip_daily_uploads - v_used_today - 1), v_settings.vip_daily_uploads, false, v_settings.free_trial_days;
    RETURN;
  END IF;

  -- Basic / Standard: rolling period
  IF v_plan = 'basic' THEN
    v_max := v_settings.basic_uploads;
    v_period_start := now() - make_interval(days => v_settings.basic_period_days);
  ELSIF v_plan = 'standard' THEN
    v_max := v_settings.standard_uploads;
    v_period_start := now() - make_interval(days => v_settings.standard_period_days);
  ELSE
    -- Unknown plan — fall back to free rules
    v_max := v_settings.free_daily_uploads;
    v_period_start := (v_today)::timestamptz;
  END IF;

  SELECT COUNT(*) INTO v_used_period
  FROM public.chart_analyses
  WHERE user_id = _user_id
    AND created_at >= v_period_start;

  IF v_used_period >= v_max THEN
    RETURN QUERY SELECT false, 'period_limit'::text, v_plan, 0, v_max, false, v_settings.free_trial_days;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, 'ok'::text, v_plan, GREATEST(0, v_max - v_used_period - 1), v_max, false, v_settings.free_trial_days;
END;
$$;

-- Read-only helper used by the client to render remaining count without claiming a slot
CREATE OR REPLACE FUNCTION public.preview_chart_upload_slot(_user_id uuid)
RETURNS TABLE(
  allowed boolean,
  reason text,
  plan_code text,
  remaining integer,
  daily_max integer,
  trial_expired boolean,
  trial_days integer,
  trial_end_date date
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings public.chart_limit_settings%ROWTYPE;
  v_plan text := 'free';
  v_is_admin boolean := false;
  v_signup timestamptz;
  v_signup_date date;
  v_today date := (now() AT TIME ZONE 'UTC')::date;
  v_trial_end date;
  v_used_today integer := 0;
  v_used_period integer := 0;
  v_max integer;
  v_period_start timestamptz;
BEGIN
  IF _user_id IS NULL THEN
    RETURN QUERY SELECT false, 'unauthenticated'::text, 'free'::text, 0, 0, false, 3, v_today;
    RETURN;
  END IF;

  SELECT * INTO v_settings FROM public.chart_limit_settings LIMIT 1;

  SELECT EXISTS(
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin'::app_role, 'super_admin'::app_role, 'signal_manager'::app_role)
  ) INTO v_is_admin;

  IF v_is_admin THEN
    RETURN QUERY SELECT true, 'admin_bypass'::text, 'admin'::text, 9999, 9999, false, v_settings.free_trial_days, v_today + v_settings.free_trial_days;
    RETURN;
  END IF;

  SELECT pp.code INTO v_plan
  FROM public.user_plan_subscriptions ups
  JOIN public.pricing_plans pp ON pp.id = ups.pricing_plan_id
  WHERE ups.user_id = _user_id AND ups.status = 'active'
  LIMIT 1;
  v_plan := COALESCE(v_plan, 'free');

  SELECT created_at INTO v_signup FROM auth.users WHERE id = _user_id;
  v_signup_date := COALESCE((v_signup AT TIME ZONE 'UTC')::date, v_today);
  v_trial_end := v_signup_date + v_settings.free_trial_days;

  IF v_plan IN ('free', 'starter') THEN
    IF v_today >= v_trial_end THEN
      RETURN QUERY SELECT false, 'trial_expired'::text, v_plan, 0, v_settings.free_daily_uploads, true, v_settings.free_trial_days, v_trial_end;
      RETURN;
    END IF;
    SELECT COUNT(*) INTO v_used_today
    FROM public.chart_analyses
    WHERE user_id = _user_id
      AND (created_at AT TIME ZONE 'UTC')::date = v_today;
    RETURN QUERY SELECT (v_used_today < v_settings.free_daily_uploads), 'ok'::text, v_plan,
      GREATEST(0, v_settings.free_daily_uploads - v_used_today), v_settings.free_daily_uploads, false, v_settings.free_trial_days, v_trial_end;
    RETURN;
  END IF;

  IF v_plan = 'vip' THEN
    SELECT COUNT(*) INTO v_used_today
    FROM public.chart_analyses
    WHERE user_id = _user_id
      AND (created_at AT TIME ZONE 'UTC')::date = v_today;
    RETURN QUERY SELECT (v_used_today < v_settings.vip_daily_uploads), 'ok'::text, v_plan,
      GREATEST(0, v_settings.vip_daily_uploads - v_used_today), v_settings.vip_daily_uploads, false, v_settings.free_trial_days, v_trial_end;
    RETURN;
  END IF;

  IF v_plan = 'basic' THEN
    v_max := v_settings.basic_uploads;
    v_period_start := now() - make_interval(days => v_settings.basic_period_days);
  ELSIF v_plan = 'standard' THEN
    v_max := v_settings.standard_uploads;
    v_period_start := now() - make_interval(days => v_settings.standard_period_days);
  ELSE
    v_max := v_settings.free_daily_uploads;
    v_period_start := (v_today)::timestamptz;
  END IF;

  SELECT COUNT(*) INTO v_used_period
  FROM public.chart_analyses
  WHERE user_id = _user_id
    AND created_at >= v_period_start;

  RETURN QUERY SELECT (v_used_period < v_max), 'ok'::text, v_plan,
    GREATEST(0, v_max - v_used_period), v_max, false, v_settings.free_trial_days, v_trial_end;
END;
$$;
