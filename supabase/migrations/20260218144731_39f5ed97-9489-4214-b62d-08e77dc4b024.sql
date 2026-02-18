
-- ============================================
-- user_deriv_tokens: multi-account token store
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_deriv_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  loginid text NOT NULL,
  is_virtual boolean NOT NULL DEFAULT false,
  currency text NOT NULL DEFAULT 'USD',
  token_encrypted text NOT NULL,
  label text NULL,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, loginid)
);

CREATE INDEX IF NOT EXISTS idx_deriv_tokens_user ON public.user_deriv_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_deriv_tokens_active ON public.user_deriv_tokens(user_id, is_active);

-- Partial unique index: only one active token per user
CREATE UNIQUE INDEX IF NOT EXISTS uniq_one_active_token_per_user
  ON public.user_deriv_tokens(user_id) WHERE is_active = true;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_deriv_tokens_updated_at
BEFORE UPDATE ON public.user_deriv_tokens
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.user_deriv_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tokens_read_own" ON public.user_deriv_tokens
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "tokens_insert_own" ON public.user_deriv_tokens
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tokens_update_own" ON public.user_deriv_tokens
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tokens_delete_own" ON public.user_deriv_tokens
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- deriv_trades: trade lifecycle linked to token
-- ============================================
CREATE TABLE IF NOT EXISTS public.deriv_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token_id uuid NOT NULL REFERENCES public.user_deriv_tokens(id) ON DELETE CASCADE,
  loginid text NOT NULL,
  symbol text NOT NULL,
  is_virtual boolean NOT NULL DEFAULT false,
  currency text NOT NULL DEFAULT 'USD',
  contract_id bigint NOT NULL,
  contract_type text NULL,
  buy_price numeric NOT NULL,
  sell_price numeric NULL,
  payout numeric NULL,
  profit numeric NULL,
  status text NOT NULL DEFAULT 'RUNNING',
  outcome text NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(token_id, contract_id)
);

CREATE INDEX IF NOT EXISTS idx_deriv_trades_user ON public.deriv_trades(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deriv_trades_status ON public.deriv_trades(user_id, status);

CREATE TRIGGER trg_deriv_trades_updated_at
BEFORE UPDATE ON public.deriv_trades
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.deriv_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trades_read_own" ON public.deriv_trades
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "trades_insert_own" ON public.deriv_trades
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trades_update_own" ON public.deriv_trades
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
