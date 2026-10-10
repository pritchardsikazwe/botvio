/**
 * TradeCopy core — pure, platform-agnostic logic shared by the edge functions
 * and unit tests. No Deno/Node specific APIs here.
 *
 * Source of truth: TradeCopy OpenAPI (swagger/v1/swagger.json). Only documented
 * endpoints/fields are modelled.
 */

export type Platform = "MT5" | "MT4" | "CTRADER" | "DXTRADE" | "TRADELOCKER" | "MATCHTRADE";
export type Environment = "DEMO" | "LIVE";
export type AccountRole = "master" | "slave";
export type Side = "BUY" | "SELL";

/** accountStatus enum in the OpenAPI: 0 = ExistsAsMaster, 1 = ExistsAsSlave */
export const ACCOUNT_STATUS = { master: 0, slave: 1 } as const;

export const RISK_TYPES = {
  0: "Equity risk multiplier",
  1: "Lot multiplier",
  2: "Fixed lot",
  3: "Auto risk",
} as const;
export type RiskType = 0 | 1 | 2 | 3;

export const SCALPER_MODES = { 0: "Off", 1: "Permanent Scalp-Mode", 2: "Rollover Scalp-Mode" } as const;
export type ScalperMode = 0 | 1 | 2;

export const ORDER_FILTERS = { 0: "Buy & sell", 1: "Buy only", 2: "Sell only", 3: "All orders" } as const;
export type OrderFilter = 0 | 1 | 2 | 3;

/** copyOrderType: 0 = copy all existing orders, 1 = copy all new orders */
export type CopyOrderType = 0 | 1;

export class TradeCopyError extends Error {
  constructor(
    message: string,
    public code: "validation" | "auth" | "upstream" | "network" | "live_guard" | "not_found" | "config" | "duplicate_master",
    public status = 400,
  ) {
    super(message);
    this.name = "TradeCopyError";
  }
}

// ---------- Risk ----------

export interface RiskSettings {
  riskType: RiskType;
  multiplier: number;
}

/** Validate + normalise follower risk settings before they reach TradeCopy. */
export function normalizeRisk(input: { riskType: unknown; multiplier: unknown }): RiskSettings {
  const rt = Number(input.riskType);
  if (![0, 1, 2, 3].includes(rt)) throw new TradeCopyError("riskType must be 0, 1, 2 or 3", "validation");
  const m = Number(input.multiplier);
  if (!Number.isFinite(m) || m <= 0) throw new TradeCopyError("multiplier must be a positive number", "validation");
  if (rt === 2 && m > 50) throw new TradeCopyError("Fixed lot cannot exceed 50 lots", "validation");
  if (rt !== 2 && m > 100) throw new TradeCopyError("Multiplier cannot exceed 100", "validation");
  // fixed lot → 2 decimal lot precision; others → 4 decimals
  const multiplier = rt === 2 ? Math.round(m * 100) / 100 : Math.round(m * 10000) / 10000;
  if (multiplier <= 0) throw new TradeCopyError("multiplier rounds to zero", "validation");
  return { riskType: rt as RiskType, multiplier };
}

/** Human description used in the UI. */
export function describeRisk(r: RiskSettings): string {
  switch (r.riskType) {
    case 0: return `Equity-proportional × ${r.multiplier}`;
    case 1: return `Provider lot × ${r.multiplier}`;
    case 2: return `Fixed ${r.multiplier.toFixed(2)} lots`;
    case 3: return `Auto risk (${r.multiplier})`;
  }
}

// ---------- Copy settings ----------

export interface CopySettings {
  copySLTP: boolean;
  scalperMode: ScalperMode;
  orderFilter: OrderFilter;
  scalperValue: number;
}

export function normalizeCopySettings(input: Partial<Record<keyof CopySettings, unknown>>): CopySettings {
  const scalperMode = Number(input.scalperMode ?? 0);
  const orderFilter = Number(input.orderFilter ?? 0);
  const scalperValue = Number(input.scalperValue ?? 0);
  if (![0, 1, 2].includes(scalperMode)) throw new TradeCopyError("scalperMode must be 0, 1 or 2", "validation");
  if (![0, 1, 2, 3].includes(orderFilter)) throw new TradeCopyError("orderFilter must be 0-3", "validation");
  if (!Number.isInteger(scalperValue) || scalperValue < 0) throw new TradeCopyError("scalperValue must be a non-negative integer", "validation");
  return {
    copySLTP: input.copySLTP === undefined ? true : Boolean(input.copySLTP),
    scalperMode: scalperMode as ScalperMode,
    orderFilter: orderFilter as OrderFilter,
    scalperValue: scalperMode === 2 ? scalperValue : 0,
  };
}

export const ORDER_CONTROL_KEYS = [
  "profitOverPoint", "lossOverPoint", "profitForEveryOrder", "lossForEveryOrder",
  "profitForAllOrder", "lossForAllOrder", "equityUnderLow", "equityUnderHigh",
  "pendingOrderProfitPoint", "pendingOrderLossPoint", "pendingTimeout",
] as const;
export type OrderControl = Partial<Record<(typeof ORDER_CONTROL_KEYS)[number], number>>;

