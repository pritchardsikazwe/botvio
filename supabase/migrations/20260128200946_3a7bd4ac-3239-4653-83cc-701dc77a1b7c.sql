-- ============================================================
-- BOTVIO DATABASE SCHEMA - Multi-bot, Multi-broker Platform
-- ============================================================

-- Create app_role enum for admin approval system
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table for admin system
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);
    
CREATE POLICY "Admins can manage all roles" ON public.user_roles
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 1.1 BROKERS TABLE
-- ============================================================
CREATE TABLE public.brokers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view brokers" ON public.brokers
    FOR SELECT USING (true);

-- Seed brokers
INSERT INTO public.brokers (code, name) VALUES 
    ('deriv', 'Deriv'),
    ('binance', 'Binance');

-- ============================================================
-- 1.2 TRADING ACCOUNTS (user broker connections)
-- ============================================================
CREATE TABLE public.trading_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    broker TEXT NOT NULL CHECK (broker IN ('deriv', 'binance')),
    label TEXT NOT NULL,
    login_id TEXT,
    api_key_encrypted TEXT NOT NULL,
    api_secret_encrypted TEXT,
    permissions_json JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trading_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own trading accounts" ON public.trading_accounts
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 1.3 BOTS CATALOG
-- ============================================================
CREATE TABLE public.bots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    short_description TEXT,
    description TEXT,
    supported_brokers TEXT[] DEFAULT ARRAY['deriv'],
    default_markets TEXT[] DEFAULT ARRAY['XAUUSD'],
    is_premium BOOLEAN DEFAULT false,
    config_schema_json JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view bots" ON public.bots
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage bots" ON public.bots
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Seed bots
INSERT INTO public.bots (code, name, short_description, supported_brokers, default_markets, is_premium) VALUES
    ('hauza', 'Hauza Sniper', 'EMA + S/R + Wick rejection strategy', ARRAY['deriv', 'binance'], ARRAY['XAUUSD'], false),
    ('boom_crash_sniper', 'Boom/Crash Sniper', 'Spike detection for Boom/Crash indices', ARRAY['deriv'], ARRAY['BOOM1000', 'CRASH1000'], true),
    ('volatility_trend', 'Volatility Trend', 'Trend following for volatility indices', ARRAY['deriv'], ARRAY['R_100', 'R_75'], false),
    ('btc_trend', 'BTC Trend', 'Bitcoin trend following strategy', ARRAY['binance'], ARRAY['BTCUSDT'], true),
    ('grid_bot', 'Grid Bot', 'Automated grid trading strategy', ARRAY['binance'], ARRAY['BTCUSDT', 'ETHUSDT'], true),
    ('risk_guard', 'Risk Guard', 'Universal risk management helper', ARRAY['deriv', 'binance'], ARRAY[]::TEXT[], false);

-- ============================================================
-- 1.4 BOT INSTANCES (user runs bots)
-- ============================================================
CREATE TABLE public.bot_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    bot_id UUID REFERENCES public.bots(id) ON DELETE CASCADE NOT NULL,
    trading_account_id UUID REFERENCES public.trading_accounts(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'paused' CHECK (status IN ('active', 'paused', 'stopped')),
    markets TEXT[] DEFAULT ARRAY['XAUUSD'],
    config_json JSONB DEFAULT '{}',
    risk_per_trade_percent NUMERIC DEFAULT 1.0,
    max_daily_loss_percent NUMERIC DEFAULT 5.0,
    max_open_trades INTEGER DEFAULT 3,
    max_stake NUMERIC DEFAULT 10.0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bot_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own bot instances" ON public.bot_instances
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 1.5 COPY TRADING - PROVIDERS
-- ============================================================
CREATE TABLE public.providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    verified BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
    total_subscribers INTEGER DEFAULT 0,
    total_trades INTEGER DEFAULT 0,
    win_rate NUMERIC DEFAULT 0,
    total_profit NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved providers" ON public.providers
    FOR SELECT USING (status = 'approved' OR auth.uid() = user_id);

CREATE POLICY "Users can create own provider profile" ON public.providers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own provider profile" ON public.providers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all providers" ON public.providers
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Provider accounts (which trading account is used for providing signals)
CREATE TABLE public.provider_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE NOT NULL,
    trading_account_id UUID REFERENCES public.trading_accounts(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'stopped')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (provider_id, trading_account_id)
);

ALTER TABLE public.provider_accounts ENABLE ROW LEVEL SECURITY;

-- Function to check provider ownership
CREATE OR REPLACE FUNCTION public.is_provider_owner(provider_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.providers
    WHERE id = provider_id AND user_id = auth.uid()
  )
$$;

CREATE POLICY "Provider owners can manage accounts" ON public.provider_accounts
    FOR ALL USING (public.is_provider_owner(provider_id));

-- ============================================================
-- COPY SUBSCRIPTIONS
-- ============================================================
CREATE TABLE public.copy_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE NOT NULL,
    subscriber_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subscriber_trading_account_id UUID REFERENCES public.trading_accounts(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'stopped')),
    copy_mode TEXT DEFAULT 'fixed' CHECK (copy_mode IN ('fixed', 'multiplier', 'proportional')),
    fixed_stake NUMERIC DEFAULT 1.0,
    multiplier NUMERIC DEFAULT 1.0,
    proportional_mode TEXT DEFAULT 'balance_ratio' CHECK (proportional_mode IN ('balance_ratio', 'equity_ratio')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (provider_id, subscriber_user_id, subscriber_trading_account_id)
);

ALTER TABLE public.copy_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subscribers can manage own subscriptions" ON public.copy_subscriptions
    FOR ALL USING (auth.uid() = subscriber_user_id);

CREATE POLICY "Providers can view their subscribers" ON public.copy_subscriptions
    FOR SELECT USING (public.is_provider_owner(provider_id));

