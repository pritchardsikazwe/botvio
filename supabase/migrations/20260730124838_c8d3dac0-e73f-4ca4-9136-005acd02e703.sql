-- 1. follower_commands: restrict writes to service role only
DROP POLICY IF EXISTS follower_commands_service_insert ON public.follower_commands;
DROP POLICY IF EXISTS follower_commands_service_update ON public.follower_commands;
CREATE POLICY follower_commands_service_insert ON public.follower_commands
  FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY follower_commands_service_update ON public.follower_commands
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);
REVOKE INSERT, UPDATE, DELETE ON public.follower_commands FROM authenticated, anon;
GRANT SELECT ON public.follower_commands TO authenticated;
GRANT ALL ON public.follower_commands TO service_role;

-- 2. market data ingestion tables: writes only by service role
DROP POLICY IF EXISTS "Service can insert market candles" ON public.market_candles;
DROP POLICY IF EXISTS "Service can update market candles" ON public.market_candles;
CREATE POLICY "Service can write market candles" ON public.market_candles
  FOR ALL TO service_role USING (true) WITH CHECK (true);
REVOKE INSERT, UPDATE, DELETE ON public.market_candles FROM authenticated, anon;

DROP POLICY IF EXISTS "Service can insert market indicators" ON public.market_indicators;
DROP POLICY IF EXISTS "Service can update market indicators" ON public.market_indicators;
CREATE POLICY "Service can write market indicators" ON public.market_indicators
  FOR ALL TO service_role USING (true) WITH CHECK (true);
REVOKE INSERT, UPDATE, DELETE ON public.market_indicators FROM authenticated, anon;

DROP POLICY IF EXISTS "Service can insert market quotes" ON public.market_quotes;
CREATE POLICY "Service can write market quotes" ON public.market_quotes
  FOR ALL TO service_role USING (true) WITH CHECK (true);
REVOKE INSERT, UPDATE, DELETE ON public.market_quotes FROM authenticated, anon;

DROP POLICY IF EXISTS "Service role can manage market_card_metrics" ON public.market_card_metrics;
CREATE POLICY "Service can write market_card_metrics" ON public.market_card_metrics
  FOR ALL TO service_role USING (true) WITH CHECK (true);
REVOKE INSERT, UPDATE, DELETE ON public.market_card_metrics FROM authenticated, anon;

GRANT ALL ON public.market_candles, public.market_indicators, public.market_quotes, public.market_card_metrics TO service_role;
GRANT SELECT ON public.market_candles, public.market_indicators, public.market_quotes, public.market_card_metrics TO authenticated, anon;

-- 3. managed_mt5_requests: force encrypted storage via edge function, hide secret column
DROP POLICY IF EXISTS "Users create own managed mt5 requests" ON public.managed_mt5_requests;

ALTER TABLE public.managed_mt5_requests
  ADD CONSTRAINT managed_mt5_password_must_be_encrypted
  CHECK (password_encrypted ~ '^[A-Za-z0-9+/]{40,}={0,2}$');

REVOKE ALL ON public.managed_mt5_requests FROM authenticated, anon;
GRANT SELECT (id, user_id, nickname, mt5_login, mt5_server, account_type, broker_name, status, assigned_terminal_uid, admin_notes, created_at, updated_at)
  ON public.managed_mt5_requests TO authenticated;
GRANT UPDATE (status) ON public.managed_mt5_requests TO authenticated;
GRANT ALL ON public.managed_mt5_requests TO service_role;