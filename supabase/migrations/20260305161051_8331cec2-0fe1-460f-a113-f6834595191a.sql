DROP POLICY IF EXISTS "Signal managers can insert signals" ON public.trading_signals;

CREATE POLICY "Signal managers can insert signals"
ON public.trading_signals
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'signal_manager'::public.app_role));