-- ============================================================
-- 1.6 TRADE LOGS
-- ============================================================

-- Provider trades (master trades)
CREATE TABLE public.provider_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE NOT NULL,
    provider_trading_account_id UUID REFERENCES public.trading_accounts(id) ON DELETE CASCADE NOT NULL,
    broker TEXT DEFAULT 'deriv',
    symbol TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('BUY', 'SELL')),
    stake NUMERIC NOT NULL,
    duration INTEGER DEFAULT 5,
    duration_unit TEXT DEFAULT 't',
    broker_trade_id TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'error')),
    profit_loss NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    closed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.provider_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can manage own trades" ON public.provider_trades
    FOR ALL USING (public.is_provider_owner(provider_id));

CREATE POLICY "Subscribers can view provider trades" ON public.provider_trades
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.copy_subscriptions cs
            WHERE cs.provider_id = provider_trades.provider_id
            AND cs.subscriber_user_id = auth.uid()
            AND cs.status = 'active'
        )
    );

-- Copied trades (subscriber copies)
CREATE TABLE public.copied_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_trade_id UUID REFERENCES public.provider_trades(id) ON DELETE CASCADE NOT NULL,
    subscriber_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subscriber_trading_account_id UUID REFERENCES public.trading_accounts(id) ON DELETE CASCADE NOT NULL,
    broker_trade_id TEXT,
    symbol TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('BUY', 'SELL')),
    stake NUMERIC NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'error')),
    profit_loss NUMERIC,
    opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    closed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.copied_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subscribers can view own copied trades" ON public.copied_trades
    FOR ALL USING (auth.uid() = subscriber_user_id);

-- Bot trades
CREATE TABLE public.bot_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_instance_id UUID REFERENCES public.bot_instances(id) ON DELETE CASCADE NOT NULL,
    broker_trade_id TEXT,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('BUY', 'SELL')),
    stake NUMERIC,
    quantity NUMERIC,
    entry_price NUMERIC,
    exit_price NUMERIC,
    stop_loss NUMERIC,
    take_profit NUMERIC,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled', 'error')),
    pnl NUMERIC,
    opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    closed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.bot_trades ENABLE ROW LEVEL SECURITY;

-- Function to check bot instance ownership
CREATE OR REPLACE FUNCTION public.is_bot_instance_owner(instance_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bot_instances
    WHERE id = instance_id AND user_id = auth.uid()
  )
$$;

CREATE POLICY "Users can manage own bot trades" ON public.bot_trades
    FOR ALL USING (public.is_bot_instance_owner(bot_instance_id));

-- ============================================================
-- 1.7 RISK SESSIONS
-- ============================================================
CREATE TABLE public.risk_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    trading_account_id UUID REFERENCES public.trading_accounts(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_balance NUMERIC,
    current_balance NUMERIC,
    daily_pnl NUMERIC DEFAULT 0,
    stop_trading BOOLEAN DEFAULT false,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, trading_account_id, date)
);

ALTER TABLE public.risk_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own risk sessions" ON public.risk_sessions
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 1.8 PRICING PLANS & SUBSCRIPTIONS
-- ============================================================
CREATE TABLE public.pricing_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    price_usd NUMERIC DEFAULT 0,
    price_zmw NUMERIC DEFAULT 0,
    max_bot_instances INTEGER DEFAULT 2,
    max_accounts INTEGER DEFAULT 1,
    allow_copy_trading BOOLEAN DEFAULT false,
    allow_premium_bots BOOLEAN DEFAULT false,
    allow_provider_listing BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pricing plans" ON public.pricing_plans
    FOR SELECT USING (true);

-- Seed pricing plans
INSERT INTO public.pricing_plans (code, name, price_usd, price_zmw, max_bot_instances, max_accounts, allow_copy_trading, allow_premium_bots, allow_provider_listing) VALUES
    ('starter', 'Starter', 0, 0, 2, 1, false, false, false),
    ('pro', 'Pro', 29, 750, 5, 2, true, true, false),
    ('vip', 'VIP', 99, 2500, 999, 10, true, true, true);

-- User subscriptions
CREATE TABLE public.user_plan_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    pricing_plan_id UUID REFERENCES public.pricing_plans(id) NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_plan_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON public.user_plan_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage subscriptions" ON public.user_plan_subscriptions
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 1.9 AUDIT LOGS
-- ============================================================
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    payload_json JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs" ON public.audit_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'trade')),
    is_read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notifications" ON public.notifications
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- AUTO-ASSIGN STARTER PLAN ON USER CREATION
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_botvio()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    starter_plan_id UUID;
BEGIN
    -- Get starter plan ID
    SELECT id INTO starter_plan_id FROM public.pricing_plans WHERE code = 'starter' LIMIT 1;
    
    -- Create user subscription with starter plan
    IF starter_plan_id IS NOT NULL THEN
        INSERT INTO public.user_plan_subscriptions (user_id, pricing_plan_id)
        VALUES (NEW.id, starter_plan_id)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created_botvio ON auth.users;
CREATE TRIGGER on_auth_user_created_botvio
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_botvio();

-- ============================================================
-- UPDATE TIMESTAMPS TRIGGERS
-- ============================================================
CREATE TRIGGER update_trading_accounts_updated_at
    BEFORE UPDATE ON public.trading_accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_bot_instances_updated_at
    BEFORE UPDATE ON public.bot_instances
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_providers_updated_at
    BEFORE UPDATE ON public.providers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_copy_subscriptions_updated_at
    BEFORE UPDATE ON public.copy_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_risk_sessions_updated_at
    BEFORE UPDATE ON public.risk_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_user_plan_subscriptions_updated_at
    BEFORE UPDATE ON public.user_plan_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();