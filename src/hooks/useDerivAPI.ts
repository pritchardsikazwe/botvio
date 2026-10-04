import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { DerivWebSocketService } from "@/services/derivWebSocket";
import type { DerivBalance, DerivTick, DerivAccountInfo, DerivContractUpdate } from "@/types/deriv";
import { supabase } from "@/integrations/supabase/client";

export type DerivProposal = {
  id: string;
  ask_price: number;
  payout: number;
  longcode: string;
};

export type DerivContract = {
  contract_id: number;
  buy_price: number;
  payout: number;
  longcode: string;
};

export type DerivSellResult = {
  sold_for: number;
  balance_after?: number;
};

export type DerivConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

interface DerivAPIState {
  connected: boolean;
  authorized: boolean;
  balance: DerivBalance | null;
  error: string | null;
  loading: boolean;
  lastTick: DerivTick | null;
  accountInfo: DerivAccountInfo | null;
  reconnecting: boolean;
  /** Single authoritative connection state machine */
  status: DerivConnectionStatus;
  accountId: string | null;
  environment: "prod" | null;
  connectedAt: string | null;
  lastHeartbeat: number | null;
}

type DerivOtpResponse = { ok?: boolean; ws_url?: string; error?: string };
type DerivProposalResponse = { proposal: { id: string; ask_price: number; payout: number; longcode: string } };
type DerivBuyResponse = { buy: { contract_id: number; buy_price: number; payout: number; longcode: string } };
export type DerivProfitTransaction = {
  contract_id?: number;
  transaction_id?: number;
  buy_price: number;
  payout: number;
  purchase_time: number;
  sell_price: number;
  profit?: number;
  contract_type?: string;
  underlying?: string;
  symbol?: string;
  status?: string;
};

