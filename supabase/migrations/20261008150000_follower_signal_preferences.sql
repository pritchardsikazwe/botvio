-- Follower-level Botvio signal preferences.
-- This is a Botvio preference layer for Botvio-managed direct signal delivery.
-- TradeCopy Cloud remains the execution authority for cloud copy relationships.
create table if not exists public.follower_signal_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trading_account_id uuid not null references public.trading_accounts(id) on delete cascade,
  mode text not null default 'all' check (mode in ('all', 'selected')),
  allowed_symbols text[] not null default '{}'::text[],
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint follower_signal_preferences_account_unique unique (trading_account_id)
);

create index if not exists follower_signal_preferences_user_idx
  on public.follower_signal_preferences(user_id);

alter table public.follower_signal_preferences enable row level security;

drop policy if exists "followers can view own signal preferences" on public.follower_signal_preferences;
create policy "followers can view own signal preferences"
  on public.follower_signal_preferences
  for select
  to authenticated
  using (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.trading_accounts ta
    where ta.id = trading_account_id
      and ta.user_id = (select auth.uid())
      and ta.account_role = 'slave'
      and ta.is_botvio_robot = false
  )
);

drop policy if exists "followers can insert own signal preferences" on public.follower_signal_preferences;
create policy "followers can insert own signal preferences"
  on public.follower_signal_preferences
  for insert
  to authenticated
  with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.trading_accounts ta
    where ta.id = trading_account_id
      and ta.user_id = (select auth.uid())
      and ta.account_role = 'slave'
      and ta.is_botvio_robot = false
  )
);

drop policy if exists "followers can update own signal preferences" on public.follower_signal_preferences;
create policy "followers can update own signal preferences"
  on public.follower_signal_preferences
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.touch_follower_signal_preferences_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists follower_signal_preferences_updated_at on public.follower_signal_preferences;
create trigger follower_signal_preferences_updated_at
before update on public.follower_signal_preferences
for each row execute function public.touch_follower_signal_preferences_updated_at();

grant select, insert, update on public.follower_signal_preferences to authenticated;
