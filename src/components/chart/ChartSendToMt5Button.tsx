import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Props {
  /** Symbol from chart context, e.g. "XAUUSD", "BTCUSD", "EURUSD", "Boom 500 Index", "PainX 10" */
  symbol: string | null | undefined;
  /** Direction from AI analysis */
  recommendation: string | null | undefined; // BUY | SELL | HOLD
  /** Optional Stop-Loss price from AI */
  stopLoss?: number | null;
  /** Optional Take-Profit price from AI */
  takeProfit?: number | null;
}

/**
 * Dispatches the AI-Chart Analysis recommendation to the user's MT5 Bridge EA
 * via the queue-hub-trade edge function. Symbol is sent verbatim — the edge
 * function handles broker-specific normalisation and minimum-lot clamping.
 */
export function ChartSendToMt5Button({ symbol, recommendation, stopLoss, takeProfit }: Props) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  const direction = (recommendation ?? "").toUpperCase() === "SELL" ? "SELL"
    : (recommendation ?? "").toUpperCase() === "BUY" ? "BUY"
    : null;

  const disabled = !symbol || !direction;

  const handle = async () => {
    if (!user) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }
    if (!symbol || !direction) return;
    setBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error("No active session");
      const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/queue-hub-trade`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          symbol,
          direction,
          sl: typeof stopLoss === "number" && stopLoss > 0 ? stopLoss : undefined,
          tp: typeof takeProfit === "number" && takeProfit > 0 ? takeProfit : undefined,
          source: "ai-chart-analysis",
        }),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(json?.error ?? "MT5 queue failed");
      toast({
        title: `MT5 ${direction} queued`,
        description: `${symbol} • Volume ${json.volume} • Terminal ${json.terminal_uid?.slice(0, 8)}…`,
      });
    } catch (e: any) {
      toast({
        title: "MT5 queue failed",
        description: e?.message ?? "Add your Bridge EA terminal under Connections.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  if (disabled) return null;

  return (
    <Button
      type="button"
      onClick={handle}
      disabled={busy}
      size="sm"
      className={
        direction === "BUY"
          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
          : "bg-red-600 hover:bg-red-700 text-white"
      }
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
      Send {direction} to MT5
    </Button>
  );
}