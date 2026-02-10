-- Allow all authenticated users to READ trading signals
CREATE POLICY "Authenticated users can view signals"
ON public.trading_signals
FOR SELECT
USING (auth.uid() IS NOT NULL);
