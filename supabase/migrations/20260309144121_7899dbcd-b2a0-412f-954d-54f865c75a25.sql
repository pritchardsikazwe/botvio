CREATE POLICY "Visitors can view active signals"
ON public.trading_signals
FOR SELECT
TO anon
USING (status = 'ACTIVE');