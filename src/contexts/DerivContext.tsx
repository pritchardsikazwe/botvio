import React, { createContext, useContext, ReactNode, useEffect, useMemo, useCallback } from "react";
import { useDerivAPI, DerivBalance, DerivTick, DerivProposal, DerivContract, DerivAccountInfo, DerivContractUpdate } from "@/hooks/useDerivAPI";
import { useRunningTrades, RunningTrade } from "@/hooks/useRunningTrades";
import { useActiveToken, ActiveToken } from "@/hooks/useActiveToken";

interface DerivContextType {
  connected: boolean;
  authorized: boolean;
  balance: DerivBalance | null;
  error: string | null;
  loading: boolean;
  lastTick: DerivTick | null;
  accountInfo: DerivAccountInfo | null;
  // Running trades & equity
  runningTrades: RunningTrade[];
  runningProfit: number;
  equity: number; // balance + sum(running profits)
  // Active token
  activeToken: ActiveToken | null;
  // Actions
  connect: (apiToken: string) => Promise<DerivBalance>;
  disconnect: () => void;
  subscribeTicks: (symbol: string) => Promise<void>;
  unsubscribeTicks: (symbol: string) => Promise<void>;
  getProposal: (params: {
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
  }) => Promise<DerivProposal>;
  buyContract: (proposalId: string, price: number) => Promise<DerivContract>;
  placeTrade: (params: {
    symbol: string;
    contract_type: string;
    amount: number;
    duration?: number;
    duration_unit?: "t" | "s" | "m" | "h" | "d";
    barrier?: number | string;
    multiplier?: number;
    growth_rate?: number;
    limit_order?: Record<string, number>;
  }) => Promise<DerivContract>;
  subscribeContract: (contractId: number) => Promise<any>;
  onContractUpdate: (listener: (update: DerivContractUpdate) => void) => () => void;
  refreshBalance: () => Promise<DerivBalance | null>;
}

const DerivContext = createContext<DerivContextType | undefined>(undefined);

export const DerivProvider = ({ children }: { children: ReactNode }) => {
  const derivAPI = useDerivAPI();
  const { runningTrades, runningProfit, addTrade, handleContractUpdate } = useRunningTrades();
  const { activeToken, setToken, validateConnection } = useActiveToken();

  // Equity = Deriv balance + sum of running profits (never simulated)
  const equity = useMemo(() => {
    const bal = derivAPI.balance?.balance ?? 0;
    return bal + runningProfit;
  }, [derivAPI.balance?.balance, runningProfit]);

  // When authorized, register active token and validate
  useEffect(() => {
    if (derivAPI.authorized && derivAPI.accountInfo && derivAPI.balance) {
      const info = derivAPI.accountInfo;
      setToken({
        loginid: info.loginid,
        is_virtual: info.is_virtual,
        currency: info.currency,
      });
    }
  }, [derivAPI.authorized, derivAPI.accountInfo?.loginid]);

  // Listen for contract updates to track running trades + refresh balance on settlement
  useEffect(() => {
    if (!derivAPI.authorized) return;
    const unsub = derivAPI.onContractUpdate((update) => {
      handleContractUpdate(update);
      // On settlement, immediately refresh wallet balance from Deriv
      const isSettled = update.is_sold || update.is_expired || ["won", "lost", "sold"].includes(update.status);
      if (isSettled) {
        console.log(`[BALANCE] Refreshing after settlement of contract_id=${update.contract_id}`);
        derivAPI.refreshBalance().then((bal) => {
          if (bal) console.log(`[BALANCE] after=${bal.balance} ${bal.currency} loginid=${bal.loginid}`);
        });
      }
    });
    return () => { unsub(); };
  }, [derivAPI.authorized, derivAPI.onContractUpdate, handleContractUpdate, derivAPI.refreshBalance]);

  // Enhanced placeTrade that also tracks running trades
  const enhancedPlaceTrade = useCallback(async (params: Parameters<typeof derivAPI.placeTrade>[0]) => {
    // Validate no demo/real mismatch
    if (derivAPI.accountInfo && activeToken) {
      if (!validateConnection(derivAPI.accountInfo.loginid)) {
        throw new Error(`Token mismatch: expected ${activeToken.loginid} but connected as ${derivAPI.accountInfo.loginid}. Please reconnect.`);
      }
    }

    const contract = await derivAPI.placeTrade(params);

    // Track running trade
    if (derivAPI.accountInfo) {
      await addTrade({
        contract_id: contract.contract_id,
        loginid: derivAPI.accountInfo.loginid,
        is_virtual: derivAPI.accountInfo.is_virtual,
        symbol: params.symbol,
        contract_type: params.contract_type ?? "",
        buy_price: contract.buy_price,
        payout: contract.payout,
      });
    }

    return contract;
  }, [derivAPI.placeTrade, derivAPI.accountInfo, activeToken, validateConnection, addTrade]);

  const value: DerivContextType = {
    ...derivAPI,
    placeTrade: enhancedPlaceTrade,
    runningTrades,
    runningProfit,
    equity,
    activeToken,
  };

  return (
    <DerivContext.Provider value={value}>
      {children}
    </DerivContext.Provider>
  );
};

export const useDeriv = () => {
  const context = useContext(DerivContext);
  if (!context) {
    throw new Error("useDeriv must be used within a DerivProvider");
  }
  return context;
};
