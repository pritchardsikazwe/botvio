import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crosshair, TrendingUp, TrendingDown, Pause, Activity, Zap, Cpu, Loader2 } from "lucide-react";
import { useDerivLiveSignal } from "@/hooks/useDerivLiveSignal";
import { usePersistLiveSignal } from "@/hooks/usePersistGoldLiveSignal";
import { supabase } from "@/integrations/supabase/client";
import { directAction, useMyMt5Accounts } from "@/hooks/useDirectExecution";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { SyntheticInstrument } from "@/config/synthetics";

interface Props {
  instrument: SyntheticInstrument;
  /** Default stake for the Deriv direct-execution button (USD) */
  defaultStake?: number;
  /** Default multiplier for Deriv MULTUP/MULTDOWN contracts */
  defaultMultiplier?: number;
  /** Notify parent of the live signal so it can plot the marker on the chart */
  onSignalChange?: (sig: { direction: "BUY" | "SELL"; confidence: number } | null) => void;
}

export function SyntheticSignalCard({
  instrument,
  defaultStake = 10,
  defaultMultiplier = 100,
  onSignalChange,
}: Props) {
  const { user } = useAuth();
  const { data: mt5Accounts } = useMyMt5Accounts();
  const [busyDeriv, setBusyDeriv] = useState(false);
  const [busyMt5, setBusyMt5] = useState(false);

  const mt5Account = (mt5Accounts ?? []).find(
    (a) => a.account_role === "slave" && a.tradecopy_active && a.tradecopy_user_id && a.is_active && !a.is_botvio_robot,
  );

  const chartSymbol = instrument.derivSymbol ?? instrument.chartProxy ?? null;
  const live = useDerivLiveSignal(chartSymbol, 300);

  // Persist BUY/SELL signals so they appear on Home + /signals
  usePersistLiveSignal(
    live,
    !!instrument.derivSymbol,
    instrument.mt5Symbol,
    `synthetic-${instrument.category}`,
  );

  const dir: "BUY" | "SELL" | null =
    live.signal === "BUY" || live.signal === "SELL" ? live.signal : null;

  // Forward marker to parent for chart overlay
  useMemo(() => {
    onSignalChange?.(dir ? { direction: dir, confidence: live.confidence } : null);
  }, [dir, live.confidence, onSignalChange]);

  const config = useMemo(() => {
    if (live.signal === "BUY") {
      return { color: "text-emerald-400", border: "border-emerald-500/50", bg: "from-emerald-500/15 via-emerald-500/5 to-transparent", icon: TrendingUp };
    }
    if (live.signal === "SELL") {
      return { color: "text-red-400", border: "border-red-500/50", bg: "from-red-500/15 via-red-500/5 to-transparent", icon: TrendingDown };
    }
    return { color: "text-amber-400", border: "border-amber-500/50", bg: "from-amber-500/15 via-amber-500/5 to-transparent", icon: Pause };
  }, [live.signal]);

  const Icon = config.icon;

  // ─── Execute on Deriv (MULTUP/MULTDOWN multipliers) ──────────────
  const tradeOnDeriv = async (forcedDir?: "BUY" | "SELL") => {
    const direction = forcedDir ?? dir;
    if (!direction) return;
    if (!user) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }
    if (!instrument.derivSymbol) {
      toast({
        title: "Live execution unavailable",
        description: `${instrument.label} is MT5-broker exclusive. Use the MT5 button instead.`,
        variant: "destructive",
      });
      return;
    }
    // Look up the user's active Deriv connection
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
        description: "Link your Deriv account in Connections to enable direct execution.",
        variant: "destructive",
      });
      setBusyDeriv(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("deriv-trade-execute", {
        body: {
          connection_id: conn.id,
          idempotency_key: `synthetic-${instrument.key}-${direction}-${Date.now()}`,
          contract_family: "MULTIPLIERS",
          payload: {
            symbol: instrument.derivSymbol,
            contract_type: direction === "BUY" ? "MULTUP" : "MULTDOWN",
            stake: defaultStake,
            multiplier: defaultMultiplier,
            currency: "USD",
          },
        },
      });
      if (error) throw error;
      if (data?.success === false) throw new Error(data?.error ?? "Trade rejected");
      toast({
        title: `Deriv ${direction} sent`,
        description: `${instrument.label} • Stake $${defaultStake} • x${defaultMultiplier}`,
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

  // ─── Send to MT5 through the current TradeCopy execution path ─────
  // Synthetic Hub must use mt5-direct-execution directly. The old
  // queue-hub-trade/Bridge EA route is retired and can produce legacy
  // "queued / Volume undefined / Terminal undefined" UI messages.
  const sendToMt5 = async (forcedDir?: "BUY" | "SELL") => {
    const direction = forcedDir ?? dir;
    if (!direction) {
      toast({
        title: "No live signal direction",
        description: "Use the manual BUY · MT5 / SELL · MT5 buttons below to send this trade.",
      });
      return;
    }
    if (!user) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }
    if (!mt5Account) {
      toast({
        title: "MT5 TradeCopy follower required",
        description: "Connect and activate an MT5 follower in Connections before sending this synthetic signal.",
        variant: "destructive",
      });
      return;
    }

    setBusyMt5(true);
    try {
      const volume = Number(mt5Account.direct_lot ?? 0.01);
      if (!Number.isFinite(volume) || volume <= 0) throw new Error("MT5 lot size is not configured");

      const result = await directAction<{
        execution?: string;
        adapterMode?: string;
        result?: Record<string, unknown>;
      }>("send_order", {
        account_id: mt5Account.id,
        symbol: instrument.mt5Symbol,
        direction,
        volume,
      });

      const raw = result?.result ?? {};
      const ticket = String(
        raw.ticket ?? raw.orderId ?? raw.order ?? raw.data?.ticket ?? raw.data?.order ?? raw.data?.orderId ?? "",
      );
      const destination = [mt5Account.broker ?? "MT5", mt5Account.server ?? "", mt5Account.login_id ? `Login ${mt5Account.login_id}` : ""]
        .filter(Boolean)
        .join(" · ");
      const mode = String(result?.adapterMode ?? "unknown").toLowerCase();
      const statusLabel = mode === "live" ? "sent" : "accepted (test mode)";
      const ticketText = ticket ? ` · Ticket ${ticket}` : "";

      toast({
        title: `MT5 ${direction} ${statusLabel}`,
        description: `${instrument.label} · ${volume.toFixed(2)} lot · ${destination}${ticketText}`,
      });
    } catch (e: any) {
      toast({
        title: "MT5 TradeCopy send failed",
        description: e?.message ?? "Could not send the synthetic signal through TradeCopy.",
        variant: "destructive",
      });
    } finally {
      setBusyMt5(false);
    }
  };

  const showBuy = instrument.bias === "buy" || instrument.bias === "both" || dir === "BUY";
  const showSell = instrument.bias === "sell" || instrument.bias === "both" || dir === "SELL";

  return (
    <Card className={`relative overflow-hidden bg-gradient-to-br ${config.bg} border-2 ${config.border} transition-all`}>
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Crosshair className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                Botvio AI Signal
              </span>
            </div>
            <h3 className="text-sm font-extrabold text-foreground">{instrument.label}</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">{instrument.blurb}</p>
          </div>
          <Badge variant="outline" className={`text-[9px] ${config.border} ${config.color} font-mono shrink-0`}>
            <Activity className={`h-2.5 w-2.5 mr-1 ${dir ? "animate-pulse" : ""}`} />
            {instrument.derivSymbol ? "LIVE" : "MT5-ONLY"}
          </Badge>
        </div>

        {/* Signal label */}
        <div className="flex items-center gap-3 bg-background/40 rounded-lg p-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.bg} border ${config.border} flex items-center justify-center`}>
            <Icon className={`h-6 w-6 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-xl font-black tracking-tight ${config.color}`}>{live.signal}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    live.confidence >= 70 ? "bg-emerald-500" : live.confidence >= 50 ? "bg-amber-500" : "bg-red-500"
                  }`}
                  style={{ width: `${live.confidence}%` }}
                />
              </div>
              <span className={`text-[10px] font-bold ${config.color}`}>{live.confidence}%</span>
            </div>
            {live.lastPrice !== null && (
              <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                Last: {live.lastPrice.toFixed(4)}
              </div>
            )}
          </div>
        </div>

        {/* Engine performance */}
        <div className="rounded-lg border border-border/40 bg-background/30 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">BOTVIO {live.mode} Engine</span>
            <Badge variant="outline" className="text-[9px]">{live.timeframe}</Badge>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{live.reason}</p>
          <div className="grid grid-cols-4 gap-2">
            <div><div className="text-[9px] text-muted-foreground">Signals</div><div className="text-xs font-bold">{live.backtest.signals}</div></div>
            <div><div className="text-[9px] text-muted-foreground">Win rate</div><div className="text-xs font-bold">{live.backtest.winRate == null ? "—" : live.backtest.winRate.toFixed(1) + "%"}</div></div>
            <div><div className="text-[9px] text-muted-foreground">PF</div><div className="text-xs font-bold">{live.backtest.profitFactor == null ? "—" : live.backtest.profitFactor.toFixed(2)}</div></div>
            <div><div className="text-[9px] text-muted-foreground">Expectancy</div><div className="text-xs font-bold">{live.backtest.expectancyR == null ? "—" : (live.backtest.expectancyR >= 0 ? "+" : "") + live.backtest.expectancyR.toFixed(2) + "R"}</div></div>
          </div>
        </div>

        {/* Execute buttons — user picks per-signal */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            size="sm"
            disabled={busyDeriv || !instrument.derivSymbol}
            onClick={() => tradeOnDeriv()}
            className="h-8 text-[11px] font-bold bg-primary/90 hover:bg-primary"
          >
            {busyDeriv ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Zap className="h-3 w-3 mr-1" />}
            Trade on Deriv
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busyMt5}
            onClick={() => sendToMt5()}
            className="h-8 text-[11px] font-bold border-primary/40 hover:bg-primary/10"
          >
            {busyMt5 ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Cpu className="h-3 w-3 mr-1" />}
            Send to MT5
          </Button>
        </div>

        {/* When signal is WAIT (or bias allows both sides), expose explicit BUY/SELL choice. */}
        {!dir && (
          <div className="flex items-center gap-2 pt-1 border-t border-border/30">
            <span className="text-[10px] text-muted-foreground">Manual:</span>
            {(instrument.bias === "buy" || instrument.bias === "both") && (
              <>
                <Button size="sm" variant="ghost" className="h-6 text-[10px] text-emerald-400 hover:bg-emerald-500/10" onClick={() => tradeOnDeriv("BUY")}>BUY · Deriv</Button>
                <Button size="sm" variant="ghost" className="h-6 text-[10px] text-emerald-400 hover:bg-emerald-500/10" onClick={() => sendToMt5("BUY")}>BUY · MT5</Button>
              </>
            )}
            {(instrument.bias === "sell" || instrument.bias === "both") && (
              <>
                <Button size="sm" variant="ghost" className="h-6 text-[10px] text-red-400 hover:bg-red-500/10" onClick={() => tradeOnDeriv("SELL")}>SELL · Deriv</Button>
                <Button size="sm" variant="ghost" className="h-6 text-[10px] text-red-400 hover:bg-red-500/10" onClick={() => sendToMt5("SELL")}>SELL · MT5</Button>
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}