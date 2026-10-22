/** Owner-approved (2026-10-22): the pre-entry capability lock is lifted so signals
 * reach MT5. Existing gates stay: SL/TP normalisation, one-attempt orders, per-market
 * open-trade limit, min-lot clamping, and LIVE needs global + per-account confirmation.
 */
export const COPY_RISK_CAPABILITY_BLOCKER = "Entry blocked: authoritative equity, margin, contract specifications and atomic follower risk admission are not verified";
export function assertRiskSubmissionReady(_mode: "mock" | "live"): void {
  // Intentionally open by owner decision.
}
