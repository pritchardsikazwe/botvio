-- Botvio Marketing Intelligence Worker
create table if not exists public.marketing_events (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  user_id uuid null references auth.users(id) on delete set null,
  session_id text,
  event_type text not null,
  page_path text,
  product text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists marketing_events_visitor_idx on public.marketing_events(visitor_id, created_at desc);
create index if not exists marketing_events_user_idx on public.marketing_events(user_id, created_at desc);
create index if not exists marketing_events_type_idx on public.marketing_events(event_type, created_at desc);

create table if not exists public.marketing_profiles (
  id uuid primary key default gen_random_uuid(),
  visitor_id text unique not null,
  user_id uuid null references auth.users(id) on delete set null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  pages_viewed integer not null default 0,
  sessions integer not null default 0,
  signup_started boolean not null default false,
  signed_up boolean not null default false,
  interests text[] not null default '{}',
  intent_score integer not null default 0,
  lifecycle_stage text not null default 'visitor',
  next_best_action text,
  last_notification_at timestamptz,
  notification_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists marketing_profiles_stage_idx on public.marketing_profiles(lifecycle_stage, intent_score desc);
create index if not exists marketing_profiles_user_idx on public.marketing_profiles(user_id);

create table if not exists public.marketing_notifications (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  user_id uuid null references auth.users(id) on delete set null,
  channel text not null default 'in_app',
  notification_type text not null,
  title text not null,
  body text not null,
  cta_label text,
  cta_url text,
  priority integer not null default 50,
  status text not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  scheduled_for timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists marketing_notifications_user_idx on public.marketing_notifications(user_id, status, created_at desc);
create index if not exists marketing_notifications_visitor_idx on public.marketing_notifications(visitor_id, status, created_at desc);

alter table public.marketing_events enable row level security;
alter table public.marketing_profiles enable row level security;
alter table public.marketing_notifications enable row level security;

drop policy if exists "marketing events own user read" on public.marketing_events;
create policy "marketing events own user read" on public.marketing_events
for select using (auth.uid() = user_id);

drop policy if exists "marketing profiles own user read" on public.marketing_profiles;
create policy "marketing profiles own user read" on public.marketing_profiles
for select using (auth.uid() = user_id);

drop policy if exists "marketing notifications own user read" on public.marketing_notifications;
create policy "marketing notifications own user read" on public.marketing_notifications
for select using (auth.uid() = user_id);
