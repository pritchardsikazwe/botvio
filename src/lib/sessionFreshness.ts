export const SESSION_RESET_CUTOFF = Date.parse("2026-10-26T13:45:00Z");
export function sessionPredatesReset(lastSignIn: string | undefined, accessToken: string) {
  let issuedAt = 0;
  try {
    const encoded = accessToken.split(".")[1];
    const payload = JSON.parse(atob(encoded.replace(/-/g, "+").replace(/_/g, "/")));
    if (typeof payload.iat === "number") issuedAt = payload.iat * 1000;
  } catch { /* Fall back to the account sign-in timestamp. */ }
  return Math.max(issuedAt, lastSignIn ? Date.parse(lastSignIn) || 0 : 0) < SESSION_RESET_CUTOFF;
}