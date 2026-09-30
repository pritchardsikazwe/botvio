create table if not exists public.syntx_api_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  login text not null,
  broker text not null default 'Weltrade',
  server text not null,
  environment text not null default 'DEMO' check (environment in ('DEMO')),
  password_encrypted text not null,
  session_id text,
  connection_status text not null default 'saved',
  last_error text,
  last_connected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, login, server)
);

create index if not exists syntx_api_connections_user_idx
  on public.syntx_api_connections(user_id);

alter table public.syntx_api_connections enable row level security;

drop policy if exists "Users can read their SyntX API connection" on public.syntx_api_connections;
create policy "Users can read their SyntX API connection"
  on public.syntx_api_connections for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their SyntX API connection" on public.syntx_api_connections;
create policy "Users can insert their SyntX API connection"
  on public.syntx_api_connections for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their SyntX API connection" on public.syntx_api_connections;
create policy "Users can update their SyntX API connection" on public.syntx_api_connections for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete their SyntX API connection" on public.syntx_api_connections;
create policy "Users can delete their SyntX API connection" on public.syntx_api_connections for delete to authenticated
  using (auth.uid() = user_id);
