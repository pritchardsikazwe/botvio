/**
 * TradeCopyAdapter — execution adapter. Botvio is the product layer; TradeCopy
 * is the execution/copy infrastructure. Only MT5 is implemented; other
 * platforms plug in by implementing ExecutionAdapter.
 */
import {
  ACCOUNT_STATUS, AccountRole, CopyOrderType, CopySettings, MarketOrderInput, NormalizedOrder,
  OrderControl, RiskSettings, Side, TradeCopyError, normalizeOrders, redact,
} from "./core.ts";

export interface RegisterResult { tradecopyUserId: number | null; raw: unknown }

export interface ExecutionAdapter {
  readonly platform: string;
  readonly mode: "mock" | "live";
  registerMaster(p: { login: number; password: string; server: string; comment?: string }): Promise<RegisterResult>;
  registerFollower(p: { login: number; password: string; server: string; masterId: number; comment?: string; copyOrderType: CopyOrderType }): Promise<RegisterResult>;
  activateMaster(id: number): Promise<unknown>;
  deactivateMaster(id: number): Promise<unknown>;
  activateFollower(id: number): Promise<unknown>;
  deactivateFollower(id: number): Promise<unknown>;
  createMarketOrder(userId: number, role: AccountRole, o: MarketOrderInput): Promise<unknown>;
  createPendingOrder(userId: number, role: AccountRole, o: { symbol: string; side: string; lots: number; price: number }): Promise<unknown>;
  getOpenOrders(userId: number, role: AccountRole): Promise<NormalizedOrder[]>;
  modifyOrder(userId: number, role: AccountRole, ticket: number, sl: number, tp: number): Promise<unknown>;
  closeOrder(userId: number, role: AccountRole, ticket: number): Promise<unknown>;
  partialClose(userId: number, role: AccountRole, ticket: number, lots: number): Promise<unknown>;
  closeAll(userId: number, role: AccountRole): Promise<unknown>;
  closeAllBySymbol(userId: number, role: AccountRole, symbol: string): Promise<unknown>;
  closeAllBySide(userId: number, role: AccountRole, side: Side): Promise<unknown>;
  getOrderHistory(userId: number, role: AccountRole, from: string, to: string): Promise<NormalizedOrder[]>;
  updateRisk(userId: number, r: RiskSettings): Promise<unknown>;
  getRisk(userId: number): Promise<unknown>;
  updateStopsLimits(userId: number, s: CopySettings): Promise<unknown>;
  updateOrderControl(userId: number, c: OrderControl): Promise<unknown>;
  mapSymbol(userId: number, source: string, follow: string, type: "Suffix" | "Special"): Promise<unknown>;
  getSuffix(userId: number): Promise<unknown>;
  getSpecial(userId: number): Promise<unknown>;
  getAllSymbols(userId: number): Promise<unknown>;
  diagnostic(id: number): Promise<unknown>;
  unfollow(userId: number): Promise<unknown>;
  removeSource(userId: number): Promise<unknown>;
}

type Query = Record<string, string | number | boolean | null | undefined>;

export class TradeCopyMt5Adapter implements ExecutionAdapter {
  readonly platform = "MT5";
  readonly mode = "live" as const;
  constructor(private apiKey: string, private baseUrl: string, private fetcher: typeof fetch = fetch) {
    if (!apiKey) throw new TradeCopyError("TRADECOPY_API_KEY is not configured", "config", 500);
  }

