create table if not exists public.telegram_signal_posts (
  signal_id uuid primary key,
  status text not null default 'posted',
  telegram_message_id bigint,
  error text,
  posted_at timestamptz not null default now()
);

alter table public.telegram_signal_posts enable row level security;

grant select, insert, update on public.telegram_signal_posts to service_role;

create policy "service role manages telegram signal posts"
  on public.telegram_signal_posts for all to service_role
  using (true) with check (true);

create policy "admins read telegram signal posts"
  on public.telegram_signal_posts for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

select cron.unschedule('botvio-telegram-signal-autopost') where exists (select 1 from cron.job where jobname = 'botvio-telegram-signal-autopost');

select cron.schedule(
  'botvio-telegram-signal-autopost',
  '0 7,10,13,16,19 * * *',
  $$select net.http_post(url:='https://tqqkzeblmjapgbnsbtgw.supabase.co/functions/v1/telegram-signal-autopost', headers:=jsonb_build_object('Content-Type','application/json','x-botvio-automation-secret',public.get_botvio_automation_secret()), body:='{}'::jsonb, timeout_milliseconds:=60000);$$
);