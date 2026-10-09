# Project architecture rules

- Home MT5 running trades and results use the existing account-authorized TradeCopy execution_status action; mock snapshots and signal executions are never presented as broker positions, and anonymous visitors never receive private account data.

- Home chart uploads reuse the existing ChartUpload screen so modes, history, usage checks and results stay consistent with the Signals and Trading pages.

- Classify Weltrade SyntX instruments by family before analysis; ordinary Forex, metals, crypto and stocks retain the generic market engine because SyntX mechanics are family-specific.
- Publish SyntX event or regime labels only from observable loaded market data; show “Data unavailable” when the required tick or sequence state is absent to prevent fabricated analysis.- MT5 copy execution goes through the TradeCopy adapter (`supabase/functions/_shared/tradecopy`) via the `tradecopy-api` edge function only; the X-API-KEY never reaches the browser.
- TradeCopy uses the mock adapter unless both `TRADECOPY_API_KEY` and `TRADECOPY_MODE=live` are set, and LIVE copying also needs the `tradecopy_live_enabled` app setting plus per-relationship confirmation, to prevent accidental real trades.
- The Bridge EA/VPS MT5 path is deprecated but kept until TradeCopy demo verification succeeds.
- Canonical SEO origin is the BASE_URL constant in src/config/domain.ts (https://botvio.live); SEOHead and sitemap/robots functions ignore DB/host values so preview hosts never leak into canonicals (guarded by src/test/seo-canonical.test.ts).
- MT5 roles (DATA FEED, DIRECT EXECUTION, PROVIDER MASTER, BOTVIO ROBOT MASTER, FOLLOWER) are derived from facts, not stored; direct signals go through `mt5-direct-execution` only and never call TradeCopy `link`, so they never consume a TradeCopy registration.
- Direct execution is idempotent via unique (trading_account_id, signal_id) in `direct_executions`, simulates orders unless `MT5_DIRECT_MODE=live`, and LIVE accounts need the typed per-account confirmation plus the global live setting; a DB trigger guards direct_* columns from client edits.
