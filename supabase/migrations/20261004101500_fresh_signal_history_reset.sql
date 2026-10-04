-- Fresh Botvio signal-history reset
-- Explicitly clears both the legacy public archive and the newer signal-engine
-- history so the verified track record starts from zero.
--
-- This intentionally does NOT delete users, trading accounts, copy relationships,
-- market data, or signal screenshots stored elsewhere.

delete from public.signals_history;
delete from public.trading_signals;
