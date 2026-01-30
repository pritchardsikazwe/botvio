-- =====================================================
-- BOTVIO AFFILIATE + STRATEGY SHARING DATABASE SCHEMA
-- =====================================================

-- 1. AFFILIATE PROFILES
CREATE TABLE public.affiliate_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    affiliate_code TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    default_payout_method TEXT DEFAULT 'crypto' CHECK (default_payout_method IN ('crypto', 'mobile_money')),
    total_clicks INTEGER DEFAULT 0,
    total_signups INTEGER DEFAULT 0,
    total_earnings_usd NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. AFFILIATE LINKS
CREATE TABLE public.affiliate_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('bot', 'strategy', 'campaign', 'generic')),
    target_id UUID,
    code TEXT NOT NULL UNIQUE,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. REFERRAL CLICKS (for tracking)
CREATE TABLE public.referral_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL,
    referrer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    landing_path TEXT,
    ip_hash TEXT,
    user_agent_hash TEXT,
    country TEXT,
    device_fingerprint_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. REFERRALS (attributed signups)
CREATE TABLE public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referred_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    affiliate_code TEXT NOT NULL,
    first_click_id UUID REFERENCES public.referral_clicks(id) ON DELETE SET NULL,
    attributed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    ip_hash TEXT,
    device_hash TEXT,
    CONSTRAINT no_self_referral CHECK (referred_user_id != referrer_user_id)
);

-- 5. COMMISSION RULES
CREATE TABLE public.commission_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope_type TEXT NOT NULL CHECK (scope_type IN ('bot', 'strategy', 'campaign', 'global')),
    scope_id UUID,
    name TEXT NOT NULL,
    referrer_type TEXT NOT NULL CHECK (referrer_type IN ('percent', 'fixed')),
    referrer_value NUMERIC(10,2) NOT NULL DEFAULT 0,
    buyer_bonus_type TEXT DEFAULT 'none' CHECK (buyer_bonus_type IN ('percent', 'fixed', 'none')),
    buyer_bonus_value NUMERIC(10,2) DEFAULT 0,
    min_purchase_usd NUMERIC(10,2),
    max_commission_usd NUMERIC(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. ORDERS
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_type TEXT NOT NULL CHECK (product_type IN ('bot', 'strategy', 'subscription')),
    product_id UUID,
    amount_usd NUMERIC(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
    referral_code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    paid_at TIMESTAMPTZ
);

-- 7. AFFILIATE EARNINGS LEDGER
CREATE TABLE public.affiliate_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    earning_type TEXT NOT NULL CHECK (earning_type IN ('signup', 'purchase', 'bonus')),
    amount_usd NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
    rule_id UUID REFERENCES public.commission_rules(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. PAYOUT METHODS
CREATE TABLE public.payout_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('crypto', 'mobile_money')),
    crypto_network TEXT CHECK (crypto_network IN ('TRC20', 'ERC20', 'BTC')),
    crypto_address TEXT,
    mobile_network TEXT CHECK (mobile_network IN ('MTN', 'Airtel', 'Zamtel')),
    mobile_number TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. PAYOUT REQUESTS
CREATE TABLE public.payout_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount_usd NUMERIC(10,2) NOT NULL CHECK (amount_usd >= 2),
    method_id UUID NOT NULL REFERENCES public.payout_methods(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'processing', 'paid', 'rejected')),
    admin_note TEXT,
    tx_reference TEXT,
    processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ
);

-- 10. STRATEGIES (Marketplace)
CREATE TABLE public.strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    market TEXT NOT NULL CHECK (market IN ('deriv', 'binance', 'mt5', 'exness')),
    symbols TEXT[] DEFAULT '{}',
    config_json JSONB DEFAULT '{}',
    pricing_type TEXT NOT NULL DEFAULT 'free' CHECK (pricing_type IN ('free', 'paid')),
    price_usd NUMERIC(10,2),
    is_public BOOLEAN DEFAULT false,
    cover_image_url TEXT,
    downloads INTEGER DEFAULT 0,
    rating NUMERIC(3,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. STRATEGY PURCHASES
CREATE TABLE public.strategy_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    strategy_id UUID NOT NULL REFERENCES public.strategies(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, strategy_id)
);

-- 12. USER LANGUAGE PREFERENCES
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS country TEXT;

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_affiliate_links_user ON public.affiliate_links(user_id);
CREATE INDEX idx_affiliate_links_code ON public.affiliate_links(code);
CREATE INDEX idx_referral_clicks_code ON public.referral_clicks(code);
CREATE INDEX idx_referral_clicks_created ON public.referral_clicks(created_at);
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_user_id);
CREATE INDEX idx_affiliate_earnings_referrer ON public.affiliate_earnings(referrer_user_id);
CREATE INDEX idx_affiliate_earnings_status ON public.affiliate_earnings(status);
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_strategies_slug ON public.strategies(slug);
CREATE INDEX idx_strategies_public ON public.strategies(is_public) WHERE is_public = true;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Affiliate Profiles
ALTER TABLE public.affiliate_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own affiliate profile"
ON public.affiliate_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own affiliate profile"
ON public.affiliate_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own affiliate profile"
ON public.affiliate_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all affiliate profiles"
ON public.affiliate_profiles FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Affiliate Links
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own affiliate links"
ON public.affiliate_links FOR ALL
USING (auth.uid() = user_id);

-- Referral Clicks (insert only for tracking, view by referrer)
ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert referral clicks"
ON public.referral_clicks FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view clicks on their codes"
ON public.referral_clicks FOR SELECT
USING (auth.uid() = referrer_user_id);

CREATE POLICY "Admins can view all clicks"
ON public.referral_clicks FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Referrers can view their referrals"
ON public.referrals FOR SELECT
USING (auth.uid() = referrer_user_id);

CREATE POLICY "Admins can manage referrals"
ON public.referrals FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Commission Rules
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active commission rules"
ON public.commission_rules FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage commission rules"
ON public.commission_rules FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
ON public.orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage orders"
ON public.orders FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Affiliate Earnings
ALTER TABLE public.affiliate_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own earnings"
ON public.affiliate_earnings FOR SELECT
USING (auth.uid() = referrer_user_id);

CREATE POLICY "Admins can manage earnings"
ON public.affiliate_earnings FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Payout Methods
ALTER TABLE public.payout_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own payout methods"
ON public.payout_methods FOR ALL
USING (auth.uid() = user_id);

-- Payout Requests
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payout requests"
ON public.payout_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own payout requests"
ON public.payout_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage payout requests"
ON public.payout_requests FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Strategies
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public strategies"
ON public.strategies FOR SELECT
USING (is_public = true);

CREATE POLICY "Users can view own strategies"
ON public.strategies FOR SELECT
USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can manage own strategies"
ON public.strategies FOR ALL
USING (auth.uid() = owner_user_id);

-- Strategy Purchases
ALTER TABLE public.strategy_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases"
ON public.strategy_purchases FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own purchases"
ON public.strategy_purchases FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Enable realtime for affiliate earnings
ALTER PUBLICATION supabase_realtime ADD TABLE public.affiliate_earnings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payout_requests;

-- =====================================================
-- SEED DEFAULT COMMISSION RULES
-- =====================================================
INSERT INTO public.commission_rules (scope_type, name, referrer_type, referrer_value, buyer_bonus_type, buyer_bonus_value, is_active)
VALUES 
    ('global', 'Default Signup Bonus', 'fixed', 2.00, 'none', 0, true),
    ('global', 'Default Purchase Commission', 'percent', 20.00, 'fixed', 1.00, true);