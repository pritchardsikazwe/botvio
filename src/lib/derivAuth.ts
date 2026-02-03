// Deriv OAuth configuration for production domain botvio.live
// App ID 99139 is registered for https://botvio.live

const DERIV_APP_ID = 99139;
const DERIV_REDIRECT_URI = "https://botvio.live/auth/deriv/callback";

export function startDerivOAuthLogin() {
  const url =
    "https://oauth.deriv.com/oauth2/authorize" +
    "?app_id=" + DERIV_APP_ID +
    "&redirect_uri=" + encodeURIComponent(DERIV_REDIRECT_URI);

  window.location.assign(url);
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

export { DERIV_APP_ID, DERIV_REDIRECT_URI };
