/** Turn raw Deriv API errors into short, actionable messages for traders. */
export function friendlyDerivError(e: unknown, market = "this market"): string {
  const raw = e instanceof Error ? e.message : typeof e === "string" ? e : "";
  const m = raw.toLowerCase();
  if (/not offered|offerings|not available|unsupported|invalid symbol|no longer/.test(m))
    return `Deriv doesn't offer this contract on ${market} right now. Pick another market or contract type.`;
  if (/market is (presently )?closed|market.*closed/.test(m)) return `${market} is closed right now. Try a synthetic index — they trade 24/7.`;
  if (/insufficient|balance/.test(m)) return "Not enough balance for this stake. Lower the stake or top up your Deriv account.";
  if (/stake|minimum|maximum|payout/.test(m)) return raw || "Stake is outside Deriv's limits for this contract.";
  if (/duration|expiry/.test(m)) return raw || "Duration isn't allowed for this contract. Pick another duration.";
  if (/rate|too many/.test(m)) return "Deriv is busy. Wait a few seconds and try again.";
  if (/auth|token|login/.test(m)) return "Your Deriv session expired. Reconnect your account and try again.";
  return raw || "Trade failed. Please try again.";
}
