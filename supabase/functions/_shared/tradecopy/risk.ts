/** Pure calculations; never assume broker specifications or imply cloud admission. */
import type { NormalizedOrder, Side } from "./core.ts";

export const DEMO_RISK_DEFAULTS = Object.freeze({ riskPerTradePct: 0.25, maxOpenRiskPct: 2, dailyLossPct: 2, maxPositions: 5 });
export interface ContractSpec {
  symbol: string;
  family: string;
  tickSize: number;
  tickValuePerLot: number; // Converted to the account currency by the authoritative source.
  digits: number;
  minStopDistance: number;
  lotStep: number;
  minLot: number;
  maxLot: number;
  costsPerLot: number;
  marginPerLot: number;
}
export interface EntryRisk {
  side: Side; entry: number; stopLoss: number; takeProfit: number;
  equity: number; freeMargin: number; signalAt: number; expiresAt: number;
  now: number; maxSignalAgeMs: number; providerConnected: boolean;
  emergencyStopped: boolean; paused: boolean;
  riskPerTradePct: number; maxOpenRiskPct: number; dailyLossPct: number;
  openRisk: number; dailyLoss: number; positions: number; maxPositions: number;
  familyOpenRisk: number; maxFamilyRiskPct: number;
  correlatedOpenRisk: number; maxCorrelatedRiskPct: number;
  spread: number; maxSpread: number; slippage: number; maxSlippage: number;
  consecutiveLosses: number; maxConsecutiveLosses: number; cooldownUntil: number;
}
export type Admission = { allowed: true; lots: number; risk: number } | { allowed: false; reason: string };
const positive = (n: number) => Number.isFinite(n) && n > 0;
const nonnegative = (n: number) => Number.isFinite(n) && n >= 0;
const onGrid = (n: number, step: number) => Math.abs(n / step - Math.round(n / step)) < 1e-6;

export function validateContract(spec: ContractSpec): boolean {
  return !!spec.symbol && !!spec.family && [spec.tickSize, spec.tickValuePerLot, spec.lotStep, spec.minLot, spec.maxLot, spec.marginPerLot].every(positive)
    && [spec.minStopDistance, spec.costsPerLot].every(nonnegative)
    && Number.isInteger(spec.digits) && spec.digits >= 0 && spec.digits <= 10
    && spec.maxLot >= spec.minLot && onGrid(spec.minLot, spec.lotStep)
    && onGrid(spec.tickSize, 10 ** -spec.digits);
}

export function validateProtection(side: Side, entry: number, sl: number, tp: number, spec: ContractSpec): string | null {
  if (!validateContract(spec)) return "Authoritative contract specifications unavailable";
  if (side !== "BUY" && side !== "SELL") return "Invalid direction";
  if (![entry, sl, tp].every(positive)) return "Positive entry, stop loss and take profit required";
  if (![entry, sl, tp].every((p) => onGrid(p, spec.tickSize) && onGrid(p, 10 ** -spec.digits))) return "Price violates tick size or precision";
  if (side === "BUY" ? sl >= entry || tp <= entry : sl <= entry || tp >= entry) return "Invalid stop or target direction";
  if (Math.abs(entry - sl) + 1e-10 < spec.minStopDistance || Math.abs(entry - tp) + 1e-10 < spec.minStopDistance) return "Broker minimum stop distance not met";
  return null;
}

/** Caller must supply a locked, current broker/account snapshot; this alone is NOT an atomic reservation. */
export function assessEntry(input: EntryRisk, spec: ContractSpec): Admission {
  const deny = (reason: string): Admission => ({ allowed: false, reason });
  if (input.emergencyStopped || input.paused) return deny("New entries stopped");
  if (!input.providerConnected) return deny("Provider disconnected");
  if (![input.now, input.signalAt, input.expiresAt].every(Number.isFinite)
      || input.signalAt > input.now || input.expiresAt <= input.now
      || input.now - input.signalAt > input.maxSignalAgeMs || !positive(input.maxSignalAgeMs)) return deny("Stale or invalid signal");
  const invalidStops = validateProtection(input.side, input.entry, input.stopLoss, input.takeProfit, spec);
  if (invalidStops) return deny(invalidStops);
  if (![input.equity, input.freeMargin, input.riskPerTradePct, input.maxOpenRiskPct, input.dailyLossPct, input.maxFamilyRiskPct, input.maxCorrelatedRiskPct].every(positive)
      || ![input.openRisk, input.dailyLoss, input.familyOpenRisk, input.correlatedOpenRisk, input.spread, input.maxSpread, input.slippage, input.maxSlippage, input.cooldownUntil].every(nonnegative)
      || ![input.positions, input.maxPositions, input.consecutiveLosses, input.maxConsecutiveLosses].every((n) => Number.isInteger(n) && n >= 0)
      || input.maxPositions === 0 || input.maxConsecutiveLosses === 0 || input.riskPerTradePct > 100) return deny("Reliable account risk data required");
  if (input.dailyLoss >= input.equity * input.dailyLossPct / 100) return deny("Daily loss circuit breaker");
  if (input.positions >= input.maxPositions) return deny("Concurrent position limit");
  if (input.consecutiveLosses >= input.maxConsecutiveLosses || input.now < input.cooldownUntil) return deny("Loss streak or cooldown");
  if (input.spread > input.maxSpread || input.slippage > input.maxSlippage) return deny("Spread or slippage limit");
  const perLotRisk = Math.abs(input.entry - input.stopLoss) / spec.tickSize * spec.tickValuePerLot + spec.costsPerLot;
  const budget = Math.min(input.equity * input.riskPerTradePct / 100,
    input.equity * input.maxOpenRiskPct / 100 - input.openRisk,
    input.equity * input.maxFamilyRiskPct / 100 - input.familyOpenRisk,
    input.equity * input.maxCorrelatedRiskPct / 100 - input.correlatedOpenRisk);
  if (!positive(budget) || !positive(perLotRisk)) return deny("Exposure limit or uncalculable risk");
  const unrounded = Math.min(budget / perLotRisk, spec.maxLot, input.freeMargin / spec.marginPerLot);
  const lots = Number((Math.floor(unrounded / spec.lotStep) * spec.lotStep).toFixed(10));
  if (lots < spec.minLot || lots <= 0) return deny("Risk budget below broker minimum lot");
  const risk = lots * perLotRisk;
  if (risk > budget + 1e-8 || lots * spec.marginPerLot > input.freeMargin + 1e-8) return deny("Risk or margin exceeded");
  return { allowed: true, lots, risk };
}

