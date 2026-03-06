
ALTER TABLE public.trading_signals
ADD COLUMN IF NOT EXISTS outcome text CHECK (outcome IN ('win', 'loss', 'pending')) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS outcome_updated_at timestamptz,
ADD COLUMN IF NOT EXISTS outcome_updated_by uuid;
