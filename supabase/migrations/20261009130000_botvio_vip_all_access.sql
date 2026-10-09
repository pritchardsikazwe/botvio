-- Botvio VIP: one $50/month subscription that enables the full premium feature set.
ALTER TABLE public.pricing_plans
  ADD COLUMN IF NOT EXISTS allow_signals_center boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_ai_chart_upload boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_trading_hubs boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_legacy_bots boolean NOT NULL DEFAULT false;

INSERT INTO public.pricing_plans (
  code, name, price_usd, is_active,
  allow_copy_trading, allow_premium_bots, allow_provider_listing,
  allow_premium_signals, allow_sports_betting, allow_all_courses,
  allow_signals_center, allow_ai_chart_upload, allow_trading_hubs, allow_legacy_bots,
  max_accounts, max_bot_instances
)
VALUES (
  'vip', 'Botvio VIP', 50, true,
  true, true, true, true, true, true,
  true, true, true, true,
  5, 10
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  price_usd = EXCLUDED.price_usd,
  is_active = true,
  allow_copy_trading = true,
  allow_premium_bots = true,
  allow_provider_listing = true,
  allow_premium_signals = true,
  allow_sports_betting = true,
  allow_all_courses = true,
  allow_signals_center = true,
  allow_ai_chart_upload = true,
  allow_trading_hubs = true,
  allow_legacy_bots = true,
  max_accounts = 5,
  max_bot_instances = 10;
