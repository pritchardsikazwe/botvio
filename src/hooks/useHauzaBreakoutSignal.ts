import { useEffect, useRef, useState } from "react";
import { getDerivPublicWebSocketUrl } from "@/config/derivEnv";
import { mapToDerivSymbol } from "@/hooks/useDerivLiveTicks";
import type { DerivLiveSignal } from "@/hooks/useDerivLiveSignal";

type CoreSignal = Omit<DerivLiveSignal, "connected" | "mode" | "timeframe" | "backtest">;
// These engines don't backtest; report "not available" rather than inventing stats.
const SIGNAL_EXTRAS: Pick<DerivLiveSignal, "mode" | "timeframe" | "backtest"> = {
  mode: "scalp" as DerivLiveSignal["mode"],
  timeframe: "M5",
  backtest: { signals: 0, wins: 0, losses: 0, winRate: null, profitFactor: null, expectancyR: null },
};

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  epoch: number;
}

/**
 * Live BUY/SELL engine driven by the same pivot S/R + breakout +
 * HH/HL channel rules that the chart's Hauza overlay plots. Designed
 * for index hubs (US30, NAS100, GER40) where price respects pivot
 * structure cleanly.
 *
 * Emits a `DerivLiveSignal`-shaped object so it can be plugged into the
 * existing persistence + MT5 execution pipeline (`usePersistLiveSignal`,
 * `useMt5HubExecution`).
 */
function detectPivots(candles: Candle[], left = 3, right = 3) {
  const highs: { idx: number; price: number }[] = [];
  const lows: { idx: number; price: number }[] = [];
  for (let i = left; i < candles.length - right; i++) {
    const c = candles[i];
    let isHigh = true;
    let isLow = true;
    for (let k = 1; k <= left; k++) {
      if (candles[i - k].high >= c.high) isHigh = false;
      if (candles[i - k].low <= c.low) isLow = false;
    }
    for (let k = 1; k <= right; k++) {
      if (candles[i + k].high >= c.high) isHigh = false;
      if (candles[i + k].low <= c.low) isLow = false;
    }
    if (isHigh) highs.push({ idx: i, price: c.high });
    if (isLow) lows.push({ idx: i, price: c.low });
  }
  return { highs, lows };
}

function buildHauzaSignal(candles: Candle[]): CoreSignal {
  if (candles.length < 25) {
    return {
      signal: "WAIT",
      confidence: 0,
      reason: "Loading live chart structure…",
      strategy: "Hauza Initialising",
      lastPrice: candles[candles.length - 1]?.close ?? null,
      ema20: null,
      ema50: null,
      rsi14: null,
    };
  }

  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const { highs, lows } = detectPivots(candles);
  const lastRes = highs[highs.length - 1];
  const lastSup = lows[lows.length - 1];

  // Range for proximity tests
  const recent = candles.slice(-30);
  const swingHigh = Math.max(...recent.map((c) => c.high));
  const swingLow = Math.min(...recent.map((c) => c.low));
  const range = swingHigh - swingLow || 1e-9;

  // ── Breakout: close beyond most recent pivot S/R ─────────────────
  if (lastRes && last.close > lastRes.price && prev.close <= lastRes.price) {
    return {
      signal: "BUY",
      confidence: 82,
      reason: `Bullish breakout — price closed above pivot resistance ${lastRes.price.toFixed(2)} (Hauza overlay).`,
      strategy: "Hauza Breakout",
      lastPrice: last.close,
      ema20: null,
      ema50: null,
      rsi14: null,
    };
  }
  if (lastSup && last.close < lastSup.price && prev.close >= lastSup.price) {
    return {
      signal: "SELL",
      confidence: 82,
      reason: `Bearish breakdown — price closed below pivot support ${lastSup.price.toFixed(2)} (Hauza overlay).`,
      strategy: "Hauza Breakout",
      lastPrice: last.close,
      ema20: null,
      ema50: null,
      rsi14: null,
    };
  }

  // ── S/R Rejection: wick rejection at pivot zone ──────────────────
  const body = Math.abs(last.close - last.open) || 1e-9;
  const upperWick = last.high - Math.max(last.open, last.close);
  const lowerWick = Math.min(last.open, last.close) - last.low;
  const isBull = last.close > last.open;
  const isBear = last.close < last.open;

  if (lastSup) {
    const dist = Math.abs(last.low - lastSup.price) / range;
    if (dist < 0.05 && lowerWick > body * 1.4 && isBull) {
      return {
        signal: "BUY",
        confidence: 74,
        reason: `Support bounce at ${lastSup.price.toFixed(2)} — long lower wick rejection (Hauza S/R).`,
        strategy: "Hauza S/R Bounce",
        lastPrice: last.close,
        ema20: null,
        ema50: null,
        rsi14: null,
      };
    }
  }
  if (lastRes) {
    const dist = Math.abs(last.high - lastRes.price) / range;
    if (dist < 0.05 && upperWick > body * 1.4 && isBear) {
      return {
        signal: "SELL",
        confidence: 74,
        reason: `Resistance rejection at ${lastRes.price.toFixed(2)} — long upper wick rejection (Hauza S/R).`,
        strategy: "Hauza S/R Rejection",
        lastPrice: last.close,
        ema20: null,
        ema50: null,
        rsi14: null,
      };
    }
  }

  // ── HH/HL trend continuation ─────────────────────────────────────
  if (highs.length >= 2 && lows.length >= 2) {
    const h2 = highs.slice(-2);
    const l2 = lows.slice(-2);
    const hh = h2[1].price > h2[0].price;
    const hl = l2[1].price > l2[0].price;
    const lh = h2[1].price < h2[0].price;
    const ll = l2[1].price < l2[0].price;
    if (hh && hl && last.close > prev.close) {
      return {
        signal: "BUY",
        confidence: 66,
        reason: `Uptrend continuation — Higher Highs & Higher Lows on pivot structure (Hauza HH/HL).`,
        strategy: "Hauza HH/HL Channel",
        lastPrice: last.close,
        ema20: null,
        ema50: null,
        rsi14: null,
      };
    }
    if (lh && ll && last.close < prev.close) {
      return {
        signal: "SELL",
        confidence: 66,
        reason: `Downtrend continuation — Lower Highs & Lower Lows on pivot structure (Hauza HH/HL).`,
        strategy: "Hauza HH/HL Channel",
        lastPrice: last.close,
        ema20: null,
        ema50: null,
        rsi14: null,
      };
    }
  }

  return {
    signal: "WAIT",
    confidence: 40,
    reason: "No fresh Hauza breakout, S/R rejection or HH/HL continuation yet.",
    strategy: "Hauza Watch",
    lastPrice: last.close,
    ema20: null,
    ema50: null,
    rsi14: null,
  };
}

export function useHauzaBreakoutSignal(
  displaySymbol: string | null | undefined,
  granularity: number = 300,
): DerivLiveSignal {
  const [state, setState] = useState<CoreSignal & { connected: boolean }>({
    signal: "WAIT",
    confidence: 0,
    reason: "Connecting to live chart…",
    strategy: "Hauza Connecting",
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
      const sig = buildHauzaSignal(candlesRef.current);
      setState((prev) => ({ ...sig, connected: prev.connected }));
    };

    const open = () => {
      if (cancelled) return;
      let ws: WebSocket;
      try {
        ws = new WebSocket(getDerivPublicWebSocketUrl());
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

  return { ...SIGNAL_EXTRAS, ...state };
}