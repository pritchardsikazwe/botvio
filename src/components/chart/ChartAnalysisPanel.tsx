import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, TrendingDown, Shield, Clock, Newspaper,
  Lightbulb, BarChart3, Activity,
} from "lucide-react";
import { useState, useEffect } from "react";

interface ChartAnalysisPanelProps {
  signal: any;
  metrics: any;
  indicator: any;
  symbol: string;
}

function Countdown({ targetTime }: { targetTime: string }) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    const update = () => {
      const diff = new Date(targetTime).getTime() - Date.now();
      if (diff <= 0) { setRemaining("Now"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(`${h}h ${String(m).padStart(2, "0")}m`);
    };
    update();
    const iv = setInterval(update, 60000);
    return () => clearInterval(iv);
  }, [targetTime]);
  return <span className="font-mono text-xs font-bold text-primary">{remaining}</span>;
}

export function ChartAnalysisPanel({ signal, metrics, indicator, symbol }: ChartAnalysisPanelProps) {
  return (
    <Card className="bg-card border-border/50 rounded-xl">
      <CardContent className="p-4 space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" /> Analysis
        </h3>

        {/* Trend */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">Trend</span>
          <span className={`text-xs font-bold capitalize flex items-center gap-1 ${
            indicator?.trend === "bullish" ? "text-success" : indicator?.trend === "bearish" ? "text-destructive" : "text-muted-foreground"
          }`}>
            {indicator?.trend === "bullish" ? <TrendingUp className="h-3.5 w-3.5" /> : indicator?.trend === "bearish" ? <TrendingDown className="h-3.5 w-3.5" /> : null}
            {indicator?.trend || "—"}
          </span>
        </div>

        {/* RSI */}
        {indicator?.rsi_14 != null && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">RSI (14)</span>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-mono font-bold ${
                Number(indicator.rsi_14) > 70 ? "text-destructive" : Number(indicator.rsi_14) < 30 ? "text-success" : "text-foreground"
              }`}>
                {Number(indicator.rsi_14).toFixed(1)}
              </span>
              {Number(indicator.rsi_14) > 70 && <Badge variant="outline" className="text-[9px] py-0 text-destructive border-destructive/30">OB</Badge>}
              {Number(indicator.rsi_14) < 30 && <Badge variant="outline" className="text-[9px] py-0 text-success border-success/30">OS</Badge>}
            </div>
          </div>
        )}

        {/* Support / Resistance */}
        {metrics && (metrics.support_1 != null || metrics.resistance_1 != null) && (
          <div className="space-y-2 bg-muted/20 rounded-lg p-3 border border-border/30">
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-primary" /> Key Levels
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-success font-bold">S1</span>
                <span className="font-mono font-semibold text-foreground">{metrics.support_1 ? Number(metrics.support_1).toFixed(2) : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-destructive font-bold">R1</span>
                <span className="font-mono font-semibold text-foreground">{metrics.resistance_1 ? Number(metrics.resistance_1).toFixed(2) : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-success/60 font-bold">S2</span>
                <span className="font-mono font-semibold text-foreground/70">{metrics.support_2 ? Number(metrics.support_2).toFixed(2) : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-destructive/60 font-bold">R2</span>
                <span className="font-mono font-semibold text-foreground/70">{metrics.resistance_2 ? Number(metrics.resistance_2).toFixed(2) : "—"}</span>
              </div>
            </div>
          </div>
        )}

        {/* Session */}
        {metrics?.current_session && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-primary" /> Session
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] py-0 font-bold text-primary border-primary/40 bg-primary/10">
                {metrics.current_session}
              </Badge>
              {metrics.next_session && metrics.next_session_open_at && (
                <span className="text-[10px] text-muted-foreground">
                  → {metrics.next_session} <Countdown targetTime={metrics.next_session_open_at} />
                </span>
              )}
            </div>
          </div>
        )}

        {/* News */}
        {metrics?.next_high_impact_event && (
          <div className="bg-destructive/10 border border-destructive/25 rounded-lg px-3 py-2">
            <div className="flex items-center gap-1.5 mb-1">
              <Newspaper className="h-3.5 w-3.5 text-destructive" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-destructive">Next News</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="truncate max-w-[70%] text-foreground font-medium">
                {metrics.next_high_impact_currency} — {metrics.next_high_impact_event}
              </span>
              {metrics.next_high_impact_time && <Countdown targetTime={metrics.next_high_impact_time} />}
            </div>
          </div>
        )}

        {/* 4H Block */}
        {metrics?.current_4h_block && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium flex items-center gap-1">
              <BarChart3 className="h-3.5 w-3.5 text-primary" /> 4H Block
            </span>
            <Badge variant="outline" className="text-[10px] py-0 font-bold bg-primary/10 border-primary/30 text-primary">
              {metrics.current_4h_block}
            </Badge>
          </div>
        )}

        {/* AI Tip */}
        {metrics?.market_tip && (
          <div className="bg-primary/8 border border-primary/25 rounded-lg px-3 py-2">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-[11px] text-foreground leading-relaxed font-medium">{metrics.market_tip}</p>
            </div>
          </div>
        )}

        {/* Small Account Warning */}
        <div className="bg-warning/10 border border-warning/25 rounded-lg px-3 py-2.5">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <p className="text-sm text-foreground leading-relaxed font-medium">
              This signal may have a wide stop loss and take profit. Traders with small accounts should adjust position size carefully.
            </p>
          </div>
        </div>

        {/* AI Summary */}
        {signal?.ai_summary && (
          <div className="border-t border-border/30 pt-3">
            <p className="text-[11px] text-foreground/70 leading-relaxed">{signal.ai_summary}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
