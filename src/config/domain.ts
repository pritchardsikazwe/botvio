// ============= Full file contents =============

/**
 * Canonical production SEO/domain configuration for Botvio.
 * Keep every public canonical, sitemap and Open Graph URL anchored here.
 */
export const PRODUCTION_DOMAIN = "botvio.live";
export const BASE_URL = `https://${PRODUCTION_DOMAIN}`;
export const CANONICAL_ORIGIN = BASE_URL;
export const SITEMAP_URL = `${BASE_URL}/sitemap.xml`;
export const ROBOTS_URL = `${BASE_URL}/robots.txt`;

export function isProductionHost(): boolean {
  if (typeof window === "undefined") return true;
  return window.location.hostname.toLowerCase() === PRODUCTION_DOMAIN;
}

export function isCanonicalDomain(): boolean {
  if (typeof window === "undefined") return true;
  return window.location.hostname.toLowerCase() === PRODUCTION_DOMAIN;
}

export function enforceCanonicalDomain(): void {
  if (typeof window === "undefined") return;
  const host = window.location.hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1") return;
  if (host.endsWith(".lovable.app") || host.endsWith(".lovableproject.com")) return;
  if (host !== PRODUCTION_DOMAIN) {
    const redirectUrl = `${BASE_URL}${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.replace(redirectUrl);
  }
}

export function getBaseUrl(): string {
  return BASE_URL;
}
