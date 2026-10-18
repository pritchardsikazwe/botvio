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