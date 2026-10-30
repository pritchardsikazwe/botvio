CREATE OR REPLACE FUNCTION public.ensure_my_affiliate()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_code text; v_try int := 0;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  SELECT affiliate_code INTO v_code FROM affiliate_profiles WHERE user_id = auth.uid();
  IF v_code IS NOT NULL THEN RETURN v_code; END IF;
  LOOP
    v_try := v_try + 1;
    v_code := 'BV' || upper(substr(md5(random()::text || clock_timestamp()::text || auth.uid()::text), 1, 6));
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