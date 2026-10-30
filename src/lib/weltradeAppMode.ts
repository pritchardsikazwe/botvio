// Weltrade Android app mode: the separate Play Store app opens /weltrade?app=weltrade.
// Once set, the device only shows the Weltrade hub, Weltrade signals and account/payment pages.
const KEY = "botvio_app_mode";

export const WELTRADE_ALLOWED_PREFIXES = [
  "/weltrade", "/auth", "/login", "/signup", "/reset-password", "/choose-plan",
  "/payment", "/billing", "/marketplace", "/settings", "/privacy", "/terms", "/disclaimer",
];

export function isWeltradeAllowedPath(path: string): boolean {
  return WELTRADE_ALLOWED_PREFIXES.some((p) => path === p || path.startsWith(p + "/") || path.startsWith(p + "?"));
}

/** Translate legacy website sign-in links without letting the app escape its Weltrade scope. */
export function weltradeAppRedirect(pathname: string, search: string): string | null {
  if (pathname === "/profile") return "/settings";
  const params = new URLSearchParams(search);
  if (pathname === "/" && params.get("authRequired") === "1") {
    const requested = params.get("next") || "/weltrade";
    const next = requested.startsWith("/") && !requested.startsWith("//") && isWeltradeAllowedPath(requested)
      ? requested : "/weltrade";
    return `/auth?next=${encodeURIComponent(next)}`;
  }
  return isWeltradeAllowedPath(pathname) ? null : "/weltrade";
}

export function detectWeltradeAppMode(search: string): boolean {
  try {
    // The Play Store app (ai.botvio.weltradesignals) launches as a Trusted Web Activity,
    // which sets document.referrer to android-app://<package>.
    const fromApp = typeof document !== "undefined" && document.referrer.startsWith("android-app://ai.botvio.weltradesignals");
    if (fromApp || new URLSearchParams(search).get("app") === "weltrade") {
      localStorage.setItem(KEY, "weltrade");
      return true;
    }
    return localStorage.getItem(KEY) === "weltrade";
  } catch {
    return false;
  }
}
