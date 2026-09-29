// ============= Full file contents =============

/**
 * Canonical domain configuration for botvio.live
 * All production traffic must use this domain
 */

export const PRODUCTION_DOMAIN = "botvio.live";
export const BASE_URL = `https://${PRODUCTION_DOMAIN}`;

/**
 * Check if we're on the canonical production domain
 */
export function isCanonicalDomain(): boolean {
  if (typeof window === "undefined") return true;
  const host = window.location.hostname.toLowerCase();
  // Lovable preview/publish hosts are always allowed (editor preview, staging)
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

  // Allow lovable domains (editor preview and staging publish URL)
  if (host.endsWith(".lovable.app")) return;

  // Redirect www (and any other host) to the canonical non-www domain
  if (host !== PRODUCTION_DOMAIN) {
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
