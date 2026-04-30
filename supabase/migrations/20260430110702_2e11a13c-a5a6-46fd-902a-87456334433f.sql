ALTER TABLE public.auto_trade_instruments
  ADD COLUMN IF NOT EXISTS auto_post boolean NOT NULL DEFAULT true;