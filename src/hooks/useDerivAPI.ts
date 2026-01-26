import { useState, useCallback, useRef, useEffect } from "react";

// Deriv App ID - this is public
const DERIV_APP_ID = "123162";
// Official Deriv WebSocket URL from https://developers.deriv.com/docs/getting-started
const DERIV_WS_URL = `wss://ws.deriv.com/websockets/v3?app_id=${DERIV_APP_ID}`;

export interface DerivBalance {
  balance: number;
  currency: string;
  loginid: string;
  fullname?: string;
}

export interface DerivTick {
  symbol: string;
  quote: number;
  epoch: number;
}

export interface DerivProposal {
  id: string;
  ask_price: number;
  payout: number;
  longcode: string;
}

export interface DerivContract {
  contract_id: number;
  buy_price: number;
  payout: number;
  longcode: string;
}

interface DerivAPIState {
  connected: boolean;
  authorized: boolean;
  balance: DerivBalance | null;
  error: string | null;
  loading: boolean;
  lastTick: DerivTick | null;
}

export const useDerivAPI = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const tokenRef = useRef<string>("");
  const reconnectTimeoutRef = useRef<number | null>(null);
  
  const [state, setState] = useState<DerivAPIState>({
    connected: false,
    authorized: false,
    balance: null,
    error: null,
    loading: false,
    lastTick: null,
  });

  const updateState = useCallback((partial: Partial<DerivAPIState>) => {
    setState(prev => ({ ...prev, ...partial }));
  }, []);

  // Simple send that returns a promise - following official Deriv pattern
  const sendMessage = useCallback((ws: WebSocket, message: object): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (ws.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket not open"));
        return;
      }

      const handler = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          // Match response by msg_type or specific keys
          const msgKeys = Object.keys(message);
          const isMatch = msgKeys.some(key => 
            data.msg_type === key || data[key] !== undefined
          );
          
          if (isMatch || data.error) {
            ws.removeEventListener("message", handler);
            if (data.error) {
              reject(new Error(data.error.message));
            } else {
              resolve(data);
            }
          }
        } catch (err) {
          // Ignore parse errors for non-matching messages
        }
      };

      ws.addEventListener("message", handler);
      ws.send(JSON.stringify(message));

      // Timeout
      setTimeout(() => {
        ws.removeEventListener("message", handler);
        reject(new Error("Request timeout"));
      }, 30000);
    });
  }, []);

  const connect = useCallback(async (apiToken: string): Promise<DerivBalance> => {
    return new Promise((resolve, reject) => {
      updateState({ loading: true, error: null });
      tokenRef.current = apiToken;

      // Clear any reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Close existing connection
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      console.log("🔄 Connecting to Deriv API...", DERIV_WS_URL);
      
      const ws = new WebSocket(DERIV_WS_URL);
      wsRef.current = ws;

      let isResolved = false;

      ws.onopen = () => {
        console.log("🔗 Connected to Deriv API, sending authorize...");
        updateState({ connected: true });

        // Send authorize request - following official pattern
        ws.send(JSON.stringify({
          authorize: apiToken
        }));
      };

      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          console.log("📩 Deriv Response:", data.msg_type || "unknown", data.error?.code || "");

          // Handle errors
          if (data.error) {
            console.error("❌ Deriv Error:", data.error.message);
            if (!isResolved && data.msg_type === "authorize") {
              isResolved = true;
              updateState({ error: data.error.message, loading: false, authorized: false });
              reject(new Error(data.error.message));
            }
            return;
          }

          // Handle authorize response
          if (data.authorize) {
            console.log("✅ User Authorized:", data.authorize.loginid);
            
            const balanceData: DerivBalance = {
              balance: data.authorize.balance,
              currency: data.authorize.currency,
              loginid: data.authorize.loginid,
              fullname: data.authorize.fullname,
            };

            updateState({
              authorized: true,
              balance: balanceData,
              loading: false,
            });

            // Request balance subscription
            ws.send(JSON.stringify({
              balance: 1,
              account: "current",
              subscribe: 1
            }));

            if (!isResolved) {
              isResolved = true;
              resolve(balanceData);
            }
            return;
          }

          // Handle balance response/updates
          if (data.balance) {
            console.log("💰 Balance:", data.balance.balance, data.balance.currency);
            updateState({
              balance: {
                balance: data.balance.balance,
                currency: data.balance.currency,
                loginid: data.balance.loginid,
              },
            });
            return;
          }

          // Handle tick updates
          if (data.tick) {
            updateState({
              lastTick: {
                symbol: data.tick.symbol,
                quote: data.tick.quote,
                epoch: data.tick.epoch,
              },
            });
            return;
          }
        } catch (err) {
          console.error("Failed to parse message:", err);
        }
      };

      ws.onerror = (err) => {
        console.error("❌ WebSocket Error:", err);
        if (!isResolved) {
          isResolved = true;
          updateState({ error: "Connection error", loading: false });
          reject(new Error("Connection error"));
        }
      };

      ws.onclose = (event) => {
        console.log("🔌 Connection Closed:", event.code, event.reason);
        updateState({ 
          connected: false, 
          authorized: false,
        });
        
        if (!isResolved) {
          isResolved = true;
          updateState({ error: "Connection closed", loading: false });
          reject(new Error("Connection closed"));
        }
      };

      // Connection timeout
      setTimeout(() => {
        if (!isResolved && ws.readyState !== WebSocket.OPEN) {
          isResolved = true;
          ws.close();
          updateState({ error: "Connection timeout", loading: false });
          reject(new Error("Connection timeout"));
        }
      }, 10000);
    });
  }, [updateState]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    tokenRef.current = "";
    
    updateState({
      connected: false,
      authorized: false,
      balance: null,
      error: null,
      loading: false,
      lastTick: null,
    });
  }, [updateState]);

  const subscribeTicks = useCallback(async (symbol: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error("Cannot subscribe: WebSocket not connected");
      return;
    }
    
    console.log("📊 Subscribing to ticks:", symbol);
    wsRef.current.send(JSON.stringify({
      ticks: symbol,
      subscribe: 1
    }));
  }, []);

  const unsubscribeTicks = useCallback(async (symbol: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }
    
    wsRef.current.send(JSON.stringify({
      forget_all: "ticks"
    }));
  }, []);

  const getProposal = useCallback(async (params: {
    symbol: string;
    contract_type: "CALL" | "PUT";
    amount: number;
    duration: number;
    duration_unit: "t" | "s" | "m" | "h" | "d";
    basis?: "stake" | "payout";
    currency?: string;
  }): Promise<DerivProposal> => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      throw new Error("Not connected to Deriv");
    }

    const response = await sendMessage(wsRef.current, {
      proposal: 1,
      amount: params.amount,
      basis: params.basis || "stake",
      contract_type: params.contract_type,
      currency: params.currency || "USD",
      duration: params.duration,
      duration_unit: params.duration_unit,
      symbol: params.symbol,
    });

    return {
      id: response.proposal.id,
      ask_price: response.proposal.ask_price,
      payout: response.proposal.payout,
      longcode: response.proposal.longcode,
    };
  }, [sendMessage]);

  const buyContract = useCallback(async (proposalId: string, price: number): Promise<DerivContract> => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      throw new Error("Not connected to Deriv");
    }

    const response = await sendMessage(wsRef.current, {
      buy: proposalId,
      price: price,
    });

    return {
      contract_id: response.buy.contract_id,
      buy_price: response.buy.buy_price,
      payout: response.buy.payout,
      longcode: response.buy.longcode,
    };
  }, [sendMessage]);

  const placeTrade = useCallback(async (params: {
    symbol: string;
    contract_type: "CALL" | "PUT";
    amount: number;
    duration: number;
    duration_unit: "t" | "s" | "m" | "h" | "d";
  }): Promise<DerivContract> => {
    // Get proposal first
    const proposal = await getProposal(params);
    
    // Then buy
    const contract = await buyContract(proposal.id, proposal.ask_price);
    
    return contract;
  }, [getProposal, buyContract]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    subscribeTicks,
    unsubscribeTicks,
    getProposal,
    buyContract,
    placeTrade,
  };
};
