-- Allow the MT5 TradeCopy broker directory used by the connection UI.
-- lower(trim()) keeps broker matching case/spacing tolerant while retaining
-- an explicit allow-list rather than removing validation.
alter table public.trading_accounts drop constraint if exists trading_accounts_broker_check;

alter table public.trading_accounts add constraint trading_accounts_broker_check
check (lower(trim(broker)) = any (array[
  'deriv',
  'binance',
  'weltrade',
  'exness',
  'hfm',
  'ic markets',
  'xm',
  'pepperstone',
  'fbs',
  'roboforex',
  'vantage',
  'fxpro',
  'other'
]::text[]));