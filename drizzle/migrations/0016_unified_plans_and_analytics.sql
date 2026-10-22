ALTER TABLE public.pricing_plans
  ADD COLUMN IF NOT EXISTS customer_visible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS features jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS maps_to_tier text,
  ADD COLUMN IF NOT EXISTS ai_chart_daily_quota integer;
COMMENT ON COLUMN public.pricing_plans.maps_to_tier IS 'Unified tier (starter/basic/vip) a legacy plan grants; existing subscribers keep their row.';

CREATE OR REPLACE FUNCTION public.get_user_plan_tier(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT COALESCE((
    SELECT COALESCE(pp.maps_to_tier, pp.code)
    FROM public.user_plan_subscriptions ups
    JOIN public.pricing_plans pp ON pp.id = ups.pricing_plan_id
    WHERE ups.user_id = _user_id AND ups.status = 'active'
      AND (ups.current_period_end IS NULL OR ups.current_period_end > now())
    LIMIT 1), 'free')
$$;
GRANT EXECUTE ON FUNCTION public.get_user_plan_tier(uuid) TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  visitor_id text,
  session_id text,
  user_id uuid,
  path text,
  referrer text,
  source text,
  medium text,
  campaign text,
  device_type text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS analytics_events_created_idx ON public.analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_name_created_idx ON public.analytics_events (event_name, created_at DESC);
GRANT INSERT ON public.analytics_events TO anon, authenticated;
GRANT SELECT ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can record analytics events" ON public.analytics_events FOR INSERT TO anon, authenticated
  WITH CHECK (length(event_name) <= 64 AND (user_id IS NULL OR user_id = auth.uid()));
CREATE POLICY "Admins read analytics events" ON public.analytics_events FOR SELECT TO authenticated USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id uuid PRIMARY KEY,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  current_path text,
  device_type text
);
GRANT SELECT ON public.user_presence TO authenticated;
GRANT ALL ON public.user_presence TO service_role;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read presence" ON public.user_presence FOR SELECT TO authenticated USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.touch_user_presence(p_current_path text, p_device_type text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  INSERT INTO public.user_presence(user_id, last_seen_at, current_path, device_type)
  VALUES (auth.uid(), now(), left(p_current_path, 300), left(p_device_type, 20))
  ON CONFLICT (user_id) DO UPDATE SET last_seen_at = now(), current_path = EXCLUDED.current_path, device_type = EXCLUDED.device_type;
END $$;
REVOKE ALL ON FUNCTION public.touch_user_presence(text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.touch_user_presence(text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_analytics_summary(p_days integer DEFAULT 30)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_since timestamptz := now() - make_interval(days => GREATEST(1, LEAST(p_days, 365))); v jsonb;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  WITH e AS (SELECT * FROM public.analytics_events WHERE created_at >= v_since),
  pv AS (SELECT * FROM e WHERE event_name = 'page_view'),
  sess AS (SELECT session_id, count(*) views FROM pv GROUP BY session_id)
  SELECT jsonb_build_object(
    'tracking_since', (SELECT min(created_at) FROM public.analytics_events),
    'visitors', (SELECT count(DISTINCT visitor_id) FROM pv),
    'sessions', (SELECT count(*) FROM sess),
    'page_views', (SELECT count(*) FROM pv),
    'avg_pages_per_session', COALESCE((SELECT round(avg(views)::numeric, 1) FROM sess), 0),
    'avg_session_seconds', COALESCE((SELECT round(avg(s)) FROM (SELECT sum(COALESCE((metadata->>'duration_seconds')::numeric,0)) s FROM e WHERE event_name='page_time' GROUP BY session_id) t), 0),
    'registered_countries', '[]'::jsonb,
    'top_pages', COALESCE((SELECT jsonb_agg(x) FROM (SELECT path, count(*) visits FROM pv GROUP BY path ORDER BY 2 DESC LIMIT 10) x), '[]'::jsonb),
    'sources', COALESCE((SELECT jsonb_agg(x) FROM (SELECT COALESCE(source,'direct') source, count(*) visits FROM pv GROUP BY 1 ORDER BY 2 DESC LIMIT 10) x), '[]'::jsonb),
    'devices', COALESCE((SELECT jsonb_agg(x) FROM (SELECT COALESCE(device_type,'unknown') device, count(*) visits FROM pv GROUP BY 1 ORDER BY 2 DESC) x), '[]'::jsonb),
    'funnel', COALESCE((SELECT jsonb_object_agg(event_name, c) FROM (SELECT event_name, count(*) c FROM e WHERE event_name NOT IN ('page_view','page_time') GROUP BY 1) f), '{}'::jsonb)
  ) INTO v;
  RETURN v;
END $$;
REVOKE ALL ON FUNCTION public.admin_analytics_summary(integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_analytics_summary(integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_monetization_summary()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v jsonb;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  SELECT jsonb_build_object(
    'registered_users', (SELECT count(*) FROM public.profiles),
    'paid_subscribers', (SELECT count(*) FROM public.user_plan_subscriptions ups JOIN public.pricing_plans pp ON pp.id=ups.pricing_plan_id WHERE ups.status='active' AND pp.price_usd > 0 AND (ups.current_period_end IS NULL OR ups.current_period_end > now())),
    'active_trials', (SELECT count(*) FROM public.trial_grants WHERE ends_at > now()),
    'revenue_30d_usd', (SELECT COALESCE(sum(amount_usd),0) FROM public.payment_requests WHERE status='approved' AND reviewed_at >= now() - interval '30 days'),
    'revenue_all_usd', (SELECT COALESCE(sum(amount_usd),0) FROM public.payment_requests WHERE status='approved'),
    'pending_payments', (SELECT count(*) FROM public.payment_requests WHERE status='pending'),
    'renewals_due_7d', (SELECT count(*) FROM public.user_plan_subscriptions WHERE status='active' AND current_period_end BETWEEN now() AND now() + interval '7 days'),
    'plan_distribution', COALESCE((SELECT jsonb_agg(x) FROM (SELECT COALESCE(pp.maps_to_tier, pp.code) tier, count(*) users FROM public.user_plan_subscriptions ups JOIN public.pricing_plans pp ON pp.id=ups.pricing_plan_id WHERE ups.status='active' GROUP BY 1 ORDER BY 2 DESC) x), '[]'::jsonb)
  ) INTO v;
  RETURN v;
END $$;
REVOKE ALL ON FUNCTION public.admin_monetization_summary() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_monetization_summary() TO authenticated;