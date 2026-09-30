-- TradeCopy execution layer (additive only)
ALTER TABLE public.trading_accounts
  ADD COLUMN IF NOT EXISTS platform text,
  ADD COLUMN IF NOT EXISTS server text,
  ADD COLUMN IF NOT EXISTS tradecopy_user_id bigint,
  ADD COLUMN IF NOT EXISTS account_role text,
  ADD COLUMN IF NOT EXISTS environment text NOT NULL DEFAULT 'DEMO',
  ADD COLUMN IF NOT EXISTS credential_ref uuid,
  ADD COLUMN IF NOT EXISTS external_account_id text,
  ADD COLUMN IF NOT EXISTS execution_provider text,
  ADD COLUMN IF NOT EXISTS tradecopy_active boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_diagnostic jsonb,
  ADD COLUMN IF NOT EXISTS last_diagnostic_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_botvio_robot boolean NOT NULL DEFAULT false;

ALTER TABLE public.trading_accounts ADD CONSTRAINT trading_accounts_account_role_check CHECK (account_role IS NULL OR account_role IN ('master','slave'));
ALTER TABLE public.trading_accounts ADD CONSTRAINT trading_accounts_environment_check CHECK (environment IN ('DEMO','LIVE'));

-- Encrypted credentials: service role only, never readable by clients
CREATE TABLE public.tradecopy_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trading_account_id uuid NOT NULL UNIQUE REFERENCES public.trading_accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  password_encrypted text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.tradecopy_credentials TO service_role;
ALTER TABLE public.tradecopy_credentials ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.copy_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES public.providers(id) ON DELETE SET NULL,
  is_botvio_robot boolean NOT NULL DEFAULT false,
  master_account_id uuid REFERENCES public.trading_accounts(id) ON DELETE SET NULL,
  follower_account_id uuid NOT NULL REFERENCES public.trading_accounts(id) ON DELETE CASCADE,
  follower_user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'inactive' CHECK (status IN ('inactive','active','paused','stopped','error')),
  copy_order_type smallint NOT NULL DEFAULT 1 CHECK (copy_order_type IN (0,1)),
  environment text NOT NULL DEFAULT 'DEMO' CHECK (environment IN ('DEMO','LIVE')),
  live_confirmed_at timestamptz,
  emergency_stopped_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_account_id, master_account_id)
);
GRANT SELECT ON public.copy_relationships TO authenticated;
GRANT ALL ON public.copy_relationships TO service_role;
ALTER TABLE public.copy_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Followers view own relationships" ON public.copy_relationships FOR SELECT TO authenticated
  USING (follower_user_id = auth.uid() OR public.is_admin() OR (provider_id IS NOT NULL AND public.is_provider_owner(provider_id)));

CREATE TABLE public.copy_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id uuid NOT NULL UNIQUE REFERENCES public.copy_relationships(id) ON DELETE CASCADE,
  risk_type smallint NOT NULL DEFAULT 1 CHECK (risk_type BETWEEN 0 AND 3),
  multiplier numeric NOT NULL DEFAULT 1 CHECK (multiplier > 0 AND multiplier <= 100),
  copy_sltp boolean NOT NULL DEFAULT true,
  order_filter smallint NOT NULL DEFAULT 0 CHECK (order_filter BETWEEN 0 AND 3),
  scalper_mode smallint NOT NULL DEFAULT 0 CHECK (scalper_mode BETWEEN 0 AND 2),
  scalper_value integer NOT NULL DEFAULT 0 CHECK (scalper_value >= 0),
  order_control jsonb NOT NULL DEFAULT '{}'::jsonb,
  max_lot numeric,
  synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.copy_settings TO authenticated;
GRANT ALL ON public.copy_settings TO service_role;
ALTER TABLE public.copy_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Followers view own copy settings" ON public.copy_settings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.copy_relationships r WHERE r.id = relationship_id AND (r.follower_user_id = auth.uid() OR public.is_admin())));

CREATE TABLE public.symbol_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_account_id uuid NOT NULL REFERENCES public.trading_accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  source_symbol text NOT NULL,
  follow_symbol text NOT NULL,
  map_type text NOT NULL DEFAULT 'Special' CHECK (map_type IN ('Suffix','Special')),
  synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_account_id, source_symbol)
);
GRANT SELECT ON public.symbol_mappings TO authenticated;
GRANT ALL ON public.symbol_mappings TO service_role;
ALTER TABLE public.symbol_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own symbol mappings" ON public.symbol_mappings FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE TABLE public.copy_execution_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text NOT NULL UNIQUE,
  relationship_id uuid REFERENCES public.copy_relationships(id) ON DELETE SET NULL,
  provider_id uuid,
  master_account_id uuid,
  follower_account_id uuid,
  follower_user_id uuid,
  source_ticket text,
  follower_ticket text,
  symbol text,
  side text,
  source_lot numeric,
  follower_lot numeric,
  entry_price numeric,
  stop_loss numeric,
  take_profit numeric,
  profit numeric,
  status text NOT NULL DEFAULT 'open',
  error text,
  environment text NOT NULL DEFAULT 'DEMO',
  opened_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX copy_execution_events_follower_idx ON public.copy_execution_events (follower_user_id, created_at DESC);
GRANT SELECT ON public.copy_execution_events TO authenticated;
GRANT ALL ON public.copy_execution_events TO service_role;
ALTER TABLE public.copy_execution_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own execution events" ON public.copy_execution_events FOR SELECT TO authenticated
  USING (follower_user_id = auth.uid() OR public.is_admin() OR (provider_id IS NOT NULL AND public.is_provider_owner(provider_id)));

CREATE TABLE public.tradecopy_reconcile_checkpoints (
  trading_account_id uuid PRIMARY KEY REFERENCES public.trading_accounts(id) ON DELETE CASCADE,
  last_polled_at timestamptz,
  last_history_date date,
  last_open_count integer,
  last_error text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.tradecopy_reconcile_checkpoints TO service_role;
GRANT SELECT ON public.tradecopy_reconcile_checkpoints TO authenticated;
ALTER TABLE public.tradecopy_reconcile_checkpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view checkpoints" ON public.tradecopy_reconcile_checkpoints FOR SELECT TO authenticated USING (public.is_admin());

CREATE TABLE public.tradecopy_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  trading_account_id uuid,
  action text NOT NULL,
  mode text NOT NULL,
  ok boolean NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tradecopy_audit_log TO authenticated;
GRANT ALL ON public.tradecopy_audit_log TO service_role;
ALTER TABLE public.tradecopy_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own tradecopy audit" ON public.tradecopy_audit_log FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE TRIGGER copy_relationships_updated BEFORE UPDATE ON public.copy_relationships FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER copy_settings_updated BEFORE UPDATE ON public.copy_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER copy_execution_events_updated BEFORE UPDATE ON public.copy_execution_events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER tradecopy_credentials_updated BEFORE UPDATE ON public.tradecopy_credentials FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.copy_relationships IS 'TradeCopy master->slave relationships. Writes only via tradecopy-api edge function.';