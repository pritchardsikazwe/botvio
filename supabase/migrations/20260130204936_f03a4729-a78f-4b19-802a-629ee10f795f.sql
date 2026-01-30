-- Create chart_analyses table for tracking chart uploads and AI analysis
CREATE TABLE public.chart_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  symbol TEXT,
  timeframe TEXT,
  analysis_result JSONB,
  ai_response TEXT,
  is_premium_analysis BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chart_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own chart analyses" 
ON public.chart_analyses FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chart analyses" 
ON public.chart_analyses FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for chart uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('charts', 'charts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chart uploads
CREATE POLICY "Users can upload charts" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'charts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Charts are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'charts');

-- Insert new bot strategies
INSERT INTO public.bots (code, name, short_description, description, default_markets, supported_brokers, is_active, is_premium)
VALUES 
  ('london_session', 'London Session Sniper', 'Trade 3 min before London open with key level analysis', 'Analyzes previous session S/R, breakouts, rejections and key levels on M15 timeframe. Activates 3 minutes before London session opens.', ARRAY['EURUSD', 'GBPUSD', 'EURGBP', 'XAUUSD'], ARRAY['deriv', 'exness', 'weltrade'], true, false),
  ('newyork_session', 'New York Session Sniper', 'Trade 3 min before NY open with previous session analysis', 'Checks previous session support/resistance, breakout patterns, and rejection wicks on M15 before New York session opens.', ARRAY['EURUSD', 'GBPJPY', 'USDJPY', 'XAUUSD', 'NAS100'], ARRAY['deriv', 'exness', 'weltrade'], true, false),
  ('tokyo_session', 'Tokyo Session Sniper', 'Trade 3 min before Tokyo open with Asian market focus', 'Analyzes previous session key levels and M15 price action for Asian session currency pairs.', ARRAY['USDJPY', 'EURJPY', 'AUDJPY', 'GBPJPY'], ARRAY['deriv', 'exness', 'weltrade'], true, false),
  ('sydney_session', 'Sydney Session Sniper', 'Trade 3 min before Sydney open for AUD/NZD pairs', 'Pre-session analysis of key levels, S/R zones, and breakout setups for Oceania currencies.', ARRAY['AUDUSD', 'NZDUSD', 'AUDNZD', 'AUDJPY'], ARRAY['deriv', 'exness', 'weltrade'], true, false),
  ('daily_range', 'Daily High/Low Alerts', 'Get notified when price reaches daily extremes', 'Monitors all markets for daily highest and lowest price levels, sends notifications when new extremes are reached.', ARRAY['EURUSD', 'GBPUSD', 'XAUUSD', 'NAS100', 'BTCUSD'], ARRAY['deriv', 'exness', 'weltrade'], true, false),
  ('rsi_strategy', 'RSI Universal Strategy', 'RSI-based signals for all markets', 'Uses RSI indicator with overbought/oversold levels across all supported markets. Works on M15 and H1 timeframes.', ARRAY['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'NAS100', 'BTCUSD', 'Volatility_75_Index'], ARRAY['deriv', 'exness', 'weltrade'], true, false)
ON CONFLICT DO NOTHING;