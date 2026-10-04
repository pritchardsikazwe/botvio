create table if not exists public.marketing_worker_reports (
  id uuid primary key default gen_random_uuid(),
  report_date date not null default current_date,
  period text not null default 'daily',
  visitors integer not null default 0,
  engaged_visitors integer not null default 0,
  high_intent_visitors integer not null default 0,
  signups integer not null default 0,
  signup_rate numeric not null default 0,
  signup_started integer not null default 0,
  signup_completion_rate numeric not null default 0,
  notifications_created integer not null default 0,
  notification_clicks integer not null default 0,
  notification_conversion_rate numeric not null default 0,
  top_interests jsonb not null default '[]'::jsonb,
  top_pages jsonb not null default '[]'::jsonb,
  top_next_actions jsonb not null default '[]'::jsonb,
  funnel jsonb not null default '{}'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  worker_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(report_date, period)
);

alter table public.marketing_worker_reports enable row level security;

drop policy if exists "marketing reports authenticated read" on public.marketing_worker_reports;
create policy "marketing reports authenticated read" on public.marketing_worker_reports
for select using (auth.role() = 'authenticated');
