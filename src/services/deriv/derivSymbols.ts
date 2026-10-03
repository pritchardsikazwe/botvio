import { supabase } from "@/integrations/supabase/client";

/**
 * Deriv symbol capability layer.
 *
 * Nothing in the UI may assume a symbol is tradable. Every asset is validated
 * against the LIVE Deriv API (`active_symbols` + `contracts_for`) before it is
 * offered for trading. No symbol is ever hard-coded as available.
 */

export interface ContractSpec {
  contractType: string;
  displayName: string;
  category: string | null;
  minStake: number | null;
  maxStake: number | null;
  minDuration: number | null;
  maxDuration: number | null;
  durationUnits: string[];
  barriers: number | null;
  expiryType: string | null;
}

export interface SymbolCapability {
  symbol: string;
  displayName: string;
  market: string | null;
  submarket: string | null;
  /** exchange_is_open === 1 */
  isOpen: boolean;
  isSuspended: boolean;
  /** Contract types confirmed by Deriv for this symbol */
  contracts: Record<string, ContractSpec>;
  /** true when the capability could NOT be verified (network/API issue) */
  unverified: boolean;
  /** technical error, for diagnostics only */
  error?: string;
  fetchedAt: number;
}

export type AvailabilityStatus = "available" | "limited" | "unavailable";

export interface AssetAvailability {
  symbol: string;
  displayName: string;
  market: string | null;
  submarket: string | null;
  status: AvailabilityStatus;
  /** user-facing reason, empty when available */
  reason: string;
  /** technical detail for the diagnostics panel */
  technical?: string;
  capability: SymbolCapability | null;
}

const CAPABILITY_TTL_MS = 5 * 60 * 1000;
const SYMBOLS_TTL_MS = 5 * 60 * 1000;

interface ActiveSymbolRow {
  symbol: string;
  display_name: string;
  market?: string;
  submarket?: string;
  is_trading_suspended?: number | boolean;
  exchange_is_open?: number | boolean;
}

let activeSymbolsCache: { at: number; rows: Record<string, ActiveSymbolRow> } | null = null;
let activeSymbolsInflight: Promise<Record<string, ActiveSymbolRow>> | null = null;

const capabilityCache = new Map<string, SymbolCapability>();
const capabilityInflight = new Map<string, Promise<SymbolCapability>>();

/** Last raw request/response, exposed only to the developer diagnostics panel. */
export const symbolDiagnostics = {
  lastRequest: null as string | null,
  lastResponseAt: null as number | null,
  lastError: null as string | null,
};

const parseDuration = (raw?: string | null): { value: number; unit: string } | null => {
  if (!raw || typeof raw !== "string") return null;
  const m = raw.trim().match(/^(\d+)\s*([a-z]+)$/i);
  if (!m) return null;
  return { value: parseInt(m[1], 10), unit: m[2].toLowerCase() };
};

const toNumber = (v: unknown): number | null => {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
};

/** Fetch (and cache) the Deriv active symbol catalogue. */
export async function fetchActiveSymbols(force = false): Promise<Record<string, ActiveSymbolRow>> {
  if (!force && activeSymbolsCache && Date.now() - activeSymbolsCache.at < SYMBOLS_TTL_MS) {
    return activeSymbolsCache.rows;
  }
  if (activeSymbolsInflight) return activeSymbolsInflight;

  activeSymbolsInflight = (async () => {
    symbolDiagnostics.lastRequest = "active_symbols";
    const { data, error } = await supabase.functions.invoke("deriv-active-symbols", { body: {} });
    symbolDiagnostics.lastResponseAt = Date.now();
    if (error || (data as any)?.error) {
      symbolDiagnostics.lastError = (data as any)?.error || error?.message || "active_symbols failed";
      throw new Error(symbolDiagnostics.lastError as string);
    }
    const grouped = ((data as any)?.symbols ?? {}) as Record<string, ActiveSymbolRow[]>;
    const rows: Record<string, ActiveSymbolRow> = {};
    Object.values(grouped).forEach((list) => {
      (list ?? []).forEach((row) => {
        if (row?.symbol) rows[row.symbol] = row;
      });
    });
    activeSymbolsCache = { at: Date.now(), rows };
    return rows;
  })().finally(() => {
    activeSymbolsInflight = null;
  });

  return activeSymbolsInflight;
}

/**
 * Resolve the live capability of one symbol: is it open, and exactly which
 * contract types (with stake/duration bounds) does Deriv allow right now.
 */
