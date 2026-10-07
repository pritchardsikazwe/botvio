import { computeIndicators, type IndicatorSet } from "./indicators";
import type { NormalizedCandle, Timeframe } from "./types";

export type DerivFamily = "BOOM" | "CRASH" | "VOLATILITY" | "RANGE_BREAK";
export type DerivMode = "SCALPING" | "DAY" | "SWING";
export type DerivDirection = "BUY" | "SELL";
export type DerivResult = "WIN" | "LOSS" | "OPEN";

export interface DerivEngineSignal {
  id: string;
  symbol: string;
  family: DerivFamily;
  mode: DerivMode;
  timeframe: Timeframe;
  direction: DerivDirection;
  strategy: string;
  confidence: number;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  time: number;
  index: number;
  result: DerivResult;
  rMultiple: number | null;
  reason: string;
}

export interface DerivEngineOptions {
  symbol: string;
  timeframe: Timeframe;
  mode: DerivMode;
  minConfidence?: number;
  atrStop?: number;
  atrTarget?: number;
  maxSignals?: number;
}

const MODE_DEFAULTS: Record<DerivMode, { minConfidence: number; stop: number; target: number }> = {
  SCALPING: { minConfidence: 68, stop: 1.15, target: 1.65 },
  DAY: { minConfidence: 72, stop: 1.45, target: 2.25 },
  SWING: { minConfidence: 76, stop: 1.9, target: 3.0 },
};

function classify(symbol: string): DerivFamily | null {
  const s = symbol.toUpperCase();
  if (s.includes("BOOM")) return "BOOM";
  if (s.includes("CRASH")) return "CRASH";
  if (s.includes("VOLATILITY") || /^VOL\s*\d+/i.test(s) || s.includes("VIX")) return "VOLATILITY";
  if (s.includes("RANGE BREAK") || s.includes("RANGEBREAK")) return "RANGE_BREAK";
  return null;
}

type DerivSymbolProfile = {
  id: string;
  label: string;
  minConfidence: number;
  stop: number;
  target: number;
  maxSpikeAtr: number;
  requireMomentum: boolean;
};

function symbolProfile(symbol: string, family: DerivFamily, mode: DerivMode): DerivSymbolProfile {
  const s = symbol.toUpperCase().replace(/_/g, " ");
  const n = Number(s.match(/(?:BOOM|CRASH|VOLATILITY)\s*(?:INDEX\s*)?(\d+)/)?.[1] ?? 0);
  const oneSecond = /1S/.test(s);
  if (family === "BOOM") {
    if (n >= 900) return { id:"BOOM_SPIKE_HUNTER_900", label:"Boom 900 Spike Hunter", minConfidence:78, stop:1.15, target:2.35, maxSpikeAtr:2.1, requireMomentum:true };
    if (n >= 500) return { id:"BOOM_SPIKE_HUNTER_500", label:"Boom 500/600 Spike Hunter", minConfidence:76, stop:1.2, target:2.25, maxSpikeAtr:2.15, requireMomentum:true };
    return { id:"BOOM_SPIKE_HUNTER_300", label:"Boom 300 Spike Hunter", minConfidence:74, stop:1.15, target:2.1, maxSpikeAtr:2.2, requireMomentum:true };
  }
  if (family === "CRASH") {
    if (n >= 900) return { id:"CRASH_SPIKE_HUNTER_900", label:"Crash 900 Spike Hunter", minConfidence:78, stop:1.15, target:2.35, maxSpikeAtr:2.1, requireMomentum:true };
    if (n >= 500) return { id:"CRASH_SPIKE_HUNTER_500", label:"Crash 500/600 Spike Hunter", minConfidence:76, stop:1.2, target:2.25, maxSpikeAtr:2.15, requireMomentum:true };
    return { id:"CRASH_SPIKE_HUNTER_300", label:"Crash 300 Spike Hunter", minConfidence:74, stop:1.15, target:2.1, maxSpikeAtr:2.2, requireMomentum:true };
  }
  if (family === "RANGE_BREAK") {
    const rb = n >= 200 ? "200" : "100";
    return { id:`RANGE_BREAK_${rb}`, label:`Range Break ${rb} Expansion`, minConfidence:76, stop:1.25, target:2.5, maxSpikeAtr:2.0, requireMomentum:true };
  }
  const volTarget = n >= 100 ? 2.75 : n >= 50 ? 2.55 : 2.35;
  const volStop = n >= 100 ? 1.5 : n >= 50 ? 1.4 : 1.3;
  const min = oneSecond ? 80 : (n >= 75 ? 77 : 74);
  return { id:`VOLATILITY_${n || "ADAPTIVE"}${oneSecond ? "_1S" : ""}`, label:`Volatility ${n || ""}${oneSecond ? " (1s)" : ""} Momentum`.trim(), minConfidence:min, stop:volStop, target:volTarget, maxSpikeAtr:oneSecond ? 1.9 : 2.2, requireMomentum:true };
}

