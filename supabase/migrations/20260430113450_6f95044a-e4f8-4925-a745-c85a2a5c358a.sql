ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS hub_auto_mt5_symbols jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.user_settings.hub_auto_mt5_symbols IS
  'Per-symbol toggle for auto-sending hub signals to MT5 (e.g. {"XAUUSD": true, "BTCUSD": false}).';