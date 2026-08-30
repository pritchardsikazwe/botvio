CREATE POLICY "Providers can view copies of their trades"
ON public.copied_trades
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.provider_trades pt
  WHERE pt.id = copied_trades.provider_trade_id
    AND public.is_provider_owner(pt.provider_id)
));