export type DerivEnv = "prod" | "dev";

function getEnvOverride(): DerivEnv | null {
  if (typeof window === "undefined") return null;
  
  const url = new URL(window.location.href);
  const forced = url.searchParams.get("env");
  if (forced === "prod") return "prod";
  if (forced === "dev") return "dev";
  return null;
}

export function resolveDerivEnv(): DerivEnv {
  const forced = getEnvOverride();
  if (forced) return forced;

  if (typeof window === "undefined") return "dev";
  
  const host = window.location.hostname.toLowerCase();
  if (host === "botvio.live" || host === "www.botvio.live") return "prod";
  return "dev";
}

export interface DerivConfig {
  env: DerivEnv;
  /** New OAuth2 client_id (string format, e.g. "app12345" or alphanumeric) */
  clientId: string;
  redirectUrl: string;
  baseDomain: string;
  /** New OAuth2 authorization URL */
  authUrl: string;
  /** New OAuth2 token exchange URL */
  tokenUrl: string;
  /** New REST API base URL */
  restApiUrl: string;
}

export function getDerivConfig(): DerivConfig {
  const env = resolveDerivEnv();

  const prod: DerivConfig = {
    env: "prod",
    clientId: "33XSUutrVPDWusVXuDUwW",
    redirectUrl: "https://botvio.live/callback",
    baseDomain: "https://botvio.live",
    authUrl: "https://auth.deriv.com/oauth2/auth",
    tokenUrl: "https://auth.deriv.com/oauth2/token",
    restApiUrl: "https://api.derivws.com",
  };

  const dev: DerivConfig = {
    env: "dev",
    clientId: "33XSUutrVPDWusVXuDUwW",
    redirectUrl: `${typeof window !== "undefined" ? window.location.origin : "https://botvio.live"}/callback`,
    baseDomain: typeof window !== "undefined" ? window.location.origin : "https://botvio.live",
    authUrl: "https://auth.deriv.com/oauth2/auth",
    tokenUrl: "https://auth.deriv.com/oauth2/token",
    restApiUrl: "https://api.derivws.com",
  };

  return env === "prod" ? prod : dev;
}

/**
 * Build the new OAuth 2.0 + PKCE authorization URL.
 * PKCE params (code_challenge, state) must be generated and stored before calling this.
 */
export function buildDerivOAuthUrl(codeChallenge: string, state: string): string {
  const { clientId, redirectUrl, authUrl } = getDerivConfig();

  const url = new URL(authUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUrl);
  url.searchParams.set("scope", "trade");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");

  return url.toString();
}

/**
 * Build the signup URL (same as login but with prompt=registration)
 */
export function buildDerivSignupUrl(codeChallenge: string, state: string): string {
  const url = buildDerivOAuthUrl(codeChallenge, state);
  return url + "&prompt=registration";
}

/**
 * Get the public WebSocket URL (no auth needed, for market data only)
 */
export function getDerivPublicWebSocketUrl(): string {
  return "wss://api.derivws.com/trading/v1/options/ws/public";
}

/**
 * Get the REST API OTP endpoint for a specific account
 */
export function getDerivOtpEndpoint(accountId: string): string {
  return `https://api.derivws.com/trading/v1/options/accounts/${accountId}/otp`;
}

/**
 * Get the REST API accounts endpoint
 */
export function getDerivAccountsEndpoint(): string {
  return "https://api.derivws.com/trading/v1/options/accounts";
}
