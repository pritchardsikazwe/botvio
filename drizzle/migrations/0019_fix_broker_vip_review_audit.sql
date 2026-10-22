CREATE OR REPLACE FUNCTION public.admin_review_broker_vip_claim(p_claim_id uuid, p_action text, p_note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.broker_vip_claims; v_plan uuid; v_sub uuid;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin only'; END IF;
  IF p_action NOT IN ('approve','reject','revoke') THEN RAISE EXCEPTION 'Invalid action'; END IF;
  SELECT * INTO c FROM public.broker_vip_claims WHERE id = p_claim_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Claim not found'; END IF;
  IF p_action = 'approve' THEN
    IF c.status <> 'pending' THEN RAISE EXCEPTION 'Only pending claims can be approved'; END IF;
    SELECT id INTO v_plan FROM public.pricing_plans WHERE code = 'vip' LIMIT 1;
    IF v_plan IS NULL THEN RAISE EXCEPTION 'VIP plan missing'; END IF;
    INSERT INTO public.user_plan_subscriptions(user_id, pricing_plan_id, status, current_period_start, current_period_end)
    VALUES (c.user_id, v_plan, 'active', now(), NULL) RETURNING id INTO v_sub;
    UPDATE public.broker_vip_claims SET status='approved', subscription_id=v_sub, reviewed_by=auth.uid(), reviewed_at=now(), admin_note=p_note, updated_at=now() WHERE id=c.id;
  ELSIF p_action = 'reject' THEN
    IF c.status <> 'pending' THEN RAISE EXCEPTION 'Only pending claims can be rejected'; END IF;
    UPDATE public.broker_vip_claims SET status='rejected', reviewed_by=auth.uid(), reviewed_at=now(), admin_note=p_note, updated_at=now() WHERE id=c.id;
  ELSE
    IF c.status <> 'approved' THEN RAISE EXCEPTION 'Only approved claims can be revoked'; END IF;
    UPDATE public.user_plan_subscriptions SET status='cancelled', current_period_end=now(), updated_at=now() WHERE id=c.subscription_id;
    UPDATE public.broker_vip_claims SET status='revoked', reviewed_by=auth.uid(), reviewed_at=now(), admin_note=p_note, updated_at=now() WHERE id=c.id;
  END IF;
  INSERT INTO public.admin_audit_log(admin_user_id, action, target_type, target_id, details)
  VALUES (auth.uid(), 'broker_vip_'||p_action, 'broker_vip_claim', c.id, jsonb_build_object('user_id', c.user_id, 'broker', c.broker));
  RETURN jsonb_build_object('ok', true, 'status', p_action);
END $$;
REVOKE ALL ON FUNCTION public.admin_review_broker_vip_claim(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_review_broker_vip_claim(uuid,text,text) TO authenticated;