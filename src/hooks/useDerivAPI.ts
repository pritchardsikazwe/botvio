import { useState, useCallback, useMemo, useEffect } from "react";
import { DerivWebSocketService } from "@/services/derivWebSocket";
import type { DerivBalance, DerivTick, DerivAccountInfo, DerivContractUpdate } from "@/types/deriv";
import { getDerivConfig } from "@/config/derivEnv";

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
}

export const useDerivAPI = () => {
  const [state, setState] = useState<DerivAPIState>({
    connected: false,
    authorized: false,
    balance: null,
    error: null,
    loading: false,
    lastTick: null,
    accountInfo: null,
  });

  const updateState = useCallback((partial: Partial<DerivAPIState>) => {
    setState(prev => ({ ...prev, ...partial }));
  }, []);

  const derivConfig = getDerivConfig();

  const service = useMemo(() => {
    const s = new DerivWebSocketService();
    return s;
  }, [derivConfig.appId]);

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
        await service.open();
        updateState({ connected: true });

        const offStatus = service.onStatus((st) => {
          updateState({ connected: st === "open" });
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

        const balance = await service.authorize(apiToken);
        const acctInfo = service.account;
        
        console.log(`[AUTH] loginid=${balance.loginid} is_virtual=${acctInfo?.is_virtual} currency=${balance.currency} balance=${balance.balance}`);
        
        updateState({ 
          authorized: true, 
          balance,
          accountInfo: acctInfo,
        });

        // Subscribe to balance updates
        try {
          const b = await service.getBalance(true);
          updateState({ balance: b });
        } catch {
          // ignore, we still have authorize balance
        }

        updateState({ loading: false });

        (disconnect as any).__cleanup = () => {
          offStatus();
          offError();
          offTick();
          offBalance();
        };

        return balance;
      } catch (e: any) {
        updateState({ loading: false, connected: false, authorized: false, error: e?.message || "Connection error" });
        throw e;
      }
    },
    [service, updateState],
  );

  const disconnect = useCallback(() => {
    const cleanup = (disconnect as any).__cleanup as undefined | (() => void);
    cleanup?.();
    (disconnect as any).__cleanup = undefined;

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
      const response: any = await service.send(request);

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
      const response: any = await service.send({
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
      const response: any = await service.send({
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
      // Use subscribe=false to avoid "already subscribed" errors
      // The balance subscription is already established during connect()
      const b = await service.getBalance(false);
      console.log(`[BALANCE] refreshed: ${b.loginid} ${b.currency} ${b.balance}`);
      updateState({ balance: b });
      return b;
    } catch (e) {
      console.error("[BALANCE] refresh failed:", e);
      // Fall back to cached balance from service
      const cached = service.latestBalance;
      if (cached) {
        console.log(`[BALANCE] using cached: ${cached.balance} ${cached.currency}`);
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
