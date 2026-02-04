-- ============================================
-- BOTVIO Trading System Database Schema
-- ============================================

-- Create mt5_commands table for EA bridge communication
CREATE TABLE IF NOT EXISTS public.mt5_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  terminal_uid text NOT NULL,
  command jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'SENT', 'ACKED', 'FAILED')),
  result jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  acked_at timestamptz
);

-- Create mt5_states table for terminal state tracking
CREATE TABLE IF NOT EXISTS public.mt5_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  terminal_uid text NOT NULL UNIQUE,
  balance numeric,
  equity numeric,
  margin numeric,
  free_margin numeric,
  positions jsonb DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_mt5_commands_terminal_uid ON public.mt5_commands(terminal_uid);
CREATE INDEX IF NOT EXISTS idx_mt5_commands_status ON public.mt5_commands(status);

-- Enable RLS on new tables
ALTER TABLE public.mt5_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mt5_states ENABLE ROW LEVEL SECURITY;

-- RLS policies for mt5_commands (bridge auth via shared secret in edge function)
CREATE POLICY "Service role can manage mt5_commands" ON public.mt5_commands FOR ALL USING (true);

-- RLS policies for mt5_states  
CREATE POLICY "Service role can manage mt5_states" ON public.mt5_states FOR ALL USING (true);

-- Add missing columns to existing tables if needed

-- Ensure trading_accounts has connection_type if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'trading_accounts' AND column_name = 'connection_type') 
  THEN
    ALTER TABLE public.trading_accounts ADD COLUMN connection_type text DEFAULT 'api_token';
  END IF;
END $$;

-- Add deriv_account_id to trading_accounts if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'trading_accounts' AND column_name = 'deriv_account_id') 
  THEN
    ALTER TABLE public.trading_accounts ADD COLUMN deriv_account_id text;
  END IF;
END $$;

-- Create global_kill_switch in admin_controls if not exists
INSERT INTO public.app_settings (key, value, description)
VALUES ('global_kill_switch', '{"enabled": false, "reason": null}'::jsonb, 'Global trading kill switch')
ON CONFLICT (key) DO NOTHING;

-- Add contract_family to strategies if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'strategies' AND column_name = 'contract_family') 
  THEN
    ALTER TABLE public.strategies ADD COLUMN contract_family text CHECK (contract_family IN ('MULTIPLIERS', 'DIGITS', 'RISEFALL', 'ACCUMULATOR', NULL));
  END IF;
END $$;

-- Add market_type to strategies if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'strategies' AND column_name = 'market_type') 
  THEN
    ALTER TABLE public.strategies ADD COLUMN market_type text CHECK (market_type IN ('DERIV_CONTRACTS', 'MT5_CFD', NULL));
  END IF;
END $$;

-- Create trade_intents table for idempotent trade execution
CREATE TABLE IF NOT EXISTS public.trade_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  strategy_id uuid REFERENCES public.strategies(id) ON DELETE SET NULL,
  connection_id uuid REFERENCES public.deriv_connections(id) ON DELETE SET NULL,
  intent jsonb NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key text NOT NULL,
  status text NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'SENT', 'FILLED', 'REJECTED', 'FAILED')),
  error text,
  broker_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, idempotency_key)
);

-- Create executions table for trade results
CREATE TABLE IF NOT EXISTS public.executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  trade_intent_id uuid REFERENCES public.trade_intents(id) ON DELETE CASCADE,
  broker_ref text,
  fill_price numeric,
  stake_or_lot numeric NOT NULL,
  pnl numeric,
  status text,
  raw jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_trade_intents_user_id ON public.trade_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_intents_status ON public.trade_intents(status);
CREATE INDEX IF NOT EXISTS idx_executions_user_id ON public.executions(user_id);
CREATE INDEX IF NOT EXISTS idx_executions_trade_intent_id ON public.executions(trade_intent_id);

-- Enable RLS
ALTER TABLE public.trade_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executions ENABLE ROW LEVEL SECURITY;

-- RLS policies for trade_intents
CREATE POLICY "Users can view own trade_intents" ON public.trade_intents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trade_intents" ON public.trade_intents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trade_intents" ON public.trade_intents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all trade_intents" ON public.trade_intents FOR ALL USING (is_admin());

-- RLS policies for executions
CREATE POLICY "Users can view own executions" ON public.executions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own executions" ON public.executions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all executions" ON public.executions FOR ALL USING (is_admin());

-- Add realtime for trade updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.trade_intents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.executions;