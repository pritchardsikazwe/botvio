-- Botvio signal + MT5 automation.
-- Supabase Cron/pg_net invokes the protected Edge Functions on a fixed cadence.
-- The two Vault entries referenced below must be created once in the Supabase Dashboard/SQL editor:
--   botvio_project_url = https://tqqkzeblmjapgbnsbtgw.supabase.co
--   botvio_automation = the dedicated secret API key used only by these cron jobs.
-- Keep the secret key in Vault; never commit it to GitHub.

create extension if not exists pg_cron;
create extension if not exists pg_net;
create extension if not exists supabase_vault with schema vault;

-- Idempotent replacement of Botvio jobs.
do $$
declare
  j record;
begin
  for j in
    select jobid
    from cron.job
    where jobname in (
      'botvio-cfd-signals',
      'botvio-weltrade-signals',
      'botvio-deriv-synthetic-signals',
      'botvio-evaluate-signals',
      'botvio-mt5-delivery',
      'botvio-top-assets'
    )
  loop
    perform cron.unschedule(j.jobid);
  end loop;
end $$;

-- Fast market signal generation: one pass per minute.
select cron.schedule(
  'botvio-cfd-signals',
  '* * * * *',
  $job$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'botvio_project_url') || '/functions/v1/generate-cfd-signals',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'botvio_automation')
    ),
    body := jsonb_build_object('source', 'cron', 'time', now()),
    timeout_milliseconds := 120000
  );
  $job$
);

select cron.schedule(
  'botvio-deriv-synthetic-signals',
  '* * * * *',
  $job$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'botvio_project_url') || '/functions/v1/generate-deriv-synthetic-signals',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'botvio_automation')
    ),
    body := jsonb_build_object('source', 'cron', 'time', now()),
    timeout_milliseconds := 120000
  );
  $job$
);

-- Weltrade API Studio is heavier, so run every 2 minutes.
select cron.schedule(
  'botvio-weltrade-signals',
  '*/2 * * * *',
  $job$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'botvio_project_url') || '/functions/v1/generate-syntx-signals',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'botvio_automation')
    ),
    body := jsonb_build_object('source', 'cron', 'time', now()),
    timeout_milliseconds := 120000
  );
  $job$
);

-- Evaluate active signals every minute so TP/SL/expiry states stay current.
select cron.schedule(
  'botvio-evaluate-signals',
  '* * * * *',
  $job$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'botvio_project_url') || '/functions/v1/evaluate-live-signals',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'botvio_automation')
    ),
    body := jsonb_build_object('source', 'cron', 'time', now()),
    timeout_milliseconds := 60000
  );
  $job$
);

-- Deliver new Botvio signals to the configured TradeCopy master and enabled followers.
select cron.schedule(
  'botvio-mt5-delivery',
  '* * * * *',
  $job$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'botvio_project_url') || '/functions/v1/mt5-direct-execution',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'botvio_automation')
    ),
    body := jsonb_build_object('action', 'wake', 'source', 'cron', 'time', now()),
    timeout_milliseconds := 60000
  );
  $job$
);

-- Refresh asset ranking hourly.
select cron.schedule(
  'botvio-top-assets',
  '5 * * * *',
  $job$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'botvio_project_url') || '/functions/v1/top-assets-ranking?type=global&limit=5&refresh=true',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'botvio_automation')
    ),
    body := jsonb_build_object('source', 'cron', 'time', now()),
    timeout_milliseconds := 60000
  );
  $job$
);

-- Retain only recent cron execution history.
select cron.schedule(
  'botvio-cron-history-cleanup',
  '30 3 * * *',
  $$ delete from cron.job_run_details where end_time < now() - interval '7 days' $$
);
