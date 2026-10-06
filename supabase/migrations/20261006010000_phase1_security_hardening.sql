-- Phase 1 security hardening: browser entitlements/orders/credentials and atomic monetization review.
DROP POLICY IF EXISTS "Users can insert own entitlements" ON public.entitlements;
DROP POLICY IF EXISTS "Users can update own entitlements" ON public.entitlements;

DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
CREATE POLICY "Users can create own unpaid orders" ON public.orders FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND status <> 'paid' AND amount_usd > 0);

DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
CREATE POLICY "Users can update own unpaid orders" ON public.orders FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND status <> 'paid')
WITH CHECK (auth.uid() = user_id AND status <> 'paid' AND amount_usd > 0);

REVOKE SELECT ON public.trading_accounts FROM anon, authenticated;
GRANT SELECT (
 id,user_id,broker,label,login_id,permissions_json,is_active,created_at,updated_at,
 connection_type,deriv_account_id,is_virtual,token_scopes,connection_status,platform,server,
 tradecopy_user_id,account_role,environment,external_account_id,execution_provider,
 tradecopy_active,last_diagnostic,last_diagnostic_at,is_botvio_robot,direct_signal_enabled,
 direct_signal_status,direct_live_confirmed_at,direct_lot,direct_min_confidence,direct_symbol_map,
 last_direct_signal_at,last_direct_execution_at,last_direct_error,botvio_signal_master_enabled,
 botvio_signal_master_lot,botvio_signal_min_confidence,direct_execution_entitled,
 direct_execution_plan,direct_execution_expires_at
) ON public.trading_accounts TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 admin_user_id uuid NOT NULL,
 action text NOT NULL,
 target_type text NOT NULL,
 target_id uuid,
 details jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view audit log" ON public.admin_audit_log;
CREATE POLICY "Admins can view audit log" ON public.admin_audit_log FOR SELECT TO authenticated
USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));

INSERT INTO public.app_settings(key,value,description)
VALUES ('marketplace_test_mode','{"enabled":false}'::jsonb,'Controls free marketplace test activation')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.activate_product_atomic(p_user_id uuid,p_product_id uuid,p_referral_code text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_product public.products%ROWTYPE; v_test_mode boolean:=false; v_order public.orders%ROWTYPE; v_entitlement public.entitlements%ROWTYPE; v_ends_at timestamptz;
BEGIN
 SELECT * INTO v_product FROM public.products WHERE id=p_product_id AND is_active=true FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Product is not active'; END IF;
 SELECT COALESCE((value->>'enabled')::boolean,false) INTO v_test_mode FROM public.app_settings WHERE key='marketplace_test_mode';
 IF NOT v_test_mode THEN RAISE EXCEPTION 'Marketplace test access is disabled. Please submit a payment request.'; END IF;
 INSERT INTO public.orders(user_id,product_id,product_type,amount_usd,referral_code,status,paid_at)
 VALUES(p_user_id,v_product.id,v_product.type,0,p_referral_code,'paid',now()) RETURNING * INTO v_order;
 v_ends_at:=CASE v_product.billing_interval WHEN 'month' THEN now()+interval '1 month' WHEN 'year' THEN now()+interval '1 year' ELSE NULL END;
 INSERT INTO public.entitlements(user_id,product_id,status,started_at,ends_at,source_order_id)
 VALUES(p_user_id,v_product.id,'active',now(),v_ends_at,v_order.id)
 ON CONFLICT(user_id,product_id) DO UPDATE SET status='active',started_at=now(),ends_at=EXCLUDED.ends_at,source_order_id=EXCLUDED.source_order_id,updated_at=now()
 RETURNING * INTO v_entitlement;
 RETURN jsonb_build_object('order_id',v_order.id,'entitlement_id',v_entitlement.id,'product_id',v_product.id,'ends_at',v_entitlement.ends_at);
END $$;
REVOKE ALL ON FUNCTION public.activate_product_atomic(uuid,uuid,text) FROM PUBLIC,anon,authenticated;

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
  INSERT INTO public.admin_audit_log(admin_user_id,action,target_type,target_id,details) VALUES(p_admin_user_id,'payment_rejected','payment_request',v_request.id,jsonb_build_object('user_id',v_request.user_id,'product_id',v_request.product_id,'amount_usd',v_request.amount_usd));
  RETURN jsonb_build_object('ok',true,'status','rejected');
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

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_action ON public.admin_audit_log(admin_user_id,action);
CREATE INDEX IF NOT EXISTS idx_entitlements_user_product ON public.entitlements(user_id,product_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_product ON public.payment_requests(product_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_account ON public.payment_requests(account_id);
