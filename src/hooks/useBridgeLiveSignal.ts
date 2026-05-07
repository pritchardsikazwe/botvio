import { useEffect, useMemo, useState } from "react";
import { useBridgeTicks } from "./useBridgeTicks";
import type { DerivLiveSignal } from "./useDerivLiveSignal";

/**
 * Builds a Hauza-style EMA20/EMA50/RSI14 signal for a Weltrade SyntX (or any
 * MT5-only) symbol by aggregating live Bridge EA ticks into 1-minute candles.
 *
 * Returns the same shape as `useDerivLiveSignal` so it plugs into the existing
 * persistence + auto-execute hooks (`usePersistLiveSignal`, `useMt5HubExecution`).
 */

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  epoch: number; // bucket start in seconds
}

const BUCKET_SECS = 60; // 1-min candles

function ema(values: number[], period: number): number | null {
  if (values.length < period) return null;
  const k = 2 / (period + 1);
  let e = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < values.length; i++) e = values[i] * k + e * (1 - k);
  return e;
}

function rsi(values: number[], period = 14): number | null {
  if (values.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = values.length - period; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  const avgG = gains / period, avgL = losses / period;
  if (avgL === 0) return 100;
  return 100 - 100 / (1 + avgG / avgL);
}

function buildSignal(candles: Candle[]): Omit<DerivLiveSignal, "connected"> {
  if (candles.length < 6) {
    return {
      signal: "WAIT",
      confidence: 0,
      reason: "Building candles from live bridge ticks…",
      strategy: "Initializing",
      lastPrice: candles[candles.length - 1]?.close ?? null,
      ema20: null, ema50: null, rsi14: null,
    };
  }

  const closes = candles.map((c) => c.close);
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const fastPeriod = Math.min(20, Math.max(3, Math.floor(closes.length / 2)));
  const slowPeriod = Math.min(50, Math.max(fastPeriod + 1, closes.length - 1));
  const e20 = ema(closes, fastPeriod);
  const e50 = ema(closes, slowPeriod);
  const r14 = rsi(closes, 14);

  if (e20 == null || e50 == null) {
    return {
      signal: "WAIT", confidence: 35, reason: "Warming indicators…",
      strategy: "Warm-up", lastPrice: last.close, ema20: e20, ema50: e50, rsi14: r14,
    };
  }

  const rsiValue = r14 ?? (last.close >= closes[0] ? 58 : 42);

  const recent = candles.slice(-20);
  const swingHigh = Math.max(...recent.map((c) => c.high));
  const swingLow = Math.min(...recent.map((c) => c.low));
  const range = swingHigh - swingLow || 1e-9;
  const body = Math.abs(last.close - last.open) || 1e-9;
  const upperWick = last.high - Math.max(last.open, last.close);
  const lowerWick = Math.min(last.open, last.close) - last.low;
  const isBullCandle = last.close > last.open;
  const isBearCandle = last.close < last.open;
  const trendUp = e20 > e50 && last.close > e20;
  const trendDown = e20 < e50 && last.close < e20;
  const momentumUp = last.close > prev.close;
  const momentumDown = last.close < prev.close;
  const nearSupport = (last.close - swingLow) / range < 0.35;
  const nearResistance = (swingHigh - last.close) / range < 0.35;

  if (trendUp && (momentumUp || (lowerWick > body * 1.5 && isBullCandle))) {
    let conf = 60;
    if (nearSupport) conf += 12;
    if (rsiValue > 50 && rsiValue < 70) conf += 10;
    if (lowerWick > body * 1.5) conf += 8;
    return {
      signal: "BUY", confidence: Math.min(92, conf),
      reason: `Bullish trend (fast EMA > slow EMA), ${nearSupport ? "near support" : "in trend"}, RSI ${rsiValue.toFixed(0)}.`,
      strategy: nearSupport ? "S/R Bounce Entry" : "MTF Trend Ride",
      lastPrice: last.close, ema20: e20, ema50: e50, rsi14: rsiValue,
    };
  }
  if (trendDown && (momentumDown || (upperWick > body * 1.5 && isBearCandle))) {
    let conf = 60;
    if (nearResistance) conf += 12;
    if (rsiValue < 50 && rsiValue > 30) conf += 10;
    if (upperWick > body * 1.5) conf += 8;
    return {
      signal: "SELL", confidence: Math.min(92, conf),
      reason: `Bearish trend (fast EMA < slow EMA), ${nearResistance ? "near resistance" : "in downtrend"}, RSI ${rsiValue.toFixed(0)}.`,
      strategy: nearResistance ? "S/R Rejection" : "Breakout Momentum",
      lastPrice: last.close, ema20: e20, ema50: e50, rsi14: rsiValue,
    };
  }
  if (rsiValue >= 72 && nearResistance) {
    return {
      signal: "SELL", confidence: 68,
      reason: `Overbought (RSI ${rsiValue.toFixed(0)}) at resistance — reversal probable.`,
      strategy: "Liquidity Sweep",
      lastPrice: last.close, ema20: e20, ema50: e50, rsi14: rsiValue,
    };
  }
  if (rsiValue <= 28 && nearSupport) {
    return {
      signal: "BUY", confidence: 68,
      reason: `Oversold (RSI ${rsiValue.toFixed(0)}) at support — reversal probable.`,
      strategy: "Liquidity Sweep",
      lastPrice: last.close, ema20: e20, ema50: e50, rsi14: rsiValue,
    };
  }

  return {
    signal: "WAIT", confidence: 45,
    reason: `Mixed — fast EMA ${e20.toFixed(4)} vs slow EMA ${e50.toFixed(4)}, RSI ${rsiValue.toFixed(0)}.`,
    strategy: "Consolidation Filter",
    lastPrice: last.close, ema20: e20, ema50: e50, rsi14: rsiValue,
  };
}

export function useBridgeLiveSignal(symbol: string | null): DerivLiveSignal {
  const { ticks, hasFeed } = useBridgeTicks(symbol, 300);

  const candles = useMemo<Candle[]>(() => {
    if (!ticks.length) return [];
    const buckets: Record<number, Candle> = {};
    const ordered = [...ticks]
      .filter((t) => t.last_price != null)
      .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

    for (const t of ordered) {
      const sec = Math.floor(new Date(t.ts).getTime() / 1000);
      const bucket = sec - (sec % BUCKET_SECS);
      const px = Number(t.last_price);
      const c = buckets[bucket];
      if (!c) {
        buckets[bucket] = { open: px, high: px, low: px, close: px, epoch: bucket };
      } else {
        c.high = Math.max(c.high, px);
        c.low = Math.min(c.low, px);
        c.close = px;
      }
    }
    return Object.values(buckets).sort((a, b) => a.epoch - b.epoch).slice(-200);
  }, [ticks]);

  const [state, setState] = useState<DerivLiveSignal>({
    signal: "WAIT", confidence: 0, reason: "Connecting to bridge feed…",
    strategy: "Connecting", lastPrice: null, ema20: null, ema50: null, rsi14: null,
    connected: false,
  });

  useEffect(() => {
    if (!candles.length) {
      setState((s) => ({ ...s, connected: hasFeed }));
      return;
    }
    const sig = buildSignal(candles);
    setState({ ...sig, connected: hasFeed });
  }, [candles, hasFeed]);

  return state;
}

export { type DerivLiveSignal as BridgeLiveSignal } from "./useDerivLiveSignal";