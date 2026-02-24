
-- 1) MT5 accounts connected to Botvio (provider or follower)
CREATE TABLE IF NOT EXISTS public.mt5_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('provider','follower')),
  broker text NOT NULL,
  server text NOT NULL,
  login bigint NOT NULL,
  currency text,
  nickname text,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS mt5_accounts_unique
ON public.mt5_accounts (broker, server, login);

-- 2) EA tokens (so each MT5 terminal authenticates securely)
CREATE TABLE IF NOT EXISTS public.ea_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.mt5_accounts(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  label text,
  revoked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz
);

-- 3) Copy links: follower subscribes to provider
CREATE TABLE IF NOT EXISTS public.copy_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_account_id uuid NOT NULL REFERENCES public.mt5_accounts(id) ON DELETE CASCADE,
  follower_account_id uuid NOT NULL REFERENCES public.mt5_accounts(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','stopped')),
  lot_mode text NOT NULL DEFAULT 'equity_ratio'
    CHECK (lot_mode IN ('fixed','balance_ratio','equity_ratio')),
  fixed_lot numeric,
  risk_mult numeric NOT NULL DEFAULT 1.0,
  max_lot numeric NOT NULL DEFAULT 10.0,
  max_trades int NOT NULL DEFAULT 20,
  slippage_points int NOT NULL DEFAULT 30,
  copy_sl_tp boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4) Provider trade events (EA streams opens/modifies/closes)
CREATE TABLE IF NOT EXISTS public.trade_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_account_id uuid NOT NULL REFERENCES public.mt5_accounts(id) ON DELETE CASCADE,
  provider_trade_id text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('OPEN','MODIFY','PARTIAL_CLOSE','CLOSE')),
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trade_events_provider_idx
ON public.trade_events(provider_account_id, created_at DESC);

-- 5) Commands queue: Botvio tells follower EA what to do
CREATE TABLE IF NOT EXISTS public.follower_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_account_id uuid NOT NULL REFERENCES public.mt5_accounts(id) ON DELETE CASCADE,
  provider_trade_id text,
  command_type text NOT NULL
    CHECK (command_type IN ('OPEN','MODIFY','CLOSE')),
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','sent','done','failed')),
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  done_at timestamptz
);

CREATE INDEX IF NOT EXISTS follower_commands_follower_idx
ON public.follower_commands(follower_account_id, status, created_at);

-- 6) Trade mapping: provider trade -> follower trade
CREATE TABLE IF NOT EXISTS public.copy_trade_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  copy_link_id uuid NOT NULL REFERENCES public.copy_links(id) ON DELETE CASCADE,
  provider_trade_id text NOT NULL,
  follower_trade_id text,
  state text NOT NULL DEFAULT 'open'
    CHECK (state IN ('open','closed','error')),
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS copy_trade_map_unique
ON public.copy_trade_map(copy_link_id, provider_trade_id);

-- Enable RLS on all tables
ALTER TABLE public.mt5_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ea_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copy_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follower_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copy_trade_map ENABLE ROW LEVEL SECURITY;

-- Helper function to check mt5 account ownership
CREATE OR REPLACE FUNCTION public.owns_mt5_account(acct_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.mt5_accounts
    WHERE id = acct_id AND user_id = auth.uid()
  )
$$;

-- RLS: mt5_accounts - owner can CRUD
CREATE POLICY "mt5_accounts_owner_all"
ON public.mt5_accounts FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS: ea_tokens - owner of the account can manage
CREATE POLICY "ea_tokens_owner_all"
ON public.ea_tokens FOR ALL
USING (public.owns_mt5_account(account_id))
WITH CHECK (public.owns_mt5_account(account_id));

-- RLS: copy_links - read by provider or follower owner; insert by follower owner
CREATE POLICY "copy_links_read"
ON public.copy_links FOR SELECT
USING (
  public.owns_mt5_account(provider_account_id)
  OR public.owns_mt5_account(follower_account_id)
);

CREATE POLICY "copy_links_insert"
ON public.copy_links FOR INSERT
WITH CHECK (public.owns_mt5_account(follower_account_id));

CREATE POLICY "copy_links_update"
ON public.copy_links FOR UPDATE
USING (public.owns_mt5_account(follower_account_id));

CREATE POLICY "copy_links_delete"
ON public.copy_links FOR DELETE
USING (public.owns_mt5_account(follower_account_id));

-- RLS: trade_events - readable by provider account owner
CREATE POLICY "trade_events_read_owner"
ON public.trade_events FOR SELECT
USING (public.owns_mt5_account(provider_account_id));

-- Service role insert for edge functions
CREATE POLICY "trade_events_service_insert"
ON public.trade_events FOR INSERT
WITH CHECK (true);

-- RLS: follower_commands - readable by follower account owner
CREATE POLICY "follower_commands_read_owner"
ON public.follower_commands FOR SELECT
USING (public.owns_mt5_account(follower_account_id));

CREATE POLICY "follower_commands_service_insert"
ON public.follower_commands FOR INSERT
WITH CHECK (true);

CREATE POLICY "follower_commands_service_update"
ON public.follower_commands FOR UPDATE
USING (true);

-- RLS: copy_trade_map - readable by follower owner via copy_link
CREATE POLICY "copy_trade_map_read"
ON public.copy_trade_map FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.copy_links cl
    WHERE cl.id = copy_trade_map.copy_link_id
    AND (public.owns_mt5_account(cl.follower_account_id) OR public.owns_mt5_account(cl.provider_account_id))
  )
);

CREATE POLICY "copy_trade_map_service_all"
ON public.copy_trade_map FOR ALL
USING (true)
WITH CHECK (true);

-- Admin can see everything
CREATE POLICY "mt5_accounts_admin" ON public.mt5_accounts FOR SELECT USING (public.is_admin());
CREATE POLICY "ea_tokens_admin" ON public.ea_tokens FOR SELECT USING (public.is_admin());
CREATE POLICY "copy_links_admin" ON public.copy_links FOR SELECT USING (public.is_admin());
CREATE POLICY "trade_events_admin" ON public.trade_events FOR SELECT USING (public.is_admin());
CREATE POLICY "follower_commands_admin" ON public.follower_commands FOR SELECT USING (public.is_admin());
CREATE POLICY "copy_trade_map_admin" ON public.copy_trade_map FOR SELECT USING (public.is_admin());

-- Online status view
CREATE OR REPLACE VIEW public.mt5_accounts_status AS
SELECT
  a.*,
  MAX(t.last_seen_at) AS last_seen_at_token,
  CASE
    WHEN MAX(t.last_seen_at) > now() - interval '60 seconds' THEN true
    ELSE false
  END AS is_online
FROM public.mt5_accounts a
LEFT JOIN public.ea_tokens t ON t.account_id = a.id AND t.revoked = false
GROUP BY a.id;
