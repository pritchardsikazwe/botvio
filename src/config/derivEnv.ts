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
  // Include www.botvio.live for production
  if (host === "botvio.live" || host === "www.botvio.live") return "prod";
  return "dev";
}

export interface DerivConfig {
  env: DerivEnv;
  appId: number;
  redirectUrl: string;
  baseDomain: string;
  oauthUrl: string;
}

export function getDerivConfig(): DerivConfig {
  const env = resolveDerivEnv();

  const prod: DerivConfig = {
    env: "prod",
    appId: 99139,
    redirectUrl: "https://botvio.live/auth/deriv/callback",
    baseDomain: "https://botvio.live",
    oauthUrl: "https://oauth.deriv.com/oauth2/authorize",
  };

  const dev: DerivConfig = {
    env: "dev",
    appId: 124208,
    redirectUrl: "https://botvio.lovable.app/auth/deriv/callback",
    baseDomain: "https://botvio.lovable.app",
    oauthUrl: "https://oauth.deriv.com/oauth2/authorize",
  };

  return env === "prod" ? prod : dev;
}

export function buildDerivOAuthUrl(): string {
  const { appId, redirectUrl, oauthUrl } = getDerivConfig();

  const url = new URL(oauthUrl);
  url.searchParams.set("app_id", String(appId));
  url.searchParams.set("redirect_uri", redirectUrl);
  url.searchParams.set("response_type", "code");

  return url.toString();
}

export function getDerivWebSocketUrl(): string {
  const { appId } = getDerivConfig();
  // Validate appId before using
  if (!Number.isFinite(appId) || appId <= 0) {
    console.error(`Invalid Deriv app_id resolved: ${appId}`);
    throw new Error(`Invalid Deriv app_id: ${appId}`);
  }
  return `wss://ws.derivws.com/websockets/v3?app_id=${appId}`;
}