  private async call(method: "GET" | "POST" | "DELETE", path: string, q: Query = {}): Promise<unknown> {
    const url = new URL(this.baseUrl.replace(/\/+$/, "") + path);
    for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    let res: Response;
    try {
      res = await this.fetcher(url.toString(), {
        method,
        headers: { ApiKey: this.apiKey, Accept: "application/json" },
        signal: typeof AbortSignal !== "undefined" && "timeout" in AbortSignal ? AbortSignal.timeout(15000) : undefined,
      });
    } catch (e) {
      throw new TradeCopyError(`TradeCopy unreachable: ${(e as Error).message}`, "network", 502);
    }
    const text = await res.text();
    let body: unknown = text;
    try { body = JSON.parse(text); } catch { /* plain text */ }
    if (res.status === 401 || res.status === 403) {
      const detail = typeof body === "object" && body
        ? JSON.stringify(redact(body)).slice(0, 300)
        : String(text).slice(0, 300);
      throw new TradeCopyError(`TradeCopy rejected the API key (${res.status}): ${detail}`, "auth", 502);
    }
    if (!res.ok) {
      const msg = typeof body === "object" && body ? JSON.stringify(redact(body)).slice(0, 300) : String(text).slice(0, 300);
      throw new TradeCopyError(`TradeCopy error ${res.status}: ${msg}`, "upstream", 502);
    }
    // StringResponseDto may carry success=false / error message
    if (body && typeof body === "object") {
      const b = body as Record<string, unknown>;
      const ok = b.success ?? b.isSuccess ?? b.status;
      if (ok === false) throw new TradeCopyError(`TradeCopy: ${String(b.message ?? b.error ?? "request failed").slice(0, 300)}`, "upstream", 502);
    }
    return body;
  }

  private static extractId(raw: unknown, fallback: number): number | null {
    if (raw && typeof raw === "object") {
      const b = raw as Record<string, unknown>;
      for (const k of ["id", "userId", "data"]) {
        const value = b[k];
        const n = Number(value);
        if (Number.isFinite(n) && n > 0) return n;
        if (value && typeof value === "object") {
          for (const nested of ["id", "userId", "userID"]) {
            const nn = Number((value as Record<string, unknown>)[nested]);
            if (Number.isFinite(nn) && nn > 0) return nn;
          }
        }
      }
    }
    return fallback || null;
  }

