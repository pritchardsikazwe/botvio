import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crosshair, TrendingUp, TrendingDown, Pause, Shield, Activity, Cpu, Loader2 } from "lucide-react";
import { useBridgeLiveSignal } from "@/hooks/useBridgeLiveSignal";
import { usePersistLiveSignal } from "@/hooks/usePersistGoldLiveSignal";
import { useMt5HubExecution } from "@/hooks/useMt5HubExecution";
import { HubAutoMt5Toggle } from "@/components/trading/HubAutoMt5Toggle";
import type { DerivSignalType } from "@/hooks/useDerivLiveSignal";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

interface Props {
  /** Exact MT5 ticker, e.g. "GainX 400" or "FX VOL 40" */
  mt5Symbol: string;
  /** Display label */
  label: string;
  category: string;
  bias: "buy" | "sell" | "both";
}

const CFG: Record<DerivSignalType, { bg: string; border: string; text: string; icon: typeof TrendingUp; pulse: string; label: string }> = {
  BUY:  { bg: "from-emerald-500/20 via-emerald-500/10 to-transparent", border: "border-emerald-500/50", text: "text-emerald-400", icon: TrendingUp, pulse: "animate-[pulse_1.5s_ease-in-out_infinite]", label: "BUY" },
  SELL: { bg: "from-red-500/20 via-red-500/10 to-transparent", border: "border-red-500/50", text: "text-red-400", icon: TrendingDown, pulse: "animate-[pulse_1.5s_ease-in-out_infinite]", label: "SELL" },
  WAIT: { bg: "from-amber-500/20 via-amber-500/10 to-transparent", border: "border-amber-500/50", text: "text-amber-400", icon: Pause, pulse: "", label: "WAIT" },
  HOLD: { bg: "from-blue-500/20 via-blue-500/10 to-transparent", border: "border-blue-500/50", text: "text-blue-400", icon: Shield, pulse: "", label: "HOLD" },
};

export function SyntxHauzaSignalButton({ mt5Symbol, label, category, bias }: Props) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const live = useBridgeLiveSignal(mt5Symbol);

  // Persist BUY/SELL >65% confidence to trading_signals so they appear in the Signals tab + history
  usePersistLiveSignal(live, true, mt5Symbol, "weltrade-syntx", "M5");

  // Auto-execute on user's Bridge EA when they have HubAutoMt5Toggle enabled
  useMt5HubExecution({
    symbol: mt5Symbol,
    live,
    enabled: true,
    source: "weltrade-hub",
  });

  const cfg = CFG[live.signal];
  const Icon = cfg.icon;

  const sendToMt5 = async (forcedDir?: "BUY" | "SELL") => {
    const direction = forcedDir ?? (live.signal === "BUY" || live.signal === "SELL" ? live.signal : null);
    if (!direction) return;
    if (!user) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("queue-hub-trade", {
        body: { symbol: mt5Symbol, direction, source: "weltrade-hub" },
      });
      if (error || data?.error) throw new Error(error?.message ?? data?.error ?? "MT5 queue failed");
      toast({
        title: `MT5 ${direction} queued`,
        description: `${label} • Volume ${data.volume} • Terminal ${String(data.terminal_uid ?? "").slice(0, 12)}`,
      });
    } catch (e: any) {
      toast({ title: "MT5 queue failed", description: e?.message ?? "Check Bridge EA terminal link.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className={`relative overflow-hidden bg-gradient-to-br ${cfg.bg} ${cfg.border} border-2 transition-all duration-500`}>
      <div className="relative p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Crosshair className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs font-bold text-foreground truncate">{label}</span>
            <Badge variant="outline" className="text-[10px] border-warning/40 text-warning shrink-0">{category}</Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <Activity className={`h-3 w-3 ${cfg.text} ${cfg.pulse}`} />
            <Badge variant="outline" className={`text-[10px] ${cfg.border} ${cfg.text} font-mono`}>
              {live.connected ? "LIVE" : "OFFLINE"}
            </Badge>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 py-1">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${cfg.bg} border ${cfg.border} flex items-center justify-center ${cfg.pulse}`}>
            <Icon className={`h-8 w-8 ${cfg.text}`} />
          </div>
          <span className={`text-xl font-black tracking-tight ${cfg.text}`}>{cfg.label}</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">Confidence</span>
            <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  live.confidence >= 70 ? "bg-emerald-500" : live.confidence >= 50 ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${live.confidence}%` }}
              />
            </div>
            <span className={`text-[11px] font-bold ${cfg.text}`}>{live.confidence}%</span>
          </div>
        </div>

        <div className="space-y-1.5 bg-background/30 rounded-lg p-2.5">
          <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">{live.strategy}</Badge>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{live.reason}</p>
          <p className="text-[10px] text-muted-foreground/80">
            Bias: <span className="font-bold text-foreground uppercase">{bias}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" variant="outline" disabled={busy} onClick={() => sendToMt5("BUY")} className="h-8 text-[11px] font-bold border-success/40 text-success hover:bg-success/10">
            {busy ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Cpu className="h-3 w-3 mr-1" />} BUY · MT5
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => sendToMt5("SELL")} className="h-8 text-[11px] font-bold border-destructive/40 text-destructive hover:bg-destructive/10">
            {busy ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Cpu className="h-3 w-3 mr-1" />} SELL · MT5
          </Button>
        </div>

        <HubAutoMt5Toggle symbol={mt5Symbol} label={label} />

        <p className="text-[10px] text-muted-foreground/60 text-center">
          Hauza signal engine • Bridge ticks → 1m candles • Not financial advice
        </p>
      </div>
    </Card>
  );
}