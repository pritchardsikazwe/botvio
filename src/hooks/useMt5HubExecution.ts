// DEPRECATED path (Bridge EA / VPS). Kept until TradeCopy demo verification succeeds — see docs/TRADECOPY.md.
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

export interface HubSignalSnapshot {
  signal: "BUY" | "SELL" | "WAIT" | "HOLD";
  confidence: number;
  /** Latest price — used to derive SL/TP brackets when sending to MT5 */
  lastPrice?: number | null;
}

/**
 * Per-symbol scalp brackets for 1-minute hub signals.
 * Tighter than the default 0.25% / 0.5% so trades close fast on M1.
 * Add new symbols here as scalping rolls out.
 */
const SCALP_BRACKETS: Record<string, { slPct: number; tpPct: number }> = {
  XAUUSD: { slPct: 0.0008, tpPct: 0.0012 }, // Gold:    ~$2 SL / ~$3 TP @ $2500
  XAGUSD: { slPct: 0.0010, tpPct: 0.0015 }, // Silver:  slightly wider, lower price
  BTCUSD: { slPct: 0.0010, tpPct: 0.0015 }, // Bitcoin: ~$60 SL / ~$90 TP @ $60k
};

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
  /** Stop-loss as a fraction of price (overrides per-symbol scalp default) */
  slPct?: number;
  /** Take-profit as a fraction of price (overrides per-symbol scalp default) */
  tpPct?: number;
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
  slPct,
  tpPct,
}: Options) {
  // Choose scalp brackets: explicit override > symbol-specific scalp > legacy default
  const scalp = SCALP_BRACKETS[symbol.toUpperCase()];
  const effSlPct = slPct ?? scalp?.slPct ?? 0.0025;
  const effTpPct = tpPct ?? scalp?.tpPct ?? 0.005;

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

  // Is shared demo MT5 enabled by admin AND opted-in by user?
  const { data: demoEnabled } = useQuery({
    queryKey: ["demo-mt5-active", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const [{ data: us }, { data: cfg }] = await Promise.all([
        supabase.from("user_settings").select("use_demo_mt5").eq("user_id", user!.id).maybeSingle(),
        supabase.from("app_settings").select("value").eq("key", "demo_mt5").maybeSingle(),
      ]);
      const v = (cfg?.value ?? {}) as { enabled?: boolean; terminal_uid?: string };
      return !!us?.use_demo_mt5 && !!v.enabled && !!v.terminal_uid;
    },
    refetchInterval: 60_000,
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
    if (!user || !enabled || !hubAutoEnabled) return;
    // Allow either personal terminal OR shared demo MT5
    if (!hasAutoTerminal && !demoEnabled) {
      // Fall through to paper-trade simulation below
    }
    if (live.signal !== "BUY" && live.signal !== "SELL") return;
    if (live.confidence < minConfidence) return;

    const key = `${symbol}:${live.signal}`;
    if (lastFiredRef.current === key) return; // already fired this direction

    lastFiredRef.current = key;

    (async () => {
      try {
        // Compute SL/TP from the latest price
        let sl: number | undefined;
        let tp: number | undefined;
        const px = live.lastPrice;
        if (typeof px === "number" && px > 0) {
          const isBuy = live.signal === "BUY";
          const slRaw = isBuy ? px * (1 - effSlPct) : px * (1 + effSlPct);
          const tpRaw = isBuy ? px * (1 + effTpPct) : px * (1 - effTpPct);
          sl = Number(slRaw.toFixed(5));
          tp = Number(tpRaw.toFixed(5));
        }

        // No MT5 path → record a paper trade (simulation)
        if (!hasAutoTerminal && !demoEnabled) {
          if (typeof px !== "number" || px <= 0) return;
          const { error: ptErr } = await supabase.from("paper_trades").insert({
            user_id: user.id,
            symbol,
            direction: live.signal,
            lot: 0.01,
            entry_price: Number(px.toFixed(5)),
            sl,
            tp,
            source: `paper:${source}`,
            status: "OPEN",
          });
          if (ptErr) {
            console.warn("[Paper] insert failed:", ptErr);
            lastFiredRef.current = null;
            return;
          }
          toast({
            title: `📝 Paper trade opened: ${live.signal} ${symbol}`,
            description: `Entry ${px.toFixed(5)} · SL ${sl ?? "—"} / TP ${tp ?? "—"} · Connect MT5 to trade live.`,
          });
          return;
        }

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
            ...(sl ? { sl } : {}),
            ...(tp ? { tp } : {}),
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
          title: `${json.demo ? "🧪 Demo " : ""}MT5 trade queued: ${live.signal} ${symbol}`,
          description: json.adjusted
            ? `Vol ${json.volume} (broker min) • SL ${sl ?? "—"} / TP ${tp ?? "—"}`
            : `Vol ${json.volume} • SL ${sl ?? "—"} / TP ${tp ?? "—"}`,
        });
      } catch (err) {
        console.error("[MT5 Auto] Error:", err);
        lastFiredRef.current = null;
      }
    })();
  }, [user, enabled, hasAutoTerminal, demoEnabled, hubAutoEnabled, live.signal, live.confidence, live.lastPrice, symbol, minConfidence, source, effSlPct, effTpPct]);
}
