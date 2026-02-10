import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, CheckCircle2, Pause, AlertTriangle, Shield } from "lucide-react";
import type { SignalResult } from "@/lib/signalEngines";
import type { RiskSession, TradeBlockReason } from "@/lib/riskGuardrails";

interface SignalPanelProps {
  signal: SignalResult | null;
  riskSession: RiskSession;
  blockReason: TradeBlockReason;
  blockMessage: string;
}

const SignalBadge = ({ signal }: { signal: SignalResult }) => {
  if (signal.signal === "WAIT") {
    return (
      <Badge variant="outline" className="text-sm px-3 py-1 gap-1.5">
        <Pause className="h-3.5 w-3.5" /> WAIT
      </Badge>
    );
  }
  const isPositive = ["RISE", "HIGHER", "EVEN", "OVER", "MATCH", "UP", "BUY"].includes(signal.signal);
  return (
    <Badge className={`text-sm px-3 py-1 gap-1.5 ${isPositive ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>
      <CheckCircle2 className="h-3.5 w-3.5" /> {signal.signal}
    </Badge>
  );
};

export const SignalPanel = memo(({ signal, riskSession, blockReason, blockMessage }: SignalPanelProps) => {
  if (!signal) {
    return (
      <Card className="glass-card">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          <Activity className="h-8 w-8 mx-auto mb-2 animate-pulse" />
          Waiting for tick data…
        </CardContent>
      </Card>
    );
  }

  const confColor = signal.confidence >= 75 ? "text-emerald-400" : signal.confidence >= 60 ? "text-amber-400" : "text-red-400";

  return (
    <Card className="glass-card space-y-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Trade Signal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Signal + Confidence */}
        <div className="flex items-center justify-between">
          <SignalBadge signal={signal} />
          <div className="text-right">
            <div className={`text-xl font-bold font-mono ${confColor}`}>{signal.confidence}%</div>
            <div className="text-[10px] text-muted-foreground">confidence</div>
          </div>
        </div>

        <Progress value={signal.confidence} className="h-1.5" />

        {/* Meta */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Valid for: </span>
            <span className="font-medium">{signal.validFor}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Timing: </span>
            <span className={`font-medium ${signal.timing === "Good" ? "text-emerald-400" : signal.timing === "Okay" ? "text-amber-400" : "text-red-400"}`}>{signal.timing}</span>
          </div>
          {signal.suggestedDuration && (
            <div>
              <span className="text-muted-foreground">Duration: </span>
              <span className="font-medium">{signal.suggestedDuration}t</span>
            </div>
          )}
          {signal.suggestedMultiplier && (
            <div>
              <span className="text-muted-foreground">Multiplier: </span>
              <span className="font-medium">x{signal.suggestedMultiplier}</span>
            </div>
          )}
        </div>

        {/* Reasons */}
        <div className="space-y-1">
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Why</div>
          {signal.reasons.map((r, i) => (
            <div key={i} className="text-xs flex items-start gap-1.5">
              <span className="text-primary mt-0.5">•</span>
              <span>{r}</span>
            </div>
          ))}
        </div>

        {/* Bias Strip */}
        {signal.biasStrip && signal.biasStrip.length > 0 && (
          <div className="space-y-1">
            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Bias (ticks)</div>
            <div className="flex gap-0.5 font-mono text-sm">
              {signal.biasStrip.map((b, i) => (
                <span key={i} className={b === "↑" ? "text-emerald-400" : b === "↓" ? "text-red-400" : "text-muted-foreground"}>
                  {b}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Risk Guardrails */}
        <div className="pt-2 border-t border-border/50 space-y-1">
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Shield className="h-3 w-3" /> Risk Guardrails
          </div>
          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <div>
              <span className="text-muted-foreground">Trades: </span>
              <span className="font-medium">{riskSession.tradesThisSession}/{riskSession.maxTradesPerSession}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Losses: </span>
              <span className={`font-medium ${riskSession.lossesInRow >= 2 ? "text-red-400" : ""}`}>
                {riskSession.lossesInRow}/{riskSession.maxLossesInRow}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Cooldown: </span>
              <span className="font-medium">{blockReason === "cooldown" || blockReason === "loss_streak_lock" ? "ON" : "OFF"}</span>
            </div>
          </div>

          {blockReason && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400 mt-1">
              <AlertTriangle className="h-3 w-3" />
              {blockMessage}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

SignalPanel.displayName = "SignalPanel";