  async registerMaster(p: { login: number; password: string; server: string; comment?: string }) {
    const raw = await this.call("POST", "/api/v1/RegisterMasterForMT5", { userId: p.login, password: p.password, server: p.server, comment: p.comment ?? "botvio" });
    return { tradecopyUserId: TradeCopyMt5Adapter.extractId(raw, p.login), raw: redact(raw) };
  }
  async registerFollower(p: { login: number; password: string; server: string; masterId: number; comment?: string; copyOrderType: CopyOrderType }) {
    const raw = await this.call("POST", "/api/v1/RegisterSlaveForMT5", { userId: p.login, password: p.password, server: p.server, masterId: p.masterId, comment: p.comment ?? "botvio", copyOrderType: p.copyOrderType });
    return { tradecopyUserId: TradeCopyMt5Adapter.extractId(raw, p.login), raw: redact(raw) };
  }
  activateMaster(id: number) { return this.call("POST", "/api/v1/active_master/MT5", { id, status: true }); }
  deactivateMaster(id: number) { return this.call("POST", "/api/v1/active_master/MT5", { id, status: false }); }
  activateFollower(id: number) { return this.call("POST", "/api/v1/active_slave/MT5", { id, status: true }); }
  deactivateFollower(id: number) { return this.call("POST", "/api/v1/active_slave/MT5", { id, status: false }); }
  createMarketOrder(userId: number, role: AccountRole, o: MarketOrderInput) {
    return this.call("POST", "/api/v1/send_order_mt5", { userId, orderType: o.side, lots: o.lots, symbol: o.symbol, stopLoss: o.stopLoss ?? 0, takeProfit: o.takeProfit ?? 0, accountStatus: ACCOUNT_STATUS[role] });
  }
  createPendingOrder(userId: number, role: AccountRole, o: { symbol: string; side: string; lots: number; price: number }) {
    return this.call("POST", "/api/v1/send_pending_order_mt5", { userId, orderType: o.side, lots: o.lots, price: o.price, symbol: o.symbol, accountStatus: ACCOUNT_STATUS[role] });
  }
  async getOpenOrders(userId: number, role: AccountRole) {
    return normalizeOrders(await this.call("POST", "/api/v1/get_orders_mt5", { userId, accountStatus: ACCOUNT_STATUS[role] }));
  }
  modifyOrder(userId: number, role: AccountRole, ticket: number, sl: number, tp: number) {
    return this.call("POST", "/api/v1/modify_order_mt5", { ticket, userId, stopLoss: sl, takeProfit: tp, accountStatus: ACCOUNT_STATUS[role] });
  }
  closeOrder(userId: number, role: AccountRole, ticket: number) { return this.call("POST", "/api/v1/closeOrderForMT5", { userId, ticket, accountStatus: ACCOUNT_STATUS[role] }); }
  partialClose(userId: number, role: AccountRole, ticket: number, lots: number) { return this.call("POST", "/api/v1/mt5/partialCloseOrder", { userId, ticket, lots, accountStatus: ACCOUNT_STATUS[role] }); }
  closeAll(userId: number, role: AccountRole) { return this.call("POST", "/api/v1/CloseAllOrdersForMT5", { userid: userId, accountStatus: ACCOUNT_STATUS[role] }); }
  closeAllBySymbol(userId: number, role: AccountRole, symbol: string) { return this.call("POST", "/api/v1/CloseAllOrderBySymbolForMT5", { userid: userId, symbol, accountStatus: ACCOUNT_STATUS[role] }); }
  closeAllBySide(userId: number, role: AccountRole, side: Side) {
    return this.call("POST", side === "BUY" ? "/api/v1/CloseAllOrderByBuy/MT5" : "/api/v1/CloseAllOrderBySell/MT5", { userid: userId, accountStatus: ACCOUNT_STATUS[role] });
  }
  async getOrderHistory(userId: number, role: AccountRole, from: string, to: string) {
    return normalizeOrders(await this.call("POST", "/api/v1/get_order_history_mt5", { AccountStatus: ACCOUNT_STATUS[role], Id: userId, From: from, To: to }));
  }
  updateRisk(userId: number, r: RiskSettings) { return this.call("POST", "/api/v1/mt5/updateRisk", { userId, riskType: r.riskType, multiplier: r.multiplier }); }
  getRisk(userId: number) { return this.call("GET", "/api/v1/mt5/getRisk", { userId }); }
  updateStopsLimits(userId: number, s: CopySettings) {
    return this.call("POST", "/api/v1/mt5/updateStopsLimits", { userId, copySLTP: s.copySLTP, scalperMode: s.scalperMode, orderFilter: s.orderFilter, scalperValue: s.scalperValue });
  }
  updateOrderControl(userId: number, c: OrderControl) { return this.call("POST", "/api/v1/mt5/updateOrderControlSetting", { userId, ...c }); }
  mapSymbol(userId: number, source: string, follow: string, type: "Suffix" | "Special") {
    return this.call("POST", "/api/v1/symbol_map/mt5", { userid: userId, sourceSymbol: source, followSymbol: follow, type });
  }
  getSuffix(userId: number) { return this.call("GET", `/api/v1/getSuffix/mt5/${userId}`); }
  getSpecial(userId: number) { return this.call("GET", `/api/v1/getSpecial/mt5/${userId}`); }
  getAllSymbols(userId: number) { return this.call("GET", `/api/v1/getAllSymbol/MT5/${userId}`); }
  diagnostic(id: number) { return this.call("GET", `/api/v1/mt5/account/${id}/diagnostic`); }
  unfollow(userId: number) { return this.call("DELETE", `/api/v1/follow/${userId}`); }
  removeSource(userId: number) { return this.call("DELETE", `/api/v1/source/${userId}`); }
}

/** Deterministic in-memory adapter — never touches the network. */
export class MockTradeCopyAdapter implements ExecutionAdapter {
  readonly platform = "MT5";
  readonly mode = "mock" as const;
  calls: { op: string; args: unknown[] }[] = [];
  private orders = new Map<number, NormalizedOrder[]>();
  private nextTicket = 900000;
  private log(op: string, ...args: unknown[]) { this.calls.push({ op, args: redact(args) }); return { success: true, mock: true, op }; }

