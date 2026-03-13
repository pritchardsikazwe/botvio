
DROP POLICY IF EXISTS "Users can manage own P2P offers" ON public.p2p_offers;

CREATE POLICY "Users can insert own offers"
ON public.p2p_offers FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own offers"
ON public.p2p_offers FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own offers"
ON public.p2p_offers FOR DELETE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create P2P trades as buyer" ON public.p2p_trades;
CREATE POLICY "Users can create P2P trades as buyer"
ON public.p2p_trades FOR INSERT TO authenticated
WITH CHECK (auth.uid() = buyer_id);
