/** No documented authoritative contract/account snapshot or cloud pre-entry hook yet.
 * Fail closed for new Botvio submissions rather than substitute guessed risk data.
 * Removing this gate requires a server-owned metadata source, atomic reservation
 * and DEMO cloud follower acceptance evidence, not a client flag or env toggle.
 */
export const COPY_RISK_CAPABILITY_BLOCKER = "Entry blocked: authoritative equity, margin, contract specifications and atomic follower risk admission are not verified";
export function assertRiskSubmissionReady(mode: "mock" | "live"): void {
  if (mode === "live") throw new Error(COPY_RISK_CAPABILITY_BLOCKER);
}