export function normalizeOrderControl(input: Record<string, unknown>): OrderControl {
  const out: OrderControl = {};
  for (const k of ORDER_CONTROL_KEYS) {
    const v = input[k];
    if (v === undefined || v === null || v === "") continue;
    const n = Number(v);
    if (!Number.isInteger(n) || n < 0) throw new TradeCopyError(`${k} must be a non-negative integer`, "validation");
    out[k] = n;
  }
  return out;
}

/** Would a provider order pass the follower's order filter? */
export function passesOrderFilter(filter: OrderFilter, side: Side): boolean {
  if (filter === 1) return side === "BUY";
  if (filter === 2) return side === "SELL";
  return true;
}

// ---------- Symbol mapping ----------

// MT5 broker symbols may contain spaces and parentheses (e.g. Deriv "Volatility 75 (1s) Index").
const SYMBOL_RE = /^[A-Za-z0-9._#+\-]([A-Za-z0-9._#+\-() ]{0,46}[A-Za-z0-9._#+\-)])?$/;

export function normalizeSymbol(s: unknown): string {
  const v = String(s ?? "").trim();
  if (!SYMBOL_RE.test(v)) throw new TradeCopyError(`Invalid symbol "${v}"`, "validation");
  return v;
}

export interface SymbolMapping { sourceSymbol: string; followSymbol: string; type: "Suffix" | "Special" }

/** Resolve follower symbol: explicit Special mapping > Suffix append > unchanged. */
export function resolveFollowerSymbol(source: string, mappings: SymbolMapping[], suffix?: string | null): string {
  const exact = mappings.find((m) => m.sourceSymbol.toUpperCase() === source.toUpperCase());
  if (exact) return exact.followSymbol;
  if (suffix && !source.endsWith(suffix)) return `${source}${suffix}`;
  return source;
}

// ---------- Orders ----------

export interface NormalizedOrder {
  ticket: string;
  symbol: string;
  side: Side | "UNKNOWN";
  lots: number | null;
  openPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  profit: number | null;
  openTime: string | null;
  closeTime: string | null;
  raw: Record<string, unknown>;
}

const pick = (o: Record<string, unknown>, keys: string[]) => {
  for (const k of keys) {
    for (const actual of Object.keys(o)) if (actual.toLowerCase() === k.toLowerCase()) return o[actual];
  }
  return undefined;
};
const num = (v: unknown) => (v === undefined || v === null || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));

function normSide(v: unknown): Side | "UNKNOWN" {
  const s = String(v ?? "").toUpperCase();
  if (s === "0" || s.includes("BUY")) return "BUY";
  if (s === "1" || s.includes("SELL")) return "SELL";
  return "UNKNOWN";
}

/**
 * TradeCopy returns StringResponseDto (a string payload). Parse defensively:
 * the payload may be a JSON string, an array, or wrapped in { data }.
 */
export function normalizeOrders(payload: unknown): NormalizedOrder[] {
  let p: unknown = payload;
  if (p && typeof p === "object" && !Array.isArray(p)) {
    const o = p as Record<string, unknown>;
    p = pick(o, ["data", "result", "orders", "message"]) ?? p;
  }
  if (typeof p === "string") {
    try { p = JSON.parse(p); } catch { return []; }
  }
  if (p && typeof p === "object" && !Array.isArray(p)) {
    const inner = pick(p as Record<string, unknown>, ["data", "orders", "result"]);
    if (Array.isArray(inner)) p = inner;
  }
  if (!Array.isArray(p)) return [];
  return p
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map((o) => {
      const t = pick(o, ["ticket", "order", "orderId", "id"]);
      return {
        ticket: t === undefined || t === null ? "" : String(t),
        symbol: String(pick(o, ["symbol"]) ?? ""),
        side: normSide(pick(o, ["type", "orderType", "side", "cmd"])),
        lots: num(pick(o, ["lots", "volume", "lot"])),
        openPrice: num(pick(o, ["openPrice", "priceOpen", "price"])),
        stopLoss: num(pick(o, ["stopLoss", "sl"])),
        takeProfit: num(pick(o, ["takeProfit", "tp"])),
        profit: num(pick(o, ["profit"])),
        openTime: (pick(o, ["openTime", "timeOpen", "time"]) as string) ?? null,
        closeTime: (pick(o, ["closeTime", "timeClose"]) as string) ?? null,
        raw: o,
      };
    })
    .filter((o) => o.ticket !== "");
}

export interface MarketOrderInput { symbol: string; side: Side; lots: number; stopLoss?: number | null; takeProfit?: number | null }

/**
 * Validate SL/TP geometry against the signal/expected entry before TradeCopy.
 * MT5 validates stops against the actual market price, so this is deliberately
 * conservative: invalid-side stops are rejected instead of being sent blindly.
 */
