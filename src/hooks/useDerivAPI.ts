import { useState, useCallback, useMemo, useEffect } from "react";
import { DerivWebSocketService } from "@/services/derivWebSocket";
import type { DerivBalance, DerivTick } from "@/types/deriv";
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
}

export const useDerivAPI = () => {
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

  // Use environment-based configuration
  const derivConfig = getDerivConfig();

  const service = useMemo(() => {
    // DerivWebSocketService now automatically uses environment-based config
    const s = new DerivWebSocketService();
    return s;
  }, [derivConfig.appId]);

  const [tickSubscriptions, setTickSubscriptions] = useState<Record<string, string>>({});

  // Map your app symbols (XAUUSD/EURUSD/BTCUSD) to Deriv symbols.
  // This prevents “connected but no ticks” when the symbol name is not valid on Deriv.
  const toDerivSymbol = useCallback((symbol: string) => {
    const s = symbol.trim();
    if (!s) return s;
    // already a Deriv style symbol like R_100 / frxEURUSD / cryBTCUSD
    if (s.includes("_") || s.startsWith("frx") || s.startsWith("cry")) return s;

    // Basic heuristics:
    if (s === "XAUUSD") return "frxXAUUSD";
    if (s === "BTCUSD") return "cryBTCUSD";
    if (s === "ETHUSD") return "cryETHUSD";

    // Forex majors in this app: EURUSD, GBPUSD, USDJPY, etc.
    return `frx${s}`;
  }, []);

  const connect = useCallback(
    async (apiToken: string): Promise<DerivBalance> => {
      updateState({ loading: true, error: null });
      try {
        await service.open();
        updateState({ connected: true });

        // Wire stream listeners once per connect call
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

        const balance = await service.authorize(apiToken);
        updateState({ authorized: true, balance });

        // Subscribe to balance updates
        try {
          const b = await service.getBalance(true);
          updateState({ balance: b });
        } catch {
          // ignore, we still have authorize balance
        }

        updateState({ loading: false });

        // Cleanup listeners when disconnect() is called by user
        // (we keep them referenced via closure and call in disconnect)
        (disconnect as any).__cleanup = () => {
          offStatus();
          offError();
          offTick();
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
      // prefer "forget" with subscription id (per requirement)
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
      // fallback (if we don't have a cached subscription id yet)
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

      // Duration (not used for multipliers/accumulators)
      if (params.duration !== undefined && params.duration !== null) {
        request.duration = params.duration;
        request.duration_unit = params.duration_unit || "m";
      }

      // Digit contracts barrier (last digit prediction 0-9)
      if (params.barrier !== undefined && params.barrier !== null) {
        request.barrier = String(params.barrier);
      }

      // Multiplier contracts
      if (params.multiplier !== undefined && params.multiplier !== null) {
        request.multiplier = params.multiplier;
      }

      // Accumulator growth rate
      if (params.growth_rate !== undefined && params.growth_rate !== null) {
        request.growth_rate = params.growth_rate;
      }

      // Limit orders (stop_loss / take_profit for multipliers)
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
    // Get proposal first
    const proposal = await getProposal(params);
    
    // Then buy
    const contract = await buyContract(proposal.id, proposal.ask_price);
    
    return contract;
  }, [getProposal, buyContract]);

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
  };
};

export type { DerivBalance, DerivTick };
