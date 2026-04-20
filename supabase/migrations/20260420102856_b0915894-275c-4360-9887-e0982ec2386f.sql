-- Schedule auto-evaluation of live scalping signals every minute.
-- Each run checks ACTIVE auto-posted signals against the latest price,
-- marks WIN/LOSS when TP/SL hit, and EXPIRES untouched signals so users
-- never enter late on stale 1m/5m scalp setups.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Drop existing job if present (idempotent re-deploys)
DO $$
DECLARE jid bigint;
BEGIN
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'evaluate-live-signals-every-minute';
  IF jid IS NOT NULL THEN
    PERFORM cron.unschedule(jid);
  END IF;
END $$;

SELECT cron.schedule(
  'evaluate-live-signals-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://tqqkzeblmjapgbnsbtgw.supabase.co/functions/v1/evaluate-live-signals',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);