  async registerMaster(p: { login: number }) { this.log("registerMaster", p); return { tradecopyUserId: p.login, raw: { mock: true } }; }
  async registerFollower(p: { login: number; masterId: number }) { this.log("registerFollower", p); return { tradecopyUserId: p.login, raw: { mock: true } }; }
  async activateMaster(id: number) { return this.log("activateMaster", id); }
  async deactivateMaster(id: number) { return this.log("deactivateMaster", id); }
  async activateFollower(id: number) { return this.log("activateFollower", id); }
  async deactivateFollower(id: number) { return this.log("deactivateFollower", id); }
  async createMarketOrder(userId: number, _r: AccountRole, o: MarketOrderInput) {
    const t = this.nextTicket++;
    const list = this.orders.get(userId) ?? [];
    list.push({ ticket: String(t), symbol: o.symbol, side: o.side, lots: o.lots, openPrice: null, stopLoss: o.stopLoss ?? null, takeProfit: o.takeProfit ?? null, profit: 0, openTime: new Date().toISOString(), closeTime: null, raw: { mock: true } });
    this.orders.set(userId, list);
    this.log("createMarketOrder", userId, o);
    return { success: true, mock: true, ticket: t };
  }
  async createPendingOrder(userId: number, _r: AccountRole, o: unknown) { return this.log("createPendingOrder", userId, o); }
  async getOpenOrders(userId: number) { this.log("getOpenOrders", userId); return [...(this.orders.get(userId) ?? [])]; }
  async modifyOrder(userId: number, _r: AccountRole, ticket: number, sl: number, tp: number) { return this.log("modifyOrder", userId, ticket, sl, tp); }
  async closeOrder(userId: number, _r: AccountRole, ticket: number) {
    this.orders.set(userId, (this.orders.get(userId) ?? []).filter((o) => o.ticket !== String(ticket)));
    return this.log("closeOrder", userId, ticket);
  }
  async partialClose(userId: number, _r: AccountRole, ticket: number, lots: number) { return this.log("partialClose", userId, ticket, lots); }
  async closeAll(userId: number) { this.orders.set(userId, []); return this.log("closeAll", userId); }
  async closeAllBySymbol(userId: number, _r: AccountRole, symbol: string) {
    this.orders.set(userId, (this.orders.get(userId) ?? []).filter((o) => o.symbol !== symbol));
    return this.log("closeAllBySymbol", userId, symbol);
  }
  async closeAllBySide(userId: number, _r: AccountRole, side: Side) {
    this.orders.set(userId, (this.orders.get(userId) ?? []).filter((o) => o.side !== side));
    return this.log("closeAllBySide", userId, side);
  }
  async getOrderHistory(userId: number) { this.log("getOrderHistory", userId); return []; }
  async updateRisk(userId: number, r: RiskSettings) { return this.log("updateRisk", userId, r); }
  async getRisk(userId: number) { return this.log("getRisk", userId); }
  async updateStopsLimits(userId: number, s: CopySettings) { return this.log("updateStopsLimits", userId, s); }
  async updateOrderControl(userId: number, c: OrderControl) { return this.log("updateOrderControl", userId, c); }
  async mapSymbol(userId: number, s: string, f: string, t: string) { return this.log("mapSymbol", userId, s, f, t); }
  async getSuffix(userId: number) { this.log("getSuffix", userId); return { mock: true, suffix: "" }; }
  async getSpecial(userId: number) { this.log("getSpecial", userId); return { mock: true, special: [] }; }
  async getAllSymbols(userId: number) { this.log("getAllSymbols", userId); return { mock: true, symbols: ["EURUSD", "GBPUSD", "XAUUSD", "US30", "NAS100"] }; }
  async diagnostic(id: number) { this.log("diagnostic", id); return { mock: true, id, connected: true, note: "Mock mode — no TradeCopy call was made." }; }
  async unfollow(userId: number) { return this.log("unfollow", userId); }
  async removeSource(userId: number) { return this.log("removeSource", userId); }
}

export const TRADECOPY_DEFAULT_BASE_URL = "http://us-1-server.tradecopy.online:3310";

/**
 * Mock unless BOTH the API key is set AND TRADECOPY_MODE=live. This keeps
 * development/testing from ever hitting the real API by accident.
 */
export function createAdapter(env: { apiKey?: string | null; mode?: string | null; baseUrl?: string | null }): ExecutionAdapter {
  if (env.apiKey && (env.mode ?? "").toLowerCase() === "live") {
    return new TradeCopyMt5Adapter(env.apiKey, env.baseUrl || TRADECOPY_DEFAULT_BASE_URL);
  }
  return new MockTradeCopyAdapter();
}
