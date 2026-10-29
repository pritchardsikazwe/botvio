/**
 * Maps raw Deriv API error strings to actionable, user-safe messages.
 * Never include tokens or credentials in these messages.
 */
export const normalizeDerivError = (raw?: string): string => {
  const msg = (raw || "").trim();
  if (!msg) return "Deriv request failed.";

  if (/properties not allowed:\s*account/i.test(msg)) {
    return [
      "Deriv connection configuration error.",
      "The connected account was identified, but an invalid account property was included in the API request.",
      "The connection has not been deleted.",
    ].join(" ");
  }

  if (/app_id is invalid/i.test(msg)) {
    return "Deriv rejected the application ID for this connection. Reconnect your Deriv account from Connections.";
  }

  if (/invalid token|authorizationrequired|token has expired/i.test(msg)) {
    return "Your Deriv authorization expired. Reconnect your Deriv account to continue trading.";
  }

  return msg;
};
