// Weltrade Android app mode: the separate Play Store app opens /weltrade?app=weltrade.
// Once set, the device only shows the Weltrade hub, Weltrade signals and account/payment pages.
const KEY = "botvio_app_mode";

export const WELTRADE_ALLOWED_PREFIXES = [
  "/weltrade", "/auth", "/login", "/signup", "/reset-password", "/choose-plan",
  "/payment", "/billing", "/profile", "/settings", "/privacy", "/terms", "/disclaimer",
];

export function isWeltradeAllowedPath(path: string): boolean {
  return WELTRADE_ALLOWED_PREFIXES.some((p) => path === p || path.startsWith(p + "/") || path.startsWith(p + "?"));
}

export function detectWeltradeAppMode(search: string): boolean {
  try {
    if (new URLSearchParams(search).get("app") === "weltrade") {
      localStorage.setItem(KEY, "weltrade");
      return true;
    }
    return localStorage.getItem(KEY) === "weltrade";
  } catch {
    return false;
  }
}
