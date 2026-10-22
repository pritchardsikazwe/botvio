import { describe, it, expect, vi } from "vitest";
import { assessEntry, DEMO_RISK_DEFAULTS, observeProtection, strategyDecision, utcRiskDay, validateProtection, verifyProtection, type ContractSpec, type EntryRisk, type StrategyState } from "./risk.ts";
import { normalizeMarketOrder, type NormalizedOrder } from "./core.ts";
import { MockTradeCopyAdapter } from "./adapter.ts";
import { emergencyClose } from "./emergency.ts";
import { assertRiskSubmissionReady } from "./capabilities.ts";

const spec: ContractSpec = { symbol: "TEST", family: "forex", tickSize: 0.01, tickValuePerLot: 1, digits: 2, minStopDistance: 0.1, lotStep: 0.01, minLot: 0.01, maxLot: 10, costsPerLot: 2, marginPerLot: 100 };
const input: EntryRisk = { side: "BUY", entry: 100, stopLoss: 99, takeProfit: 102, equity: 10000, freeMargin: 5000, signalAt: 1000, expiresAt: 5000, now: 2000, maxSignalAgeMs: 2000, providerConnected: true, emergencyStopped: false, paused: false, ...DEMO_RISK_DEFAULTS, openRisk: 0, dailyLoss: 0, positions: 0, familyOpenRisk: 0, maxFamilyRiskPct: 1, correlatedOpenRisk: 0, maxCorrelatedRiskPct: 1, spread: 0.01, maxSpread: 0.05, slippage: 0, maxSlippage: 0.05, consecutiveLosses: 0, maxConsecutiveLosses: 3, cooldownUntil: 0 };
const order: NormalizedOrder = { ticket: "1", symbol: "TEST", side: "BUY", lots: 0.1, openPrice: 100, stopLoss: 99, takeProfit: 102, profit: 0, openTime: null, closeTime: null, raw: {} };

describe("demo defaults and risk sizing", () => {
  it("initial risk is 0.25%", () => expect(DEMO_RISK_DEFAULTS.riskPerTradePct).toBe(0.25));
  it("aggregate risk defaults to 2%", () => expect(DEMO_RISK_DEFAULTS.maxOpenRiskPct).toBe(2));
  it("daily loss defaults to 2%", () => expect(DEMO_RISK_DEFAULTS.dailyLossPct).toBe(2));
  it("concurrent positions default to five", () => expect(DEMO_RISK_DEFAULTS.maxPositions).toBe(5));
  it("sizes down including costs", () => expect(assessEntry(input, spec)).toEqual({ allowed: true, lots: 0.24, risk: 24.48 }));
  it("supports configured 0.5% risk", () => expect(assessEntry({ ...input, riskPerTradePct: 0.5 }, spec)).toEqual({ allowed: true, lots: 0.49, risk: 49.98 }));
  it("rejects minimum lots exceeding budget", () => expect(assessEntry(input, { ...spec, minLot: 4 })).toMatchObject({ allowed: false }));
  it("preserves synthetic 0.001 step without guessed contract values", () => expect(assessEntry(input, { ...spec, family: "synthetic-volatility", lotStep: 0.001, minLot: 0.001 })).toMatchObject({ allowed: true, lots: 0.245 }));
  it.each(["forex", "gold", "crypto", "synthetic-boom", "synthetic-crash", "synthetic-volatility"])("requires authoritative tick value for %s", (family) => expect(assessEntry(input, { ...spec, family, tickValuePerLot: NaN })).toMatchObject({ allowed: false }));
  it("rejects full aggregate exposure", () => expect(assessEntry({ ...input, openRisk: 200 }, spec)).toMatchObject({ allowed: false }));
  it("limits family risk", () => expect(assessEntry({ ...input, familyOpenRisk: 100 }, spec)).toMatchObject({ allowed: false }));
  it("limits correlated exposure", () => expect(assessEntry({ ...input, correlatedOpenRisk: 100 }, spec)).toMatchObject({ allowed: false }));
  it("limits margin", () => expect(assessEntry({ ...input, freeMargin: 0.5 }, spec)).toMatchObject({ allowed: false }));
  it("stops at 2% daily loss", () => expect(assessEntry({ ...input, dailyLoss: 200 }, spec)).toMatchObject({ allowed: false, reason: "Daily loss circuit breaker" }));
  it("blocks sixth concurrent position", () => expect(assessEntry({ ...input, positions: 5 }, spec)).toMatchObject({ allowed: false }));
  it.each([{ paused: true }, { emergencyStopped: true }, { providerConnected: false }, { expiresAt: 1999 }, { signalAt: -1000 }, { cooldownUntil: 3000 }, { consecutiveLosses: 3 }, { spread: 0.06 }, { slippage: 0.06 }])("rejects admission violation %j", (patch) => expect(assessEntry({ ...input, ...patch }, spec)).toMatchObject({ allowed: false }));
  it("uses UTC across local midnight", () => expect(utcRiskDay(Date.parse("2026-10-20T00:30:00+02:00"))).toBe("2026-10-19"));
});

