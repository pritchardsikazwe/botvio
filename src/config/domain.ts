/**
 * Canonical domain configuration for botvio.live
 * All production traffic must use this domain
 */

export const PRODUCTION_DOMAIN = "botvio.lovable.app";
export const BASE_URL = `https://${PRODUCTION_DOMAIN}`;

/**
 * Check if we're on the canonical production domain
 */
/**
 * FOR NOW the app is published at https://botvio.lovable.app — botvio.live is
 * not the active publish target. Treat every lovable.app host as canonical
 * so visitors are never redirected away from the live URL.
 */
export function isCanonicalDomain(): boolean {
  if (typeof window === "undefined") return true;
  const host = window.location.hostname.toLowerCase();
  if (host.endsWith(".lovable.app")) return true;
  return host === PRODUCTION_DOMAIN || host === `www.${PRODUCTION_DOMAIN}`;
}

/**
 * Redirect to canonical domain if needed
 * Call this early in app initialization
 */
export function enforceCanonicalDomain(): void {
  if (typeof window === "undefined") return;

  const host = window.location.hostname.toLowerCase();

  // Allow localhost for development
  if (host === "localhost" || host === "127.0.0.1") return;

  // Allow lovable domains (current publish target: botvio.lovable.app)
  if (host.endsWith(".lovable.app")) return;

  // Check if we need to redirect
  const nonCanonicalDomains = [
    "botvio.lovable.app",
    `www.${PRODUCTION_DOMAIN}` // Redirect www to non-www
  ];

  if (nonCanonicalDomains.includes(host) || (!host.includes("localhost") && host !== PRODUCTION_DOMAIN)) {
    // Build redirect URL preserving path and query
    const redirectUrl = `${BASE_URL}${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.replace(redirectUrl);
  }
}

/**
 * Get the correct base URL for the current environment
 */
export function getBaseUrl(): string {
  if (typeof window === "undefined") return BASE_URL;
  
  const host = window.location.hostname.toLowerCase();
  
  // Development
  if (host === "localhost" || host === "127.0.0.1") {
    return window.location.origin;
  }
  
  // Lovable preview
  if (host.includes("lovable.app")) {
    return window.location.origin;
  }
  
  // Production
  return BASE_URL;
}