export function observeProtection(order: Pick<NormalizedOrder, "side" | "openPrice" | "stopLoss" | "takeProfit">, mock = false) {
  if (mock || order.side === "UNKNOWN" || !positive(order.openPrice ?? 0)) return "unverified" as const;
  if (!positive(order.stopLoss ?? 0) || !positive(order.takeProfit ?? 0)) return "missing" as const;
  // Profitable break-even/trailing stops may cross entry: broker observation alone cannot validate their geometry.
  return "reported" as const;
}

export function verifyProtection(order: NormalizedOrder, requested: { symbol: string; side: Side; lots: number; stopLoss: number; takeProfit: number }, spec: ContractSpec): boolean {
  return validateContract(spec) && order.symbol === requested.symbol && order.side === requested.side
    && positive(order.openPrice ?? 0) && positive(order.lots ?? 0) && (order.lots ?? 0) <= requested.lots
    && positive(order.stopLoss ?? 0) && positive(order.takeProfit ?? 0)
    && Math.abs((order.stopLoss ?? 0) - requested.stopLoss) < spec.tickSize / 2
    && Math.abs((order.takeProfit ?? 0) - requested.takeProfit) < spec.tickSize / 2;
}

export interface StrategyState {
  profile: "trend-pullback" | "breakout-retest" | "synthetic-index";
  side: Side; entry: number; current: number; stopLoss: number; takeProfit: number;
  initialRiskDistance: number; costAllowance: number; atr: number;
  breakEvenAtR: number; trailAtR: number; trailAtrMultiple: number;
  confirmedInvalidation: boolean; confirmedOpposite: boolean;
  partialSupported: boolean; partialAlreadyTaken: boolean; partialAtR: number;
}
export type StrategyDecision = { action: "hold" | "close" | "partial" | "modify"; reason: string; stopLoss?: number };
/** Produces intentions only. A confirmed close never produces an automatic reverse entry. */
export function strategyDecision(s: StrategyState): StrategyDecision {
  if (![s.entry, s.current, s.stopLoss, s.takeProfit, s.initialRiskDistance, s.atr, s.breakEvenAtR, s.trailAtR, s.trailAtrMultiple, s.partialAtR].every(positive)
      || !nonnegative(s.costAllowance) || (s.side !== "BUY" && s.side !== "SELL")) return { action: "hold", reason: "Strategy data unavailable" };
  const sign = s.side === "BUY" ? 1 : -1;
  if (sign * (s.current - s.stopLoss) <= 0) return { action: "close", reason: "Stop loss reached" };
  if (sign * (s.current - s.takeProfit) >= 0) return { action: "close", reason: "Take profit reached" };
  if (s.confirmedInvalidation || s.confirmedOpposite) return { action: "close", reason: s.confirmedInvalidation ? "Confirmed trend invalidation" : "Confirmed opposite setup; fresh entry required" };
  const move = sign * (s.current - s.entry);
  let nextStop = s.stopLoss;
  if (move >= s.breakEvenAtR * s.initialRiskDistance + s.costAllowance) {
    const candidate = s.entry + sign * s.costAllowance;
    if (sign * (candidate - nextStop) > 0) nextStop = candidate;
  }
  if (move >= s.trailAtR * s.initialRiskDistance) {
    const candidate = s.current - sign * s.atr * s.trailAtrMultiple;
    if (sign * (candidate - nextStop) > 0) nextStop = candidate;
  }
  if (sign * (nextStop - s.stopLoss) > 0 && sign * (s.current - nextStop) > 0) return { action: "modify", stopLoss: nextStop, reason: "Favorable move: tighten protection; broker validation required" };
  if (s.partialSupported && !s.partialAlreadyTaken && move >= s.partialAtR * s.initialRiskDistance) return { action: "partial", reason: "Confirmed partial profit threshold; volume validation required" };
  return { action: "hold", reason: "Exit conditions not confirmed" };
}

export function utcRiskDay(timestamp: number): string { return new Date(timestamp).toISOString().slice(0, 10); }