export const useDerivAPI = () => {
  const [state, setState] = useState<DerivAPIState>({
    connected: false,
    authorized: false,
    balance: null,
    error: null,
    loading: false,
    lastTick: null,
    accountInfo: null,
    reconnecting: false,
    status: "disconnected",
    accountId: null,
    environment: null,
    connectedAt: null,
    lastHeartbeat: null,
  });

  const updateState = useCallback((partial: Partial<DerivAPIState>) => {
    setState(prev => ({ ...prev, ...partial }));
  }, []);

  const service = useMemo(() => {
    const s = new DerivWebSocketService();
    return s;
  }, []);
  const cleanupRef = useRef<(() => void) | null>(null);

  /**
   * Authoritative socket-level listeners. Registered once for the lifetime of the
   * service (NOT only inside connect()) so a dropped socket immediately flips the
   * global state back to disconnected/error, even if nothing called connect() here.
   */
  useEffect(() => {
    const offStatus = service.onStatus((st) => {
      const socketOpen = service.socketOpen;
      console.log(`[DERIV][ws] status=${st} readyState=${service.socketReadyState} loginid=${service.authorizedLoginId ?? "-"}`);
      setState((prev) => {
        // "connected" requires: socket OPEN + authorize succeeded + account id
        const stillConnected = st === "open" && socketOpen && prev.authorized && !!prev.accountId;
        if (st === "open") {
          return {
            ...prev,
            connected: true,
            reconnecting: false,
            status: stillConnected ? "connected" : prev.status === "connected" ? "connecting" : prev.status,
            lastHeartbeat: Date.now(),
          };
        }
        if (st === "reconnecting" || st === "connecting") {
          return { ...prev, connected: false, reconnecting: st === "reconnecting", status: "connecting" };
        }
        // closed / idle -> hard disconnect, invalidate the trading session
        console.warn("[DERIV][ws] socket closed — invalidating trading session");
        return {
          ...prev,
          connected: false,
          authorized: false,
          reconnecting: false,
          status: prev.error ? "error" : "disconnected",
          accountId: null,
          environment: null,
          connectedAt: null,
        };
      });
    });

    const offError = service.onError((msg) => {
      console.error("[DERIV][auth] error:", msg);
      setState((prev) => ({
        ...prev,
        error: msg,
        status: prev.status === "connected" && service.socketOpen ? prev.status : "error",
      }));
    });

    return () => { offStatus(); offError(); };
  }, [service]);

  const [tickSubscriptions, setTickSubscriptions] = useState<Record<string, string>>({});

  const toDerivSymbol = useCallback((symbol: string) => {
    const s = symbol.trim();
    if (!s) return s;
    // Deriv synthetic indices already use their native symbols. Never prefix them
    // with frx — doing so turns JD100 into the invalid symbol frxJD100.
    if (
      s.includes("_") ||
      s.startsWith("frx") ||
      s.startsWith("cry") ||
      /^JD\d+$/.test(s) ||
      /^BOOM\d+N?$/.test(s) ||
      /^CRASH\d+N?$/.test(s) ||
      /^1HZ\d+V?$/.test(s) ||
      s === "stpRNG" ||
      /^RDBULL$|^RDBEAR$/.test(s)
    ) return s;
    if (s === "XAUUSD") return "frxXAUUSD";
    if (s === "BTCUSD") return "cryBTCUSD";
    if (s === "ETHUSD") return "cryETHUSD";
    return `frx${s}`;
  }, []);

  const connect = useCallback(
    async (apiToken: string, accountId?: string): Promise<DerivBalance> => {
      updateState({ loading: true, error: null });
      try {
        const getOtpUrl = async () => {
          const { data, error } = await supabase.functions.invoke<DerivOtpResponse>("deriv-get-otp", {
            body: { deriv_token: apiToken, account_id: accountId || localStorage.getItem("deriv_active_account_id") || undefined },
          });
          if (error || !data?.ok || !data?.ws_url) {
            throw new Error(data?.error || error?.message || "Failed to create Deriv PAT session");
          }
          return data.ws_url as string;
        };

        updateState({ status: "connecting" });
        const offTick = service.onTick((tick) => {
          updateState({
            lastTick: {
              symbol: tick.symbol,
              quote: tick.quote,
              epoch: tick.epoch,
            },
          });
          if (tick.subscription_id) {
            setTickSubscriptions((prev) => ({ ...prev, [tick.symbol]: tick.subscription_id! }));
          }
        });

        // Listen for real-time balance updates from Deriv
        const offBalance = service.onBalanceUpdate((bal) => {
          console.log(`[BALANCE] ${bal.loginid} ${bal.currency} ${bal.balance}`);
          updateState({ balance: bal });
        });

        const wsUrl = await getOtpUrl();
        const balance = await service.connectWithOtpUrl(wsUrl, getOtpUrl);
        const acctInfo: DerivAccountInfo = {
          loginid: balance.loginid,
          is_virtual: balance.loginid.startsWith("VRTC"),
          currency: balance.currency,
          fullname: balance.fullname,
        };
        
        console.log(`[AUTH] loginid=${balance.loginid} is_virtual=${acctInfo?.is_virtual} currency=${balance.currency} balance=${balance.balance}`);
        
        console.log(`[DERIV][auth] authorize successful — accountId=${balance.loginid} env=prod wsOpen=${service.socketOpen}`);

        updateState({
          authorized: true,
          connected: true,
          balance,
          accountInfo: acctInfo,
          reconnecting: false,
          status: service.socketOpen ? "connected" : "connecting",
          accountId: balance.loginid,
          environment: "prod",
          connectedAt: new Date().toISOString(),
          lastHeartbeat: Date.now(),
          error: null,
        });
        console.log("[DERIV][store] connection store updated — status=connected");

        // Subscribe to balance updates
        try {
          const b = await service.getBalance(true);
          updateState({ balance: b });
        } catch {
          // ignore, we still have authorize balance
        }

        updateState({ loading: false });

        cleanupRef.current = () => {
          offTick();
          offBalance();
        };

        return balance;
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Connection error";
        console.error("[DERIV][auth] authorization error:", message);
        updateState({
          loading: false, connected: false, authorized: false, error: message,
          status: "error", accountId: null, environment: null, connectedAt: null,
        });
        throw e;
      }
    },
    [service, updateState],
  );

  const disconnect = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;

    service.close();
    setTickSubscriptions({});
    updateState({
      connected: false,
      authorized: false,
      balance: null,
      error: null,
      loading: false,
      lastTick: null,
      accountInfo: null,
      reconnecting: false,
      status: "disconnected",
      accountId: null,
      environment: null,
      connectedAt: null,
      lastHeartbeat: null,
    });
  }, [service, updateState]);

  /**
   * Re-check the LIVE Deriv authorization state instead of trusting stale local state.
   * Returns true only when the socket is open and Deriv answers with an account id.
   */
  const refreshDerivConnection = useCallback(async (): Promise<boolean> => {
    if (!service.socketOpen) {
      console.warn("[DERIV][refresh] socket not open — marking disconnected");
      updateState({
        connected: false, authorized: false, status: "disconnected",
        accountId: null, environment: null, connectedAt: null,
      });
      return false;
    }
    try {
      const b = await service.getBalance(false);
      console.log(`[DERIV][refresh] live authorization verified — accountId=${b.loginid}`);
      updateState({
        balance: b,
        connected: true,
        authorized: true,
        status: "connected",
        accountId: b.loginid,
        environment: "prod",
        lastHeartbeat: Date.now(),
        error: null,
      });
      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Authorization check failed";
      console.error("[DERIV][refresh] failed:", message);
      updateState({
        connected: false, authorized: false, status: "error", error: message,
        accountId: null, environment: null, connectedAt: null,
      });
      return false;
    }
  }, [service, updateState]);

  const subscribeTicks = useCallback(
    async (symbol: string) => {
      const derivSymbol = toDerivSymbol(symbol);
      await service.subscribeTicks(derivSymbol);
    },
    [service, toDerivSymbol],
  );

  const unsubscribeTicks = useCallback(
    async (symbol: string) => {
      const derivSymbol = toDerivSymbol(symbol);
      const subId = tickSubscriptions[derivSymbol];
      if (subId) {
        await service.unsubscribe(subId);
        setTickSubscriptions((prev) => {
          const next = { ...prev };
          delete next[derivSymbol];
          return next;
        });
        return;
      }
      await service.unsubscribeTicks(derivSymbol);
    },
    [service, tickSubscriptions, toDerivSymbol],
  );

  const getProposal = useCallback(
    async (params: {
      symbol: string;
      contract_type: string;
      amount: number;
      duration?: number;
      duration_unit?: "t" | "s" | "m" | "h" | "d";
      basis?: "stake" | "payout";
      currency?: string;
      barrier?: number | string;
      multiplier?: number;
      growth_rate?: number;
      limit_order?: Record<string, number>;
    }): Promise<DerivProposal> => {
      const symbol = toDerivSymbol(params.symbol);
      const request: Record<string, unknown> = {
        proposal: 1,
        amount: params.amount,
        basis: params.basis || "stake",
        contract_type: params.contract_type,
        currency: params.currency || "USD",
        // New Deriv options API expects `underlying_symbol`; the legacy API
        // expects `symbol`. We send the new key and fall back automatically.
        underlying_symbol: symbol,
      };

      if (params.duration !== undefined && params.duration !== null) {
        request.duration = params.duration;
        request.duration_unit = params.duration_unit || "m";
      }
      if (params.barrier !== undefined && params.barrier !== null) {
        request.barrier = String(params.barrier);
      }
      if (params.multiplier !== undefined && params.multiplier !== null) {
        request.multiplier = params.multiplier;
      }
      if (params.growth_rate !== undefined && params.growth_rate !== null) {
        request.growth_rate = params.growth_rate;
      }
      if (params.limit_order && Object.keys(params.limit_order).length > 0) {
        request.limit_order = params.limit_order;
      }

      console.log("[Deriv] getProposal request:", JSON.stringify(request));
      let response: DerivProposalResponse;
      try {
        response = await service.send<DerivProposalResponse>(request);
      } catch (err: any) {
        // Legacy endpoint: retry with the old `symbol` property.
        if (/properties not allowed:\s*underlying_symbol/i.test(err?.message || "")) {
          const legacy = { ...request };
          delete legacy.underlying_symbol;
          legacy.symbol = symbol;
          response = await service.send<DerivProposalResponse>(legacy);
        } else {
          throw err;
        }
      }

      return {
        id: response.proposal.id,
        ask_price: response.proposal.ask_price,
        payout: response.proposal.payout,
        longcode: response.proposal.longcode,
      };
    },
    [service, toDerivSymbol],
  );

  const buyContract = useCallback(
    async (proposalId: string, price: number): Promise<DerivContract> => {
      const response = await service.send<DerivBuyResponse>({
        buy: proposalId,
        price,
      });

      return {
        contract_id: response.buy.contract_id,
        buy_price: response.buy.buy_price,
        payout: response.buy.payout,
        longcode: response.buy.longcode,
      };
    },
    [service],
  );

  const sellContract = useCallback(
    async (contractId: number, price = 0): Promise<DerivSellResult> => {
      if (!state.authorized || !service.socketOpen) throw new Error("Deriv account is not connected");
      const response = await service.send<any>({ sell: contractId, price });
      if (response?.error) throw new Error(response.error.message || "Unable to sell contract");
      const sold = response?.sell;
      if (!sold) throw new Error("Deriv returned no sell result");
      return {
        sold_for: Number(sold.sold_for ?? sold.sell_price ?? 0),
        balance_after: sold.balance_after != null ? Number(sold.balance_after) : undefined,
      };
    },
    [service, state.authorized],
  );

  // Subscribe to proposal_open_contract for settlement tracking
  const subscribeContract = useCallback(
    async (contractId: number) => {
      console.log(`[BUY] Subscribing to contract ${contractId}`);
      // Track for re-subscription on reconnect (critical for minute-based contracts)
      service.trackContractSubscription(contractId);
      const response = await service.send({
        proposal_open_contract: 1,
        contract_id: contractId,
        subscribe: 1,
      });
      return response;
    },
    [service],
  );

  // Listen for contract settlement events
  const onContractUpdate = useCallback(
    (listener: (update: DerivContractUpdate) => void) => {
      return service.onContractUpdate(listener);
    },
    [service],
  );

  // Fetch closed trade history from the currently authenticated Demo/Real account.
  // Deriv's current profit_table endpoint is account-scoped; do not send loginid.
  const getTradeHistory = useCallback(async (limit = 50): Promise<DerivProfitTransaction[]> => {
    if (!state.authorized || !service.socketOpen) {
      throw new Error("Deriv account is not connected");
    }
    const safeLimit = Math.max(1, Math.min(500, Math.floor(limit)));
    const response = await service.send<any>({
      profit_table: 1,
      limit: safeLimit,
      sort: "DESC",
    }, 15000);
    const transactions = response?.profit_table?.transactions;
    return Array.isArray(transactions) ? transactions as DerivProfitTransaction[] : [];
  }, [service, state.authorized]);

  // Refresh balance from Deriv (truth source)
  const refreshBalance = useCallback(async () => {
    try {
      // One-shot balance request (no subscribe to avoid errors)
      const b = await service.getBalance(false);
      console.log(`[BALANCE] refreshed: ${b.loginid} ${b.currency} ${b.balance}`);
      updateState({ balance: b });
      return b;
    } catch (e) {
      console.error("[BALANCE] refresh failed:", e);
      const cached = service.latestBalance;
      if (cached) {
        updateState({ balance: cached });
        return cached;
      }
      return null;
    }
  }, [service, updateState]);

  const placeTrade = useCallback(async (params: {
    symbol: string;
    contract_type: string;
    amount: number;
    duration?: number;
    duration_unit?: "t" | "s" | "m" | "h" | "d";
    barrier?: number | string;
    multiplier?: number;
    growth_rate?: number;
    limit_order?: Record<string, number>;
  }): Promise<DerivContract> => {
    const proposal = await getProposal(params);
    const contract = await buyContract(proposal.id, proposal.ask_price);
    
    console.log(`[BUY] ${params.symbol} ${params.contract_type} stake=${params.amount} contract_id=${contract.contract_id} buy_price=${contract.buy_price}`);
    
    // Immediately refresh balance after buy (stake deducted)
    refreshBalance().catch(() => {});
    
    // Auto-subscribe to contract for settlement tracking
    await subscribeContract(contract.contract_id);
    
    return contract;
  }, [getProposal, buyContract, subscribeContract, refreshBalance]);

  useEffect(() => {
    return () => {
      service.close();
    };
  }, [service]);

  return {
    ...state,
    /** Single source of truth for "can this user trade right now" */
    isDerivConnected:
      state.status === "connected" &&
      !!state.accountId &&
      state.environment === "prod" &&
      state.authorized &&
      service.socketOpen,
    socketReadyState: service.socketReadyState,
    lastConnectionError: state.error,
    /** Diagnostics only — symbols/contracts currently streaming. */
    activeTickSymbols: service.activeTickSymbols,
    activeContractIds: service.activeContractIds,
    socketStale: service.isStale,
    connect,
    disconnect,
    refreshDerivConnection,
    subscribeTicks,
    unsubscribeTicks,
    getProposal,
    buyContract,
    sellContract,
    placeTrade,
    subscribeContract,
    onContractUpdate,
    refreshBalance,
    getTradeHistory,
  };
};

export type { DerivBalance, DerivTick, DerivAccountInfo, DerivContractUpdate };
