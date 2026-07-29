// Deriv WebSocket authorization helper — new OTP-based flow only
import { getDerivOAuthToken } from "./derivAuth";
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

  const otpUrl = await getOtpWebSocketUrl();
  if (!otpUrl) {
    throw new Error("Could not obtain authenticated Deriv session. Please reconnect your Deriv account.");
  }

  const ws = new WebSocket(otpUrl);

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("WebSocket connection timeout")), 15000);
    ws.onopen = () => { clearTimeout(timeout); resolve(); };
    ws.onerror = () => { clearTimeout(timeout); reject(new Error("WebSocket connection failed")); };
  });

  // OTP socket is pre-authenticated — request balance to get account info
  ws.send(JSON.stringify({ balance: 1 }));

  return await new Promise<DerivAuthorizeResult>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Balance request timeout")), 30000);
    ws.onmessage = (e) => {
      clearTimeout(timeout);
      const data = JSON.parse(e.data);
      if (data.error) {
        reject(new Error(data.error.message || "Request failed"));
        return;
      }
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
}

/**
 * Create a public (unauthenticated) Deriv WebSocket for market data.
 */
export function createDerivWebSocket(): WebSocket {
  return new WebSocket("wss://api.derivws.com/trading/v1/options/ws/public");
}
