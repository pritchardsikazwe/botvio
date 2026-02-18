
-- Table to enforce single active Deriv token per user
CREATE TABLE public.user_active_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  loginid text NOT NULL,
  is_virtual boolean NOT NULL DEFAULT false,
  currency text NOT NULL DEFAULT 'USD',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, loginid)
);

-- Only one active token per user (enforced via trigger)
CREATE OR REPLACE FUNCTION public.enforce_single_active_token()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.user_active_tokens
    SET is_active = false, updated_at = now()
    WHERE user_id = NEW.user_id AND id != NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_single_active_token
BEFORE INSERT OR UPDATE ON public.user_active_tokens
FOR EACH ROW
EXECUTE FUNCTION public.enforce_single_active_token();

-- Timestamp trigger
CREATE TRIGGER update_user_active_tokens_updated_at
BEFORE UPDATE ON public.user_active_tokens
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.user_active_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own active tokens"
ON public.user_active_tokens
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Running trades table for real-time contract tracking
CREATE TABLE public.running_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contract_id bigint NOT NULL UNIQUE,
  loginid text NOT NULL,
  is_virtual boolean NOT NULL DEFAULT false,
  symbol text NOT NULL,
  contract_type text NOT NULL,
  buy_price numeric NOT NULL,
  current_profit numeric NOT NULL DEFAULT 0,
  payout numeric,
  status text NOT NULL DEFAULT 'RUNNING',
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  sell_price numeric,
  final_profit numeric,
  final_status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER update_running_trades_updated_at
BEFORE UPDATE ON public.running_trades
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.running_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own running trades"
ON public.running_trades
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Enable realtime for running_trades
ALTER PUBLICATION supabase_realtime ADD TABLE public.running_trades;
