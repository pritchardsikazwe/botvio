
-- Expiry model predictions: stores per-expiry win probabilities for each signal candidate
CREATE TABLE public.expiry_model_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_candidate_id uuid REFERENCES public.trading_signals(id) ON DELETE CASCADE,
  asset_id uuid REFERENCES public.assets(id) ON DELETE CASCADE,
  broker_slug text NOT NULL DEFAULT '',
  expiry_seconds integer NOT NULL,
  win_probability numeric(5,4) NOT NULL DEFAULT 0,
  calibrated_probability numeric(5,4),
  is_recommended boolean NOT NULL DEFAULT false,
  is_backup boolean NOT NULL DEFAULT false,
  features_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Asset daily scores: daily health/ranking for each asset per broker
CREATE TABLE public.asset_daily_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES public.assets(id) ON DELETE CASCADE,
  broker_slug text NOT NULL DEFAULT '',
  score_date date NOT NULL DEFAULT CURRENT_DATE,
  accuracy_score numeric(5,2) NOT NULL DEFAULT 0,
  volatility_score numeric(5,2) NOT NULL DEFAULT 0,
  trend_score numeric(5,2) NOT NULL DEFAULT 0,
  opportunity_score numeric(5,2) NOT NULL DEFAULT 0,
  reliability_score numeric(5,2) NOT NULL DEFAULT 0,
  final_score numeric(5,2) NOT NULL DEFAULT 0,
  sample_size integer NOT NULL DEFAULT 0,
  metadata_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(asset_id, broker_slug, score_date)
);

-- Strategy daily scores: per-strategy health tracking
CREATE TABLE public.strategy_daily_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_name text NOT NULL,
  broker_slug text NOT NULL DEFAULT '',
  score_date date NOT NULL DEFAULT CURRENT_DATE,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  health_score numeric(5,2) NOT NULL DEFAULT 50,
  max_loss_streak integer NOT NULL DEFAULT 0,
  avg_confidence numeric(5,2),
  metadata_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(strategy_name, broker_slug, score_date)
);

-- Asset expiry performance: historical win rates per asset/broker/expiry
CREATE TABLE public.asset_expiry_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES public.assets(id) ON DELETE CASCADE,
  broker_slug text NOT NULL DEFAULT '',
  expiry_seconds integer NOT NULL,
  sample_size integer NOT NULL DEFAULT 0,
  win_rate numeric(5,4) NOT NULL DEFAULT 0,
  avg_confidence numeric(5,2),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(asset_id, broker_slug, expiry_seconds)
);

-- Signal quality logs: audit trail for signal filtering decisions
CREATE TABLE public.signal_quality_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id uuid REFERENCES public.trading_signals(id) ON DELETE CASCADE,
  model_score numeric(5,2),
  asset_health numeric(5,2),
  strategy_health numeric(5,2),
  expiry_fit numeric(5,2),
  session_fit numeric(5,2),
  volatility_fit numeric(5,2),
  historical_reliability numeric(5,2),
  final_quality_score numeric(5,2) NOT NULL DEFAULT 0,
  approved boolean NOT NULL DEFAULT false,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Top asset snapshots: cached daily rankings by type
CREATE TABLE public.top_asset_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  ranking_type text NOT NULL DEFAULT 'global',
  asset_id uuid REFERENCES public.assets(id) ON DELETE CASCADE,
  rank_position integer NOT NULL,
  score numeric(5,2) NOT NULL DEFAULT 0,
  best_broker text,
  best_expiry_seconds integer,
  best_strategy text,
  accuracy_today numeric(5,2),
  opportunities_today integer DEFAULT 0,
  metadata_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(snapshot_date, ranking_type, asset_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.expiry_model_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_daily_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_daily_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_expiry_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_quality_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.top_asset_snapshots ENABLE ROW LEVEL SECURITY;

-- Public read access for rankings and scores (user-facing data)
CREATE POLICY "Anyone can read asset daily scores" ON public.asset_daily_scores FOR SELECT USING (true);
CREATE POLICY "Anyone can read strategy daily scores" ON public.strategy_daily_scores FOR SELECT USING (true);
CREATE POLICY "Anyone can read asset expiry performance" ON public.asset_expiry_performance FOR SELECT USING (true);
CREATE POLICY "Anyone can read top asset snapshots" ON public.top_asset_snapshots FOR SELECT USING (true);
CREATE POLICY "Anyone can read expiry predictions" ON public.expiry_model_predictions FOR SELECT USING (true);
CREATE POLICY "Anyone can read signal quality logs" ON public.signal_quality_logs FOR SELECT USING (true);

-- Admin write access
CREATE POLICY "Admins can manage asset daily scores" ON public.asset_daily_scores FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage strategy daily scores" ON public.strategy_daily_scores FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage asset expiry performance" ON public.asset_expiry_performance FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage top asset snapshots" ON public.top_asset_snapshots FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage expiry predictions" ON public.expiry_model_predictions FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage signal quality logs" ON public.signal_quality_logs FOR ALL USING (public.is_admin());

-- Service role insert for edge functions (using service_role key bypasses RLS, so these are for future-proofing)
