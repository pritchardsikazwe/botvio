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

interface DerivAPIState {
  connected: boolean;
  authorized: boolean;
  balance: DerivBalance | null;
  error: string | null;
  loading: boolean;
  lastTick: DerivTick | null;
  accountInfo: DerivAccountInfo | null;
  reconnecting: boolean;
}

type DerivOtpResponse = { ok?: boolean; ws_url?: string; error?: string };
type DerivProposalResponse = { proposal: { id: string; ask_price: number; payout: number; longcode: string } };
type DerivBuyResponse = { buy: { contract_id: number; buy_price: number; payout: number; longcode: string } };

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
  });

  const updateState = useCallback((partial: Partial<DerivAPIState>) => {
    setState(prev => ({ ...prev, ...partial }));
  }, []);

  const service = useMemo(() => {
    const s = new DerivWebSocketService();
    return s;
  }, []);
  const cleanupRef = useRef<(() => void) | null>(null);

  const [tickSubscriptions, setTickSubscriptions] = useState<Record<string, string>>({});

  const toDerivSymbol = useCallback((symbol: string) => {
    const s = symbol.trim();
    if (!s) return s;
    if (s.includes("_") || s.startsWith("frx") || s.startsWith("cry")) return s;
    if (s === "XAUUSD") return "frxXAUUSD";
    if (s === "BTCUSD") return "cryBTCUSD";
    if (s === "ETHUSD") return "cryETHUSD";
    return `frx${s}`;
  }, []);

  const connect = useCallback(
    async (apiToken: string): Promise<DerivBalance> => {
      updateState({ loading: true, error: null });
      try {
        const getOtpUrl = async () => {
          const { data, error } = await supabase.functions.invoke<DerivOtpResponse>("deriv-get-otp", {
            body: { deriv_token: apiToken },
          });
          if (error || !data?.ok || !data?.ws_url) {
            throw new Error(data?.error || error?.message || "Failed to create Deriv PAT session");
          }
          return data.ws_url as string;
        };

        const offStatus = service.onStatus((st) => {
          updateState({ connected: st === "open", reconnecting: st === "reconnecting" });
        });
        const offError = service.onError((msg) => {
          updateState({ error: msg });
        });
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
        
        updateState({ 
          authorized: true, 
          balance,
          accountInfo: acctInfo,
          reconnecting: false,
        });

        // Subscribe to balance updates
        try {
          const b = await service.getBalance(true);
          updateState({ balance: b });
        } catch {
          // ignore, we still have authorize balance
        }

        updateState({ loading: false });

        cleanupRef.current = () => {
          offStatus();
          offError();
          offTick();
          offBalance();
        };

        return balance;
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Connection error";
        updateState({ loading: false, connected: false, authorized: false, error: message });
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
    });
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
        symbol,
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
      const response = await service.send<DerivProposalResponse>(request);

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
    connect,
    disconnect,
    subscribeTicks,
    unsubscribeTicks,
    getProposal,
    buyContract,
    placeTrade,
    subscribeContract,
    onContractUpdate,
    refreshBalance,
  };
};

export type { DerivBalance, DerivTick, DerivAccountInfo, DerivContractUpdate };
