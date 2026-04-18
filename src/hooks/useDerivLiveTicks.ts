import { useEffect, useRef, useState } from "react";
import { getDerivWebSocketUrl } from "@/config/derivEnv";

/**
 * Map display symbol (e.g. "XAU/USD") → Deriv WebSocket symbol code.
 * Returns null when the symbol is not supported by Deriv.
 */
export function mapToDerivSymbol(displaySymbol: string): string | null {
  const map: Record<string, string> = {
    "XAU/USD": "frxXAUUSD",
    "XAG/USD": "frxXAGUSD",
    "GBP/USD": "frxGBPUSD",
    "EUR/USD": "frxEURUSD",
    "USD/JPY": "frxUSDJPY",
    "AUD/USD": "frxAUDUSD",
    "BTC/USD": "cryBTCUSD",
    "ETH/USD": "cryETHUSD",
  };
  return map[displaySymbol] ?? null;
}

export interface DerivLiveTick {
  symbol: string;
  price: number;
  epoch: number;
}

/**
 * Subscribe to live Deriv ticks for a given display symbol.
 * Uses a public, unauthenticated WebSocket — no token required.
 */
export function useDerivLiveTicks(displaySymbol: string | null | undefined) {
  const [tick, setTick] = useState<DerivLiveTick | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!displaySymbol) return;
    const derivSymbol = mapToDerivSymbol(displaySymbol);
    if (!derivSymbol) return;

    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const open = () => {
      if (cancelled) return;
      let ws: WebSocket;
      try {
        ws = new WebSocket(getDerivWebSocketUrl());
      } catch (err) {
        console.warn("[DerivLive] Failed to open WS:", err);
        return;
      }
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) return;
        setConnected(true);
        ws.send(JSON.stringify({ ticks: derivSymbol, subscribe: 1 }));
      };

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.error) {
            console.warn("[DerivLive] error:", data.error.message);
            return;
          }
          if (data.tick) {
            setTick({
              symbol: data.tick.symbol,
              price: Number(data.tick.quote),
              epoch: Number(data.tick.epoch),
            });
          }
        } catch {
          /* ignore */
        }
      };

      ws.onclose = () => {
        setConnected(false);
        if (cancelled) return;
        // Reconnect after short delay
        reconnectTimer = setTimeout(open, 3000);
      };

      ws.onerror = () => {
        try { ws.close(); } catch { /* noop */ }
      };
    };

    open();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        try { ws.send(JSON.stringify({ forget_all: "ticks" })); } catch { /* noop */ }
      }
      try { ws?.close(); } catch { /* noop */ }
      wsRef.current = null;
    };
  }, [displaySymbol]);

  return { tick, connected, derivSupported: !!mapToDerivSymbol(displaySymbol ?? "") };
}
