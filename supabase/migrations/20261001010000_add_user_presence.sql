-- Track authenticated users who are actively connected to Botvio.
-- A user is considered online when last_seen_at is within the last 90 seconds.

create table if not exists public.user_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_seen_at timestamptz not null default now(),
  current_path text,
  device_type text,
  updated_at timestamptz not null default now()
);

alter table public.user_presence enable row level security;

drop policy if exists "Users can upsert their own presence" on public.user_presence;
create policy "Users can upsert their own presence"
  on public.user_presence
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own presence" on public.user_presence;
create policy "Users can update their own presence"
  on public.user_presence
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can read their own presence" on public.user_presence;
create policy "Users can read their own presence"
  on public.user_presence
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1
      from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role in ('admin', 'super_admin')
    )
  );

create index if not exists user_presence_last_seen_idx
  on public.user_presence (last_seen_at desc);

create or replace function public.touch_user_presence(
  p_current_path text default null,
  p_device_type text default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  insert into public.user_presence (user_id, last_seen_at, current_path, device_type, updated_at)
  values (auth.uid(), now(), p_current_path, p_device_type, now())
  on conflict (user_id) do update set
    last_seen_at = now(),
    current_path = excluded.current_path,
    device_type = excluded.device_type,
    updated_at = now();
end;
$$;

grant execute on function public.touch_user_presence(text, text) to authenticated;

-- Keep this table lightweight: one row per authenticated user, not an event log.
