CREATE OR REPLACE FUNCTION public.wake_direct_signal_delivery()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.status = 'ACTIVE' AND EXISTS (SELECT 1 FROM public.trading_accounts WHERE direct_signal_enabled) THEN
    BEGIN
      PERFORM net.http_post(
        url := 'https://tqqkzeblmjapgbnsbtgw.supabase.co/functions/v1/mt5-direct-execution',
        headers := '{"Content-Type":"application/json"}'::jsonb,
        body := '{"action":"wake"}'::jsonb);
    EXCEPTION WHEN OTHERS THEN RAISE WARNING 'direct delivery wake failed: %', SQLERRM;
    END;
  END IF;
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS wake_direct_signal_delivery_trg ON public.trading_signals;
CREATE TRIGGER wake_direct_signal_delivery_trg AFTER INSERT ON public.trading_signals
FOR EACH ROW EXECUTE FUNCTION public.wake_direct_signal_delivery();