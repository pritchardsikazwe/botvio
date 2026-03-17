
-- Signal brokers table
CREATE TABLE public.signal_brokers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  affiliate_url TEXT NOT NULL DEFAULT '',
  execution_mode TEXT NOT NULL DEFAULT 'display_only',
  routing_priority INT NOT NULL DEFAULT 50,
  supported_expiries JSONB DEFAULT '[]',
  supported_market_types TEXT[] DEFAULT '{}',
  country_rules JSONB DEFAULT '{}',
  best_for TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.signal_brokers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signal brokers are publicly readable" ON public.signal_brokers FOR SELECT USING (true);
CREATE POLICY "Admins can manage signal brokers" ON public.signal_brokers FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Broker assets support table
CREATE TABLE public.signal_broker_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  broker_id UUID NOT NULL REFERENCES public.signal_brokers(id) ON DELETE CASCADE,
  asset_symbol TEXT NOT NULL,
  market_type TEXT NOT NULL DEFAULT 'forex',
  supported BOOLEAN NOT NULL DEFAULT true,
  expiry_options JSONB DEFAULT '[]'
);

ALTER TABLE public.signal_broker_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Broker assets are publicly readable" ON public.signal_broker_assets FOR SELECT USING (true);
CREATE POLICY "Admins can manage broker assets" ON public.signal_broker_assets FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Signal broker routes (which broker recommended per signal)
CREATE TABLE public.signal_broker_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_id UUID NOT NULL REFERENCES public.trading_signals(id) ON DELETE CASCADE,
  broker_id UUID NOT NULL REFERENCES public.signal_brokers(id) ON DELETE CASCADE,
  route_score INT NOT NULL DEFAULT 50,
  is_recommended BOOLEAN NOT NULL DEFAULT false,
  reason_codes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.signal_broker_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signal routes are publicly readable" ON public.signal_broker_routes FOR SELECT USING (true);
CREATE POLICY "Admins can manage signal routes" ON public.signal_broker_routes FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Broker click tracking
CREATE TABLE public.broker_click_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  signal_id UUID REFERENCES public.trading_signals(id) ON DELETE SET NULL,
  broker_id UUID NOT NULL REFERENCES public.signal_brokers(id) ON DELETE CASCADE,
  country_code TEXT,
  device_type TEXT,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.broker_click_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own clicks" ON public.broker_click_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anon can insert clicks" ON public.broker_click_events FOR INSERT TO anon WITH CHECK (user_id IS NULL);
CREATE POLICY "Admins can read all clicks" ON public.broker_click_events FOR SELECT TO authenticated USING (is_admin());

-- Add AI scoring columns to trading_signals
ALTER TABLE public.trading_signals
  ADD COLUMN IF NOT EXISTS ai_win_probability NUMERIC,
  ADD COLUMN IF NOT EXISTS ai_model_version TEXT,
  ADD COLUMN IF NOT EXISTS strategy_quality_score INT,
  ADD COLUMN IF NOT EXISTS market_context_score INT,
  ADD COLUMN IF NOT EXISTS volatility_fit_score INT,
  ADD COLUMN IF NOT EXISTS session_fit_score INT,
  ADD COLUMN IF NOT EXISTS explanation_json JSONB,
  ADD COLUMN IF NOT EXISTS expiry_seconds INT,
  ADD COLUMN IF NOT EXISTS signal_lifecycle TEXT DEFAULT 'candidate',
  ADD COLUMN IF NOT EXISTS settled_price NUMERIC,
  ADD COLUMN IF NOT EXISTS settled_at TIMESTAMPTZ;

-- Index for performance
CREATE INDEX idx_signal_broker_routes_signal ON public.signal_broker_routes(signal_id);
CREATE INDEX idx_broker_click_events_broker ON public.broker_click_events(broker_id);
CREATE INDEX idx_trading_signals_lifecycle ON public.trading_signals(signal_lifecycle);