function bollinger(candles: NormalizedCandle[], period = 20, multiplier = 2) {
  if (candles.length < period) return null;
  const values = candles.slice(-period).map((x) => x.close);
  const mean = values.reduce((a, b) => a + b, 0) / period;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / period;
  const sd = Math.sqrt(variance);
  return { mean, upper: mean + multiplier * sd, lower: mean - multiplier * sd, sd };
}

function timeframeAllowed(mode: DerivMode, timeframe: Timeframe): boolean {
  if (mode === "SCALPING") return ["1m", "3m", "5m"].includes(timeframe);
  if (mode === "DAY") return ["5m", "15m", "30m"].includes(timeframe);
  return ["30m", "1H", "4H"].includes(timeframe);
}

function resolveOutcome(
  candles: NormalizedCandle[],
  start: number,
  direction: DerivDirection,
  stopLoss: number,
  takeProfit: number
): { result: DerivResult; rMultiple: number | null } {
  const risk = Math.abs(takeProfit - (direction === "BUY" ? takeProfit - (takeProfit - stopLoss) : takeProfit + (stopLoss - takeProfit)));
  const actualRisk = Math.abs(candles[start].close - stopLoss);
  for (let j = start + 1; j < candles.length; j++) {
    const c = candles[j];
    const hitStop = direction === "BUY" ? c.low <= stopLoss : c.high >= stopLoss;
    const hitTarget = direction === "BUY" ? c.high >= takeProfit : c.low <= takeProfit;
    if (hitStop && hitTarget) return { result: "LOSS", rMultiple: -1 };
    if (hitStop) return { result: "LOSS", rMultiple: -1 };
    if (hitTarget) return { result: "WIN", rMultiple: actualRisk > 0 ? Math.abs(takeProfit - candles[start].close) / actualRisk : null };
  }
  return { result: "OPEN", rMultiple: null };
}

/**
 * Deriv Synthetic Engine.
 *
 * The engine is deliberately family-aware:
 * - BOOM: upward spike bias; prefers BUY setups and filters weak counter-trend SELLs.
 * - CRASH: downward spike bias; prefers SELL setups and filters weak counter-trend BUYs.
 * - VOLATILITY: no forced directional bias; requires trend + momentum agreement.
 *
 * This is a research/backtest engine. Confidence is technical setup strength,
 * not a claim of future profitability.
 */
