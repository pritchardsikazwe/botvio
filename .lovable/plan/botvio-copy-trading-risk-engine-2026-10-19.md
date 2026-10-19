# Botvio Copy Trading Risk Engine

## Preserve
Upgrade the existing app in reviewable stages. Keep authentication, subscriptions, provider/follower relationships, Deriv Options and the working Weltrade API Studio feed unchanged. Preserve signal engine → MT5 Signal Master → TradeCopy Cloud → follower MT5. No parallel copy engine, deployment or live activation.

## Audit findings
- Follower execution history currently has zero rows; recorded master `sent` statuses do not verify follower fills or SL/TP.
- Existing submission paths lack a complete persistent equity-risk check and post-fill follower protection verification.
- Emergency Stop currently does not verify remaining positions after requesting closure.
- Baseline: 22 tests pass, two fail (a stale relationship expectation and a Deno-only environment read).
- Broker-side loss causes remain unproven; do not attribute losses to missing stops without actual position evidence.

## Stages
1. **Establish evidence and capability gates.** Repair the baseline test harness while preserving existing account rules. Read actual demo master/follower positions and contract specifications. Verify whether TradeCopy Cloud can enforce per-follower pre-entry risk, protective stops, margin, signal freshness and atomic exposure limits. If unsupported, mark those acceptance criteria blocked rather than replace copying or imply enforcement.
2. **Protect entries.** Add instrument-aware direction, precision, stop-distance, lot-step, margin and cost validation. Copy valid provider SL/TP; use an approved strategy stop only with sufficient data, otherwise reject. Size down to the permitted lot step and reject below-minimum lots rather than increase risk. Add UTC daily accounting, atomic risk reservations and idempotency immediately before supported submissions. Demo defaults: 0.25% risk per trade (configurable through 0.5%), 2% aggregate open risk, 2% daily loss breaker, five concurrent positions. Configure family/correlation exposure, spread, slippage, signal age, loss streak and cooldown limits.
3. **Verify and recover.** Link provider/follower tickets, reconcile uncertain submissions before retries, and compare broker-returned SL/TP after fills and modifications. Handle partial fills, rejected stops, manual closes, mapping failures and disconnects. Attempt scoped closure of unprotected positions and report remaining exposure truthfully. No blind retries, silent stop widening or martingale.
4. **Manage strategies.** Implement configurable Trend Pullback, Breakout and Retest, and Synthetic Index profiles using confirmed invalidation, break-even after costs, ATR/structure trailing and anti-whipsaw cooldowns. Partial exits only when supported. Opposite entries require the old position's exit rules, reconciled exposure and a fresh confirmed setup.
5. **Add the Risk Centre.** Reuse the current dashboard and controls to show actual positions/P&L, verified/unverified protection, equity risk, daily drawdown/breaker, provider health, last signal, exposure, reasons, failures and recovery. Persist authorized follower settings. Pause blocks entries only; Stop disables copying; Emergency Stop blocks entries and requests confirmed-scope closures with verified progress and failures.
6. **Demo acceptance.** Add unit/integration/regression coverage for every specified risk rule, concurrency, duplicate entries/closes, uncertain responses, strategy exits, partial fills, failed closures, stale signals, disconnected providers and existing access/settings behavior. Verify the complete flow on a connected DEMO follower and record broker tickets and protection readback. Do not deploy or enable live automation until all acceptance criteria pass.

## Technical details
- Extend the existing TradeCopy adapter, authenticated handlers and reconciliation; keep secrets server-only.
- Reuse existing settings/events where compatible. Additive configuration, risk-reservation, UTC ledger and operation-state persistence may require migrations; preserve existing tables/policies and data, with explicit grants and scoped RLS for new tables. Never treat JSON settings alone as concurrency protection.
- Periodic reconciliation detects issues but does not substitute for TradeCopy-side pre-entry enforcement of cloud-created follower trades.
- Run relevant tests and inspect preview diagnostics; document structural decisions in AGENTS.md and provide changed files, migration details, evidence and blockers after each stage.

## Current blockers
- Sign in through the preview to enable authorized read-only broker verification; automatic sign-in could not identify your account.
- A registered DEMO master exists, but no registered DEMO follower was returned. Connect a demo follower for acceptance testing.
- TradeCopy Cloud follower-preflight and complete contract/margin capabilities require confirmation before strict protections can be claimed.
- This sandbox uses a managed edit branch, not the named branch; no Git switching or commits will be performed here. Reviewable changes remain in the existing project.
- Additive migrations affect the shared published backend even without function deployment; review their scope before application.
