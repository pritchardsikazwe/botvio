import { describe, expect, it, vi } from "vitest";
import {
  assertLiveAllowed, dedupeByKey, executionIdempotencyKey, normalizeCopySettings, normalizeMarketOrder,
  normalizeOrderControl, normalizeOrders, normalizeRisk, passesOrderFilter, redact, resolveFollowerSymbol,
  TradeCopyError, validateRelationship,
} from "./core.ts";
import { createAdapter, MockTradeCopyAdapter, TradeCopyMt5Adapter } from "./adapter.ts";

describe("risk mapping", () => {
  it("accepts documented risk types 0-3", () => {
    for (const t of [0, 1, 2, 3]) expect(normalizeRisk({ riskType: t, multiplier: 1 }).riskType).toBe(t);
  });
  it("rejects unknown types and bad multipliers", () => {
    expect(() => normalizeRisk({ riskType: 4, multiplier: 1 })).toThrow(TradeCopyError);
    expect(() => normalizeRisk({ riskType: 1, multiplier: 0 })).toThrow();
    expect(() => normalizeRisk({ riskType: 2, multiplier: 60 })).toThrow();
  });
  it("rounds fixed lot to 2dp", () => {
    expect(normalizeRisk({ riskType: 2, multiplier: 0.123 }).multiplier).toBe(0.12);
  });
});

describe("copy settings", () => {
  it("defaults and zeroes scalper value unless rollover", () => {
    expect(normalizeCopySettings({})).toEqual({ copySLTP: true, scalperMode: 0, orderFilter: 0, scalperValue: 0 });
    expect(normalizeCopySettings({ scalperMode: 1, scalperValue: 5 }).scalperValue).toBe(0);
    expect(normalizeCopySettings({ scalperMode: 2, scalperValue: 5 }).scalperValue).toBe(5);
  });
  it("validates filters", () => {
    expect(() => normalizeCopySettings({ orderFilter: 9 })).toThrow();
    expect(passesOrderFilter(1, "SELL")).toBe(false);
    expect(passesOrderFilter(2, "SELL")).toBe(true);
    expect(passesOrderFilter(3, "BUY")).toBe(true);
  });
  it("order control only keeps valid integer keys", () => {
    expect(normalizeOrderControl({ lossForAllOrder: "50", junk: 1, profitOverPoint: "" })).toEqual({ lossForAllOrder: 50 });
    expect(() => normalizeOrderControl({ lossForAllOrder: -1 })).toThrow();
  });
});

describe("symbol mapping", () => {
  const maps = [{ sourceSymbol: "XAUUSD", followSymbol: "GOLD", type: "Special" as const }];
  it("prefers special mapping, then suffix", () => {
    expect(resolveFollowerSymbol("xauusd", maps, ".m")).toBe("GOLD");
    expect(resolveFollowerSymbol("EURUSD", maps, ".m")).toBe("EURUSD.m");
    expect(resolveFollowerSymbol("EURUSD.m", maps, ".m")).toBe("EURUSD.m");
    expect(resolveFollowerSymbol("EURUSD", [], null)).toBe("EURUSD");
  });
});

describe("idempotency", () => {
  it("is deterministic and dedupes repeated polls", () => {
    const k = executionIdempotencyKey({ relationshipId: "r1", masterAccountId: "m1", sourceTicket: "123" });
    expect(k).toBe(executionIdempotencyKey({ relationshipId: "r1", masterAccountId: "m1", sourceTicket: "123" }));
    expect(k).not.toBe(executionIdempotencyKey({ relationshipId: "r2", masterAccountId: "m1", sourceTicket: "123" }));
    const rows = [{ k }, { k }, { k: "other" }];
    expect(dedupeByKey(rows, (r) => r.k)).toHaveLength(2);
    expect(() => executionIdempotencyKey({ relationshipId: null, masterAccountId: "", sourceTicket: "1" })).toThrow();
  });
});

describe("provider/follower relationship", () => {
  const base = { masterRole: "master" as const, followerRole: "slave" as const, masterUserId: "a", followerUserId: "b", masterTradecopyId: 1, masterEnvironment: "DEMO" as const, followerEnvironment: "DEMO" as const };
  it("accepts a valid link", () => expect(() => validateRelationship(base)).not.toThrow());
  it("rejects wrong roles, unconnected master and mixed environments", () => {
    expect(() => validateRelationship({ ...base, masterRole: "slave" })).toThrow();
    expect(() => validateRelationship({ ...base, followerRole: "master" })).toThrow();
    expect(() => validateRelationship({ ...base, masterTradecopyId: null })).toThrow();
    expect(() => validateRelationship({ ...base, followerEnvironment: "LIVE" })).toThrow();
  });
});