describe("protection", () => {
  it.each([undefined, 0, NaN, "bad"])("rejects missing or invalid stop %s", (stopLoss) => expect(() => normalizeMarketOrder({ symbol: "TEST", side: "BUY", lots: 0.001, stopLoss, takeProfit: 102 })).toThrow());
  it("does not round lots upward", () => expect(normalizeMarketOrder({ symbol: "TEST", side: "BUY", lots: 0.001, stopLoss: 99, takeProfit: 102 }).lots).toBe(0.001));
  it("rejects BUY geometry", () => expect(validateProtection("BUY", 100, 101, 102, spec)).toBe("Invalid stop or target direction"));
  it("rejects SELL geometry", () => expect(validateProtection("SELL", 100, 99, 98, spec)).toBe("Invalid stop or target direction"));
  it("rejects broker stop distance", () => expect(validateProtection("BUY", 100, 99.95, 102, spec)).toBe("Broker minimum stop distance not met"));
  it("rejects tick precision", () => expect(validateProtection("BUY", 100, 99.999, 102, spec)).toBe("Price violates tick size or precision"));
  const requested = { symbol: "TEST", side: "BUY" as const, lots: 0.2, stopLoss: 99, takeProfit: 102 };
  it("confirms matching partial fill protection", () => expect(verifyProtection(order, requested, spec)).toBe(true));
  it("does not confirm rejected SL", () => expect(verifyProtection({ ...order, stopLoss: 0 }, requested, spec)).toBe(false));
  it("does not confirm widened SL", () => expect(verifyProtection({ ...order, stopLoss: 98 }, requested, spec)).toBe(false));
  it("does not confirm oversized fill", () => expect(verifyProtection({ ...order, lots: 0.3 }, requested, spec)).toBe(false));
  it("mock cannot establish broker protection", () => expect(observeProtection(order, true)).toBe("unverified"));
});

