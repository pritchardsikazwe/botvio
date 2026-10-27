CREATE TABLE public.trial_signal_unlocks (user_id uuid NOT NULL, signal_id uuid NOT NULL REFERENCES public.trading_signals(id), unlock_day date NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,unlock_day,signal_id));
GRANT SELECT ON public.trial_signal_unlocks TO authenticated; GRANT ALL ON public.trial_signal_unlocks TO service_role;
ALTER TABLE public.trial_signal_unlocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own signal unlocks" ON public.trial_signal_unlocks FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE TABLE public.home_signal_batches (batch_day date PRIMARY KEY, signal_ids uuid[] NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.home_signal_batches TO anon,authenticated; GRANT ALL ON public.home_signal_batches TO service_role;
ALTER TABLE public.home_signal_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read daily home selections" ON public.home_signal_batches FOR SELECT TO anon,authenticated USING(true);
CREATE OR REPLACE FUNCTION public.signal_access_day() RETURNS date LANGUAGE sql STABLE SET search_path=public AS $$ SELECT ((now() AT TIME ZONE 'Africa/Lusaka') - interval '6 hours')::date $$;
CREATE OR REPLACE FUNCTION public.has_paid_signal_access() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT auth.uid() IS NOT NULL AND (public.is_admin() OR public.has_role(auth.uid(),'signal_manager') OR public.get_user_plan_tier(auth.uid()) IN ('starter','basic','standard','vip','pro','elite') OR EXISTS(SELECT 1 FROM public.unlimited_access u WHERE u.user_id=auth.uid()) OR EXISTS(SELECT 1 FROM public.entitlements e JOIN public.products p ON p.id=e.product_id WHERE e.user_id=auth.uid() AND e.status='active' AND (e.ends_at IS NULL OR e.ends_at>now()) AND p.type='signal_pack')) $$;
CREATE OR REPLACE FUNCTION public.has_signal_trial() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.user_id=auth.uid() AND p.created_at + make_interval(days => LEAST(7, GREATEST(0,COALESCE((SELECT free_trial_days FROM public.chart_limit_settings LIMIT 1),7)))) > now()) AND NOT EXISTS(SELECT 1 FROM public.device_accounts own JOIN public.device_accounts other ON other.device_id=own.device_id AND other.user_id<>own.user_id AND other.first_seen<own.first_seen WHERE own.user_id=auth.uid()) $$;
CREATE OR REPLACE FUNCTION public.can_read_signal(p_signal_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT public.has_paid_signal_access() OR EXISTS(SELECT 1 FROM public.home_signal_batches h WHERE h.batch_day=public.signal_access_day() AND p_signal_id=ANY(h.signal_ids)) OR (public.has_signal_trial() AND EXISTS(SELECT 1 FROM public.trial_signal_unlocks u WHERE u.user_id=auth.uid() AND u.unlock_day=public.signal_access_day() AND u.signal_id=p_signal_id)) $$;
CREATE POLICY "Enforce trial signal unlocks" ON public.trading_signals AS RESTRICTIVE FOR SELECT TO anon,authenticated USING(public.can_read_signal(id));
CREATE OR REPLACE FUNCTION public.get_home_daily_signals() RETURNS SETOF public.trading_signals LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_day date := public.signal_access_day(); v_cutoff timestamptz := (v_day::timestamp + interval '6 hours') AT TIME ZONE 'Africa/Lusaka';
BEGIN
PERFORM pg_advisory_xact_lock(hashtext('home-signals-'||v_day::text));
IF NOT EXISTS(SELECT 1 FROM public.home_signal_batches WHERE batch_day=v_day) THEN
INSERT INTO public.home_signal_batches(batch_day,signal_ids)
SELECT v_day,COALESCE(array_agg(id ORDER BY slot),'{}'::uuid[]) FROM (
SELECT DISTINCT ON(slot) id,slot FROM (
SELECT id,created_at,CASE
WHEN category='syntx' OR 'weltrade'=ANY(broker) OR symbol ~* '(GAINX|PAINX|FLIPX|SWITCHX|BREAKX|TRENDX|FIBOX|QUADX|SFX|PLUSX)' THEN 5
WHEN symbol ~* '(XAU|GOLD)' THEN 2
WHEN symbol ~* '(BTC|BITCOIN)' THEN 3
WHEN category='synthetic' OR symbol ~* '^(R_|1HZ|BOOM|CRASH|STEP|JUMP|RANGE|VOL)' THEN 1
WHEN category='forex' OR symbol ~* '^(EUR|GBP|AUD|NZD|USD|CAD|CHF|JPY)[/ _-]?(EUR|GBP|AUD|NZD|USD|CAD|CHF|JPY)' THEN 4 END AS slot
FROM public.trading_signals WHERE upper(replace(timeframe,' ','')) IN ('M15','15M') AND created_at<=v_cutoff AND created_at>v_cutoff-interval '36 hours' AND status IN ('ACTIVE','CLOSED','EXPIRED')
) c WHERE slot IS NOT NULL ORDER BY slot,created_at DESC,id
) picks;
END IF;
RETURN QUERY SELECT s.* FROM public.trading_signals s JOIN public.home_signal_batches h ON s.id=ANY(h.signal_ids) WHERE h.batch_day=v_day ORDER BY array_position(h.signal_ids,s.id);
END $$;
CREATE OR REPLACE FUNCTION public.get_trial_signal_catalog() RETURNS TABLE(id uuid,symbol text,timeframe text,category text,broker text[],status text,created_at timestamptz,unlocked boolean) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
IF NOT public.has_paid_signal_access() AND NOT public.has_signal_trial() THEN RAISE EXCEPTION 'Your trial has ended. Subscribe or request approved partner access.'; END IF;
RETURN QUERY SELECT s.id,s.symbol,s.timeframe,s.category,s.broker,s.status,s.created_at,public.has_paid_signal_access() OR EXISTS(SELECT 1 FROM public.trial_signal_unlocks u WHERE u.user_id=auth.uid() AND u.unlock_day=public.signal_access_day() AND u.signal_id=s.id) FROM public.trading_signals s WHERE s.created_at>now()-interval '2 days' AND s.status IN ('ACTIVE','CLOSED','EXPIRED') ORDER BY s.created_at DESC LIMIT 500;
END $$;
CREATE OR REPLACE FUNCTION public.unlock_trial_signal(p_signal_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_used integer; v_day date:=public.signal_access_day(); v_signal jsonb;
BEGIN
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to unlock signals'; END IF;
PERFORM pg_advisory_xact_lock(hashtext(auth.uid()::text||v_day::text));
IF NOT public.has_paid_signal_access() AND NOT public.has_signal_trial() THEN RAISE EXCEPTION 'Your trial has ended. Subscribe or request approved partner access.'; END IF;
SELECT count(*) INTO v_used FROM public.trial_signal_unlocks WHERE user_id=auth.uid() AND unlock_day=v_day;
IF NOT public.has_paid_signal_access() AND NOT EXISTS(SELECT 1 FROM public.trial_signal_unlocks WHERE user_id=auth.uid() AND unlock_day=v_day AND signal_id=p_signal_id) THEN
IF v_used>=35 THEN RETURN jsonb_build_object('allowed',false,'used',v_used,'limit',35,'reason','Daily trial limit reached'); END IF;
IF NOT EXISTS(SELECT 1 FROM public.trading_signals WHERE id=p_signal_id AND created_at>now()-interval '2 days' AND status IN ('ACTIVE','CLOSED','EXPIRED')) THEN RAISE EXCEPTION 'Signal unavailable'; END IF;
INSERT INTO public.trial_signal_unlocks(user_id,unlock_day,signal_id) VALUES(auth.uid(),v_day,p_signal_id); v_used:=v_used+1;
END IF;
SELECT to_jsonb(s) INTO v_signal FROM public.trading_signals s WHERE s.id=p_signal_id;
IF v_signal IS NULL THEN RAISE EXCEPTION 'Signal unavailable'; END IF;
RETURN jsonb_build_object('allowed',true,'used',v_used,'limit',35,'signal',v_signal);
END $$;
REVOKE ALL ON FUNCTION public.get_home_daily_signals() FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.get_home_daily_signals() TO anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.get_trial_signal_catalog() FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.get_trial_signal_catalog() TO authenticated,service_role;
REVOKE ALL ON FUNCTION public.unlock_trial_signal(uuid) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.unlock_trial_signal(uuid) TO authenticated,service_role;
REVOKE ALL ON FUNCTION public.has_paid_signal_access(),public.has_signal_trial(),public.can_read_signal(uuid) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.has_paid_signal_access(),public.has_signal_trial(),public.can_read_signal(uuid) TO anon,authenticated,service_role;