describe("order normalization", () => {
  it("parses string, wrapped and array payloads", () => {
    const arr = [{ Ticket: 5, Symbol: "EURUSD", Type: "BUY", Lots: 0.1, StopLoss: 1.0, TakeProfit: 1.2 }];
    expect(normalizeOrders(arr)[0]).toMatchObject({ ticket: "5", side: "BUY", lots: 0.1 });
    expect(normalizeOrders({ data: JSON.stringify(arr) })).toHaveLength(1);
    expect(normalizeOrders("not json")).toEqual([]);
    expect(normalizeOrders({ data: [{ symbol: "X" }] })).toEqual([]); // no ticket → dropped
  });
  it("validates market orders", () => {
    expect(normalizeMarketOrder({ side: "buy", lots: 0.105, symbol: "EURUSD" })).toMatchObject({ side: "BUY", lots: 0.11 });
    expect(() => normalizeMarketOrder({ side: "HOLD", lots: 1, symbol: "EURUSD" })).toThrow();
    expect(() => normalizeMarketOrder({ side: "BUY", lots: 0, symbol: "EURUSD" })).toThrow();
    expect(() => normalizeMarketOrder({ side: "BUY", lots: 1, symbol: "bad symbol;" })).toThrow();
  });
});

describe("live mode guard", () => {
  const live = { environment: "LIVE" as const, liveConfirmedAt: "x", globalLiveEnabled: true, adapterMode: "live" as const };
  it("always allows demo", () => expect(() => assertLiveAllowed({ ...live, environment: "DEMO", globalLiveEnabled: false, adapterMode: "mock", liveConfirmedAt: null })).not.toThrow());
  it("blocks live without every condition", () => {
    expect(() => assertLiveAllowed(live)).not.toThrow();
    expect(() => assertLiveAllowed({ ...live, globalLiveEnabled: false })).toThrow();
    expect(() => assertLiveAllowed({ ...live, adapterMode: "mock" })).toThrow();
    expect(() => assertLiveAllowed({ ...live, liveConfirmedAt: null })).toThrow();
    expect(() => assertLiveAllowed({ ...live, emergencyStopped: true })).toThrow();
  });
});

describe("API error handling & adapter selection", () => {
  it("uses mock unless key AND live mode are set", () => {
    expect(createAdapter({ apiKey: "k", mode: null })).toBeInstanceOf(MockTradeCopyAdapter);
    expect(createAdapter({ apiKey: null, mode: "live" })).toBeInstanceOf(MockTradeCopyAdapter);
    expect(createAdapter({ apiKey: "k", mode: "live" })).toBeInstanceOf(TradeCopyMt5Adapter);
  });
  it("sends X-API-KEY and maps HTTP errors", async () => {
    const f = vi.fn(async () => new Response("nope", { status: 401 }));
    const a = new TradeCopyMt5Adapter("secret", "http://x", f as unknown as typeof fetch);
    await expect(a.diagnostic(1)).rejects.toMatchObject({ code: "auth" });
    const [, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>)["X-API-KEY"]).toBe("secret");
    const f2 = vi.fn(async () => new Response(JSON.stringify({ success: false, message: "bad" }), { status: 200 }));
    await expect(new TradeCopyMt5Adapter("s", "http://x", f2 as unknown as typeof fetch).getRisk(1)).rejects.toMatchObject({ code: "upstream" });
    const f3 = vi.fn(async () => { throw new Error("down"); });
    await expect(new TradeCopyMt5Adapter("s", "http://x", f3 as unknown as typeof fetch).getRisk(1)).rejects.toMatchObject({ code: "network" });
  });
  it("builds documented query params", async () => {
    const f = vi.fn(async () => new Response(JSON.stringify({ success: true })));
    const a = new TradeCopyMt5Adapter("s", "http://x", f as unknown as typeof fetch);
    await a.createMarketOrder(7, "slave", { symbol: "EURUSD", side: "BUY", lots: 0.1 });
    const url = new URL((f.mock.calls[0] as unknown as [string])[0]);
    expect(url.pathname).toBe("/api/v1/send_order_mt5");
    expect(url.searchParams.get("accountStatus")).toBe("1");
    expect(url.searchParams.get("orderType")).toBe("BUY");
  });
  it("redacts secrets", () => {
    expect(redact({ password: "p", nested: { apiKey: "k", ok: 1 } })).toEqual({ password: "[redacted]", nested: { apiKey: "[redacted]", ok: 1 } });
  });
  it("mock adapter never needs network", async () => {
    const m = new MockTradeCopyAdapter();
    await m.createMarketOrder(1, "master", { symbol: "EURUSD", side: "BUY", lots: 0.1 });
    expect(await m.getOpenOrders(1)).toHaveLength(1);
    await m.closeAll(1);
    expect(await m.getOpenOrders(1)).toHaveLength(0);
  });
});
