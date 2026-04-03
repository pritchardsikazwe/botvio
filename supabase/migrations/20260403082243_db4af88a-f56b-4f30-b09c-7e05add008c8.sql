ALTER TABLE public.pricing_plans
  ADD COLUMN IF NOT EXISTS allow_premium_signals boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_sports_betting boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_all_courses boolean DEFAULT false;