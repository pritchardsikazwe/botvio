import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb, Newspaper, Clock, AlertTriangle,
  TrendingUp, Shield, BarChart3, Zap,
} from "lucide-react";

interface ChartTipsPanelProps {
  metrics: any;
  signal: any;
  symbol: string;
}

const GENERAL_TIPS = [
  { icon: TrendingUp, tip: "Always trade with the trend — avoid counter-trend entries unless at strong S/R zones." },
  { icon: Shield, tip: "Set your stop loss before entering any trade. Never risk more than 1-2% of your account." },
  { icon: BarChart3, tip: "Use multiple timeframes: higher TF for direction, lower TF for precise entry." },
  { icon: Zap, tip: "Volume confirms breakouts — low volume breakouts often fail and trap traders." },
  { icon: Lightbulb, tip: "Wait for candle close confirmation before entering. Don't chase wicks." },
  { icon: AlertTriangle, tip: "Avoid trading 15 minutes before and after high-impact news releases." },
];

export function ChartTipsPanel({ metrics, signal, symbol }: ChartTipsPanelProps) {
  return (
    <div className="space-y-4">
      {/* News Calendar */}
      <Card className="bg-card border-border/50 rounded-xl">
        <CardContent className="p-4">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-destructive" />
            Upcoming News Events
          </h3>

          {metrics?.next_high_impact_event ? (
            <div className="space-y-3">
              <div className="bg-destructive/10 border border-destructive/25 rounded-lg px-3 py-3">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30 font-bold">
                    HIGH IMPACT
                  </Badge>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {metrics.next_high_impact_time
                      ? new Date(metrics.next_high_impact_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "—"}
                  </span>
                </div>
                <p className="text-xs font-semibold text-foreground">
                  {metrics.next_high_impact_currency} — {metrics.next_high_impact_event}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  ⚠️ Avoid opening new positions 15 min before this event. Expect high volatility.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground bg-muted/20 rounded-lg px-3 py-3 text-center">
              No high-impact news events scheduled. Safe to trade based on technicals.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trading Tips */}
      <Card className="bg-card border-border/50 rounded-xl">
        <CardContent className="p-4">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-warning" />
            Trading Tips for {symbol}
          </h3>

          {/* Dynamic tip from metrics */}
          {metrics?.market_tip && (
            <div className="bg-primary/8 border border-primary/25 rounded-lg px-3 py-2.5 mb-3">
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-[11px] text-foreground font-semibold leading-relaxed">
                  {metrics.market_tip}
                </p>
              </div>
            </div>
          )}

          {/* Signal context tip */}
          {signal?.ai_summary && (
            <div className="bg-muted/30 border border-border/40 rounded-lg px-3 py-2.5 mb-3">
              <p className="text-[11px] text-foreground/80 leading-relaxed">
                📊 <span className="font-medium">AI Context:</span> {signal.ai_summary}
              </p>
            </div>
          )}

          {/* General tips grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {GENERAL_TIPS.map((t, i) => (
              <div key={i} className="bg-background/60 rounded-lg border border-border/30 px-3 py-2 flex items-start gap-2">
                <t.icon className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <p className="text-[10px] text-muted-foreground leading-relaxed">{t.tip}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
