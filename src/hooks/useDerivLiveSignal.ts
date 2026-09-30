import { useEffect, useRef, useState } from "react";
import { getDerivPublicWebSocketUrl } from "@/config/derivEnv";
import { mapToDerivSymbol } from "@/hooks/useDerivLiveTicks";
import { computeDerivSignals, type DerivMode } from "@/lib/marketData/derivSignalEngine";
import type { NormalizedCandle } from "@/lib/marketData/types";

export type DerivSignalType = "BUY" | "SELL" | "WAIT" | "HOLD";

export interface DerivLiveSignal {
  signal: DerivSignalType;
  confidence: number;
  reason: string;
  strategy: string;
  lastPrice: number | null;
  ema20: number | null;
  ema50: number | null;
  rsi14: number | null;
  connected: boolean;
  mode: DerivMode;
  timeframe: string;
  backtest: {
    signals: number;
    wins: number;
    losses: number;
    winRate: number | null;
    profitFactor: number | null;
    expectancyR: number | null;
  };
}

function modeForGranularity(seconds: number): DerivMode {
  if (seconds <= 300) return "SCALPING";
  if (seconds <= 1800) return "DAY";
  return "SWING";
}

function timeframeForGranularity(seconds: number): NormalizedCandle[] extends never[] ? never : "1m" | "3m" | "5m" | "15m" | "30m" | "1H" | "4H" {
  if (seconds === 60) return "1m";
  if (seconds === 180) return "3m";
  if (seconds === 300) return "5m";
  if (seconds === 900) return "15m";
  if (seconds === 1800) return "30m";
  if (seconds === 3600) return "1H";
  return "4H";
}

const emptyStats = {
  signals: 0,
  wins: 0,
  losses: 0,
  winRate: null as number | null,
  profitFactor: null as number | null,
  expectancyR: null as number | null,
};

export function useDerivLiveSignal(
  displaySymbol: string | null | undefined,
  granularity: number = 300,
): DerivLiveSignal {
  const mode = modeForGranularity(granularity);
  const timeframe = timeframeForGranularity(granularity);
  const [state, setState] = useState<DerivLiveSignal>({
    signal: "WAIT",
    confidence: 0,
    reason: "Connecting to live market…",
    strategy: "BOTVIO Deriv Synthetic Engine",
    lastPrice: null,
    ema20: null,
    ema50: null,
    rsi14: null,
    connected: false,
    mode,
    timeframe,
    backtest: emptyStats,
  });
  const candlesRef = useRef<NormalizedCandle[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!displaySymbol) return;
    const derivSymbol = mapToDerivSymbol(displaySymbol);
    if (!derivSymbol) return;

    let cancelled = false;
    let reconnect: ReturnType<typeof setTimeout> | null = null;

    const recompute = () => {
      const candles = candlesRef.current;
      if (candles.length < 100) {
        setState((s) => ({
          ...s,
          signal: "WAIT",
          confidence: 0,
          reason: `Building ${mode.toLowerCase()} engine history (${candles.length}/100 candles)…`,
          strategy: `BOTVIO Deriv ${mode} Engine`,
          lastPrice: candles.at(-1)?.close ?? null,
          mode,
          timeframe,
          backtest: emptyStats,
        }));
        return;
      }

      const signals = computeDerivSignals(candles, {
        symbol: derivSymbol,
        timeframe: timeframe as any,
        mode,
        maxSignals: 100,
      });
      const latest = signals.at(-1);
      const settled = signals.filter((s) => s.result !== "OPEN");
      const wins = settled.filter((s) => s.result === "WIN").length;
      const losses = settled.filter((s) => s.result === "LOSS").length;
      const grossWinR = signals.filter((s) => s.result === "WIN").reduce((sum, s) => sum + Math.max(0, s.rMultiple ?? 0), 0);
      const stats = {
        signals: signals.length,
        wins,
        losses,
        winRate: settled.length ? (wins / settled.length) * 100 : null,
        profitFactor: losses ? grossWinR / losses : null,
        expectancyR: settled.length ? (grossWinR - losses) / settled.length : null,
      };

      const last = candles.at(-1);
      setState((s) => ({
        ...s,
        signal: latest?.direction ?? "WAIT",
        confidence: latest?.confidence ?? 45,
        reason: latest?.reason ?? "No confirmed Deriv setup — waiting for the next valid structure.",
        strategy: latest?.strategy ?? `BOTVIO Deriv ${mode} Engine`,
        lastPrice: last?.close ?? null,
        ema20: null,
        ema50: null,
        rsi14: null,
        mode,
        timeframe,
        backtest: stats,
      }));
    };

    const open = () => {
      if (cancelled) return;
      let ws: WebSocket;
      try { ws = new WebSocket(getDerivPublicWebSocketUrl()); } catch { return; }
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) return;
        setState((s) => ({ ...s, connected: true }));
        ws.send(JSON.stringify({
          ticks_history: derivSymbol,
          adjust_start_time: 1,
          count: 500,
          end: "latest",
          granularity,
          style: "candles",
          subscribe: 1,
        }));
      };

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.error) return;

          if (Array.isArray(data.candles)) {
            candlesRef.current = data.candles
              .map((c: any) => ({
                time: Number(c.epoch),
                open: Number(c.open),
                high: Number(c.high),
                low: Number(c.low),
                close: Number(c.close),
              }))
              .filter((c: NormalizedCandle) => Number.isFinite(c.time) && Number.isFinite(c.close));
            recompute();
          }

          if (data.ohlc) {
            const o = data.ohlc;
            const candle: NormalizedCandle = {
              time: Number(o.open_time ?? o.epoch),
              open: Number(o.open),
              high: Number(o.high),
              low: Number(o.low),
              close: Number(o.close),
            };
            const arr = candlesRef.current;
            const idx = arr.length - 1;
            if (idx >= 0 && arr[idx].time === candle.time) arr[idx] = candle;
            else {
              arr.push(candle);
              if (arr.length > 600) arr.shift();
            }
            recompute();
          }
        } catch { /* ignore malformed feed messages */ }
      };

      ws.onclose = () => {
        setState((s) => ({ ...s, connected: false }));
        if (!cancelled) reconnect = setTimeout(open, 3000);
      };

      ws.onerror = () => { try { ws.close(); } catch { /* noop */ } };
    };

    open();

    return () => {
      cancelled = true;
      if (reconnect) clearTimeout(reconnect);
      const ws = wsRef.current;
      if (ws?.readyState === WebSocket.OPEN) {
        try { ws.send(JSON.stringify({ forget_all: ["candles", "ticks"] })); } catch { /* noop */ }
      }
      try { ws?.close(); } catch { /* noop */ }
      wsRef.current = null;
      candlesRef.current = [];
    };
  }, [displaySymbol, granularity, mode, timeframe]);

  return state;
}
