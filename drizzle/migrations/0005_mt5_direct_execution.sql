ALTER TABLE public.trading_accounts
  ADD COLUMN IF NOT EXISTS direct_signal_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS direct_signal_status text NOT NULL DEFAULT 'off',
  ADD COLUMN IF NOT EXISTS direct_live_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS direct_lot numeric NOT NULL DEFAULT 0.01,
  ADD COLUMN IF NOT EXISTS direct_min_confidence integer NOT NULL DEFAULT 70,
  ADD COLUMN IF NOT EXISTS direct_symbol_map jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_direct_signal_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_direct_execution_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_direct_error text;

-- Direct-execution state can only be changed server-side (service role) or by admins,
-- so a user cannot self-confirm LIVE or forge status through the owner policy.
CREATE OR REPLACE FUNCTION public.guard_direct_execution_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.role() = 'service_role' OR public.is_admin() THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.direct_signal_enabled := false; NEW.direct_signal_status := 'off'; NEW.direct_live_confirmed_at := NULL;
    NEW.last_direct_signal_at := NULL; NEW.last_direct_execution_at := NULL; NEW.last_direct_error := NULL;
    RETURN NEW;
  END IF;
  NEW.direct_signal_enabled := OLD.direct_signal_enabled;
  NEW.direct_signal_status := OLD.direct_signal_status;
  NEW.direct_live_confirmed_at := OLD.direct_live_confirmed_at;
  NEW.direct_lot := OLD.direct_lot;
  NEW.direct_min_confidence := OLD.direct_min_confidence;
  NEW.direct_symbol_map := OLD.direct_symbol_map;
  NEW.last_direct_signal_at := OLD.last_direct_signal_at;
  NEW.last_direct_execution_at := OLD.last_direct_execution_at;
  NEW.last_direct_error := OLD.last_direct_error;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS guard_direct_execution_fields_trg ON public.trading_accounts;
CREATE TRIGGER guard_direct_execution_fields_trg BEFORE INSERT OR UPDATE ON public.trading_accounts
FOR EACH ROW EXECUTE FUNCTION public.guard_direct_execution_fields();

CREATE TABLE IF NOT EXISTS public.direct_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trading_account_id uuid NOT NULL REFERENCES public.trading_accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  signal_id uuid NOT NULL,
  symbol text NOT NULL,
  mt5_symbol text NOT NULL,
  direction text NOT NULL,
  volume numeric NOT NULL,
  entry_price numeric,
  stop_loss numeric,
  take_profit numeric,
  environment text NOT NULL DEFAULT 'DEMO',
  mode text NOT NULL DEFAULT 'simulated',
  status text NOT NULL DEFAULT 'pending',
  ticket text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT direct_executions_once UNIQUE (trading_account_id, signal_id)
);
GRANT SELECT ON public.direct_executions TO authenticated;
GRANT ALL ON public.direct_executions TO service_role;
ALTER TABLE public.direct_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view own direct executions" ON public.direct_executions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins view all direct executions" ON public.direct_executions FOR SELECT TO authenticated USING (public.is_admin());
CREATE INDEX IF NOT EXISTS direct_executions_account_idx ON public.direct_executions (trading_account_id, created_at DESC);
CREATE TRIGGER direct_executions_updated BEFORE UPDATE ON public.direct_executions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP POLICY IF EXISTS "Admins view all broker market feeds" ON public.broker_market_feeds;
CREATE POLICY "Admins view all broker market feeds" ON public.broker_market_feeds FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Admins view all syntx connections" ON public.syntx_api_connections;