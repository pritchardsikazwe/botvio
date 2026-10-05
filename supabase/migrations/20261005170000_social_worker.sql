create table if not exists public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('linkedin','facebook','instagram','x','tiktok')),
  account_name text,
  account_id text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  enabled boolean not null default true,
  connected_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(platform, account_id)
);

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('linkedin','facebook','instagram','x','tiktok')),
  content text not null,
  source_url text,
  media_url text,
  status text not null default 'draft' check (status in ('draft','approved','scheduled','publishing','published','failed')),
  scheduled_at timestamptz,
  published_at timestamptz,
  external_post_id text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_worker_settings (
  id boolean primary key default true,
  enabled boolean not null default false,
  approval_required boolean not null default true,
  poll_interval_minutes integer not null default 15,
  allowed_platforms text[] not null default array['linkedin','facebook','instagram','x','tiktok'],
  updated_at timestamptz not null default now(),
  check (poll_interval_minutes >= 5)
);

insert into public.social_worker_settings(id) values(true) on conflict (id) do nothing;

alter table public.social_accounts enable row level security;
alter table public.social_posts enable row level security;
alter table public.social_worker_settings enable row level security;

revoke all on public.social_accounts from anon, authenticated;
revoke all on public.social_worker_settings from anon, authenticated;

create policy "super admins manage social accounts"
on public.social_accounts for all to authenticated
using (exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('super_admin','admin')))
with check (exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('super_admin','admin')));

create policy "super admins manage social posts"
on public.social_posts for all to authenticated
using (exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('super_admin','admin')))
with check (exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('super_admin','admin')));

revoke all on public.social_posts from anon;
grant select, insert, update on public.social_posts to authenticated;

create index if not exists social_posts_queue_idx on public.social_posts(status, scheduled_at);
create index if not exists social_posts_platform_idx on public.social_posts(platform, created_at desc);
