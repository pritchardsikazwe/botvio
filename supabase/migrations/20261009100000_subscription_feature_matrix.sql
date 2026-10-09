-- Central subscription feature switches. Defaults preserve the existing plan entitlements while
-- making legacy bots opt-in rather than automatically visible to every paid plan.
ALTER TABLE public.pricing_plans
  ADD COLUMN IF NOT EXISTS allow_signals_center boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_ai_chart_upload boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_trading_hubs boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_legacy_bots boolean NOT NULL DEFAULT false;

-- Carry forward existing premium-signal eligibility for AI chart uploads.
UPDATE public.pricing_plans
SET allow_ai_chart_upload = COALESCE(allow_premium_signals, false)
WHERE allow_ai_chart_upload = false;

COMMENT ON COLUMN public.pricing_plans.allow_signals_center IS 'Allows access to the Botvio Signals Center route and feed.';
COMMENT ON COLUMN public.pricing_plans.allow_ai_chart_upload IS 'Allows AI chart upload/analysis tools.';
COMMENT ON COLUMN public.pricing_plans.allow_trading_hubs IS 'Allows subscribed users to use protected trading hubs.';
COMMENT ON COLUMN public.pricing_plans.allow_legacy_bots IS 'Explicit opt-in for legacy bot catalog/features; defaults off.';
