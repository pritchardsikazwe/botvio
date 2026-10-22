CREATE TABLE public.broker_vip_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  broker text NOT NULL CHECK (broker IN ('exness','deriv')),
  broker_account_id text NOT NULL CHECK (char_length(broker_account_id) BETWEEN 3 AND 64),
  screenshot_path text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','revoked')),
  admin_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  subscription_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX broker_vip_claims_one_open ON public.broker_vip_claims(user_id) WHERE status IN ('pending','approved');
GRANT SELECT, INSERT ON public.broker_vip_claims TO authenticated;
GRANT ALL ON public.broker_vip_claims TO service_role;
ALTER TABLE public.broker_vip_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own claims read" ON public.broker_vip_claims FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "own claims insert" ON public.broker_vip_claims FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'pending' AND reviewed_by IS NULL AND subscription_id IS NULL);

CREATE POLICY "vip proofs upload own" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'broker-vip-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "vip proofs read own or admin" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'broker-vip-proofs' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));

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
  VALUES (auth.uid(), 'broker_vip_'||p_action, 'broker_vip_claim', c.id::text, jsonb_build_object('user_id', c.user_id, 'broker', c.broker));
  RETURN jsonb_build_object('ok', true, 'status', p_action);
END $$;
REVOKE ALL ON FUNCTION public.admin_review_broker_vip_claim(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_review_broker_vip_claim(uuid,text,text) TO authenticated;