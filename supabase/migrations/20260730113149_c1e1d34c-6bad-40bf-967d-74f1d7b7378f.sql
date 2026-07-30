-- 1. Unlimited access allowlist
CREATE TABLE IF NOT EXISTS public.unlimited_access (
  user_id uuid PRIMARY KEY,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.unlimited_access TO authenticated;
GRANT ALL ON public.unlimited_access TO service_role;
ALTER TABLE public.unlimited_access ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS unlimited_access_self_read ON public.unlimited_access;
CREATE POLICY unlimited_access_self_read ON public.unlimited_access
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS unlimited_access_admin_all ON public.unlimited_access;
CREATE POLICY unlimited_access_admin_all ON public.unlimited_access
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.unlimited_access (user_id, note)
VALUES ('837a1fdd-31c2-43b5-9284-df4c997c4cae', 'sifotech@gmail.com — unlimited access granted by owner')
ON CONFLICT (user_id) DO NOTHING;

-- Put the account on the VIP plan so all premium services unlock
UPDATE public.user_plan_subscriptions
SET pricing_plan_id = '51c34bd2-26bc-4d2c-be84-c5f3ddba0892',
    status = 'active',
    current_period_start = now()
WHERE user_id = '837a1fdd-31c2-43b5-9284-df4c997c4cae';

INSERT INTO public.user_plan_subscriptions (user_id, pricing_plan_id, status, current_period_start)
SELECT '837a1fdd-31c2-43b5-9284-df4c997c4cae', '51c34bd2-26bc-4d2c-be84-c5f3ddba0892', 'active', now()
WHERE NOT EXISTS (SELECT 1 FROM public.user_plan_subscriptions WHERE user_id = '837a1fdd-31c2-43b5-9284-df4c997c4cae');

-- Unlimited sports/slip access too
INSERT INTO public.sports_betting_access (user_id, is_active, daily_slip_limit, granted_by)
SELECT '837a1fdd-31c2-43b5-9284-df4c997c4cae', true, 9999, '837a1fdd-31c2-43b5-9284-df4c997c4cae'
WHERE NOT EXISTS (SELECT 1 FROM public.sports_betting_access WHERE user_id = '837a1fdd-31c2-43b5-9284-df4c997c4cae');

-- 2. Chart upload limit bypass for unlimited users
CREATE OR REPLACE FUNCTION public.claim_chart_upload_slot(_user_id uuid)
 RETURNS TABLE(allowed boolean, reason text, plan_code text, remaining integer, daily_max integer, trial_expired boolean, trial_days integer)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
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

  IF EXISTS (SELECT 1 FROM public.unlimited_access WHERE user_id = _user_id) THEN
    RETURN QUERY SELECT true, 'unlimited'::text, 'unlimited'::text, 9999, 9999, false, 3650;
    RETURN;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('chart_upload:' || _user_id::text, 0));

  SELECT * INTO v_settings FROM public.chart_limit_settings LIMIT 1;
  IF v_settings.id IS NULL THEN
    v_settings.free_trial_days := 3;
    v_settings.free_daily_uploads := 1;
    v_settings.vip_daily_uploads := 10;
    v_settings.basic_uploads := 50;
    v_settings.basic_period_days := 7;
    v_settings.standard_uploads := 100;
    v_settings.standard_period_days := 30;
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin'::app_role, 'super_admin'::app_role, 'signal_manager'::app_role)
  ) INTO v_is_admin;

  IF v_is_admin THEN
    RETURN QUERY SELECT true, 'admin_bypass'::text, 'admin'::text, 9999, 9999, false, v_settings.free_trial_days;
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

  IF v_plan IN ('free', 'starter') THEN
    v_trial_end := v_signup_date + v_settings.free_trial_days;
    IF v_today >= v_trial_end THEN
      RETURN QUERY SELECT false, 'trial_expired'::text, v_plan, 0, v_settings.free_daily_uploads, true, v_settings.free_trial_days;
      RETURN;
    END IF;

    SELECT COUNT(*) INTO v_used_today
    FROM public.chart_analyses
    WHERE user_id = _user_id AND (created_at AT TIME ZONE 'UTC')::date = v_today;

    IF v_used_today >= v_settings.free_daily_uploads THEN
      RETURN QUERY SELECT false, 'daily_limit'::text, v_plan, 0, v_settings.free_daily_uploads, false, v_settings.free_trial_days;
      RETURN;
    END IF;

    RETURN QUERY SELECT true, 'ok'::text, v_plan, GREATEST(0, v_settings.free_daily_uploads - v_used_today - 1), v_settings.free_daily_uploads, false, v_settings.free_trial_days;
    RETURN;
  END IF;

  IF v_plan = 'vip' THEN
    SELECT COUNT(*) INTO v_used_today
    FROM public.chart_analyses
    WHERE user_id = _user_id AND (created_at AT TIME ZONE 'UTC')::date = v_today;

    IF v_used_today >= v_settings.vip_daily_uploads THEN
      RETURN QUERY SELECT false, 'daily_limit'::text, v_plan, 0, v_settings.vip_daily_uploads, false, v_settings.free_trial_days;
      RETURN;
    END IF;

    RETURN QUERY SELECT true, 'ok'::text, v_plan, GREATEST(0, v_settings.vip_daily_uploads - v_used_today - 1), v_settings.vip_daily_uploads, false, v_settings.free_trial_days;
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
  WHERE user_id = _user_id AND created_at >= v_period_start;

  IF v_used_period >= v_max THEN
    RETURN QUERY SELECT false, 'period_limit'::text, v_plan, 0, v_max, false, v_settings.free_trial_days;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, 'ok'::text, v_plan, GREATEST(0, v_max - v_used_period - 1), v_max, false, v_settings.free_trial_days;
