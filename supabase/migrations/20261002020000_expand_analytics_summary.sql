create or replace function public.admin_analytics_summary(p_days integer default 30)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare since_at timestamptz := now() - make_interval(days => greatest(1, least(coalesce(p_days,30),365))); result jsonb;
begin
 if not exists (select 1 from public.user_roles where user_id=auth.uid() and role in ('admin','super_admin')) then raise exception 'not authorized'; end if;
 select jsonb_build_object(
  'visitors',(select count(distinct visitor_id) from analytics_events where created_at>=since_at),
  'sessions',(select count(distinct session_id) from analytics_events where created_at>=since_at),
  'page_views',(select count(*) from analytics_events where created_at>=since_at and event_name='page_view'),
  'avg_pages_per_session',coalesce((select round(count(*)::numeric/nullif(count(distinct session_id),0),2) from analytics_events where created_at>=since_at and event_name='page_view'),0),
  'avg_session_seconds',coalesce((select round(avg((metadata->>'duration_seconds')::numeric),0) from analytics_events where created_at>=since_at and event_name='page_time' and (metadata->>'duration_seconds') ~ '^[0-9]+$'),0),
  'top_pages',coalesce((select jsonb_agg(jsonb_build_object('path',path,'visits',visits) order by visits desc) from (select coalesce(path,'/') path,count(distinct session_id) visits from analytics_events where created_at>=since_at and event_name='page_view' group by coalesce(path,'/') order by visits desc limit 15) q),'[]'::jsonb),
  'sources',coalesce((select jsonb_agg(jsonb_build_object('source',source,'visits',visits) order by visits desc) from (select coalesce(nullif(source,''),'Direct') source,count(distinct session_id) visits from analytics_events where created_at>=since_at group by coalesce(nullif(source,''),'Direct') order by visits desc limit 15) q),'[]'::jsonb),
  'registered_countries',coalesce((select jsonb_agg(jsonb_build_object('country',country,'users',users) order by users desc) from (select coalesce(nullif(p.country,''),'Unknown') country,count(*) users from profiles p where p.country is not null group by coalesce(nullif(p.country,''),'Unknown') order by users desc limit 20) q),'[]'::jsonb),
  'devices',coalesce((select jsonb_agg(jsonb_build_object('device',device,'visits',visits) order by visits desc) from (select coalesce(nullif(device_type,''),'unknown') device,count(distinct session_id) visits from analytics_events where created_at>=since_at group by coalesce(nullif(device_type,''),'unknown') order by visits desc) q),'[]'::jsonb),
  'funnel',coalesce((select jsonb_object_agg(event_name,events) from (select event_name,count(distinct coalesce(user_id::text,visitor_id)) events from analytics_events where created_at>=since_at and event_name in ('market_open','news_hub_open','signals_open','signal_view','ai_analysis_open','signup_started','signup_completed','connection_started','connection_connected','copy_started','pricing_view','payment_submitted','subscription_activated') group by event_name) q),'{}'::jsonb)
 ) into result; return result;
end; $$;
grant execute on function public.admin_analytics_summary(integer) to authenticated;