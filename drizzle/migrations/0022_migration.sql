create table public.linkedin_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  url text not null,
  status text not null default 'posted',
  linkedin_post_id text,
  error text,
  posted_at timestamptz not null default now()
);
alter table public.linkedin_posts enable row level security;
grant select on public.linkedin_posts to authenticated;
grant all on public.linkedin_posts to service_role;
create policy "Admins read LinkedIn posts" on public.linkedin_posts for select to authenticated using (public.is_admin());