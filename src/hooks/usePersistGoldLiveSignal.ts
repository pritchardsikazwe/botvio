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
 * Rules:
 *  - Only persist BUY or SELL with confidence >= 65
 *  - Throttle to one insert per direction per 30 minutes (prevents spam)
 *  - expires_at = now + 1 hour (auto-expiry handled by existing widget logic)
 */
export function usePersistGoldLiveSignal(
  live: DerivLiveSignal,
  enabled: boolean,
  symbol: string = "XAUUSD",
) {
  const lastInsertRef = useRef<{ direction: string; at: number } | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (inFlightRef.current) return;
    if (live.signal !== "BUY" && live.signal !== "SELL") return;
    if (!live.lastPrice) return;
    if (live.confidence < 65) return;

    const now = Date.now();
    const last = lastInsertRef.current;
    // Throttle: same direction within 30 min → skip
    if (last && last.direction === live.signal && now - last.at < 30 * 60 * 1000) {
      return;
    }

    inFlightRef.current = true;

    (async () => {
      try {
        // Check DB for any recent signal (any user) to avoid duplicates across tabs
        const thirtyMinAgo = new Date(now - 30 * 60 * 1000).toISOString();
        const { data: existing } = await supabase
          .from("trading_signals")
          .select("id, direction, created_at")
          .eq("symbol", symbol)
          .eq("status", "ACTIVE")
          .eq("direction", live.signal)
          .gte("created_at", thirtyMinAgo)
          .limit(1);

        if (existing && existing.length > 0) {
          lastInsertRef.current = { direction: live.signal, at: now };
          return;
        }

        const price = live.lastPrice!;
        const isBuy = live.signal === "BUY";
        // Gold typical move: ~0.5% TP, 0.3% SL
        const tp = isBuy ? price * 1.005 : price * 0.995;
        const sl = isBuy ? price * 0.997 : price * 1.003;
        const expiresAt = new Date(now + 60 * 60 * 1000).toISOString(); // 1 hour

        const { error } = await supabase.from("trading_signals").insert({
          symbol,
          direction: live.signal,
          entry_price: Number(price.toFixed(2)),
          stop_loss: Number(sl.toFixed(2)),
          take_profit: Number(tp.toFixed(2)),
          timeframe: "M5",
          category: "commodity",
          broker: ["exness", "deriv", "weltrade"],
          confidence: Math.round(live.confidence),
          reason: `Live engine: ${live.strategy}. ${live.reason}`,
          strategy_name: `Botvio Live · ${live.strategy}`,
          status: "ACTIVE",
          is_manual: false,
          expires_at: expiresAt,
        });

        if (!error) {
          lastInsertRef.current = { direction: live.signal, at: now };
        }
      } catch {
        /* swallow */
      } finally {
        inFlightRef.current = false;
      }
    })();
  }, [live.signal, live.confidence, live.lastPrice, enabled, symbol]);
}
