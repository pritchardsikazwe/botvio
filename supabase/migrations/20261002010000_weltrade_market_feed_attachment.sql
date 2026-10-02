create table if not exists public.broker_market_feeds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trading_account_id uuid not null references public.trading_accounts(id) on delete cascade,
  broker text not null,
  platform text not null default 'MT5',
  feed_provider text not null default 'tradecopy_api',
  status text not null default 'attached' check (status in ('attached','degraded','detached')),
  symbols jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  last_quote_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(trading_account_id)
);

alter table public.broker_market_feeds enable row level security;

drop policy if exists "Users can view own broker market feeds" on public.broker_market_feeds;
create policy "Users can view own broker market feeds"
on public.broker_market_feeds for select
using (auth.uid() = user_id);

drop policy if exists "Users can manage own broker market feeds" on public.broker_market_feeds;
create policy "Users can manage own broker market feeds"
on public.broker_market_feeds for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists idx_broker_market_feeds_user on public.broker_market_feeds(user_id);
create index if not exists idx_broker_market_feeds_account on public.broker_market_feeds(trading_account_id);