export function computeDerivSignals(
  candles: NormalizedCandle[],
  opts: DerivEngineOptions,
  indicators?: IndicatorSet
): DerivEngineSignal[] {
  const family = classify(opts.symbol);
  if (!family || !timeframeAllowed(opts.mode, opts.timeframe) || candles.length < 100) return [];

  const defaults = MODE_DEFAULTS[opts.mode];
  const profile = symbolProfile(opts.symbol, family, opts.mode);
  const minConfidence = Math.max(opts.minConfidence ?? defaults.minConfidence, profile.minConfidence);
  const atrStop = opts.atrStop ?? profile.stop;
  const atrTarget = opts.atrTarget ?? profile.target;
  const maxSignals = opts.maxSignals ?? 50;
  const ind = indicators ?? computeIndicators(candles);
  const signals: DerivEngineSignal[] = [];

  for (let i = 60; i < candles.length; i++) {
    const c = candles[i];
    const p = candles[i - 1];
    const ema9 = ind.ema9[i];
    const ema21 = ind.ema21[i];
    const ema50 = ind.ema50[i];
    const rsi = ind.rsi14[i];
    const atr = ind.atr14[i];
    const macd = ind.macd[i];
    if (ema9 == null || ema21 == null || ema50 == null || rsi == null || atr == null || atr <= 0) continue;

    const bullish = c.close > ema21 && ema9 > ema21 && ema21 > ema50;
    const bearish = c.close < ema21 && ema9 < ema21 && ema21 < ema50;
    const momentumUp = macd.histogram != null && macd.histogram > 0;
    const momentumDown = macd.histogram != null && macd.histogram < 0;

    const range = Math.max(c.high - c.low, atr);
    const body = Math.abs(c.close - c.open);
    const upperWick = c.high - Math.max(c.open, c.close);
    const lowerWick = Math.min(c.open, c.close) - c.low;
    const bullishReject = lowerWick > body * 0.8 && c.close > c.open;
    const bearishReject = upperWick > body * 0.8 && c.close < c.open;
    const expansion = range >= atr * 1.15;

    // A large spike candle is treated as a risk event, not an automatic entry.
    // This prevents the engine from chasing the spike itself.
    const spikeLike = range >= atr * profile.maxSpikeAtr;
    if (spikeLike) continue;

    let direction: DerivDirection | null = null;
    let confidence = 0;
    const reasons: string[] = [];

    if (family === "BOOM") {
      if (bullish && momentumUp && rsi < 76 && (bullishReject || c.close > p.high)) {
        direction = "BUY";
        confidence = 64;
        reasons.push("Boom upward-spike bias");
        reasons.push("bullish EMA structure");
        reasons.push("positive momentum");
        if (bullishReject || c.close > p.high) { confidence += 10; reasons.push("bullish confirmation"); }
        if (expansion) { confidence += 5; reasons.push("controlled range expansion"); }
      }
    }

    if (family === "CRASH") {
      if (bearish && momentumDown && rsi > 24 && (bearishReject || c.close < p.low)) {
        direction = "SELL";
        confidence = 64;
        reasons.push("Crash downward-spike bias");
        reasons.push("bearish EMA structure");
        reasons.push("negative momentum");
        if (bearishReject || c.close < p.low) { confidence += 10; reasons.push("bearish confirmation"); }
        if (expansion) { confidence += 5; reasons.push("controlled range expansion"); }
      }
    }

    if (family === "RANGE_BREAK") {
      const recent = candles.slice(Math.max(0, i - 24), i);
      const rangeHigh = Math.max(...recent.map(x => x.high));
      const rangeLow = Math.min(...recent.map(x => x.low));
      if (c.close > rangeHigh && momentumUp && rsi >= 50 && rsi <= 78) {
        direction = "BUY"; confidence = 68; reasons.push(profile.label, "range expansion", "positive momentum");
        if (expansion) { confidence += 9; reasons.push("volatility expansion"); }
        if (c.close > p.high) { confidence += 6; reasons.push("breakout confirmation"); }
      } else if (c.close < rangeLow && momentumDown && rsi >= 22 && rsi <= 50) {
        direction = "SELL"; confidence = 68; reasons.push(profile.label, "range breakdown", "negative momentum");
        if (expansion) { confidence += 9; reasons.push("volatility expansion"); }
        if (c.close < p.low) { confidence += 6; reasons.push("breakdown confirmation"); }
      }
    }

    if (family === "VOLATILITY") {
      const bb = bollinger(candles.slice(0, i + 1), 20, 2);
      if (bb && bb.sd > 0) {
        // Volatility indices are driftless by design. Avoid treating EMA/MACD
        // crossovers as predictive trend signals; trade only strong reversion
        // from a Bollinger extreme with RSI and candle rejection.
        const lowerExtreme = c.close <= bb.lower && rsi <= 35 && lowerWick > body * 0.6 && c.close > c.open;
        const upperExtreme = c.close >= bb.upper && rsi >= 65 && upperWick > body * 0.6 && c.close < c.open;
        if (lowerExtreme) {
          direction = "BUY";
          confidence = 80;
          reasons.push("Volatility mean reversion", "lower Bollinger extreme", "bullish rejection");
        } else if (upperExtreme) {
          direction = "SELL";
          confidence = 80;
          reasons.push("Volatility mean reversion", "upper Bollinger extreme", "bearish rejection");
        }
      }
    }

    if (!direction || confidence < minConfidence) continue;

    // Strongly stretched RSI is a late-entry warning.
    if ((direction === "BUY" && rsi > 78) || (direction === "SELL" && rsi < 22)) continue;

    const entry = c.close;
    const stopLoss = direction === "BUY" ? entry - atr * atrStop : entry + atr * atrStop;
    const takeProfit = direction === "BUY" ? entry + atr * atrTarget : entry - atr * atrTarget;
    const outcome = resolveOutcome(candles, i, direction, stopLoss, takeProfit);

    signals.push({
      id: `deriv-${opts.symbol}-${opts.timeframe}-${opts.mode}-${c.time}-${direction}`,
      symbol: opts.symbol,
      family,
      mode: opts.mode,
      timeframe: opts.timeframe,
      direction,
      strategy: profile.label,
      confidence: Math.min(96, confidence),
      entry,
      stopLoss,
      takeProfit,
      time: c.time,
      index: i,
      result: outcome.result,
      rMultiple: outcome.rMultiple,
      reason: reasons.join(" · "),
    });
  }

  return signals.slice(-maxSignals);
}

export interface DerivPerformance {
  total: number;
  wins: number;
  losses: number;
  open: number;
  winRate: number | null;
  profitFactor: number | null;
  expectancyR: number | null;
  totalR: number;
}

export function summarizeDerivPerformance(signals: DerivEngineSignal[]): DerivPerformance {
  const settled = signals.filter((s) => s.result !== "OPEN");
  const wins = settled.filter((s) => s.result === "WIN");
  const losses = settled.filter((s) => s.result === "LOSS");
  const grossWinR = wins.reduce((sum, s) => sum + Math.max(0, s.rMultiple ?? 0), 0);
  const grossLossR = losses.length;
  const totalR = grossWinR - grossLossR;
  return {
    total: signals.length,
    wins: wins.length,
    losses: losses.length,
    open: signals.filter((s) => s.result === "OPEN").length,
    winRate: settled.length ? (wins.length / settled.length) * 100 : null,
    profitFactor: grossLossR > 0 ? grossWinR / grossLossR : null,
    expectancyR: settled.length ? totalR / settled.length : null,
    totalR,
  };
}
