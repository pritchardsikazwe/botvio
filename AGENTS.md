# Project architecture rules
- Trial signal details require atomic per-user daily unlocks enforced by restrictive signal RLS; homepage IDs are stored in a shared daily batch so refreshes cannot rotate category picks or bypass the trial cap outside public selections.

- Signup contact metadata is persisted by the existing profile-creation trigger before email confirmation; profile edits require saved-row readback, and WhatsApp validation is shared across signup and completion to prevent false success.
- Admin user contact presentation is shared by mobile list entries and desktop rows, keeping WhatsApp and country visible without horizontal scrolling on phones.

- Stream participant identities and watch-time rows are accessed only through authorized server-side stream actions; public market analysis remains readable but AI signal creation is service-role only, preventing viewer-data disclosure and client-inserted signals.

- Copy-risk calculations and strategy intentions live in shared pure TradeCopy helpers; the pre-entry capability lock was lifted by the owner, so remaining order gates (stops, per-market limit, LIVE confirmations) must not be weakened further.
- Emergency copy controls persist account-wide relationship latches before upstream calls and read remaining broker tickets before reporting closure; adapter mocks must mutate positions for meaningful recovery tests.

- Botvio Robot overview presentation lives in TradingOverview with locally scoped semantic theme tokens; CopyControlCenter retains account queries, authentication gates and execution controls so appearance changes do not alter trading behavior.

- Scheduled Weltrade generation reuses the existing SyntX schedule and trading_signals publication/MT5 webhook; broker-returned symbols, broker-time windows and closed UTC candles are required before publishing, preserving quality and execution gates.

- Home MT5 running trades and results use the existing account-authorized TradeCopy execution_status action; mock snapshots and signal executions are never presented as broker positions, and anonymous visitors never receive private account data.

- Home chart uploads reuse the existing ChartUpload screen so modes, history, usage checks and results stay consistent with the Signals and Trading pages.

- Classify Weltrade SyntX instruments by family before analysis; ordinary Forex, metals, crypto and stocks retain the generic market engine because SyntX mechanics are family-specific.
- Publish SyntX event or regime labels only from observable loaded market data; show “Data unavailable” when the required tick or sequence state is absent to prevent fabricated analysis.- MT5 copy execution goes through the TradeCopy adapter (`supabase/functions/_shared/tradecopy`) via the `tradecopy-api` edge function only; the X-API-KEY never reaches the browser.
- TradeCopy uses the mock adapter unless both `TRADECOPY_API_KEY` and `TRADECOPY_MODE=live` are set, and LIVE copying also needs the `tradecopy_live_enabled` app setting plus per-relationship confirmation, to prevent accidental real trades.
- The Bridge EA/VPS MT5 path is deprecated but kept until TradeCopy demo verification succeeds.
- Canonical SEO origin is the BASE_URL constant in src/config/domain.ts (https://botvio.live); SEOHead and sitemap/robots functions ignore DB/host values so preview hosts never leak into canonicals (guarded by src/test/seo-canonical.test.ts).
- MT5 roles (DATA FEED, DIRECT EXECUTION, PROVIDER MASTER, BOTVIO ROBOT MASTER, FOLLOWER) are derived from facts, not stored; direct signals go through `mt5-direct-execution` only and never call TradeCopy `link`, so they never consume a TradeCopy registration.
- Direct execution is idempotent via unique (trading_account_id, signal_id) in `direct_executions`, simulates orders unless `MT5_DIRECT_MODE=live`, and LIVE accounts need the typed per-account confirmation plus the global live setting; a DB trigger guards direct_* columns from client edits.
- Customer plans are the pricing_plans rows with customer_visible=true; legacy plans keep their subscribers and map to a unified tier via maps_to_tier (get_user_plan_tier server-side, src/config/planEntitlements.ts client-side), so consolidation never rewrites subscription rows.
- Visitor analytics come from analytics_events (anonymous insert, admin read) and user_presence via touch_user_presence; admin summaries are admin-checked SECURITY DEFINER RPCs that show "Data unavailable" rather than zero when they fail.
- LinkedIn autopost runs via the linkedin-autopost edge function on a 3x/day cron through the LinkedIn connector; built-in articles come from a JSON snapshot of BLOG_INDEX (re-export when adding code articles) plus published posts rows, and linkedin_posts prevents repeats.
- LinkedIn Company Page posting uses the owner's own LinkedIn app via linkedin-org-oauth with tokens in a service-role-only table; linkedin-autopost falls back to the personal connector when no page is connected, because the managed connector cannot grant organization scopes.
