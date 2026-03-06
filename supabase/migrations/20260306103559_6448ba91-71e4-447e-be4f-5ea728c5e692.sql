
-- Market card metrics: sessions, news, day range, 4H blocks, levels, tips
CREATE TABLE IF NOT EXISTS public.market_card_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  timeframe text NOT NULL DEFAULT '15min',
  snapshot_time timestamptz NOT NULL DEFAULT now(),

  current_session text,
  next_session text,
  next_session_open_at timestamptz,

  next_high_impact_event text,
  next_high_impact_currency text,
  next_high_impact_level text,
  next_high_impact_time timestamptz,

  day_low numeric(20,8),
  day_high numeric(20,8),

  current_4h_block text,
  current_4h_high numeric(20,8),
  current_4h_low numeric(20,8),

  support_1 numeric(20,8),
  support_2 numeric(20,8),
  resistance_1 numeric(20,8),
  resistance_2 numeric(20,8),

  market_tip text,

  UNIQUE(asset_id, timeframe, snapshot_time)
);

ALTER TABLE public.market_card_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view market_card_metrics"
  ON public.market_card_metrics FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage market_card_metrics"
  ON public.market_card_metrics FOR ALL
  USING (true)
  WITH CHECK (true);