END;
$function$;

CREATE OR REPLACE FUNCTION public.preview_chart_upload_slot(_user_id uuid)
 RETURNS TABLE(allowed boolean, reason text, plan_code text, remaining integer, daily_max integer, trial_expired boolean, trial_days integer, trial_end_date date)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
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

  IF EXISTS (SELECT 1 FROM public.unlimited_access WHERE user_id = _user_id) THEN
    RETURN QUERY SELECT true, 'unlimited'::text, 'unlimited'::text, 9999, 9999, false, 3650, (v_today + 3650);
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
    WHERE user_id = _user_id AND (created_at AT TIME ZONE 'UTC')::date = v_today;
    RETURN QUERY SELECT (v_used_today < v_settings.free_daily_uploads), 'ok'::text, v_plan,
      GREATEST(0, v_settings.free_daily_uploads - v_used_today), v_settings.free_daily_uploads, false, v_settings.free_trial_days, v_trial_end;
    RETURN;
  END IF;

  IF v_plan = 'vip' THEN
    SELECT COUNT(*) INTO v_used_today
    FROM public.chart_analyses
    WHERE user_id = _user_id AND (created_at AT TIME ZONE 'UTC')::date = v_today;
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
  WHERE user_id = _user_id AND created_at >= v_period_start;

  RETURN QUERY SELECT (v_used_period < v_max), 'ok'::text, v_plan,
    GREATEST(0, v_max - v_used_period), v_max, false, v_settings.free_trial_days, v_trial_end;
END;
$function$;

-- 3. Security: view runs with caller permissions
ALTER VIEW public.mt5_accounts_status SET (security_invoker = on);

-- 4. Security: copy_trade_map write access restricted to service role
DROP POLICY IF EXISTS copy_trade_map_service_all ON public.copy_trade_map;
REVOKE INSERT, UPDATE, DELETE ON public.copy_trade_map FROM anon, authenticated;
GRANT ALL ON public.copy_trade_map TO service_role;
CREATE POLICY copy_trade_map_service_all ON public.copy_trade_map
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 5. Security: investor password no longer readable by client roles
REVOKE SELECT ON public.bridge_connection_requests FROM anon, authenticated;
GRANT SELECT (id, user_id, broker, account_login, server_name, account_type, notes,
  contact_whatsapp, contact_email, status, terminal_uid, admin_note, reviewed_by,
  reviewed_at, created_at, updated_at) ON public.bridge_connection_requests TO authenticated;
GRANT ALL ON public.bridge_connection_requests TO service_role;

CREATE OR REPLACE FUNCTION public.get_bridge_investor_password(_request_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_pwd text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT investor_password INTO v_pwd FROM public.bridge_connection_requests WHERE id = _request_id;
  INSERT INTO public.audit_logs (user_id, action, details)
  VALUES (auth.uid(), 'bridge_investor_password_viewed', jsonb_build_object('request_id', _request_id));
  RETURN v_pwd;
END;
$function$;
REVOKE ALL ON FUNCTION public.get_bridge_investor_password(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_bridge_investor_password(uuid) TO authenticated, service_role;