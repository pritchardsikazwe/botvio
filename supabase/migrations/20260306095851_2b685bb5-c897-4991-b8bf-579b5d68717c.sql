
-- 1. Assets being tracked
CREATE TABLE IF NOT EXISTS public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL UNIQUE,
  provider_symbol text NOT NULL,
  asset_type text NOT NULL CHECK (asset_type IN ('forex', 'crypto', 'commodity')),
  base_currency text,
  quote_currency text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view assets" ON public.assets FOR SELECT USING (true);
CREATE POLICY "Admins can manage assets" ON public.assets FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 2. Latest snapshot price
CREATE TABLE IF NOT EXISTS public.market_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  price numeric(20,8) NOT NULL,
  bid numeric(20,8),
  ask numeric(20,8),
  spread numeric(20,8),
  change_percent_24h numeric(10,4),
  provider_timestamp timestamptz,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_market_quotes_asset_fetched ON public.market_quotes(asset_id, fetched_at DESC);

ALTER TABLE public.market_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view market quotes" ON public.market_quotes FOR SELECT USING (true);
CREATE POLICY "Service can insert market quotes" ON public.market_quotes FOR INSERT WITH CHECK (true);

-- 3. OHLCV candles
CREATE TABLE IF NOT EXISTS public.market_candles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  timeframe text NOT NULL CHECK (timeframe IN ('1min','5min','15min','1h','4h','1day')),
  candle_time timestamptz NOT NULL,
  open numeric(20,8) NOT NULL,
  high numeric(20,8) NOT NULL,
  low numeric(20,8) NOT NULL,
  close numeric(20,8) NOT NULL,
  volume numeric(28,8),
  provider text NOT NULL DEFAULT 'twelvedata',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(asset_id, timeframe, candle_time)
);

CREATE INDEX IF NOT EXISTS idx_market_candles_asset_tf_time ON public.market_candles(asset_id, timeframe, candle_time DESC);

ALTER TABLE public.market_candles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view market candles" ON public.market_candles FOR SELECT USING (true);
CREATE POLICY "Service can insert market candles" ON public.market_candles FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can update market candles" ON public.market_candles FOR UPDATE USING (true);

-- 4. Computed technical indicators
CREATE TABLE IF NOT EXISTS public.market_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  timeframe text NOT NULL CHECK (timeframe IN ('1min','5min','15min','1h','4h','1day')),
  candle_time timestamptz NOT NULL,
  ema_20 numeric(20,8),
  ema_50 numeric(20,8),
  rsi_14 numeric(10,4),
  atr_14 numeric(20,8),
  macd numeric(20,8),
  macd_signal numeric(20,8),
  support_1 numeric(20,8),
  resistance_1 numeric(20,8),
  trend text CHECK (trend IN ('bullish','bearish','neutral')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(asset_id, timeframe, candle_time)
);

ALTER TABLE public.market_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view market indicators" ON public.market_indicators FOR SELECT USING (true);
CREATE POLICY "Service can insert market indicators" ON public.market_indicators FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can update market indicators" ON public.market_indicators FOR UPDATE USING (true);

-- 5. AI-generated signal output
CREATE TABLE IF NOT EXISTS public.ai_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  timeframe text NOT NULL CHECK (timeframe IN ('1min','5min','15min','1h','4h','1day')),
  signal text NOT NULL CHECK (signal IN ('buy','sell','hold','avoid')),
  confidence numeric(5,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  entry_price numeric(20,8),
  stop_loss numeric(20,8),
  take_profit_1 numeric(20,8),
  take_profit_2 numeric(20,8),
  risk_reward numeric(10,4),
  ai_summary text NOT NULL,
  reasoning_json jsonb,
  provider_snapshot_time timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_signals_asset_tf_created ON public.ai_signals(asset_id, timeframe, created_at DESC);

ALTER TABLE public.ai_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ai signals" ON public.ai_signals FOR SELECT USING (true);
CREATE POLICY "Service can insert ai signals" ON public.ai_signals FOR INSERT WITH CHECK (true);

-- 6. Alert rules
CREATE TABLE IF NOT EXISTS public.price_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  condition_type text NOT NULL CHECK (condition_type IN ('above','below','crosses_up','crosses_down')),
  trigger_price numeric(20,8) NOT NULL,
  timeframe text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  triggered_at timestamptz
);

ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own alerts" ON public.price_alerts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Enable realtime for quotes and signals
ALTER PUBLICATION supabase_realtime ADD TABLE public.market_quotes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_signals;

-- Seed assets
INSERT INTO public.assets (symbol, provider_symbol, asset_type, base_currency, quote_currency)
VALUES
('XAU/USD', 'XAU/USD', 'commodity', 'XAU', 'USD'),
('XAG/USD', 'XAG/USD', 'commodity', 'XAG', 'USD'),
('BTC/USD', 'BTC/USD', 'crypto', 'BTC', 'USD'),
('GBP/USD', 'GBP/USD', 'forex', 'GBP', 'USD'),
('USD/JPY', 'USD/JPY', 'forex', 'USD', 'JPY'),
('EUR/USD', 'EUR/USD', 'forex', 'EUR', 'USD'),
('AUD/USD', 'AUD/USD', 'forex', 'AUD', 'USD')
ON CONFLICT (symbol) DO NOTHING;
