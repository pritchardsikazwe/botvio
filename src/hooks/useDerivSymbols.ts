import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  clearSymbolCaches,
  getAssetAvailabilities,
  type AssetAvailability,
} from "@/services/deriv/derivSymbols";

export interface CandidateAsset {
  symbol: string;
  displayName?: string;
}

/**
 * Resolves live Deriv availability for a candidate asset list and a required
 * set of contract types. Assets are never presented as tradable unless the
 * live API confirms the contract type.
 */
export const useDerivSymbols = (
  candidates: CandidateAsset[],
  contractTypes: string[],
  enabled = true,
) => {
  const [assets, setAssets] = useState<AssetAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const key = useMemo(
    () => `${candidates.map((c) => c.symbol).join(",")}|${contractTypes.join(",")}`,
    [candidates, contractTypes],
  );

  const load = useCallback(async (force = false) => {
    if (!enabled || candidates.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      if (force) clearSymbolCaches();
      const result = await getAssetAvailabilities(candidates, contractTypes, { force });
      if (mounted.current) setAssets(result);
    } catch (e) {
      if (mounted.current) setError(e instanceof Error ? e.message : "Could not load assets");
    } finally {
      if (mounted.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, key]);

  useEffect(() => { load(false); }, [load]);

  const bySymbol = useMemo(() => {
    const map = new Map<string, AssetAvailability>();
    assets.forEach((a) => map.set(a.symbol, a));
    return map;
  }, [assets]);

  const tradableAssets = useMemo(
    () => assets.filter((a) => a.status !== "unavailable"),
    [assets],
  );

  return {
    assets,
    tradableAssets,
    bySymbol,
    getAsset: (symbol: string) => bySymbol.get(symbol) ?? null,
    loading,
    error,
    refresh: () => load(true),
  };
};