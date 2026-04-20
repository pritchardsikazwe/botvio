import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { DerivLiveSignal } from "./useDerivLiveSignal";

/**
 * Persists fresh BUY/SELL signals from the live Deriv engine into
 * `trading_signals` so they appear in:
 *  - Symbol-specific hubs (Gold, etc.)
 *  - Home Latest Trading Signals widget
 *  - /signals page
 *  - signals_history (for the public profitability tracker)
 *
 * Calls the `persist-live-gold-signal` edge function, which uses the service
 * role to bypass RLS, enforces a per-timeframe throttle (M1=1min, M5=5min)
 * and sets `expires_at` to match — so users never enter late.
 */
export function usePersistLiveSignal(
  live: DerivLiveSignal,
  enabled: boolean,
  symbol: string,
  category?: string,
  timeframe: "M1" | "M5" = "M5",
) {
  const lastSentRef = useRef<{ direction: string; tf: string; at: number } | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (inFlightRef.current) return;
    if (live.signal !== "BUY" && live.signal !== "SELL") return;
    if (!live.lastPrice) return;
    if (live.confidence < 65) return;

    const throttleMs = (timeframe === "M1" ? 60 : 300) * 1000;
    const now = Date.now();
    const last = lastSentRef.current;
    if (
      last &&
      last.direction === live.signal &&
      last.tf === timeframe &&
      now - last.at < throttleMs * 0.9
    ) {
      return;
    }

    inFlightRef.current = true;

    (async () => {
      try {
        await supabase.functions.invoke("persist-live-gold-signal", {
          body: {
            symbol,
            direction: live.signal,
            entry_price: live.lastPrice,
            confidence: live.confidence,
            reason: live.reason,
            strategy: live.strategy,
            category,
            timeframe,
          },
        });
        lastSentRef.current = { direction: live.signal as string, tf: timeframe, at: now };
      } catch {
        /* swallow */
      } finally {
        inFlightRef.current = false;
      }
    })();
  }, [live.signal, live.confidence, live.lastPrice, enabled, symbol, category, timeframe]);
}

// Backward-compat alias for the gold-specific call sites.
export function usePersistGoldLiveSignal(
  live: DerivLiveSignal,
  enabled: boolean,
  symbol: string = "XAUUSD",
  timeframe: "M1" | "M5" = "M5",
) {
  return usePersistLiveSignal(live, enabled, symbol, "gold", timeframe);
}
