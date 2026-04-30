import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

export interface HubSignalSnapshot {
  signal: "BUY" | "SELL" | "WAIT" | "HOLD";
  confidence: number;
}

interface Options {
  /** Symbol to execute on MT5 (e.g. "XAUUSD", "BTCUSD", "EURUSD") */
  symbol: string;
  /** Live signal snapshot from useDerivLiveSignal */
  live: HubSignalSnapshot;
  /** Only fire when market is open & loaded */
  enabled: boolean;
  /** Minimum confidence required to auto-execute (default 70) */
  minConfidence?: number;
  /** Source label for logging (e.g. "gold-hub", "btc-hub") */
  source?: string;
}

/**
 * Auto-routes hub BUY/SELL signals to the user's MT5 Bridge EA.
 * - Reads `user_mt5_terminals` to confirm at least one terminal has auto_execute=true
 * - De-duplicates: only fires once per (symbol + direction) per session unless signal flips
 * - Calls the `queue-hub-trade` edge function which inserts into `mt5_commands`
 */
export function useMt5HubExecution({
  symbol,
  live,
  enabled,
  minConfidence = 70,
  source = "hub-signal",
}: Options) {
  const { user } = useAuth();
  const lastFiredRef = useRef<string | null>(null);

  // Has the user enabled auto-execute on at least one terminal?
  const { data: hasAutoTerminal } = useQuery({
    queryKey: ["mt5-auto-terminal", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_mt5_terminals")
        .select("id")
        .eq("user_id", user!.id)
        .eq("auto_execute", true)
        .limit(1);
      return (data?.length ?? 0) > 0;
    },
    refetchInterval: 30_000,
  });

  // Per-symbol "Auto-send to MT5" toggle from user_settings.hub_auto_mt5_symbols
  const { data: hubAutoEnabled } = useQuery({
    queryKey: ["hub-auto-mt5", user?.id, symbol],
    enabled: !!user?.id && !!symbol,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_settings")
        .select("hub_auto_mt5_symbols")
        .eq("user_id", user!.id)
        .maybeSingle();
      const map = (data?.hub_auto_mt5_symbols as Record<string, boolean> | null) ?? {};
      return map[symbol] === true;
    },
    refetchInterval: 15_000,
  });

  useEffect(() => {
    if (!user || !enabled || !hasAutoTerminal || !hubAutoEnabled) return;
    if (live.signal !== "BUY" && live.signal !== "SELL") return;
    if (live.confidence < minConfidence) return;

    const key = `${symbol}:${live.signal}`;
    if (lastFiredRef.current === key) return; // already fired this direction

    lastFiredRef.current = key;

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        if (!accessToken) return;

        const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/queue-hub-trade`;
        const resp = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            symbol,
            direction: live.signal,
            source,
          }),
        });
        const json = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          console.warn("[MT5 Auto] Failed to queue trade:", json);
          toast({
            title: "MT5 auto-execute failed",
            description: json?.error ?? "Could not queue trade.",
            variant: "destructive",
          });
          // allow retry next signal cycle
          lastFiredRef.current = null;
          return;
        }
        toast({
          title: `MT5 trade queued: ${live.signal} ${symbol}`,
          description: json.adjusted
            ? `Volume auto-adjusted to ${json.volume} (broker min for ${symbol}) • Terminal ${json.terminal_uid?.slice(0, 8)}…`
            : `Volume ${json.volume} • Terminal ${json.terminal_uid?.slice(0, 8)}…`,
        });
      } catch (err) {
        console.error("[MT5 Auto] Error:", err);
        lastFiredRef.current = null;
      }
    })();
  }, [user, enabled, hasAutoTerminal, hubAutoEnabled, live.signal, live.confidence, symbol, minConfidence, source]);
}
