create table if not exists public.user_deriv_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  loginid text not null,
  is_virtual boolean not null default false,
  currency text not null default 'USD',
  label text,
  token_encrypted text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_deriv_tokens_user_loginid_key unique (user_id, loginid)
);

create index if not exists idx_user_deriv_tokens_user_active
  on public.user_deriv_tokens(user_id, is_active, created_at desc);

alter table public.user_deriv_tokens enable row level security;

drop policy if exists "Users can view own Deriv tokens" on public.user_deriv_tokens;
create policy "Users can view own Deriv tokens"
  on public.user_deriv_tokens for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own Deriv tokens" on public.user_deriv_tokens;
create policy "Users can insert own Deriv tokens"
  on public.user_deriv_tokens for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own Deriv tokens" on public.user_deriv_tokens;
create policy "Users can update own Deriv tokens"
  on public.user_deriv_tokens for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own Deriv tokens" on public.user_deriv_tokens;
create policy "Users can delete own Deriv tokens"
  on public.user_deriv_tokens for delete
  to authenticated
  using (auth.uid() = user_id);

insert into public.user_deriv_tokens (
  user_id, loginid, is_virtual, currency, label, token_encrypted, is_active, created_at, updated_at
)
select
  ta.user_id,
  ta.login_id,
  coalesce(ta.is_virtual, false),
  'USD',
  case when coalesce(ta.is_virtual, false) then 'Demo' else 'Real' end,
  ta.api_key_encrypted,
  row_number() over (partition by ta.user_id order by ta.created_at desc) = 1,
  ta.created_at,
  coalesce(ta.updated_at, ta.created_at)
from public.trading_accounts ta
where ta.broker = 'deriv'
  and ta.login_id is not null
  and ta.api_key_encrypted is not null
on conflict (user_id, loginid) do nothing;

create or replace function public.touch_user_deriv_tokens_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_user_deriv_tokens_updated_at on public.user_deriv_tokens;
create trigger touch_user_deriv_tokens_updated_at
before update on public.user_deriv_tokens
for each row execute function public.touch_user_deriv_tokens_updated_at();