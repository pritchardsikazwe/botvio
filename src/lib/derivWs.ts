// Deriv WebSocket authorization helper
// Supports both legacy (authorize message) and new (OTP-based) flows
import { DERIV_APP_ID, getDerivOAuthToken } from "./derivAuth";
import { supabase } from "@/integrations/supabase/client";

export interface DerivAuthorizeResult {
  authorize: {
    account_list: Array<{
      account_type: string;
      currency: string;
      is_virtual: number;
      loginid: string;
    }>;
    balance: number;
    currency: string;
    email: string;
    fullname: string;
    is_virtual: number;
    loginid: string;
    user_id: number;
  };
}

/**
 * Try to get an OTP-authenticated WebSocket URL via the edge function.
 * Returns the URL string if successful, null otherwise.
 */
async function getOtpWebSocketUrl(): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke("deriv-get-otp", {
      body: {},
    });
    if (error || !data?.ok) return null;
    return data.ws_url || null;
  } catch {
    return null;
  }
}

export async function derivAuthorize(): Promise<DerivAuthorizeResult> {
  const token = getDerivOAuthToken();
  if (!token) throw new Error("No Deriv token found. Please login with Deriv first.");

  // Try OTP-based connection first
  const otpUrl = await getOtpWebSocketUrl();
  
  let ws: WebSocket;
  
  if (otpUrl) {
    // New API: connect with OTP URL (already authenticated)
    ws = new WebSocket(otpUrl);
    
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("WebSocket connection timeout")), 15000);
      ws.onopen = () => { clearTimeout(timeout); resolve(); };
      ws.onerror = () => { clearTimeout(timeout); reject(new Error("WebSocket connection failed")); };
    });

    // With OTP, we're already authenticated — request balance to get account info
    ws.send(JSON.stringify({ balance: 1, account: "current" }));

    const result = await new Promise<DerivAuthorizeResult>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Balance request timeout")), 30000);
      ws.onmessage = (e) => {
        clearTimeout(timeout);
        const data = JSON.parse(e.data);
        if (data.error) {
          reject(new Error(data.error.message || "Request failed"));
          return;
        }
        // Construct a compatible result from balance response
        if (data.balance) {
          resolve({
            authorize: {
              account_list: [],
              balance: data.balance.balance,
              currency: data.balance.currency,
              email: "",
              fullname: "",
              is_virtual: 0,
              loginid: data.balance.loginid,
              user_id: 0,
            },
          });
        }
      };
      ws.onerror = () => { clearTimeout(timeout); reject(new Error("WebSocket error")); };
    });

    return result;
  }
  
  // Fallback: Legacy authorize flow
  ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${DERIV_APP_ID}`);

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("WebSocket connection timeout")), 15000);
    ws.onopen = () => { clearTimeout(timeout); resolve(); };
    ws.onerror = () => { clearTimeout(timeout); reject(new Error("WebSocket connection failed")); };
  });

  ws.send(JSON.stringify({ authorize: token }));

  const result = await new Promise<DerivAuthorizeResult>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Authorization timeout")), 30000);
    ws.onmessage = (e) => {
      clearTimeout(timeout);
      const data = JSON.parse(e.data);
      if (data.error) {
        reject(new Error(data.error.message || "Authorization failed"));
        return;
      }
      resolve(data as DerivAuthorizeResult);
    };
    ws.onerror = () => { clearTimeout(timeout); reject(new Error("WebSocket error during authorization")); };
  });

  return result;
}

export function createDerivWebSocket(): WebSocket {
  return new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${DERIV_APP_ID}`);
}
