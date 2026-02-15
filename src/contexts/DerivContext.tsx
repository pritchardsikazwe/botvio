import React, { createContext, useContext, ReactNode } from "react";
import { useDerivAPI, DerivBalance, DerivTick, DerivProposal, DerivContract } from "@/hooks/useDerivAPI";

interface DerivContextType {
  connected: boolean;
  authorized: boolean;
  balance: DerivBalance | null;
  error: string | null;
  loading: boolean;
  lastTick: DerivTick | null;
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
    duration: number;
    duration_unit: "t" | "s" | "m" | "h" | "d";
  }) => Promise<DerivContract>;
}

const DerivContext = createContext<DerivContextType | undefined>(undefined);

export const DerivProvider = ({ children }: { children: ReactNode }) => {
  const derivAPI = useDerivAPI();

  return (
    <DerivContext.Provider value={derivAPI}>
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
