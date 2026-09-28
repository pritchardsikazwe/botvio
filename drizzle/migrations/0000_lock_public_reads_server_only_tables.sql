-- Remove public read access from server-only analytics/strategy tables
DROP POLICY IF EXISTS "analytics read public" ON public.stream_analytics_daily;
DROP POLICY IF EXISTS "Anyone can read strategy daily scores" ON public.strategy_daily_scores;
DROP POLICY IF EXISTS "es_select_all" ON public.exchange_strategies;

-- These tables are only read by server-side functions (service_role), so revoke anon/authenticated SELECT
REVOKE SELECT ON public.stream_analytics_daily FROM anon, authenticated;
REVOKE SELECT ON public.strategy_daily_scores FROM anon, authenticated;
REVOKE SELECT ON public.exchange_strategies FROM anon, authenticated;