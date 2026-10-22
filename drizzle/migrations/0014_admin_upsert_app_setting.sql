CREATE OR REPLACE FUNCTION public.admin_upsert_app_setting(p_key text, p_value jsonb, p_description text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_old jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF p_key NOT IN ('master_auto_send_blocked','global_access_open') THEN RAISE EXCEPTION 'Setting not editable here'; END IF;
  SELECT value INTO v_old FROM public.app_settings WHERE key = p_key;
  INSERT INTO public.app_settings(key, value, description, updated_at)
  VALUES (p_key, p_value, p_description, now())
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = COALESCE(EXCLUDED.description, app_settings.description), updated_at = now();
  INSERT INTO public.admin_audit_log(admin_user_id, action, target_type, details)
  VALUES (auth.uid(), 'app_setting_updated', 'app_setting', jsonb_build_object('key', p_key, 'old', v_old, 'new', p_value));
  RETURN (SELECT value FROM public.app_settings WHERE key = p_key);
END $$;
REVOKE ALL ON FUNCTION public.admin_upsert_app_setting(text, jsonb, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_upsert_app_setting(text, jsonb, text) TO authenticated;