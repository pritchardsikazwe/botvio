import { useState, useCallback, useRef, useEffect } from "react";

// Deriv App ID - this is public
const DERIV_APP_ID = "123162";
const DERIV_WS_URL = `wss://ws.derivws.com/websockets/v3?app_id=${DERIV_APP_ID}`;

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

type MessageHandler = (data: any) => void;

export const useDerivAPI = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<string, MessageHandler>>(new Map());
  const tokenRef = useRef<string>("");
  
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

  const send = useCallback((request: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket not connected"));
        return;
      }

      const reqId = Date.now().toString();
      const requestWithId = { ...request, req_id: reqId };

      handlersRef.current.set(reqId, (data) => {
        handlersRef.current.delete(reqId);
        if (data.error) {
          reject(new Error(data.error.message));
        } else {
          resolve(data);
        }
      });

      wsRef.current.send(JSON.stringify(requestWithId));

      // Timeout after 30 seconds
      setTimeout(() => {
        if (handlersRef.current.has(reqId)) {
          handlersRef.current.delete(reqId);
          reject(new Error("Request timeout"));
        }
      }, 30000);
    });
  }, []);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      
      // Handle req_id responses
      if (data.req_id && handlersRef.current.has(data.req_id)) {
        handlersRef.current.get(data.req_id)?.(data);
        return;
      }

      // Handle tick updates
      if (data.msg_type === "tick" && data.tick) {
        updateState({
          lastTick: {
            symbol: data.tick.symbol,
            quote: data.tick.quote,
            epoch: data.tick.epoch,
          },
        });
      }

      // Handle balance updates
      if (data.msg_type === "balance" && data.balance) {
        updateState({
          balance: {
            balance: data.balance.balance,
            currency: data.balance.currency,
            loginid: data.balance.loginid,
          },
        });
      }
    } catch (err) {
      console.error("Failed to parse WebSocket message:", err);
    }
  }, [updateState]);

  const connect = useCallback(async (apiToken: string): Promise<DerivBalance> => {
    return new Promise((resolve, reject) => {
      updateState({ loading: true, error: null });
      tokenRef.current = apiToken;

      // Close existing connection
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      console.log("🔄 Connecting to Deriv WebSocket...");
      const ws = new WebSocket(DERIV_WS_URL);
      wsRef.current = ws;

      // Set up message handler BEFORE connection opens
      ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          console.log("📨 Received:", data.msg_type || data.error?.code);
          
          // Handle req_id responses
          if (data.req_id && handlersRef.current.has(data.req_id.toString())) {
            handlersRef.current.get(data.req_id.toString())?.(data);
            return;
          }

          // Handle tick updates
          if (data.msg_type === "tick" && data.tick) {
            updateState({
              lastTick: {
                symbol: data.tick.symbol,
                quote: data.tick.quote,
                epoch: data.tick.epoch,
              },
            });
          }

          // Handle balance updates
          if (data.msg_type === "balance" && data.balance) {
            updateState({
              balance: {
                balance: data.balance.balance,
                currency: data.balance.currency,
                loginid: data.balance.loginid,
              },
            });
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };

      ws.onopen = () => {
        console.log("✅ WebSocket connected, authorizing...");
        updateState({ connected: true });

        // Send authorize request directly (not using send() to avoid race condition)
        const reqId = Date.now().toString();
        const authRequest = { authorize: apiToken, req_id: reqId };

        handlersRef.current.set(reqId, (data) => {
          handlersRef.current.delete(reqId);
          
          if (data.error) {
            console.error("❌ Auth error:", data.error.message);
            updateState({ 
              error: data.error.message, 
              loading: false,
              authorized: false,
            });
            reject(new Error(data.error.message));
            return;
          }

          if (data.authorize) {
            console.log("✅ Authorized as:", data.authorize.fullname || data.authorize.loginid);
            const auth = data.authorize;
            const balanceData: DerivBalance = {
              balance: auth.balance,
              currency: auth.currency,
              loginid: auth.loginid,
              fullname: auth.fullname,
            };

            updateState({
              authorized: true,
              balance: balanceData,
              loading: false,
            });

            // Subscribe to balance updates
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ balance: 1, subscribe: 1 }));
            }

            resolve(balanceData);
          }
        });

        // Timeout after 15 seconds
        setTimeout(() => {
          if (handlersRef.current.has(reqId)) {
            handlersRef.current.delete(reqId);
            updateState({ error: "Authorization timeout", loading: false });
            reject(new Error("Authorization timeout"));
          }
        }, 15000);

        ws.send(JSON.stringify(authRequest));
      };

      ws.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
        updateState({ error: "Connection error", loading: false });
        reject(new Error("Connection error"));
      };

      ws.onclose = (event) => {
        console.log("🔌 WebSocket closed:", event.code, event.reason);
        updateState({ 
          connected: false, 
          authorized: false,
        });
      };
    });
  }, [updateState]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
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
    try {
      await send({ ticks: symbol, subscribe: 1 });
    } catch (err) {
      console.error("Failed to subscribe to ticks:", err);
    }
  }, [send]);

  const unsubscribeTicks = useCallback(async (symbol: string) => {
    try {
      await send({ forget_all: "ticks" });
    } catch (err) {
      console.error("Failed to unsubscribe from ticks:", err);
    }
  }, [send]);

  const getProposal = useCallback(async (params: {
    symbol: string;
    contract_type: "CALL" | "PUT";
    amount: number;
    duration: number;
    duration_unit: "t" | "s" | "m" | "h" | "d";
    basis?: "stake" | "payout";
    currency?: string;
  }): Promise<DerivProposal> => {
    const response = await send({
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
  }, [send]);

  const buyContract = useCallback(async (proposalId: string, price: number): Promise<DerivContract> => {
    const response = await send({
      buy: proposalId,
      price: price,
    });

    return {
      contract_id: response.buy.contract_id,
      buy_price: response.buy.buy_price,
      payout: response.buy.payout,
      longcode: response.buy.longcode,
    };
  }, [send]);

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
