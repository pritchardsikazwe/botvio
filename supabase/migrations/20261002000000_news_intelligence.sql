create table if not exists public.news_intelligence_events (
  event_key text primary key,
  event_time timestamptz not null,
  country text,
  currency text not null,
  event_name text not null,
  impact text not null default 'Medium',
  actual numeric,
  forecast numeric,
  previous numeric,
  unit text,
  phase text not null default 'UPCOMING',
  strategy_state text not null default 'NORMAL',
  affected_markets text[] not null default '{}',
  source text not null default 'finnhub',
  refreshed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists news_intelligence_events_time_idx on public.news_intelligence_events(event_time);
alter table public.news_intelligence_events enable row level security;
drop policy if exists "news intelligence is readable" on public.news_intelligence_events;
create policy "news intelligence is readable" on public.news_intelligence_events for select using (true);
create or replace function public.touch_news_intelligence_events_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end; $$;
drop trigger if exists news_intelligence_events_touch on public.news_intelligence_events;
create trigger news_intelligence_events_touch before update on public.news_intelligence_events for each row execute function public.touch_news_intelligence_events_updated_at();