export async function getSymbolCapability(symbol: string, force = false): Promise<SymbolCapability> {
  const cached = capabilityCache.get(symbol);
  if (!force && cached && Date.now() - cached.fetchedAt < CAPABILITY_TTL_MS) return cached;

  const inflight = capabilityInflight.get(symbol);
  if (inflight && !force) return inflight;

  const run = (async (): Promise<SymbolCapability> => {
    let meta: ActiveSymbolRow | undefined;
    try {
      const rows = await fetchActiveSymbols(force);
      meta = rows[symbol];
    } catch {
      meta = undefined;
    }

    const base: SymbolCapability = {
      symbol,
      displayName: meta?.display_name ?? symbol,
      market: meta?.market ?? null,
      submarket: meta?.submarket ?? null,
      isOpen: meta ? !!Number(meta.exchange_is_open ?? 1) : true,
      isSuspended: meta ? !!Number(meta.is_trading_suspended ?? 0) : false,
      contracts: {},
      unverified: false,
      fetchedAt: Date.now(),
    };

    try {
      symbolDiagnostics.lastRequest = `contracts_for ${symbol}`;
      const { data, error } = await supabase.functions.invoke("deriv-contracts-for-symbol", {
        body: { symbol },
      });
      symbolDiagnostics.lastResponseAt = Date.now();
      if (error || (data as any)?.error) {
        throw new Error((data as any)?.error || error?.message || "contracts_for failed");
      }
      const available: any[] = (data as any)?.raw?.available ?? (data as any)?.available ?? [];
      if (!Array.isArray(available) || available.length === 0) {
        return { ...base, contracts: {}, fetchedAt: Date.now() };
      }
      const contracts: Record<string, ContractSpec> = {};
      for (const c of available) {
        const type = c?.contract_type;
        if (!type) continue;
        const min = parseDuration(c.min_contract_duration);
        const max = parseDuration(c.max_contract_duration);
        const prev = contracts[type];
        const units = new Set<string>(prev?.durationUnits ?? []);
        if (min?.unit) units.add(min.unit);
        if (max?.unit) units.add(max.unit);
        contracts[type] = {
          contractType: type,
          displayName: c.contract_display || prev?.displayName || type,
          category: c.contract_category ?? prev?.category ?? null,
          minStake: toNumber(c.min_stake) ?? prev?.minStake ?? null,
          maxStake: toNumber(c.max_stake) ?? prev?.maxStake ?? null,
          minDuration: min?.value ?? prev?.minDuration ?? null,
          maxDuration: max?.value ?? prev?.maxDuration ?? null,
          durationUnits: Array.from(units),
          barriers: toNumber(c.barriers) ?? prev?.barriers ?? null,
          expiryType: c.expiry_type ?? prev?.expiryType ?? null,
        };
      }
      const cap: SymbolCapability = { ...base, contracts, fetchedAt: Date.now() };
      capabilityCache.set(symbol, cap);
      return cap;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Capability lookup failed";
      symbolDiagnostics.lastError = message;
      // Unverified: we do NOT claim support, and we do NOT hard-block either.
      const cap: SymbolCapability = { ...base, unverified: true, error: message, fetchedAt: Date.now() };
      capabilityCache.set(symbol, cap);
      return cap;
    }
  })();

  capabilityInflight.set(symbol, run);
  try {
    return await run;
  } finally {
    capabilityInflight.delete(symbol);
  }
}

/** Does Deriv confirm this exact contract type for this symbol? */
export const supportsContract = (cap: SymbolCapability | null, contractTypes: string[]): boolean => {
  if (!cap) return false;
  return contractTypes.some((t) => !!cap.contracts[t]);
};

/**
 * Availability of one asset for a given set of contract types
 * (e.g. Rise/Fall = ["CALL", "PUT"]).
 */
export async function getAssetAvailability(
  symbol: string,
  contractTypes: string[],
  opts: { displayName?: string; force?: boolean } = {},
): Promise<AssetAvailability> {
  const cap = await getSymbolCapability(symbol, opts.force);
  const displayName = opts.displayName || cap.displayName || symbol;
  const shared = { symbol, displayName, market: cap.market, submarket: cap.submarket, capability: cap };

  if (cap.unverified) {
    return {
      ...shared,
      status: "unavailable",
      reason: "Deriv availability could not be verified, so this symbol is blocked.",
      technical: cap.error,
    };
  }
  if (cap.isSuspended) {
    return { ...shared, status: "unavailable", reason: `${displayName} trading is suspended by Deriv.` };
  }
  if (!cap.isOpen) {
    return { ...shared, status: "unavailable", reason: `${displayName} market is currently closed.` };
  }
  if (Object.keys(cap.contracts).length === 0) {
    return { ...shared, status: "unavailable", reason: `${displayName} has no currently available contract types.` };
  }
  if (!supportsContract(cap, contractTypes)) {
    return {
      ...shared,
      status: "unavailable",
      reason: `${displayName} does not currently support this trade type.`,
      technical: `contracts_for(${symbol}) returned ${Object.keys(cap.contracts).length} types without ${contractTypes.join("/")}`,
    };
  }
  return { ...shared, status: "available", reason: "" };
}

/** Resolve many assets at once with limited concurrency. */
export async function getAssetAvailabilities(
  assets: { symbol: string; displayName?: string }[],
  contractTypes: string[],
  opts: { force?: boolean; concurrency?: number } = {},
): Promise<AssetAvailability[]> {
  const concurrency = opts.concurrency ?? 4;
  const out: AssetAvailability[] = [];
  let cursor = 0;

  const worker = async () => {
    while (cursor < assets.length) {
      const index = cursor++;
      const a = assets[index];
      out[index] = await getAssetAvailability(a.symbol, contractTypes, {
        displayName: a.displayName,
        force: opts.force,
      });
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, assets.length) }, worker));
  return out.filter(Boolean);
}

/** Drop all cached capability data (used by the "Refresh assets" button). */
export function clearSymbolCaches() {
  capabilityCache.clear();
  capabilityInflight.clear();
  activeSymbolsCache = null;
}

/** Contract types that the connected environment confirms for a symbol set. */
export async function getSupportedContractTypes(symbols: string[]): Promise<Set<string>> {
  const set = new Set<string>();
  for (const s of symbols) {
    try {
      const cap = await getSymbolCapability(s);
      Object.keys(cap.contracts).forEach((t) => set.add(t));
    } catch {
      /* ignore — unverified symbols contribute nothing */
    }
  }
  return set;
}