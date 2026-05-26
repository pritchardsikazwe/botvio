import { useEffect, useRef, useState } from "react";
import { getDerivPublicWebSocketUrl } from "@/config/derivEnv";

/**
 * Map display symbol (e.g. "XAU/USD") → Deriv WebSocket symbol code.
 * Returns null when the symbol is not supported by Deriv.
 */
export function mapToDerivSymbol(displaySymbol: string): string | null {
  const s = (displaySymbol || "").trim();
  if (!s) return null;
  // Pass-through if already a Deriv code
  if (s.startsWith("frx") || s.startsWith("cry") || s.includes("_")) return s;

  const map: Record<string, string> = {
    // Forex pairs (slash + plain)
    "XAU/USD": "frxXAUUSD", "XAUUSD": "frxXAUUSD",
    "XAG/USD": "frxXAGUSD", "XAGUSD": "frxXAGUSD",
    "GBP/USD": "frxGBPUSD", "GBPUSD": "frxGBPUSD",
    "EUR/USD": "frxEURUSD", "EURUSD": "frxEURUSD",
    "USD/JPY": "frxUSDJPY", "USDJPY": "frxUSDJPY",
    "AUD/USD": "frxAUDUSD", "AUDUSD": "frxAUDUSD",
    "USD/CHF": "frxUSDCHF", "USDCHF": "frxUSDCHF",
    "USD/CAD": "frxUSDCAD", "USDCAD": "frxUSDCAD",
    "NZD/USD": "frxNZDUSD", "NZDUSD": "frxNZDUSD",
    "EUR/JPY": "frxEURJPY", "EURJPY": "frxEURJPY",
    "GBP/JPY": "frxGBPJPY", "GBPJPY": "frxGBPJPY",
    // Crypto
    "BTC/USD": "cryBTCUSD", "BTCUSD": "cryBTCUSD", "BTC": "cryBTCUSD",
    "ETH/USD": "cryETHUSD", "ETHUSD": "cryETHUSD", "ETH": "cryETHUSD",
    // Indices (Deriv cash CFDs)
    "US30": "OTC_DJI", "DOW": "OTC_DJI", "DJI": "OTC_DJI",
    "SPX500": "OTC_SPC", "SPX": "OTC_SPC", "SP500": "OTC_SPC",
    "NAS100": "OTC_NDX", "NDX": "OTC_NDX", "NASDAQ": "OTC_NDX",
    "GER40": "OTC_GDAXI", "DAX": "OTC_GDAXI",
    "UK100": "OTC_FTSE", "FTSE": "OTC_FTSE",
    "JP225": "OTC_N225", "NIKKEI": "OTC_N225",
    "HK50": "OTC_HSI", "HSI": "OTC_HSI",
    "AUS200": "OTC_AS51",
    // Deriv Synthetic Indices — pass-through codes (already valid Deriv symbols)
    "BOOM500": "BOOM500", "BOOM1000": "BOOM1000",
    "CRASH500": "CRASH500", "CRASH1000": "CRASH1000",
    "R_10": "R_10", "R_25": "R_25", "R_50": "R_50", "R_75": "R_75", "R_100": "R_100",
    "1HZ10V": "1HZ10V", "1HZ25V": "1HZ25V", "1HZ50V": "1HZ50V", "1HZ75V": "1HZ75V", "1HZ100V": "1HZ100V",
    "stpRNG": "stpRNG", "STPRNG": "stpRNG", "STEP": "stpRNG",
  };
  return map[s] ?? null;
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
        ws = new WebSocket(getDerivPublicWebSocketUrl());
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
