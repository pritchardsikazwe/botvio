
-- 1) Exchange accounts (Binance API keys, encrypted as text via Edge Function AES)
CREATE TABLE IF NOT EXISTS public.exchange_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  exchange text NOT NULL CHECK (exchange IN ('binance')),
  label text DEFAULT 'Binance',
  api_key_enc text NOT NULL,
  api_secret_enc text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exchange_accounts_user ON public.exchange_accounts(user_id);

-- 2) Exchange strategies (templates for Binance bots)
CREATE TABLE IF NOT EXISTS public.exchange_strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange text NOT NULL CHECK (exchange IN ('binance')),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  market_type text NOT NULL CHECK (market_type IN ('spot','futures')),
  schema_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  template_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3) Exchange bot instances (user's running Binance bots)
CREATE TABLE IF NOT EXISTS public.exchange_bot_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  exchange_account_id uuid NOT NULL REFERENCES public.exchange_accounts(id) ON DELETE CASCADE,
  strategy_id uuid NOT NULL REFERENCES public.exchange_strategies(id) ON DELETE RESTRICT,
  market_type text NOT NULL CHECK (market_type IN ('spot','futures')),
  symbol text NOT NULL,
  status text NOT NULL DEFAULT 'paused' CHECK (status IN ('running','paused','stopped')),
  risk_profile text NOT NULL DEFAULT 'low' CHECK (risk_profile IN ('low','medium','high')),
  config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exchange_bot_instances_user ON public.exchange_bot_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_exchange_bot_instances_status ON public.exchange_bot_instances(status);

-- 4) Exchange bot runs (audit trail)
CREATE TABLE IF NOT EXISTS public.exchange_bot_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_instance_id uuid NOT NULL REFERENCES public.exchange_bot_instances(id) ON DELETE CASCADE,
  ran_at timestamptz NOT NULL DEFAULT now(),
  decision text NOT NULL CHECK (decision IN ('buy','sell','hold','close','error')),
  reason text,
  snapshot jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exchange_bot_runs_bot ON public.exchange_bot_runs(bot_instance_id);

-- 5) Exchange orders
CREATE TABLE IF NOT EXISTS public.exchange_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_instance_id uuid REFERENCES public.exchange_bot_instances(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  exchange text NOT NULL CHECK (exchange IN ('binance')),
  symbol text NOT NULL,
  side text NOT NULL CHECK (side IN ('BUY','SELL')),
  order_type text NOT NULL CHECK (order_type IN ('MARKET','LIMIT')),
  quantity numeric(28,12),
  price numeric(28,12),
  status text NOT NULL DEFAULT 'NEW',
  exchange_order_id text,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exchange_orders_user ON public.exchange_orders(user_id);

-- 6) Exchange positions (futures - optional, prepared)
CREATE TABLE IF NOT EXISTS public.exchange_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  exchange text NOT NULL CHECK (exchange IN ('binance')),
  symbol text NOT NULL,
  market_type text NOT NULL CHECK (market_type IN ('spot','futures')),
  position_side text,
  qty numeric(28,12),
  entry_price numeric(28,12),
  unrealized_pnl numeric(28,12),
  raw jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ====== RLS ======
ALTER TABLE public.exchange_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_bot_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_bot_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_positions ENABLE ROW LEVEL SECURITY;

-- exchange_accounts policies
CREATE POLICY "ea_select_own" ON public.exchange_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ea_insert_own" ON public.exchange_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ea_update_own" ON public.exchange_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ea_delete_own" ON public.exchange_accounts FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "ea_admin_all" ON public.exchange_accounts FOR ALL USING (is_admin());

-- exchange_strategies policies (public read, admin write)
CREATE POLICY "es_select_all" ON public.exchange_strategies FOR SELECT USING (true);
CREATE POLICY "es_admin_all" ON public.exchange_strategies FOR ALL USING (is_admin());

-- exchange_bot_instances policies
CREATE POLICY "ebi_select_own" ON public.exchange_bot_instances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ebi_insert_own" ON public.exchange_bot_instances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ebi_update_own" ON public.exchange_bot_instances FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ebi_delete_own" ON public.exchange_bot_instances FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "ebi_admin_all" ON public.exchange_bot_instances FOR ALL USING (is_admin());

-- exchange_bot_runs policies
CREATE POLICY "ebr_select_own" ON public.exchange_bot_runs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.exchange_bot_instances bi WHERE bi.id = bot_instance_id AND bi.user_id = auth.uid()));
CREATE POLICY "ebr_admin_all" ON public.exchange_bot_runs FOR ALL USING (is_admin());

-- exchange_orders policies
CREATE POLICY "eo_select_own" ON public.exchange_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "eo_insert_own" ON public.exchange_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "eo_admin_all" ON public.exchange_orders FOR ALL USING (is_admin());

-- exchange_positions policies
CREATE POLICY "ep_select_own" ON public.exchange_positions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ep_admin_all" ON public.exchange_positions FOR ALL USING (is_admin());