const strategy: StrategyState = { profile: "trend-pullback", side: "BUY", entry: 100, current: 99.5, stopLoss: 99, takeProfit: 105, initialRiskDistance: 1, costAllowance: 0.1, atr: 0.5, breakEvenAtR: 1, trailAtR: 2, trailAtrMultiple: 2, confirmedInvalidation: false, confirmedOpposite: false, partialSupported: false, partialAlreadyTaken: false, partialAtR: 3 };
describe("strategy intentions", () => {
  it("does not reverse losing positions", () => expect(strategyDecision(strategy).action).toBe("hold"));
  it.each(["trend-pullback", "breakout-retest", "synthetic-index"] as const)("confirmed invalidation closes %s without reversal", (profile) => expect(strategyDecision({ ...strategy, profile, confirmedInvalidation: true })).toMatchObject({ action: "close" }));
  it("opposite requires a fresh entry", () => expect(strategyDecision({ ...strategy, confirmedOpposite: true })).toMatchObject({ action: "close" }));
  it("cost-aware break-even", () => expect(strategyDecision({ ...strategy, current: 101.2 })).toMatchObject({ action: "modify", stopLoss: 100.1 }));
  it("trailing only tightens", () => expect(strategyDecision({ ...strategy, current: 103 })).toMatchObject({ action: "modify", stopLoss: 102 }));
  it("does not widen an existing trailing stop", () => expect(strategyDecision({ ...strategy, current: 103, stopLoss: 102.5 }).action).toBe("hold"));
  it("partial only when supported", () => expect(strategyDecision({ ...strategy, current: 103, stopLoss: 102.5, partialSupported: true }).action).toBe("partial"));
  it("does not repeat partial", () => expect(strategyDecision({ ...strategy, current: 103, stopLoss: 102.5, partialSupported: true, partialAlreadyTaken: true }).action).toBe("hold"));
});

describe("mock recovery and capability barrier", () => {
  it("allows submissions after owner unlocked the capability gate", () => expect(() => assertRiskSubmissionReady("live")).not.toThrow());
  it("allows network-free mock tests", () => expect(() => assertRiskSubmissionReady("mock")).not.toThrow());
  it("mock modifications and partial fills read back", async () => {
    const adapter = new MockTradeCopyAdapter();
    const result = await adapter.createMarketOrder(1, "slave", { symbol: "TEST", side: "BUY", lots: 1, stopLoss: 99, takeProfit: 102 });
    await adapter.modifyOrder(1, "slave", result.ticket, 100, 103);
    await adapter.partialClose(1, "slave", result.ticket, 0.5);
    expect((await adapter.getOpenOrders(1))[0]).toMatchObject({ stopLoss: 100, takeProfit: 103, lots: 0.5 });
  });
  it("pause does not close positions", async () => {
    const a = new MockTradeCopyAdapter(); await a.createMarketOrder(1, "slave", { symbol: "TEST", side: "BUY", lots: 1 });
    expect(await emergencyClose(a, 1, false)).toMatchObject({ closureStatus: "not_requested", remainingTickets: ["900000"] });
    expect(a.calls.filter((c) => c.op === "closeAll")).toHaveLength(0);
  });
  it("emergency checks actual remaining positions", async () => {
    const a = new MockTradeCopyAdapter(); await a.createMarketOrder(1, "slave", { symbol: "TEST", side: "BUY", lots: 1 });
    expect(await emergencyClose(a, 1, true)).toMatchObject({ closureStatus: "confirmed", remainingTickets: [], simulated: true });
  });
  it("failed close does not imply closed and is not retried", async () => {
    const a = new MockTradeCopyAdapter(); await a.createMarketOrder(1, "slave", { symbol: "TEST", side: "BUY", lots: 1 });
    const close = vi.spyOn(a, "closeAll").mockRejectedValue(new Error("timeout"));
    expect(await emergencyClose(a, 1, true)).toMatchObject({ closureStatus: "remaining", remainingTickets: ["900000"] }); expect(close).toHaveBeenCalledTimes(1);
  });
  it("attempts closure even when deactivation fails", async () => {
    const a = new MockTradeCopyAdapter(); vi.spyOn(a, "deactivateFollower").mockRejectedValue(new Error("down"));
    expect(await emergencyClose(a, 1, true)).toMatchObject({ deactivated: false, closureStatus: "confirmed" });
  });
  it("failed readback remains unknown", async () => {
    const a = new MockTradeCopyAdapter(); vi.spyOn(a, "getOpenOrders").mockRejectedValue(new Error("down"));
    expect(await emergencyClose(a, 1, true)).toMatchObject({ closureStatus: "unknown", remainingTickets: null });
  });
});