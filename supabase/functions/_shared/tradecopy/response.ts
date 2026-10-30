import { TradeCopyError } from "./core.ts";

/** Provider credential failures are service conditions, not Botvio session failures. */
export function tradeCopyFailure(error: unknown) {
  const err = error instanceof TradeCopyError
    ? error
    : new TradeCopyError("TradeCopy request could not be completed. Please try again later.", "upstream", 500);
  const expected = ["network", "upstream", "validation"].includes(err.code)
    || (err.code === "auth" && err.status === 502);
  return {
    status: expected ? 200 : err.status,
    body: { ok: false as const, error: err.code === "network"
      ? "TradeCopy's server isn't responding right now. Your accounts and settings are safe — please try again in a few minutes."
      : err.message, code: err.code },
  };
}