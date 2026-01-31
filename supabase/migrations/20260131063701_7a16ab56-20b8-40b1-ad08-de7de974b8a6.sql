-- =====================================================
-- BOTVIO COMPREHENSIVE UPDATE MIGRATION
-- Fixes: Primary Market, Broker Connections, Subscriptions, P2P
-- =====================================================

-- 1. Add primary_market column to providers table
ALTER TABLE public.providers
ADD COLUMN IF NOT EXISTS primary_market text;

-- 2. Add broker_connection_type to trading_accounts
ALTER TABLE public.trading_accounts
ADD COLUMN IF NOT EXISTS connection_type text DEFAULT 'api_token',
ADD COLUMN IF NOT EXISTS deriv_account_id text,
ADD COLUMN IF NOT EXISTS is_virtual boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS token_scopes text[],
ADD COLUMN IF NOT EXISTS connection_status text DEFAULT 'connected';

-- 3. Create subscription_requests table for admin approval workflow
CREATE TABLE IF NOT EXISTS public.subscription_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid REFERENCES public.pricing_plans(id),
  current_plan_id uuid REFERENCES public.pricing_plans(id),
  status text NOT NULL DEFAULT 'pending_approval',
  amount_usd numeric NOT NULL,
  payment_method text,
  proof_upload_url text,
  admin_note text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on subscription_requests
ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscription_requests
CREATE POLICY "Users can view own subscription requests"
ON public.subscription_requests FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own subscription requests"
ON public.subscription_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscription requests"
ON public.subscription_requests FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Create P2P tables
CREATE TABLE IF NOT EXISTS public.p2p_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('buy', 'sell')),
  price numeric NOT NULL,
  currency text NOT NULL DEFAULT 'ZMW',
  min_amount numeric NOT NULL DEFAULT 50,
  max_amount numeric NOT NULL DEFAULT 50000,
  payment_methods text[] NOT NULL DEFAULT ARRAY['Mobile Money'],
  is_active boolean DEFAULT true,
  terms text,
  auto_reply text,
  completion_rate numeric DEFAULT 100,
  avg_release_time integer DEFAULT 5,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.p2p_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid REFERENCES public.p2p_offers(id) ON DELETE SET NULL,
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  amount_usd numeric NOT NULL,
  amount_fiat numeric NOT NULL,
  currency text NOT NULL,
  price numeric NOT NULL,
  payment_method text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'released', 'disputed', 'cancelled', 'completed')),
  buyer_confirmed_at timestamp with time zone,
  seller_released_at timestamp with time zone,
  dispute_reason text,
  admin_resolution text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.p2p_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id uuid REFERENCES public.p2p_trades(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL,
  reviewed_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on P2P tables
ALTER TABLE public.p2p_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.p2p_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.p2p_reviews ENABLE ROW LEVEL SECURITY;

-- P2P Offers policies
CREATE POLICY "Anyone can view active P2P offers"
ON public.p2p_offers FOR SELECT
TO authenticated
USING (is_active = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage own P2P offers"
ON public.p2p_offers FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- P2P Trades policies
CREATE POLICY "Users can view own P2P trades"
ON public.p2p_trades FOR SELECT
TO authenticated
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create P2P trades as buyer"
ON public.p2p_trades FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Participants can update P2P trades"
ON public.p2p_trades FOR UPDATE
TO authenticated
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Admins can manage all P2P trades"
ON public.p2p_trades FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- P2P Reviews policies
CREATE POLICY "Anyone can view P2P reviews"
ON public.p2p_reviews FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Trade participants can create reviews"
ON public.p2p_reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reviewer_id);

-- 5. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_p2p_offers_active ON public.p2p_offers(is_active, type);
CREATE INDEX IF NOT EXISTS idx_p2p_trades_status ON public.p2p_trades(status);
CREATE INDEX IF NOT EXISTS idx_p2p_trades_participants ON public.p2p_trades(buyer_id, seller_id);
CREATE INDEX IF NOT EXISTS idx_subscription_requests_status ON public.subscription_requests(status);
CREATE INDEX IF NOT EXISTS idx_subscription_requests_user ON public.subscription_requests(user_id);

-- 6. Create P2P trader stats view function
CREATE OR REPLACE FUNCTION public.get_p2p_trader_stats(trader_id uuid)
RETURNS TABLE(
  total_trades bigint,
  completed_trades bigint,
  avg_rating numeric,
  total_volume numeric,
  completion_rate numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*) as total_trades,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_trades,
    COALESCE(AVG(r.rating), 0) as avg_rating,
    COALESCE(SUM(amount_usd) FILTER (WHERE status = 'completed'), 0) as total_volume,
    CASE WHEN COUNT(*) > 0 
      THEN (COUNT(*) FILTER (WHERE status = 'completed')::numeric / COUNT(*)::numeric * 100)
      ELSE 100
    END as completion_rate
  FROM public.p2p_trades t
  LEFT JOIN public.p2p_reviews r ON r.reviewed_id = trader_id
  WHERE t.buyer_id = trader_id OR t.seller_id = trader_id;
$$;

-- 7. Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.p2p_offers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.p2p_trades;
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscription_requests;