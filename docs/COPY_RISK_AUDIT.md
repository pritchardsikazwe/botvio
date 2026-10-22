# Copy Trading Risk Engine — preliminary audit

## Evidence collected

- Read-only production database checks on 2026-10-18: `copy_execution_events` contains **zero rows**, so it cannot establish that follower stops were copied or explain follower losses.
- Past seven days of `direct_executions`: 319 DEMO entries marked `sent`; 1,086 position-limit rejections; numerous account-symbol rejections. `sent` is not proof of a follower fill or accepted protection.
- The connected-account query returned one registered DEMO master and no registered DEMO follower. End-to-end follower acceptance is blocked until a demo follower is connected.
- Broker position checks were not performed: managed sign-in could not match the requesting user to an existing account. Sign in through the preview before authenticated broker reads. No orders or close actions were executed.
- Existing copy-table policies scope reads to followers, providers where appropriate, and admins. These policies were not changed.

## Verified implementation gaps

- `tradecopy-api` `robot_order` normalizes a market order and submits it without a persistent account risk reservation or post-fill follower protection check.
- `copy_settings` has copy multiplier/filter/SLTP controls but no complete equity-risk, aggregate-risk, daily-drawdown or strategy-management configuration.
- `execution_status` exposes normalized open orders and 24-hour history but does not verify protection or calculate exposure.
- `emergency_stop` deactivates a follower and optionally calls account-wide `closeAll`; it returns a stop timestamp without reading remaining positions. It must not be represented as confirmed closure.
- Dashboard position reads can display broker-returned positions, but there is no verified SL/TP risk status or reconciled daily circuit breaker.
- Cloud-created follower orders bypass Botvio's immediate pre-submission handler. Strict follower preflight cannot be guaranteed by a dashboard or a periodic poll; compatible TradeCopy-side enforcement must be demonstrated first.

These are verified safety gaps, **not a proven explanation for particular broker losses**. Actual broker tickets, fills and SL/TP evidence are still required.

## Baseline tests

`bunx vitest run supabase/functions/_shared/tradecopy/tradecopy.test.ts src/test/live-trading.test.ts src/test/seo-canonical.test.ts`

22 passed, 2 failed:

1. Relationship test expects DEMO → LIVE rejection, while current documented implementation intentionally permits it. Preserve existing rules and test LIVE → DEMO rejection plus separate live-confirmation gates; do not silently alter account rules.
2. Adapter-selection test references `Deno.env` in Vitest. Make environment configuration explicitly injectable or provide a scoped runtime mock without exposing secrets.

An existing frontend status-type error in `src/services/derivWebSocket.ts` was narrowed without changing settlement behavior; preview subsequently reported `build OK`.

## Constraints

- Sandbox uses a managed `edit/...` branch, not the requested `botvio-independent-sep13`; no branch switching or commits performed.
- No schema changes, deployment, live activation, Weltrade API Studio changes or broker mutations performed.
- Proposed additive persistence needs review before migrations are applied, since this backend is shared with the published application.

## Staged implementation and test evidence — 2026-10-20

- Removed the DEMO invalid-stops retry that submitted unprotected orders. Positive SL and TP now required by shared normalization; malformed stops reject. Fixed lots and order lots no longer round upward or clamp to guessed broker minimums.
- Pure risk helpers calculate equity/stop/cost/margin sizing with supplied instrument specifications, downward lot steps, family/correlated limits, 2% aggregate and daily limits, five positions, freshness, provider, spread/slippage and cooldown checks. They are **not** a persistent reservation and are not presented as one.
- Pure strategy intentions cover confirmed invalidation/opposite exits without reversing, cost-aware break-even, tightening ATR trailing and supported one-time partial intentions. No strategy executor has been enabled.
- Real TradeCopy adapter submissions and master/follower activation fail closed behind a source-code capability gate. This includes actual broker DEMO trading, not just LIVE-labelled accounts. Mock tests remain possible. This code is **not deployed**, so it does not stop already active production/cloud copying.
- Emergency action persists account-wide follower relationship latches and the account inactive flag before upstream calls, independently attempts deactivation/close, reads remaining tickets and reports unknown/remaining/confirmed plus mock state. No blind close retry. This is **not** a transaction across admission paths or a proven upstream cloud barrier.
- Preserved mappings rather than deleting local rows while the copier retains them. Copied SL/TP cannot newly be disabled. Direct follower suppression includes the actual fallback signal master.
- Risk Centre exposes account-authorized position observations with unavailable/unknown risk, drawdown, provider health and circuit-breaker values instead of fabricated or protected claims. It reports broker SL/TP as reported, not risk-verified.
- Stateful mock modification/partial-close semantics make recovery tests meaningful; adapter timeout is injected rather than referencing Deno inside Vitest.

### Selected tests

`bunx vitest run supabase/functions/_shared/tradecopy/tradecopy.test.ts supabase/functions/_shared/tradecopy/risk.test.ts src/test/live-trading.test.ts src/test/seo-canonical.test.ts`

**86 tests passed across four files**, including 62 new risk/recovery tests; both baseline failures resolved. Existing DEMO→LIVE relationship policy is preserved, with explicit LIVE confirmation still required; this does not prove downstream follower protection. Preview log most recently reported `build OK` at 2026-10-20T05:33:33Z. Authenticated UI and broker/cloud follower acceptance remain unverified; test fixtures are not broker evidence.

### Public API capability evidence

Read-only public Swagger inspection found `getRisk`/`updateRisk`, generic symbol reads and generic order responses. No documented per-follower pre-entry admission, atomic aggregate stop-risk, authoritative equity/free margin or contract tick/lot metadata. Diagnostic fields are unspecified. Absence in the schema is not proof the service cannot support these; provider contract/evidence is needed. No documented mapping-delete route.

### Changed files and pending gates

- Shared TradeCopy: `core.ts`, `adapter.ts`, `tradecopy.test.ts`; new `risk.ts`, `risk.test.ts`, `emergency.ts`, `capabilities.ts`.
- Functions: `mt5-direct-execution/index.ts`, `tradecopy-api/index.ts`, `tradecopy-reconcile/index.ts` (timeout injection only in reconciler).
- UI: new `src/components/tradecopy/CopyRiskCentre.tsx`, updated `FollowerTradeCopyPanel.tsx`.
- Documentation: this report, root `AGENTS.md` and `roadmap.md`.
- **No migrations, deployments, live enablement, broker mutations, branch switches or commits.**
- Blockers: documented authoritative account/contracts and cloud pre-entry enforcement; reviewed durable risk/intent/day-ledger persistence; isolated registered DEMO follower; ticket-level protection, concurrency, reconciliation and exit evidence; requested branch unavailable in managed sandbox. Full acceptance criteria remain open. Existing authentication, subscription and feeds have not been fully end-to-end regressed.