ALTER TABLE public.user_mt5_terminals
  ADD COLUMN IF NOT EXISTS route text NOT NULL DEFAULT 'mt5'
  CHECK (route IN ('mt5','deriv'));