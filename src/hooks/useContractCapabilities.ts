import { useState, useEffect, useCallback, useRef } from "react";
import { useDeriv } from "@/contexts/DerivContext";

export interface ContractCapability {
  contract_type: string;
  min_duration?: number;
  max_duration?: number;
  duration_unit?: string;
  multiplier_range?: number[];
  growth_rate_range?: number[];
  barrier_range?: { min: number; max: number };
}

/**
 * Queries Deriv `contracts_for` for a given symbol.
 * Returns which contract types are available and their allowed parameters.
 */
export const useContractCapabilities = (symbol: string | null) => {
  const { authorized } = useDeriv();
  const [capabilities, setCapabilities] = useState<ContractCapability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const lastSymbolRef = useRef<string | null>(null);

  const fetchCapabilities = useCallback(async (sym: string) => {
    if (!authorized || !sym) return;
    if (lastSymbolRef.current === sym && capabilities.length > 0) return;
    lastSymbolRef.current = sym;
    setLoading(true);
    setError(null);

    try {
      // Use a fresh throwaway WS or piggyback on existing DerivWS service
      // For simplicity, we'll use supabase edge function
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error: fnError } = await supabase.functions.invoke("deriv-contracts-for-symbol", {
        body: { symbol: sym },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      // Edge function returns { raw: { available: [...] }, contracts: {...} }
      const available = data?.raw?.available ?? data?.available ?? [];
      const caps: ContractCapability[] = available.map((c: any) => {
        const cap: ContractCapability = {
          contract_type: c.contract_type,
        };
        if (c.min_contract_duration) {
          const match = c.min_contract_duration.match(/^(\d+)([a-z]+)$/);
          if (match) {
            cap.min_duration = parseInt(match[1]);
            cap.duration_unit = match[2];
          }
        }
        if (c.max_contract_duration) {
          const match = c.max_contract_duration.match(/^(\d+)([a-z]+)$/);
          if (match) {
            cap.max_duration = parseInt(match[1]);
          }
        }
        if (c.multiplier_range) {
          cap.multiplier_range = c.multiplier_range;
        }
        if (c.growth_rate_range) {
          cap.growth_rate_range = c.growth_rate_range;
        }
        return cap;
      });

      setCapabilities(caps);
    } catch (err: any) {
      console.error("[CAPS] Error fetching capabilities:", err.message);
      setError(err.message);
      setCapabilities([]);
    } finally {
      setLoading(false);
    }
  }, [authorized]);

  useEffect(() => {
    if (symbol) {
      lastSymbolRef.current = null; // reset to force refetch
      fetchCapabilities(symbol);
    } else {
      setCapabilities([]);
    }
  }, [symbol, fetchCapabilities]);

  /** Check if a contract type is supported for this symbol */
  const isSupported = useCallback((contractType: string) => {
    if (capabilities.length === 0) return true; // optimistic while loading
    return capabilities.some(c => c.contract_type === contractType);
  }, [capabilities]);

  /** Get allowed multiplier values for this symbol */
  const getAllowedMultipliers = useCallback((): number[] => {
    const multCap = capabilities.find(c => 
      c.contract_type === "MULTUP" || c.contract_type === "MULTDOWN"
    );
    if (multCap?.multiplier_range && multCap.multiplier_range.length > 0) {
      return multCap.multiplier_range;
    }
    return []; // empty = unknown/use defaults
  }, [capabilities]);

  /** Get allowed growth rates for accumulators */
  const getAllowedGrowthRates = useCallback((): number[] => {
    const accuCap = capabilities.find(c => c.contract_type === "ACCU");
    if (accuCap?.growth_rate_range && accuCap.growth_rate_range.length > 0) {
      return accuCap.growth_rate_range;
    }
    return [0.01, 0.02, 0.03, 0.04, 0.05];
  }, [capabilities]);

  /** Get all supported contract type codes */
  const supportedTypes = capabilities.map(c => c.contract_type);

  return {
    capabilities,
    loading,
    error,
    isSupported,
    getAllowedMultipliers,
    getAllowedGrowthRates,
    supportedTypes,
    refetch: () => symbol && fetchCapabilities(symbol),
  };
};
