import { getDerivConfig, buildDerivOAuthUrl } from "@/config/derivEnv";

// Centralized Deriv OAuth configuration.
// IMPORTANT: Do not hardcode app_id / redirect URIs here — they depend on environment.

export function startDerivOAuthLogin() {
  window.location.assign(buildDerivOAuthUrl());
}

export function getDerivOAuthToken(): string | null {
  return localStorage.getItem("deriv_oauth_token");
}

export function setDerivOAuthToken(token: string): void {
  localStorage.setItem("deriv_oauth_token", token);
}

export function clearDerivOAuthToken(): void {
  localStorage.removeItem("deriv_oauth_token");
}

// Backwards-compatible exports (some legacy code still imports these)
const cfg = getDerivConfig();
const DERIV_APP_ID = cfg.appId;
const DERIV_REDIRECT_URI = cfg.redirectUrl;

export { DERIV_APP_ID, DERIV_REDIRECT_URI };
