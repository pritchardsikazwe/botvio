-- Paid MT5 direct-execution entitlement.
-- Direct signal execution is a monetized feature and must be explicitly granted by an admin.
ALTER TABLE public.trading_accounts
  ADD COLUMN IF NOT EXISTS direct_execution_entitled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS direct_execution_plan text,
  ADD COLUMN IF NOT EXISTS direct_execution_expires_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_trading_accounts_direct_entitlement
  ON public.trading_accounts (direct_execution_entitled, direct_execution_expires_at);

-- Existing direct-signal flags are preserved, but no account is automatically
-- granted the new paid entitlement. Admin must explicitly assign access.
