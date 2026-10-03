import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";
import { directAction, useMyMt5Accounts } from "@/hooks/useDirectExecution";
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
 * Dispatches the AI-Chart Analysis recommendation to the user's connected
 * TradeCopy MT5 follower. No Bridge EA or VPS terminal is involved.
 */
export function ChartSendToMt5Button({ symbol, recommendation, stopLoss, takeProfit }: Props) {
  const { user } = useAuth();
  const { data: accounts } = useMyMt5Accounts();
  const [busy, setBusy] = useState(false);
  const account = (accounts ?? []).find((a) => a.account_role === "slave" && a.tradecopy_active && a.tradecopy_user_id);


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
      if (!account) throw new Error("Connect and activate an MT5 follower through TradeCopy first");
      const sl = typeof stopLoss === "number" && Number.isFinite(stopLoss) && stopLoss > 0 ? stopLoss : undefined;
      const tp = typeof takeProfit === "number" && Number.isFinite(takeProfit) && takeProfit > 0 ? takeProfit : undefined;
      const result = await directAction<{ result?: { ticket?: string } }>("send_order", {
        account_id: account.id,
        symbol,
        direction,
        volume: Number(account.direct_lot ?? 0.01),
        stop_loss: sl,
        take_profit: tp,
      });
      toast({
        title: `MT5 ${direction} sent via TradeCopy`,
        description: `${symbol} • Volume ${account.direct_lot ?? 0.01} • SL ${sl ?? "—"} / TP ${tp ?? "—"}`,
      });
    } catch (e: any) {
      toast({
        title: "MT5 queue failed",
        description: e?.message ?? "Connect and activate an MT5 TradeCopy follower under Connections.",
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