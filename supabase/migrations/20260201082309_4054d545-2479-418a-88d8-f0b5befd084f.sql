-- =============================================
-- TASK 1: Ensure super_admin role setup
-- =============================================

-- Ensure pritchardsikazwe@gmail.com has super_admin role
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'super_admin'::app_role
FROM auth.users u
WHERE lower(u.email) = lower('pritchardsikazwe@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;

-- =============================================
-- TASK 2: Signal approvals workflow improvements
-- =============================================

-- Add approval audit fields to trading_signals if not present
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trading_signals' AND column_name = 'approved_by') THEN
    ALTER TABLE public.trading_signals ADD COLUMN approved_by uuid REFERENCES auth.users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trading_signals' AND column_name = 'approved_at') THEN
    ALTER TABLE public.trading_signals ADD COLUMN approved_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trading_signals' AND column_name = 'rejection_reason') THEN
    ALTER TABLE public.trading_signals ADD COLUMN rejection_reason text;
  END IF;
END $$;

-- Create signal_audit_logs table for tracking approvals
CREATE TABLE IF NOT EXISTS public.signal_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id uuid REFERENCES public.trading_signals(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL, -- 'submitted', 'approved', 'rejected', 'expired'
  performed_by uuid REFERENCES auth.users(id),
  old_status text,
  new_status text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.signal_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can read signal audit logs" 
ON public.signal_audit_logs FOR SELECT
USING (is_admin());

-- Only admins can insert audit logs  
CREATE POLICY "Admins can insert signal audit logs"
ON public.signal_audit_logs FOR INSERT
WITH CHECK (is_admin());

-- =============================================
-- TASK 3: Market sessions table for trading hours
-- =============================================

CREATE TABLE IF NOT EXISTS public.market_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_type text NOT NULL, -- 'forex', 'indices', 'synthetic', 'crypto'
  market_name text NOT NULL,
  timezone text NOT NULL DEFAULT 'UTC',
  open_time time,
  close_time time,
  open_days integer[] NOT NULL DEFAULT ARRAY[1,2,3,4,5], -- 0=Sun, 1=Mon, ... 6=Sat
  is_24_7 boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.market_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can read market sessions
CREATE POLICY "Anyone can view market sessions"
ON public.market_sessions FOR SELECT
USING (true);

-- Only admins can manage market sessions
CREATE POLICY "Admins can manage market sessions"
ON public.market_sessions FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Seed market sessions
INSERT INTO public.market_sessions (market_type, market_name, timezone, open_time, close_time, open_days, is_24_7) VALUES
  ('forex', 'Forex Major Pairs', 'UTC', '22:00', '22:00', ARRAY[0,1,2,3,4,5,6], false), -- Sunday 22:00 to Friday 22:00
  ('indices', 'US Indices (NAS100/US30)', 'America/New_York', '09:30', '16:00', ARRAY[1,2,3,4,5], false),
  ('indices', 'UK100', 'Europe/London', '08:00', '16:30', ARRAY[1,2,3,4,5], false),
  ('synthetic', 'Synthetic Indices', 'UTC', NULL, NULL, ARRAY[0,1,2,3,4,5,6], true),
  ('crypto', 'Crypto Markets', 'UTC', NULL, NULL, ARRAY[0,1,2,3,4,5,6], true)
ON CONFLICT DO NOTHING;

-- =============================================
-- TASK 4: Trade execution logging
-- =============================================

CREATE TABLE IF NOT EXISTS public.trade_execution_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trading_account_id uuid REFERENCES public.trading_accounts(id) ON DELETE SET NULL,
  signal_id uuid REFERENCES public.trading_signals(id) ON DELETE SET NULL,
  request_type text NOT NULL, -- 'proposal', 'buy', 'sell', 'close'
  request_payload jsonb,
  response_payload jsonb,
  contract_id text,
  status text NOT NULL, -- 'pending', 'success', 'failed'
  error_message text,
  execution_time_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trade_execution_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own execution logs
CREATE POLICY "Users can view own trade execution logs"
ON public.trade_execution_logs FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own execution logs
CREATE POLICY "Users can insert own trade execution logs"
ON public.trade_execution_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all execution logs
CREATE POLICY "Admins can view all trade execution logs"
ON public.trade_execution_logs FOR SELECT
USING (is_admin());

-- =============================================
-- TASK 5: User trade settings (risk limits, kill switch)
-- =============================================

-- Add auto-trading settings to user_settings
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'auto_trading_enabled') THEN
    ALTER TABLE public.user_settings ADD COLUMN auto_trading_enabled boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'auto_trading_consent_at') THEN
    ALTER TABLE public.user_settings ADD COLUMN auto_trading_consent_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'max_daily_trades') THEN
    ALTER TABLE public.user_settings ADD COLUMN max_daily_trades integer DEFAULT 10;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'max_daily_loss_usd') THEN
    ALTER TABLE public.user_settings ADD COLUMN max_daily_loss_usd numeric DEFAULT 50;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'kill_switch') THEN
    ALTER TABLE public.user_settings ADD COLUMN kill_switch boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'admin_kill_switch') THEN
    ALTER TABLE public.user_settings ADD COLUMN admin_kill_switch boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'admin_kill_switch_reason') THEN
    ALTER TABLE public.user_settings ADD COLUMN admin_kill_switch_reason text;
  END IF;
END $$;

-- =============================================
-- TASK 6: Products table (strategies/courses/bots/signal_packs)
-- =============================================

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL, -- 'strategy', 'course', 'bot', 'signal_pack'
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  short_description text,
  cover_image_url text,
  price_usd numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  strategy_id uuid REFERENCES public.strategies(id) ON DELETE SET NULL,
  bot_id uuid REFERENCES public.bots(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Anyone can view active products
CREATE POLICY "Anyone can view active products"
ON public.products FOR SELECT
USING (is_active = true OR is_admin());

-- Admins can manage products
CREATE POLICY "Admins can manage products"
ON public.products FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Product purchases
CREATE TABLE IF NOT EXISTS public.product_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  affiliate_code text,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

ALTER TABLE public.product_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view own product purchases"
ON public.product_purchases FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own purchases (via payment flow)
CREATE POLICY "Users can insert own product purchases"
ON public.product_purchases FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all purchases
CREATE POLICY "Admins can view all product purchases"
ON public.product_purchases FOR SELECT
USING (is_admin());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trading_signals_status ON public.trading_signals(status);
CREATE INDEX IF NOT EXISTS idx_trading_signals_expires_at ON public.trading_signals(expires_at);
CREATE INDEX IF NOT EXISTS idx_trading_signals_posted_by ON public.trading_signals(posted_by);
CREATE INDEX IF NOT EXISTS idx_signal_audit_logs_signal_id ON public.signal_audit_logs(signal_id);
CREATE INDEX IF NOT EXISTS idx_trade_execution_logs_user_id ON public.trade_execution_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_products_type ON public.products(type);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_product_purchases_user_id ON public.product_purchases(user_id);