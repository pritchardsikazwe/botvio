-- Compatibility migration for the original Botvio trading_accounts schema.
-- Keeps the existing TradeCopy master/robot accounts intact.
ALTER TABLE public.trading_accounts
  ADD COLUMN IF NOT EXISTS botvio_signal_master_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS botvio_signal_master_lot numeric NOT NULL DEFAULT 0.01,
  ADD COLUMN IF NOT EXISTS botvio_signal_min_confidence integer NOT NULL DEFAULT 70;

-- Configure the existing non-Robot Deriv MT5 TradeCopy master as the
-- Botvio Signal Master when it is present. Never create a new account.
UPDATE public.trading_accounts
SET botvio_signal_master_enabled = false
WHERE account_role = 'master';

UPDATE public.trading_accounts
SET botvio_signal_master_enabled = true,
    botvio_signal_master_lot = 0.01,
    botvio_signal_min_confidence = 70
WHERE tradecopy_user_id = 35164
  AND account_role = 'master'
  AND COALESCE(is_botvio_robot, false) = false
  AND COALESCE(is_active, true) = true
  AND COALESCE(tradecopy_active, false) = true;