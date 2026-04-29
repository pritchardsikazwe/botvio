import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface ScalpExecPayload {
  /** Display symbol, e.g. "XAU/USD", "EUR/USD", "BTC/USD" */
  displaySymbol: string;
  /** Deriv WS symbol if known, e.g. "frxXAUUSD", "cryBTCUSD" */
  derivSymbol?: string | null;
  direction: "BUY" | "SELL";
  entry: number;
  sl: number;
  tp: number;
  /** For Deriv MULTIPLIERS */
  defaultStake?: number;
  defaultMultiplier?: number;
  /** Used in idempotency keys */
  source?: string;
}

/**
 * Reusable executor for Botvio Scalp Robot signals.
 * - sendToMt5  → queue-hub-trade edge function (MT5 Bridge EA picks it up)
 * - sendToDeriv → deriv-trade-execute edge function (MULTIPLIERS family)
 */
export function useSendScalpSignal() {
  const { user } = useAuth();
  const [busyMt5, setBusyMt5] = useState(false);
  const [busyDeriv, setBusyDeriv] = useState(false);

  const sendToMt5 = async (p: ScalpExecPayload) => {
    if (!user) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }
    setBusyMt5(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error("No session");

      const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/queue-hub-trade`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          symbol: p.displaySymbol.replace("/", ""),
          direction: p.direction,
          sl: p.sl,
          tp: p.tp,
          source: p.source ?? "scalp-robot",
        }),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(json?.error ?? "Could not queue trade");
      toast({
        title: `MT5 ${p.direction} queued`,
        description: json.adjusted
          ? `Volume auto-adjusted to ${json.volume} (broker min) • ${p.displaySymbol}`
          : `Volume ${json.volume} • ${p.displaySymbol}`,
      });
    } catch (e: any) {
      toast({
        title: "MT5 trade failed",
        description: e?.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusyMt5(false);
    }
  };

  const sendToDeriv = async (p: ScalpExecPayload) => {
    if (!user) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }
    if (!p.derivSymbol) {
      toast({
        title: "Deriv execution unavailable",
        description: "This asset isn't routable to Deriv. Use the MT5 button instead.",
        variant: "destructive",
      });
      return;
    }
    setBusyDeriv(true);
    try {
      const { data: conns } = await supabase
        .from("deriv_connections")
        .select("id, is_connected, login_id")
        .eq("user_id", user.id)
        .order("is_connected", { ascending: false })
        .order("updated_at", { ascending: false })
        .limit(5);
      const conn = conns?.find((c) => c.is_connected) ?? conns?.[0];
      if (!conn) {
        toast({
          title: "Connect Deriv first",
          description: "Link your Deriv account under Connections to enable direct execution.",
          variant: "destructive",
        });
        return;
      }

      const stake = p.defaultStake ?? 1;
      const multiplier = p.defaultMultiplier ?? 100;
      const { data, error } = await supabase.functions.invoke("deriv-trade-execute", {
        body: {
          connection_id: conn.id,
          idempotency_key: `${p.source ?? "scalp"}-${p.displaySymbol}-${p.direction}-${Date.now()}`,
          contract_family: "MULTIPLIERS",
          payload: {
            symbol: p.derivSymbol,
            contract_type: p.direction === "BUY" ? "MULTUP" : "MULTDOWN",
            stake,
            multiplier,
            currency: "USD",
          },
        },
      });
      if (error) throw error;
      if (data?.success === false) throw new Error(data?.error ?? "Trade rejected");
      toast({
        title: `Deriv ${p.direction} sent`,
        description: `${p.displaySymbol} • Stake $${stake} • x${multiplier}`,
      });
    } catch (e: any) {
      toast({
        title: "Deriv trade failed",
        description: e?.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusyDeriv(false);
    }
  };

  return { sendToMt5, sendToDeriv, busyMt5, busyDeriv };
}