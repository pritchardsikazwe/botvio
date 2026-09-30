# TradeCopy execution layer (MT5)

Botvio is the product layer, and TradeCopy handles execution and copying. MT5 is supported now. Other platforms get added by implementing
`ExecutionAdapter` in `supabase/functions/_shared/tradecopy/adapter.ts`.

## Setup

1. Get an API key from your TradeCopy account (the dashboard at `http://us-1-server.tradecopy.online:3310`).
   The key that was pasted in chat earlier is **compromised**. Rotate it and use a new one.
2. In **Project Settings → Secrets**, add:
   - `TRADECOPY_API_KEY`: your new key. This is server-only; never use a `VITE_` variable for it.
   - `TRADECOPY_MODE`: leave it unset (mock) until you're ready. Set it to `live` to make real API calls.
   - `TRADECOPY_BASE_URL` (optional): defaults to `http://us-1-server.tradecopy.online:3310`.
3. MT5 passwords are encrypted with AES-GCM using the existing `TOKEN_ENCRYPTION_KEY`. They're stored in
   `tradecopy_credentials`, which only the server can read.

## Safety layers (all must pass for LIVE)

1. The adapter is the mock unless `TRADECOPY_API_KEY` **and** `TRADECOPY_MODE=live` are both set.
2. `app_settings.tradecopy_live_enabled = {"enabled": true}` (default `false`).
3. The account/relationship environment is `LIVE`. New connections are always `DEMO` and inactive.
4. For each relationship, the user must type `START LIVE COPYING` to confirm.
5. An emergency stop blocks resuming until the user resets it.

## Pieces

- `tradecopy-api`: authenticated wrapper. Actions: connect_master, connect_follower, link, update_settings,
  map_symbol, delete_mapping, discover_symbols, diagnostic, open_orders, set_master_active, set_environment,
  set_relationship_status, emergency_stop, robot_order (admin, Botvio Robot master), status.
- `tradecopy-reconcile`: runs every 5 minutes. It polls `get_orders_mt5` and `get_order_history_mt5`, then upserts
  `copy_execution_events` by an idempotency key, so repeated polls never duplicate records. It never places orders.
- Tables: `copy_relationships`, `copy_settings`, `symbol_mappings`, `copy_execution_events`,
  `tradecopy_reconcile_checkpoints`, `tradecopy_audit_log`, `tradecopy_credentials`, plus new TradeCopy columns on
  `trading_accounts`.
- UI: Provider Dashboard (`/provider-dashboard`), Follower Dashboard (`/copy-trading/my`), Botvio Robot (`/botvio-robot`).
- Tests: `supabase/functions/_shared/tradecopy/tradecopy.test.ts` (`bunx vitest run`).

## Botvio Robot

Botvio signal → `robot_order` → TradeCopy master (the account flagged `is_botvio_robot`) → TradeCopy cloud copy → followers.
No Bridge EA or VPS is used. The old Bridge path (`useMt5HubExecution`, `bridge-*` functions) is deprecated but kept.
