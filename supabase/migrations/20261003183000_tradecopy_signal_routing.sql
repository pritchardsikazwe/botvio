-- Route Botvio-generated MT5 signals through the existing TradeCopy master/slave infrastructure.
-- No Bridge EA is used for execution.

ALTER TABLE public.trading_accounts
  ADD COLUMN IF NOT EXISTS botvio_signal_master_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS botvio_signal_master_lot numeric NOT NULL DEFAULT 0.01,
  ADD COLUMN IF NOT EXISTS botvio_signal_min_confidence integer NOT NULL DEFAULT 70;

CREATE UNIQUE INDEX IF NOT EXISTS trading_accounts_one_botvio_signal_master_idx
  ON public.trading_accounts (botvio_signal_master_enabled)
  WHERE botvio_signal_master_enabled = true;

CREATE INDEX IF NOT EXISTS trading_accounts_botvio_signal_master_idx
  ON public.trading_accounts (account_role, botvio_signal_master_enabled, tradecopy_active);

COMMENT ON COLUMN public.trading_accounts.botvio_signal_master_enabled IS
  'Exact TradeCopy MT5 master that receives Botvio-generated signals.';
COMMENT ON COLUMN public.trading_accounts.botvio_signal_master_lot IS
  'Default lot size used when Botvio opens a generated signal on the configured TradeCopy master.';
COMMENT ON COLUMN public.trading_accounts.botvio_signal_min_confidence IS
  'Minimum Botvio signal confidence accepted by the configured TradeCopy master route.';