export function normalizeMarketOrder(input: Record<string, unknown>): MarketOrderInput {
  const side = String(input.side ?? "").toUpperCase();
  if (side !== "BUY" && side !== "SELL") throw new TradeCopyError("side must be BUY or SELL", "validation");
  const lots = Number(input.lots);
  if (!Number.isFinite(lots) || lots <= 0 || lots > 100) throw new TradeCopyError("lots must be between 0 and 100", "validation");
  const sl = num(input.stopLoss);
  const tp = num(input.takeProfit);
  const reference = num(input.referencePrice);
  if (sl !== null && sl < 0) throw new TradeCopyError("stopLoss must be ≥ 0", "validation");
  if (tp !== null && tp < 0) throw new TradeCopyError("takeProfit must be ≥ 0", "validation");
  if (reference !== null && reference > 0) {
    if (side === "BUY") {
      if (sl !== null && sl >= reference) throw new TradeCopyError("BUY stop loss must be below the reference entry price", "validation");
      if (tp !== null && tp <= reference) throw new TradeCopyError("BUY take profit must be above the reference entry price", "validation");
    } else {
      if (sl !== null && sl <= reference) throw new TradeCopyError("SELL stop loss must be above the reference entry price", "validation");
      if (tp !== null && tp >= reference) throw new TradeCopyError("SELL take profit must be below the reference entry price", "validation");
    }
  }
  return { symbol: normalizeSymbol(input.symbol), side, lots: Math.round(lots * 100) / 100, stopLoss: sl, takeProfit: tp };
}

// ---------- Idempotency ----------

/** Deterministic key: same master ticket + same relationship → same record. */
export function executionIdempotencyKey(p: { relationshipId: string | null; masterAccountId: string; sourceTicket: string; followerTicket?: string | null }): string {
  if (!p.masterAccountId || !p.sourceTicket) throw new TradeCopyError("idempotency requires masterAccountId and sourceTicket", "validation");
  return ["tc", p.masterAccountId, p.relationshipId ?? "master", p.sourceTicket, p.followerTicket ?? "-"].join(":");
}

/** Deduplicate a batch of orders so repeated polling can never double-insert. */
export function dedupeByKey<T>(items: T[], keyOf: (t: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((i) => { const k = keyOf(i); if (seen.has(k)) return false; seen.add(k); return true; });
}

// ---------- Relationships ----------

export interface RelationshipCheck {
  masterRole: AccountRole | null;
  followerRole: AccountRole | null;
  masterUserId: string | null;
  followerUserId: string;
  masterTradecopyId: number | null;
  masterEnvironment: Environment;
  followerEnvironment: Environment;
}

/** Validate a provider(master) → follower(slave) link. */
export function validateRelationship(r: RelationshipCheck): void {
  if (r.masterRole !== "master") throw new TradeCopyError("Provider account must be registered as a master", "validation");
  if (r.followerRole !== "slave") throw new TradeCopyError("Follower account must be registered as a follower", "validation");
  if (!r.masterTradecopyId) throw new TradeCopyError("Provider master account is not connected yet", "validation");
  if (r.masterUserId && r.masterUserId === r.followerUserId) {
    // allowed only when both roles differ (already ensured) — but block self-copy of same account
  }
  // A DEMO source may feed either a DEMO or LIVE follower. This is the
  // intentional "demo signal source -> live execution account" model.
  // LIVE sources may not be linked to DEMO followers because that would
  // mix a live source into a demo execution environment.
  if (r.masterEnvironment === "LIVE" && r.followerEnvironment === "DEMO") {
    throw new TradeCopyError("A live master cannot be linked to a demo follower", "validation");
  }
}

// ---------- Live guard ----------

export interface LiveGuardInput {
  environment: Environment;
  liveConfirmedAt: string | null | undefined;
  globalLiveEnabled: boolean;
  adapterMode: "mock" | "live";
  emergencyStopped?: boolean;
}

/**
 * Throws unless the action is allowed. DEMO always allowed (mock adapter
 * or TradeCopy demo). LIVE requires global switch + explicit per-relationship
 * confirmation + live adapter + no emergency stop.
 */
export function assertLiveAllowed(g: LiveGuardInput): void {
  if (g.emergencyStopped) throw new TradeCopyError("Emergency stop is active. Reset it before resuming.", "live_guard", 409);
  if (g.environment === "DEMO") return;
  if (!g.globalLiveEnabled) throw new TradeCopyError("Live copy trading is disabled platform-wide.", "live_guard", 403);
  if (g.adapterMode !== "live") throw new TradeCopyError("Live trading requires the TradeCopy API key to be configured.", "live_guard", 403);
  if (!g.liveConfirmedAt) throw new TradeCopyError("Live copying must be explicitly confirmed first.", "live_guard", 403);
}

/** Strip anything credential-like before logging/returning. */
export function redact<T>(value: T): T {
  const SECRET = /pass(word)?|api[-_]?key|secret|token/i;
  const walk = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") {
      return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, SECRET.test(k) ? "[redacted]" : walk(x)]));
    }
    return v;
  };
  return walk(value) as T;
}
