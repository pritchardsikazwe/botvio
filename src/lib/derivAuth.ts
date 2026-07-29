import { getDerivConfig, buildDerivOAuthUrl } from "@/config/derivEnv";

// ─── PKCE Helpers ───────────────────────────────────────────────────────────

/**
 * Generate a cryptographically random code_verifier for PKCE
 */
export function generateCodeVerifier(): string {
  const array = crypto.getRandomValues(new Uint8Array(64));
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  return Array.from(array)
    .map(v => charset[v % charset.length])
    .join('');
}

/**
 * Derive code_challenge from code_verifier using SHA-256
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Generate a random state string for CSRF protection
 */
export function generateOAuthState(): string {
  return crypto.getRandomValues(new Uint8Array(16))
    .reduce((s, b) => s + b.toString(16).padStart(2, '0'), '');
}

// ─── OAuth Login Flow ───────────────────────────────────────────────────────

/**
 * Start the new Deriv OAuth 2.0 + PKCE login flow.
 * Generates PKCE params, stores them in sessionStorage, and redirects.
 */
export async function startDerivOAuthLogin() {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateOAuthState();

  // Store before redirect — needed for callback verification
  sessionStorage.setItem('deriv_pkce_code_verifier', codeVerifier);
  sessionStorage.setItem('deriv_oauth_state', state);

  const url = buildDerivOAuthUrl(codeChallenge, state);
  window.location.assign(url);
}

// ─── Token Storage ──────────────────────────────────────────────────────────

export function getDerivOAuthToken(): string | null {
  return localStorage.getItem("deriv_oauth_token");
}

export function setDerivOAuthToken(token: string): void {
  localStorage.setItem("deriv_oauth_token", token);
  // Tell DerivProvider to (re)authorize immediately — no logout/login required.
  window.dispatchEvent(new CustomEvent("deriv:token-updated", { detail: { token } }));
}

export function clearDerivOAuthToken(): void {
  localStorage.removeItem("deriv_oauth_token");
  window.dispatchEvent(new CustomEvent("deriv:token-cleared"));
}

// ─── PKCE Storage Helpers ───────────────────────────────────────────────────

export function getStoredCodeVerifier(): string | null {
  return sessionStorage.getItem('deriv_pkce_code_verifier');
}

export function getStoredOAuthState(): string | null {
  return sessionStorage.getItem('deriv_oauth_state');
}

export function clearPKCEStorage(): void {
  sessionStorage.removeItem('deriv_pkce_code_verifier');
  sessionStorage.removeItem('deriv_oauth_state');
}

// ─── Backwards-compatible exports ───────────────────────────────────────────
const cfg = getDerivConfig();
const DERIV_CLIENT_ID = cfg.clientId;
const DERIV_REDIRECT_URI = cfg.redirectUrl;

export { DERIV_CLIENT_ID, DERIV_REDIRECT_URI };
