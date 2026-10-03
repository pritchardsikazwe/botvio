import { computeIndicators, type IndicatorSet } from "./indicators";
import { getSymbolStrategy } from "./symbolStrategies";
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
  strategyId?: string;
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
  const profile = getSymbolStrategy(opts.symbol);
  const timeframeAllowed = profile.timeframes.includes(opts.timeframe);
  if (!timeframeAllowed || candles.length < 80) return [];

  const minConfidence = opts.minConfidence ?? profile.minConfidence;
  const atrStop = opts.atrStop ?? profile.atrStop;
  const atrTarget = opts.atrTarget ?? profile.atrTarget;
  const maxSignals = opts.maxSignals ?? 40;
  const ind = indicators ?? computeIndicators(candles);
  const signals: EngineSignal[] = [];

  for (let i = 60; i < candles.length; i++) {
    const c = candles[i];
    const p = candles[i - 1];
    const e9 = ind.ema9[i], e21 = ind.ema21[i], e50 = ind.ema50[i];
    const rsi = ind.rsi14[i], atr = ind.atr14[i], macd = ind.macd[i];
    if (e9 == null || e21 == null || e50 == null || rsi == null || atr == null || atr <= 0) continue;

    const range = c.high - c.low;
    const body = Math.abs(c.close - c.open);
    const upperWick = c.high - Math.max(c.open, c.close);
    const lowerWick = Math.min(c.open, c.close) - c.low;
    const bullReject = c.close > c.open && lowerWick > Math.max(body * 0.8, atr * 0.2);
    const bearReject = c.close < c.open && upperWick > Math.max(body * 0.8, atr * 0.2);
    const expansion = range >= atr * 1.15;
    const tooExtendedUp = (c.close - e9) / atr > profile.maxExtensionAtr;
    const tooExtendedDown = (e9 - c.close) / atr > profile.maxExtensionAtr;

    const trendUp = e9 > e21 && e21 > e50 && c.close > e50;
    const trendDown = e9 < e21 && e21 < e50 && c.close < e50;
    const momentumUp = macd?.histogram != null && macd.histogram > 0;
    const momentumDown = macd?.histogram != null && macd.histogram < 0;

    // Recent range used for breakout/retest strategies.
    const lookback = candles.slice(Math.max(0, i - 20), i);
    const rangeHigh = Math.max(...lookback.map(v => v.high));
    const rangeLow = Math.min(...lookback.map(v => v.low));
    const breakoutUp = c.close > rangeHigh && p.close <= rangeHigh;
    const breakoutDown = c.close < rangeLow && p.close >= rangeLow;

    let direction: SignalDirection | null = null;
    let confidence = 0;
    const reasons: string[] = [];

    if (profile.id === "GOLD_STRUCTURE") {
      if (trendUp && momentumUp && !tooExtendedUp && (bullReject || c.close > p.high)) {
        direction = "BUY"; confidence = 67; reasons.push("Gold bullish structure", "momentum confirmation", "controlled pullback/liquidity reaction");
      } else if (trendDown && momentumDown && !tooExtendedDown && (bearReject || c.close < p.low)) {
        direction = "SELL"; confidence = 67; reasons.push("Gold bearish structure", "momentum confirmation", "controlled pullback/liquidity reaction");
      }
      if (breakoutUp && momentumUp) { direction = "BUY"; confidence = Math.max(confidence, 73); reasons.push("range breakout confirmed"); }
      if (breakoutDown && momentumDown) { direction = "SELL"; confidence = Math.max(confidence, 73); reasons.push("range breakdown confirmed"); }
    } else if (profile.id === "BTC_MOMENTUM" || profile.id === "CRYPTO_MOMENTUM") {
      if (breakoutUp && momentumUp && expansion && !tooExtendedUp) {
        direction = "BUY"; confidence = 75; reasons.push("crypto breakout", "positive momentum", "volatility expansion");
      } else if (breakoutDown && momentumDown && expansion && !tooExtendedDown) {
        direction = "SELL"; confidence = 75; reasons.push("crypto breakdown", "negative momentum", "volatility expansion");
      } else if (trendUp && momentumUp && bullReject && !tooExtendedUp) {
        direction = "BUY"; confidence = 68; reasons.push("trend continuation", "pullback confirmation");
      } else if (trendDown && momentumDown && bearReject && !tooExtendedDown) {
        direction = "SELL"; confidence = 68; reasons.push("trend continuation", "pullback confirmation");
      }
    } else if (profile.id === "NAS100_BREAKOUT") {
      if (breakoutUp && momentumUp && !tooExtendedUp) {
        direction = "BUY"; confidence = 76; reasons.push("NAS100 range breakout", "momentum confirmation");
      } else if (breakoutDown && momentumDown && !tooExtendedDown) {
        direction = "SELL"; confidence = 76; reasons.push("NAS100 range breakdown", "momentum confirmation");
      } else if (trendUp && bullReject && momentumUp) {
        direction = "BUY"; confidence = 70; reasons.push("NAS100 pullback to trend", "bullish rejection");
      } else if (trendDown && bearReject && momentumDown) {
        direction = "SELL"; confidence = 70; reasons.push("NAS100 pullback to trend", "bearish rejection");
      }
    } else {
      if (trendUp && momentumUp && rsi >= 48 && rsi <= 70 && bullReject && !tooExtendedUp) {
        direction = "BUY"; confidence = 68; reasons.push("trend alignment", "momentum confirmation", "pullback rejection");
      } else if (trendDown && momentumDown && rsi >= 30 && rsi <= 52 && bearReject && !tooExtendedDown) {
        direction = "SELL"; confidence = 68; reasons.push("trend alignment", "momentum confirmation", "pullback rejection");
      }
      if (profile.id === "GBP_PULLBACK" && expansion) {
        confidence -= 5;
        reasons.push("high-range candle penalty");
      }
    }

    if (!direction) continue;

    // Avoid late entries and abnormal volatility spikes.
    if ((direction === "BUY" && (rsi > 78 || tooExtendedUp)) ||
        (direction === "SELL" && (rsi < 22 || tooExtendedDown))) continue;
    if (range >= atr * 2.4) continue;

    if (direction === "BUY" && rsi >= 50) confidence += 4;
    if (direction === "SELL" && rsi <= 50) confidence += 4;
    if (expansion && range < atr * 2.0) confidence += 3;
    confidence = Math.min(96, Math.max(0, confidence));
    if (confidence < minConfidence) continue;

    const entry = c.close;
    const stopLoss = direction === "BUY" ? entry - atr * atrStop : entry + atr * atrStop;
    const takeProfit = direction === "BUY" ? entry + atr * atrTarget : entry - atr * atrTarget;

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
      symbol, label, timeframe, direction,
      strategy: profile.label,
      strategyId: profile.id,
      confidence,
      entry, stopLoss, takeProfit,
      time: c.time, index: i, result,
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