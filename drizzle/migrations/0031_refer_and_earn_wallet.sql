ALTER TABLE public.affiliate_earnings ADD COLUMN IF NOT EXISTS payment_request_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS affiliate_earnings_payment_unique ON public.affiliate_earnings(payment_request_id, earning_type) WHERE payment_request_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS referrals_referred_unique ON public.referrals(referred_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS affiliate_profiles_code_unique ON public.affiliate_profiles(upper(affiliate_code));
ALTER TABLE public.payout_requests ADD COLUMN IF NOT EXISTS payout_channel text;
ALTER TABLE public.payout_requests ADD COLUMN IF NOT EXISTS payout_destination text;

-- Users can no longer write wallet-affecting rows directly; secure functions do it.
DROP POLICY IF EXISTS "Users can update own affiliate profile" ON public.affiliate_profiles;
DROP POLICY IF EXISTS "Users can create own affiliate profile" ON public.affiliate_profiles;
DROP POLICY IF EXISTS "Users can create own payout requests" ON public.payout_requests;

CREATE OR REPLACE FUNCTION public.ensure_my_affiliate()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_code text; v_try int := 0;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  SELECT affiliate_code INTO v_code FROM affiliate_profiles WHERE user_id = auth.uid();
  IF v_code IS NOT NULL THEN RETURN v_code; END IF;
  LOOP
    v_try := v_try + 1;
    v_code := 'BV' || upper(substr(translate(encode(gen_random_bytes(8),'base64'),'+/=0O1IL',''),1,6));
    BEGIN
      INSERT INTO affiliate_profiles(user_id, affiliate_code, status) VALUES (auth.uid(), v_code, 'active');
      RETURN v_code;
    EXCEPTION WHEN unique_violation THEN
      SELECT affiliate_code INTO v_code FROM affiliate_profiles WHERE user_id = auth.uid();
      IF v_code IS NOT NULL THEN RETURN v_code; END IF;
      IF v_try > 8 THEN RAISE; END IF;
    END;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.claim_referral(p_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_ref uuid; v_created timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok',false,'reason','signed_out'); END IF;
  IF EXISTS (SELECT 1 FROM referrals WHERE referred_user_id = auth.uid()) THEN RETURN jsonb_build_object('ok',false,'reason','already_referred'); END IF;
  SELECT user_id INTO v_ref FROM affiliate_profiles WHERE upper(affiliate_code) = upper(trim(p_code));
  IF v_ref IS NULL THEN SELECT user_id INTO v_ref FROM affiliate_links WHERE code = trim(p_code); END IF;
  IF v_ref IS NULL THEN RETURN jsonb_build_object('ok',false,'reason','unknown_code'); END IF;
  IF v_ref = auth.uid() THEN RETURN jsonb_build_object('ok',false,'reason','self'); END IF;
  SELECT created_at INTO v_created FROM auth.users WHERE id = auth.uid();
  IF v_created < now() - interval '7 days' THEN RETURN jsonb_build_object('ok',false,'reason','account_too_old'); END IF;
  IF EXISTS (SELECT 1 FROM payment_requests WHERE user_id = auth.uid() AND status='approved') THEN RETURN jsonb_build_object('ok',false,'reason','already_customer'); END IF;
  INSERT INTO referrals(referred_user_id, referrer_user_id, affiliate_code, status) VALUES (auth.uid(), v_ref, upper(trim(p_code)), 'signed_up')
  ON CONFLICT (referred_user_id) DO NOTHING;
  UPDATE affiliate_profiles SET total_signups = COALESCE(total_signups,0)+1, updated_at=now() WHERE user_id = v_ref;
  RETURN jsonb_build_object('ok',true);
END $$;

-- 15% on every approved payment (first + renewals) and $10 per 10 paying referrals.
CREATE OR REPLACE FUNCTION public.award_referral_commission(p_payment_request_id uuid, p_user_id uuid, p_amount numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_ref uuid; v_paying int; v_bonuses int;
BEGIN
  SELECT referrer_user_id INTO v_ref FROM referrals WHERE referred_user_id = p_user_id;
  IF v_ref IS NULL OR v_ref = p_user_id OR COALESCE(p_amount,0) <= 0 THEN RETURN; END IF;
  INSERT INTO affiliate_earnings(referrer_user_id, referred_user_id, payment_request_id, earning_type, amount_usd, status, approved_at)
  VALUES (v_ref, p_user_id, p_payment_request_id, 'subscription_commission', round(p_amount * 0.15, 2), 'approved', now())
  ON CONFLICT DO NOTHING;
  UPDATE referrals SET status='paying' WHERE referred_user_id = p_user_id;
  SELECT count(DISTINCT referred_user_id) INTO v_paying FROM affiliate_earnings WHERE referrer_user_id = v_ref AND earning_type='subscription_commission';
  SELECT count(*) INTO v_bonuses FROM affiliate_earnings WHERE referrer_user_id = v_ref AND earning_type='referral_bonus';
  WHILE v_bonuses < floor(v_paying / 10) LOOP
    INSERT INTO affiliate_earnings(referrer_user_id, earning_type, amount_usd, status, approved_at) VALUES (v_ref, 'referral_bonus', 10, 'approved', now());
    v_bonuses := v_bonuses + 1;
  END LOOP;
  UPDATE affiliate_profiles SET total_earnings_usd = (SELECT COALESCE(sum(amount_usd),0) FROM affiliate_earnings WHERE referrer_user_id=v_ref AND status IN ('approved','paid')), updated_at=now() WHERE user_id = v_ref;
END $$;
REVOKE EXECUTE ON FUNCTION public.award_referral_commission(uuid, uuid, numeric) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.affiliate_wallet_balance(p_user_id uuid)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT GREATEST(0, round(
    COALESCE((SELECT sum(amount_usd) FROM affiliate_earnings WHERE referrer_user_id=p_user_id AND status IN ('approved','paid')),0)
  - COALESCE((SELECT sum(amount_usd) FROM payout_requests WHERE user_id=p_user_id AND status IN ('requested','pending','paid')),0), 2));
$$;
REVOKE EXECUTE ON FUNCTION public.affiliate_wallet_balance(uuid) FROM PUBLIC, anon;

CREATE OR REPLACE FUNCTION public.get_my_affiliate_wallet()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE u uuid := auth.uid();
BEGIN
  IF u IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  RETURN jsonb_build_object(
    'balance', affiliate_wallet_balance(u),
    'lifetime', COALESCE((SELECT sum(amount_usd) FROM affiliate_earnings WHERE referrer_user_id=u AND status IN ('approved','paid')),0),
    'commissions', COALESCE((SELECT sum(amount_usd) FROM affiliate_earnings WHERE referrer_user_id=u AND earning_type='subscription_commission'),0),
    'bonuses', COALESCE((SELECT sum(amount_usd) FROM affiliate_earnings WHERE referrer_user_id=u AND earning_type='referral_bonus'),0),
    'pending_payout', COALESCE((SELECT sum(amount_usd) FROM payout_requests WHERE user_id=u AND status IN ('requested','pending')),0),
    'paid_out', COALESCE((SELECT sum(amount_usd) FROM payout_requests WHERE user_id=u AND status='paid'),0),
    'referred', (SELECT count(*) FROM referrals WHERE referrer_user_id=u),
    'paying', (SELECT count(DISTINCT referred_user_id) FROM affiliate_earnings WHERE referrer_user_id=u AND earning_type='subscription_commission'),
    'clicks', (SELECT count(*) FROM referral_clicks WHERE referrer_user_id=u)
  );
END $$;

CREATE OR REPLACE FUNCTION public.get_my_referrals()
RETURNS TABLE(joined_at timestamptz, display_name text, masked_email text, status text, earned_usd numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT r.attributed_at,
    COALESCE(p.display_name, 'Botvio member'),
    CASE WHEN p.email IS NULL THEN NULL ELSE left(p.email,2) || '***@' || split_part(p.email,'@',2) END,
    r.status,
    COALESCE((SELECT sum(e.amount_usd) FROM affiliate_earnings e WHERE e.referrer_user_id=r.referrer_user_id AND e.referred_user_id=r.referred_user_id),0)
  FROM referrals r LEFT JOIN profiles p ON p.user_id = r.referred_user_id
  WHERE r.referrer_user_id = auth.uid()
  ORDER BY r.attributed_at DESC LIMIT 500;
$$;

CREATE OR REPLACE FUNCTION public.request_affiliate_payout(p_channel text, p_destination text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE u uuid := auth.uid(); v_bal numeric;
BEGIN
  IF u IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  IF p_channel NOT IN ('crypto','mobile_money') THEN RAISE EXCEPTION 'Choose crypto or mobile money'; END IF;
  IF length(trim(COALESCE(p_destination,''))) < 5 THEN RAISE EXCEPTION 'Enter your wallet address or mobile money number'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('affiliate_payout_' || u::text));
  IF EXISTS (SELECT 1 FROM payout_requests WHERE user_id=u AND status IN ('requested','pending')) THEN RAISE EXCEPTION 'You already have a payout waiting'; END IF;
  v_bal := affiliate_wallet_balance(u);
  IF v_bal < 5 THEN RAISE EXCEPTION 'Minimum payout is $5'; END IF;
  INSERT INTO payout_requests(user_id, amount_usd, status, payout_channel, payout_destination) VALUES (u, v_bal, 'requested', p_channel, left(trim(p_destination),200));
  RETURN jsonb_build_object('ok',true,'amount',v_bal);
END $$;

CREATE OR REPLACE FUNCTION public.admin_list_affiliate_wallets()
RETURNS TABLE(user_id uuid, email text, display_name text, whatsapp_number text, affiliate_code text, referred bigint, paying bigint, lifetime numeric, balance numeric, pending_request_id uuid, pending_amount numeric, pending_channel text, pending_destination text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  RETURN QUERY
  SELECT a.user_id, p.email, p.display_name, p.whatsapp_number, a.affiliate_code,
    (SELECT count(*) FROM referrals r WHERE r.referrer_user_id=a.user_id),
    (SELECT count(DISTINCT e.referred_user_id) FROM affiliate_earnings e WHERE e.referrer_user_id=a.user_id AND e.earning_type='subscription_commission'),
    COALESCE((SELECT sum(e.amount_usd) FROM affiliate_earnings e WHERE e.referrer_user_id=a.user_id AND e.status IN ('approved','paid')),0),
    affiliate_wallet_balance(a.user_id) + COALESCE(pr.amount_usd,0),
    pr.id, pr.amount_usd, pr.payout_channel, pr.payout_destination
  FROM affiliate_profiles a
  LEFT JOIN profiles p ON p.user_id=a.user_id
  LEFT JOIN LATERAL (SELECT * FROM payout_requests x WHERE x.user_id=a.user_id AND x.status IN ('requested','pending') ORDER BY x.created_at LIMIT 1) pr ON true
  WHERE EXISTS (SELECT 1 FROM referrals r WHERE r.referrer_user_id=a.user_id) OR pr.id IS NOT NULL
  ORDER BY 9 DESC, 6 DESC LIMIT 500;
END $$;

-- Admin pays offline (crypto / mobile money) and clears the whole wallet.
CREATE OR REPLACE FUNCTION public.admin_settle_affiliate_wallet(p_user_id uuid, p_channel text, p_reference text, p_note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_total numeric; v_req uuid;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF p_channel NOT IN ('crypto','mobile_money') THEN RAISE EXCEPTION 'Choose crypto or mobile money'; END IF;
  IF length(trim(COALESCE(p_reference,''))) < 3 THEN RAISE EXCEPTION 'Enter the transaction reference'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('affiliate_payout_' || p_user_id::text));
  SELECT id INTO v_req FROM payout_requests WHERE user_id=p_user_id AND status IN ('requested','pending') ORDER BY created_at LIMIT 1;
  v_total := affiliate_wallet_balance(p_user_id) + COALESCE((SELECT amount_usd FROM payout_requests WHERE id=v_req),0);
  IF v_total < 5 THEN RAISE EXCEPTION 'Wallet is below the $5 minimum payout'; END IF;
  IF v_req IS NOT NULL THEN
    UPDATE payout_requests SET status='rejected', admin_note='Merged into final payout' WHERE user_id=p_user_id AND status IN ('requested','pending') AND id<>v_req;
    UPDATE payout_requests SET status='paid', amount_usd=v_total, payout_channel=p_channel, tx_reference=left(trim(p_reference),200), admin_note=p_note, processed_by=auth.uid(), processed_at=now() WHERE id=v_req;
  ELSE
    INSERT INTO payout_requests(user_id, amount_usd, status, payout_channel, tx_reference, admin_note, processed_by, processed_at)
    VALUES (p_user_id, v_total, 'paid', p_channel, left(trim(p_reference),200), p_note, auth.uid(), now()) RETURNING id INTO v_req;
  END IF;
  UPDATE affiliate_earnings SET status='paid' WHERE referrer_user_id=p_user_id AND status='approved';
  INSERT INTO admin_audit_log(admin_user_id,action,target_type,target_id,details) VALUES (auth.uid(),'affiliate_wallet_paid','payout_request',v_req,jsonb_build_object('user_id',p_user_id,'amount_usd',v_total,'channel',p_channel));
  RETURN jsonb_build_object('ok',true,'amount',v_total);
END $$;

CREATE OR REPLACE FUNCTION public.review_payment_atomic(p_admin_user_id uuid, p_payment_request_id uuid, p_action text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
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
  PERFORM public.award_referral_commission(v_request.id, v_request.user_id, v_request.amount_usd);
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
 PERFORM public.award_referral_commission(v_request.id, v_request.user_id, v_request.amount_usd);
 INSERT INTO public.admin_audit_log(admin_user_id,action,target_type,target_id,details) VALUES(p_admin_user_id,'payment_approved','payment_request',v_request.id,jsonb_build_object('user_id',v_request.user_id,'product_id',v_product.id,'product_slug',v_product.slug,'amount_usd',v_request.amount_usd,'order_id',v_order.id,'account_id',v_request.account_id,'ends_at',v_ends_at));
 RETURN jsonb_build_object('ok',true,'status','approved','order_id',v_order.id,'product_id',v_product.id,'ends_at',v_ends_at);
END $function$;

GRANT EXECUTE ON FUNCTION public.ensure_my_affiliate(), public.claim_referral(text), public.get_my_affiliate_wallet(), public.get_my_referrals(), public.request_affiliate_payout(text,text), public.admin_list_affiliate_wallets(), public.admin_settle_affiliate_wallet(uuid,text,text,text) TO authenticated;