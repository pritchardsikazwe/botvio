import { computeIndicators, type IndicatorSet } from "./indicators";
import type { NormalizedCandle, Timeframe } from "./types";

export type SignalDirection = "BUY" | "SELL";
export type SignalResultState = "WIN" | "LOSS" | "OPEN";

export interface EngineSignal {
  id: string;
  symbol: string;
  label: string;
  timeframe: Timeframe;
  direction: SignalDirection;
  strategy: string;
  confidence: number;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  /** Candle time (epoch seconds) the signal was generated on. */
  time: number;
  /** Index into the candle dataset the signal was computed from. */
  index: number;
  result: SignalResultState;
  reason: string;
}

export interface SignalEngineOptions {
  symbol: string;
  label: string;
  timeframe: Timeframe;
  /** Minimum confidence a setup needs before it is published. */
  minConfidence?: number;
  /** Take-profit / stop-loss in ATR multiples. */
  atrStop?: number;
  atrTarget?: number;
  /** Max signals returned (most recent first is applied by the caller). */
  maxSignals?: number;
}

function priceStep(candles: NormalizedCandle[]): number {
  const last = candles[candles.length - 1]?.close ?? 1;
  return Math.abs(last) > 500 ? 0.01 : 0.00001;
}

/**
 * Botvio trend + momentum engine, computed over the exact normalized dataset the
 * chart renders. Signals are anchored to the candle index where the setup
 * triggered — never to "the latest candle".
 */
export function computeSignals(
  candles: NormalizedCandle[],
  opts: SignalEngineOptions,
  indicators?: IndicatorSet
): EngineSignal[] {
  const {
    symbol,
    label,
    timeframe,
    minConfidence = 55,
    atrStop = 1.5,
    atrTarget = 2.5,
    maxSignals = 40,
  } = opts;

  if (candles.length < 60) return [];
  const ind = indicators ?? computeIndicators(candles);
  const step = priceStep(candles);
  const signals: EngineSignal[] = [];

  for (let i = 30; i < candles.length; i++) {
    const c = candles[i];
    const ema9 = ind.ema9[i];
    const ema9p = ind.ema9[i - 1];
    const ema21 = ind.ema21[i];
    const ema21p = ind.ema21[i - 1];
    const ema50 = ind.ema50[i];
    const rsi = ind.rsi14[i];
    const atr = ind.atr14[i] ?? Math.max(c.high - c.low, step * 10);
    const macd = ind.macd[i];
    if (ema9 == null || ema21 == null || ema9p == null || ema21p == null || rsi == null) continue;

    const crossedUp = ema9p <= ema21p && ema9 > ema21;
    const crossedDown = ema9p >= ema21p && ema9 < ema21;
    if (!crossedUp && !crossedDown) continue;

    const direction: SignalDirection = crossedUp ? "BUY" : "SELL";
    const trendAligned = ema50 == null ? false : direction === "BUY" ? c.close > ema50 : c.close < ema50;
    const momentumAligned =
      macd?.histogram == null ? false : direction === "BUY" ? macd.histogram > 0 : macd.histogram < 0;
    const rsiOk = direction === "BUY" ? rsi > 45 && rsi < 78 : rsi < 55 && rsi > 22;

    let confidence = 48;
    const reasons: string[] = [`EMA 9/21 ${direction === "BUY" ? "bullish" : "bearish"} cross`];
    if (trendAligned) {
      confidence += 14;
      reasons.push("price on the trend side of EMA 50");
    }
    if (momentumAligned) {
      confidence += 12;
      reasons.push("MACD histogram confirms");
    }
    if (rsiOk) {
      confidence += 10;
      reasons.push(`RSI ${rsi.toFixed(1)} in the healthy band`);
    } else {
      confidence -= 8;
      reasons.push(`RSI ${rsi.toFixed(1)} stretched`);
    }
    const body = Math.abs(c.close - c.open);
    if (body > atr * 0.6) {
      confidence += 6;
      reasons.push("expansion candle");
    }
    confidence = Math.max(0, Math.min(96, confidence));
    if (confidence < minConfidence) continue;

    const entry = c.close;
    const stopLoss = direction === "BUY" ? entry - atr * atrStop : entry + atr * atrStop;
    const takeProfit = direction === "BUY" ? entry + atr * atrTarget : entry - atr * atrTarget;

    // Forward-walk the same dataset to resolve the outcome (no look-ahead bias:
    // only candles AFTER the entry candle are inspected).
    let result: SignalResultState = "OPEN";
    for (let j = i + 1; j < candles.length; j++) {
      const f = candles[j];
      if (direction === "BUY") {
        if (f.low <= stopLoss) { result = "LOSS"; break; }
        if (f.high >= takeProfit) { result = "WIN"; break; }
      } else {
        if (f.high >= stopLoss) { result = "LOSS"; break; }
        if (f.low <= takeProfit) { result = "WIN"; break; }
      }
    }

    signals.push({
      id: `${symbol}-${timeframe}-${c.time}-${direction}`,
      symbol,
      label,
      timeframe,
      direction,
      strategy: "Botvio EMA/RSI Momentum",
      confidence,
      entry,
      stopLoss,
      takeProfit,
      time: c.time,
      index: i,
      result,
      reason: reasons.join(" · "),
    });
  }

  return signals.slice(-maxSignals);
}

export interface SignalStats {
  total: number;
  wins: number;
  losses: number;
  open: number;
  winRate: number | null;
}

export function summarizeSignals(signals: EngineSignal[]): SignalStats {
  const wins = signals.filter((s) => s.result === "WIN").length;
  const losses = signals.filter((s) => s.result === "LOSS").length;
  const open = signals.filter((s) => s.result === "OPEN").length;
  const settled = wins + losses;
  return {
    total: signals.length,
    wins,
    losses,
    open,
    winRate: settled ? (wins / settled) * 100 : null,
  };
}