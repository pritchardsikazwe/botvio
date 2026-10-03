CREATE TABLE IF NOT EXISTS public.syntx_api_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  login text NOT NULL,
  broker text NOT NULL DEFAULT 'Weltrade',
  server text NOT NULL,
  environment text NOT NULL DEFAULT 'DEMO' CHECK (environment IN ('DEMO','LIVE')),
  password_encrypted text NOT NULL,
  session_id text,
  connection_status text NOT NULL DEFAULT 'saved',
  last_error text,
  last_connected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, login, server)
);
CREATE INDEX IF NOT EXISTS syntx_api_connections_user_idx ON public.syntx_api_connections(user_id);
-- Holds encrypted MT5 passwords: server-only, no browser access.
GRANT ALL ON public.syntx_api_connections TO service_role;
ALTER TABLE public.syntx_api_connections ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.broker_market_feeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trading_account_id uuid NOT NULL REFERENCES public.trading_accounts(id) ON DELETE CASCADE,
  broker text NOT NULL,
  platform text NOT NULL DEFAULT 'MT5',
  feed_provider text NOT NULL DEFAULT 'tradecopy_api',
  status text NOT NULL DEFAULT 'attached' CHECK (status IN ('attached','degraded','detached')),
  symbols jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_quote_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trading_account_id)
);
CREATE INDEX IF NOT EXISTS idx_broker_market_feeds_user ON public.broker_market_feeds(user_id);
GRANT SELECT ON public.broker_market_feeds TO authenticated;
GRANT ALL ON public.broker_market_feeds TO service_role;
ALTER TABLE public.broker_market_feeds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own broker market feeds" ON public.broker_market_feeds;
CREATE POLICY "Users can view own broker market feeds" ON public.broker_market_feeds
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';