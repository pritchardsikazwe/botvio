-- Add expires_at column to trading_signals for signal expiration
ALTER TABLE public.trading_signals ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster expiration queries
CREATE INDEX IF NOT EXISTS idx_trading_signals_expires_at ON public.trading_signals(expires_at);

-- Create a function to auto-expire signals
CREATE OR REPLACE FUNCTION public.auto_expire_signals()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.trading_signals
    SET status = 'EXPIRED'
    WHERE status = 'ACTIVE' 
    AND expires_at IS NOT NULL 
    AND expires_at < now();
END;
$$;