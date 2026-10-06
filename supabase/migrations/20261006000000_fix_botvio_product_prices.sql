-- Fix Botvio product prices without overwriting admin-edited values.
UPDATE public.products
SET price_usd = 19
WHERE slug IN ('synthetic-hub','weltrade-hub')
  AND COALESCE(price_usd,0) = 0;

UPDATE public.products
SET price_usd = 39
WHERE slug IN ('gold-robot','synthetic-robot','botvio-ai-robot')
  AND COALESCE(price_usd,0) = 0;

UPDATE public.products
SET price_usd = 29
WHERE slug = 'mt5-direct'
  AND COALESCE(price_usd,0) = 0;

UPDATE public.products
SET is_active = true
WHERE slug IN ('synthetic-hub','weltrade-hub','gold-robot','synthetic-robot','botvio-ai-robot','mt5-direct')
  AND COALESCE(is_active, false) = false;

UPDATE public.products
SET billing_type = 'recurring'
WHERE slug IN ('synthetic-hub','weltrade-hub','gold-robot','synthetic-robot','botvio-ai-robot','mt5-direct')
  AND billing_type IS NULL;

UPDATE public.products
SET billing_interval = 'month'
WHERE slug IN ('synthetic-hub','weltrade-hub','gold-robot','synthetic-robot','botvio-ai-robot','mt5-direct')
  AND billing_interval IS NULL;
