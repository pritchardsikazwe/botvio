// Deriv WebSocket authorization helper for production
import { DERIV_APP_ID, getDerivOAuthToken } from "./derivAuth";

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

export async function derivAuthorize(): Promise<DerivAuthorizeResult> {
  const token = getDerivOAuthToken();
  if (!token) throw new Error("No Deriv token found. Please login with Deriv first.");

  const ws = new WebSocket(
    `wss://ws.derivws.com/websockets/v3?app_id=${DERIV_APP_ID}`
  );

  // Wait for connection
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("WebSocket connection timeout"));
    }, 15000);

    ws.onopen = () => {
      clearTimeout(timeout);
      resolve();
    };
    ws.onerror = (e) => {
      clearTimeout(timeout);
      reject(new Error("WebSocket connection failed"));
    };
  });

  // Send authorize request
  ws.send(JSON.stringify({ authorize: token }));

  // Wait for response
  const result = await new Promise<DerivAuthorizeResult>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Authorization timeout"));
    }, 30000);

    ws.onmessage = (e) => {
      clearTimeout(timeout);
      const data = JSON.parse(e.data);
      
      if (data.error) {
        reject(new Error(data.error.message || "Authorization failed"));
        return;
      }
      
      resolve(data as DerivAuthorizeResult);
    };

    ws.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("WebSocket error during authorization"));
    };
  });

  return result;
}

export function createDerivWebSocket(): WebSocket {
  return new WebSocket(
    `wss://ws.derivws.com/websockets/v3?app_id=${DERIV_APP_ID}`
  );
}
