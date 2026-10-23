CREATE OR REPLACE FUNCTION public.review_payment_atomic(p_admin_user_id uuid,p_payment_request_id uuid,p_action text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_request public.payment_requests%ROWTYPE; v_product public.products%ROWTYPE; v_order public.orders%ROWTYPE; v_ends_at timestamptz;
BEGIN
 IF NOT (has_role(p_admin_user_id,'admin'::app_role) OR has_role(p_admin_user_id,'super_admin'::app_role)) THEN RAISE EXCEPTION 'Admin access required'; END IF;
 IF p_action NOT IN ('approve','reject') THEN RAISE EXCEPTION 'Invalid payment review action'; END IF;
 SELECT * INTO v_request FROM public.payment_requests WHERE id=p_payment_request_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Payment request not found'; END IF;
 IF p_action='reject' THEN
  UPDATE public.payment_requests SET status='rejected',reviewed_by=p_admin_user_id,reviewed_at=now(),updated_at=now() WHERE id=v_request.id;
  INSERT INTO public.admin_audit_log(admin_user_id,action,target_type,target_id,details) VALUES(p_admin_user_id,'payment_rejected','payment_request',v_request.id,jsonb_build_object('user_id',v_request.user_id,'product_id',v_request.product_id,'plan_id',v_request.plan_id,'amount_usd',v_request.amount_usd));
  RETURN jsonb_build_object('ok',true,'status','rejected');
 END IF;
 IF v_request.product_id IS NULL AND v_request.plan_id IS NOT NULL THEN
  IF NOT EXISTS (SELECT 1 FROM public.pricing_plans WHERE id=v_request.plan_id) THEN RAISE EXCEPTION 'Plan not found'; END IF;
  v_ends_at:=now()+interval '30 days';
  UPDATE public.payment_requests SET status='approved',reviewed_by=p_admin_user_id,reviewed_at=now(),updated_at=now() WHERE id=v_request.id;
  INSERT INTO public.user_plan_subscriptions(user_id,pricing_plan_id,status,current_period_start,current_period_end)
  VALUES(v_request.user_id,v_request.plan_id,'active',now(),v_ends_at)
  ON CONFLICT(user_id) DO UPDATE SET pricing_plan_id=EXCLUDED.pricing_plan_id,status='active',current_period_start=now(),current_period_end=EXCLUDED.current_period_end,updated_at=now();
  INSERT INTO public.admin_audit_log(admin_user_id,action,target_type,target_id,details) VALUES(p_admin_user_id,'payment_approved','payment_request',v_request.id,jsonb_build_object('user_id',v_request.user_id,'plan_id',v_request.plan_id,'amount_usd',v_request.amount_usd,'ends_at',v_ends_at));
  RETURN jsonb_build_object('ok',true,'status','approved','plan_id',v_request.plan_id,'ends_at',v_ends_at);
 END IF;
 SELECT * INTO v_product FROM public.products WHERE id=v_request.product_id AND is_active=true FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Product is not active'; END IF;
 v_ends_at:=CASE v_product.billing_interval WHEN 'month' THEN now()+interval '1 month' WHEN 'year' THEN now()+interval '1 year' ELSE NULL END;
 UPDATE public.payment_requests SET status='approved',reviewed_by=p_admin_user_id,reviewed_at=now(),updated_at=now() WHERE id=v_request.id;
 INSERT INTO public.orders(user_id,product_id,product_type,amount_usd,status,paid_at) VALUES(v_request.user_id,v_product.id,v_product.type,v_request.amount_usd,'paid',now()) RETURNING * INTO v_order;
 INSERT INTO public.entitlements(user_id,product_id,status,started_at,ends_at,source_order_id) VALUES(v_request.user_id,v_product.id,'active',now(),v_ends_at,v_order.id)
 ON CONFLICT(user_id,product_id) DO UPDATE SET status='active',started_at=now(),ends_at=EXCLUDED.ends_at,source_order_id=EXCLUDED.source_order_id,updated_at=now();
 IF v_product.slug='mt5-direct' AND v_request.account_id IS NOT NULL THEN
  UPDATE public.trading_accounts SET direct_execution_entitled=true,direct_execution_plan=v_product.slug,direct_execution_expires_at=v_ends_at,updated_at=now()
  WHERE id=v_request.account_id AND user_id=v_request.user_id;
 END IF;
 INSERT INTO public.admin_audit_log(admin_user_id,action,target_type,target_id,details) VALUES(p_admin_user_id,'payment_approved','payment_request',v_request.id,jsonb_build_object('user_id',v_request.user_id,'product_id',v_product.id,'product_slug',v_product.slug,'amount_usd',v_request.amount_usd,'order_id',v_order.id,'account_id',v_request.account_id,'ends_at',v_ends_at));
 RETURN jsonb_build_object('ok',true,'status','approved','order_id',v_order.id,'product_id',v_product.id,'ends_at',v_ends_at);
END $$;
REVOKE ALL ON FUNCTION public.review_payment_atomic(uuid,uuid,text) FROM PUBLIC,anon,authenticated;