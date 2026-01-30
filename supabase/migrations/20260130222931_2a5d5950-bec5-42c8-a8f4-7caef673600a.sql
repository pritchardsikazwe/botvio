-- Create trial_grants table for free VIP 2-day trial
CREATE TABLE IF NOT EXISTS public.trial_grants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    plan_id UUID REFERENCES public.pricing_plans(id),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trial_grants ENABLE ROW LEVEL SECURITY;

-- RLS policies for trial_grants
CREATE POLICY "Users can view own trial" ON public.trial_grants
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage trials" ON public.trial_grants
    FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create payment_requests table for manual offline payments
CREATE TABLE IF NOT EXISTS public.payment_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    plan_id UUID REFERENCES public.pricing_plans(id),
    amount_usd NUMERIC NOT NULL,
    currency TEXT DEFAULT 'USD',
    method TEXT NOT NULL CHECK (method IN ('mobile_money', 'crypto', 'cash', 'bank_transfer')),
    proof_upload_url TEXT,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'rejected')),
    admin_note TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_requests
CREATE POLICY "Users can view own payment requests" ON public.payment_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create payment requests" ON public.payment_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage payment requests" ON public.payment_requests
    FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create deriv_symbols_cache table for symbol validation
CREATE TABLE IF NOT EXISTS public.deriv_symbols_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    market TEXT,
    submarket TEXT,
    is_active BOOLEAN DEFAULT true,
    pip_size NUMERIC,
    cached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deriv_symbols_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access to symbols cache
CREATE POLICY "Anyone can view symbols cache" ON public.deriv_symbols_cache
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage symbols cache" ON public.deriv_symbols_cache
    FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create app_settings table for global settings
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL DEFAULT '{}',
    description TEXT,
    updated_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to settings
CREATE POLICY "Anyone can view settings" ON public.app_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage settings" ON public.app_settings
    FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_trial_grants_user_id ON public.trial_grants(user_id);
CREATE INDEX IF NOT EXISTS idx_trial_grants_ends_at ON public.trial_grants(ends_at);
CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id ON public.payment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON public.payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_deriv_symbols_cache_symbol ON public.deriv_symbols_cache(symbol);
CREATE INDEX IF NOT EXISTS idx_deriv_symbols_cache_market ON public.deriv_symbols_cache(market);

-- Add updated_at trigger for payment_requests
CREATE TRIGGER update_payment_requests_updated_at
    BEFORE UPDATE ON public.payment_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Insert default app settings
INSERT INTO public.app_settings (key, value, description)
VALUES 
    ('trial_duration_hours', '48', 'Duration of free VIP trial in hours'),
    ('min_payout_usd', '2', 'Minimum payout amount in USD'),
    ('symbol_cache_ttl_hours', '6', 'How long to cache Deriv symbols')
ON CONFLICT (key) DO NOTHING;