import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BridgeTick {
  symbol: string;
  bid: number | null;
  ask: number | null;
  last_price: number | null;
  ts: string;
}

/**
 * Subscribes to live ticks streamed from the BOTVIO Bridge EA for a single symbol.
 * Returns the latest price + recent history (last N ticks).
 */
export function useBridgeTicks(symbol: string | null, historyLimit = 300) {
  const [ticks, setTicks] = useState<BridgeTick[]>([]);
  const [latest, setLatest] = useState<BridgeTick | null>(null);
  const [hasFeed, setHasFeed] = useState(false);

  useEffect(() => {
    if (!symbol) {
      setTicks([]);
      setLatest(null);
      setHasFeed(false);
      return;
    }

    let cancelled = false;

    // 1) Initial backfill
    (async () => {
      const { data } = await supabase
        .from("bridge_ticks")
        .select("symbol,bid,ask,last_price,ts")
        .eq("symbol", symbol)
        .order("ts", { ascending: false })
        .limit(historyLimit);
      if (cancelled) return;
      const rows = (data ?? []).reverse() as BridgeTick[];
      setTicks(rows);
      const last = rows[rows.length - 1] ?? null;
      setLatest(last);
      // "feed" is considered live if last tick is < 60s old
      setHasFeed(
        !!last && Date.now() - new Date(last.ts).getTime() < 60_000,
      );
    })();

    // 2) Realtime subscription
    const channel = supabase
      .channel(`bridge-ticks-${symbol}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bridge_ticks",
          filter: `symbol=eq.${symbol}`,
        },
        (payload) => {
          const row = payload.new as BridgeTick;
          setLatest(row);
          setHasFeed(true);
          setTicks((prev) => {
            const next = [...prev, row];
            return next.length > historyLimit
              ? next.slice(next.length - historyLimit)
              : next;
          });
        },
      )
      .subscribe();

    // 3) Stale-feed watchdog: if no new tick for 60s, mark as offline
    const watchdog = setInterval(() => {
      setHasFeed((prev) => {
        if (!latest) return false;
        return Date.now() - new Date(latest.ts).getTime() < 60_000;
      });
    }, 10_000);

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      clearInterval(watchdog);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, historyLimit]);

  return { ticks, latest, hasFeed };
}