import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { DerivLiveSignal } from "./useDerivLiveSignal";

/**
 * Persists fresh BUY/SELL gold signals from the live Deriv engine into
 * `trading_signals` so they appear in:
 *  - Gold Trading Hub (Active Gold Signals)
 *  - Home Latest Trading Signals widget
 *  - /signals page
 *
 * Calls the `persist-live-gold-signal` edge function, which uses the service
 * role to bypass RLS and enforces a 30-minute throttle per direction.
 * Auto-expires after 1 hour via `expires_at`.
 */
export function usePersistGoldLiveSignal(
  live: DerivLiveSignal,
  enabled: boolean,
  symbol: string = "XAUUSD",
) {
  const lastSentRef = useRef<{ direction: string; at: number } | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (inFlightRef.current) return;
    if (live.signal !== "BUY" && live.signal !== "SELL") return;
    if (!live.lastPrice) return;
    if (live.confidence < 65) return;

    const now = Date.now();
    const last = lastSentRef.current;
    // Client-side throttle: skip same-direction within 25 min
    if (last && last.direction === live.signal && now - last.at < 25 * 60 * 1000) {
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
          },
        });
        lastSentRef.current = { direction: live.signal as string, at: now };
      } catch {
        /* swallow */
      } finally {
        inFlightRef.current = false;
      }
    })();
  }, [live.signal, live.confidence, live.lastPrice, enabled, symbol]);
}
