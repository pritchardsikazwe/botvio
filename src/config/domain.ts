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

const WORKER_HOST_SUFFIX = ".pritchardsikazwe.workers.dev";

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

  // Keep direct Worker URLs available for deployment and health testing.
  // SEO/canonical URLs still point to botvio.live via BASE_URL.
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === PRODUCTION_DOMAIN ||
    host.endsWith(WORKER_HOST_SUFFIX) ||
    host.endsWith(".lovable.app") ||
    host.endsWith(".lovableproject.com")
  ) {
    return;
  }

  const redirectUrl = `${BASE_URL}${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.replace(redirectUrl);
}

export function getBaseUrl(): string {
  return BASE_URL;
}
