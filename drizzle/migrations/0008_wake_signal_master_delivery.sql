CREATE OR REPLACE FUNCTION public.wake_direct_signal_delivery()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF NEW.status = 'ACTIVE' AND EXISTS (
    SELECT 1 FROM public.trading_accounts
    WHERE direct_signal_enabled OR (botvio_signal_master_enabled AND tradecopy_active)
  ) THEN
    BEGIN
      PERFORM net.http_post(
        url := 'https://tqqkzeblmjapgbnsbtgw.supabase.co/functions/v1/mt5-direct-execution',
        headers := jsonb_build_object('Content-Type','application/json','x-botvio-automation-secret', public.get_botvio_automation_secret()),
        body := '{"action":"wake"}'::jsonb,
        timeout_milliseconds := 55000);
    EXCEPTION WHEN OTHERS THEN RAISE WARNING 'direct delivery wake failed: %', SQLERRM;
    END;
  END IF;
  RETURN NULL;
END $function$;