import { useEffect, useRef, useState } from "react";
import { getDerivWebSocketUrl } from "@/config/derivEnv";
import { mapToDerivSymbol } from "@/hooks/useDerivLiveTicks";

export type DerivSignalType = "BUY" | "SELL" | "WAIT" | "HOLD";

export interface DerivLiveSignal {
  signal: DerivSignalType;
  confidence: number; // 0-100
  reason: string;
  strategy: string;
  lastPrice: number | null;
  ema20: number | null;
  ema50: number | null;
  rsi14: number | null;
  connected: boolean;
}

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  epoch: number;
}

// ── Indicator helpers ────────────────────────────────────────────
function ema(values: number[], period: number): number | null {
  if (values.length < period) return null;
  const k = 2 / (period + 1);
  let e = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < values.length; i++) {
    e = values[i] * k + e * (1 - k);
  }
  return e;
}

function rsi(values: number[], period = 14): number | null {
  if (values.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  for (let i = values.length - period; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const avgG = gains / period;
  const avgL = losses / period;
  if (avgL === 0) return 100;
  const rs = avgG / avgL;
  return 100 - 100 / (1 + rs);
}

function buildSignal(candles: Candle[]): Omit<DerivLiveSignal, "connected"> {
  if (candles.length < 25) {
    return {
      signal: "WAIT",
      confidence: 0,
      reason: "Loading live market data…",
      strategy: "Initializing",
      lastPrice: candles[candles.length - 1]?.close ?? null,
      ema20: null,
      ema50: null,
      rsi14: null,
    };
  }

  const closes = candles.map((c) => c.close);
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const e20 = ema(closes, 20);
  const e50 = ema(closes, 50) ?? ema(closes, Math.min(50, closes.length - 1));
  const r14 = rsi(closes, 14);

  if (e20 == null || e50 == null || r14 == null) {
    return {
      signal: "WAIT",
      confidence: 35,
      reason: "Building indicator history (EMA/RSI)…",
      strategy: "Warm-up",
      lastPrice: last.close,
      ema20: e20,
      ema50: e50,
      rsi14: r14,
    };
  }

  const recent = candles.slice(-20);
  const swingHigh = Math.max(...recent.map((c) => c.high));
  const swingLow = Math.min(...recent.map((c) => c.low));
  const range = swingHigh - swingLow || 1e-9;

  // Wick analysis on last candle
  const body = Math.abs(last.close - last.open) || 1e-9;
  const upperWick = last.high - Math.max(last.open, last.close);
  const lowerWick = Math.min(last.open, last.close) - last.low;
  const isBullCandle = last.close > last.open;
  const isBearCandle = last.close < last.open;

  // Trend & momentum
  const trendUp = e20 > e50 && last.close > e20;
  const trendDown = e20 < e50 && last.close < e20;
  const momentumUp = last.close > prev.close;
  const momentumDown = last.close < prev.close;

  // ── BUY conditions ─────────────────────────────────────
  // Price near support + bullish trend + bullish momentum or wick rejection
  const nearSupport = (last.close - swingLow) / range < 0.35;
  const nearResistance = (swingHigh - last.close) / range < 0.35;

  if (trendUp && (momentumUp || (lowerWick > body * 1.5 && isBullCandle))) {
    let conf = 60;
    if (nearSupport) conf += 12;
    if (r14 > 50 && r14 < 70) conf += 10;
    if (lowerWick > body * 1.5) conf += 8;
    return {
      signal: "BUY",
      confidence: Math.min(92, conf),
      reason: `Bullish trend (EMA20 > EMA50), price ${nearSupport ? "near support" : "in trend"}, RSI ${r14.toFixed(0)}${lowerWick > body * 1.5 ? " + wick rejection at low" : ""}.`,
      strategy: nearSupport ? "S/R Bounce Entry" : "MTF Trend Ride",
      lastPrice: last.close,
      ema20: e20,
      ema50: e50,
      rsi14: r14,
    };
  }

  // ── SELL conditions ────────────────────────────────────
  if (trendDown && (momentumDown || (upperWick > body * 1.5 && isBearCandle))) {
    let conf = 60;
    if (nearResistance) conf += 12;
    if (r14 < 50 && r14 > 30) conf += 10;
    if (upperWick > body * 1.5) conf += 8;
    return {
      signal: "SELL",
      confidence: Math.min(92, conf),
      reason: `Bearish trend (EMA20 < EMA50), price ${nearResistance ? "near resistance" : "in downtrend"}, RSI ${r14.toFixed(0)}${upperWick > body * 1.5 ? " + wick rejection at high" : ""}.`,
      strategy: nearResistance ? "S/R Rejection" : "Breakout Momentum",
      lastPrice: last.close,
      ema20: e20,
      ema50: e50,
      rsi14: r14,
    };
  }

  // ── Overbought/Oversold reversals ─────────────────────
  if (r14 >= 72 && nearResistance) {
    return {
      signal: "SELL",
      confidence: 68,
      reason: `Overbought (RSI ${r14.toFixed(0)}) at resistance — high reversal probability.`,
      strategy: "Liquidity Sweep",
      lastPrice: last.close,
      ema20: e20,
      ema50: e50,
      rsi14: r14,
    };
  }
  if (r14 <= 28 && nearSupport) {
    return {
      signal: "BUY",
      confidence: 68,
      reason: `Oversold (RSI ${r14.toFixed(0)}) at support — high reversal probability.`,
      strategy: "Liquidity Sweep",
      lastPrice: last.close,
      ema20: e20,
      ema50: e50,
      rsi14: r14,
    };
  }

  // ── Conflicted / consolidation → WAIT ─────────────────
  return {
    signal: "WAIT",
    confidence: 45,
    reason: `Mixed signals — EMA20 ${e20.toFixed(2)} vs EMA50 ${e50.toFixed(2)}, RSI ${r14.toFixed(0)}. Waiting for clean setup.`,
    strategy: "Consolidation Filter",
    lastPrice: last.close,
    ema20: e20,
    ema50: e50,
    rsi14: r14,
  };
}

/**
 * Subscribe to live Deriv candles and emit a real, indicator-driven signal.
 * Granularity in seconds (default 300 = 5m).
 */
export function useDerivLiveSignal(
  displaySymbol: string | null | undefined,
  granularity: number = 300,
): DerivLiveSignal {
  const [state, setState] = useState<DerivLiveSignal>({
    signal: "WAIT",
    confidence: 0,
    reason: "Connecting to live market…",
    strategy: "Connecting",
    lastPrice: null,
    ema20: null,
    ema50: null,
    rsi14: null,
    connected: false,
  });
  const candlesRef = useRef<Candle[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!displaySymbol) return;
    const derivSymbol = mapToDerivSymbol(displaySymbol);
    if (!derivSymbol) return;

    let cancelled = false;
    let reconnect: ReturnType<typeof setTimeout> | null = null;

    const recompute = () => {
      const sig = buildSignal(candlesRef.current);
      setState((prev) => ({ ...sig, connected: prev.connected }));
    };

    const open = () => {
      if (cancelled) return;
      let ws: WebSocket;
      try {
        ws = new WebSocket(getDerivWebSocketUrl());
      } catch {
        return;
      }
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) return;
        setState((s) => ({ ...s, connected: true }));
        ws.send(
          JSON.stringify({
            ticks_history: derivSymbol,
            adjust_start_time: 1,
            count: 120,
            end: "latest",
            granularity,
            style: "candles",
            subscribe: 1,
          }),
        );
      };

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.error) return;

          if (data.candles && Array.isArray(data.candles)) {
            candlesRef.current = data.candles.map((c: any) => ({
              open: Number(c.open),
              high: Number(c.high),
              low: Number(c.low),
              close: Number(c.close),
              epoch: Number(c.epoch),
            }));
            recompute();
          }

          if (data.ohlc) {
            const ohlc = data.ohlc;
            const newCandle: Candle = {
              open: Number(ohlc.open),
              high: Number(ohlc.high),
              low: Number(ohlc.low),
              close: Number(ohlc.close),
              epoch: Number(ohlc.open_time ?? ohlc.epoch),
            };
            const arr = candlesRef.current;
            const lastIdx = arr.length - 1;
            if (lastIdx >= 0 && arr[lastIdx].epoch === newCandle.epoch) {
              arr[lastIdx] = newCandle;
            } else {
              arr.push(newCandle);
              if (arr.length > 200) arr.shift();
            }
            recompute();
          }
        } catch {
          /* ignore */
        }
      };

      ws.onclose = () => {
        setState((s) => ({ ...s, connected: false }));
        if (cancelled) return;
        reconnect = setTimeout(open, 3000);
      };

      ws.onerror = () => {
        try { ws.close(); } catch { /* noop */ }
      };
    };

    open();

    return () => {
      cancelled = true;
      if (reconnect) clearTimeout(reconnect);
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        try { ws.send(JSON.stringify({ forget_all: ["candles", "ticks"] })); } catch { /* noop */ }
      }
      try { ws?.close(); } catch { /* noop */ }
      wsRef.current = null;
      candlesRef.current = [];
    };
  }, [displaySymbol, granularity]);

  return state;
}
