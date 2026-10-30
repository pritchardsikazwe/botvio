CREATE INDEX IF NOT EXISTS idx_trading_signals_recent_feed ON public.trading_signals (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_trading_signals_status_recent_feed ON public.trading_signals (status, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_trading_signals_category_recent_feed ON public.trading_signals (category, created_at DESC, id DESC);
ALTER POLICY "Enforce trial signal unlocks" ON public.trading_signals USING ((SELECT public.has_paid_signal_access()) OR public.can_read_signal(id));