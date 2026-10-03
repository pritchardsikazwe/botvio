-- Keep MT5 broker names extensible. The connection form supports brokers beyond
-- the original Deriv/Binance/MT5-era fixed list.
ALTER TABLE public.trading_accounts DROP CONSTRAINT IF EXISTS trading_accounts_broker_check;
ALTER TABLE public.trading_accounts
  ADD CONSTRAINT trading_accounts_broker_check
  CHECK (length(btrim(broker)) BETWEEN 2 AND 100);
