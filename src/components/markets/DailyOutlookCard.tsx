import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, GraduationCap, Crosshair, Lightbulb, Calendar } from "lucide-react";

export interface OutlookLevel {
  label: string;
  value: string;
}

export interface DailyOutlookCardProps {
  market: string;          // e.g. "NASDAQ 100"
  emoji?: string;
  bias: "Bullish" | "Bearish" | "Neutral";
  /** One-line technical summary — EMA/RSI/structure */
  technical: string;
  /** Fundamental drivers — news, rates, oil, geopolitics */
  fundamental: string;
  /** Hauza strategy guidance — S/R, breakout, trend rules */
  hauza: string;
  /** Key levels (support / resistance / pivots) */
  levels: OutlookLevel[];
  /** Tip for new traders */
  newTraderTip: string;
  /** Sessions to focus on */
  bestSession?: string;
  /** Optional date label (defaults to today) */
  dateLabel?: string;
}

export function DailyOutlookCard({
  market,
  emoji,
  bias,
  technical,
  fundamental,
  hauza,
  levels,
  newTraderTip,
  bestSession,
  dateLabel,
}: DailyOutlookCardProps) {
  const today = dateLabel || new Date().toLocaleDateString(undefined, {
    weekday: "short", month: "short", day: "numeric",
  });

  const biasColor =
    bias === "Bullish" ? "text-success border-success/40 bg-success/10" :
    bias === "Bearish" ? "text-destructive border-destructive/40 bg-destructive/10" :
    "text-muted-foreground border-border bg-muted/30";

  const BiasIcon = bias === "Bullish" ? TrendingUp : bias === "Bearish" ? TrendingDown : Minus;

  return (
    <Card className="border-border/60 overflow-hidden">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {emoji && <span className="text-xl">{emoji}</span>}
            <div>
              <h3 className="font-extrabold text-sm text-foreground">{market} — Daily Outlook</h3>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Calendar className="h-2.5 w-2.5" />
                <span>{today}</span>
                {bestSession && <span className="ml-1">• {bestSession}</span>}
              </div>
            </div>
          </div>
          <Badge className={`${biasColor} font-extrabold text-xs px-2 py-1 border gap-1`}>
            <BiasIcon className="h-3 w-3" />
            {bias}
          </Badge>
        </div>

        {/* Technical */}
        <div className="rounded-lg bg-secondary/50 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Crosshair className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Technical Analysis</span>
          </div>
          <p className="text-xs text-foreground leading-relaxed">{technical}</p>
        </div>

        {/* Fundamental */}
        <div className="rounded-lg bg-warning/5 border border-warning/20 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Lightbulb className="h-3 w-3 text-warning" />
            <span className="text-[10px] font-bold text-warning uppercase tracking-wider">Fundamental Drivers</span>
          </div>
          <p className="text-xs text-foreground leading-relaxed">{fundamental}</p>
        </div>

        {/* Hauza Strategy */}
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Crosshair className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Hauza Strategy Setup</span>
          </div>
          <p className="text-xs text-foreground leading-relaxed">{hauza}</p>
        </div>

        {/* Key Levels */}
        {levels.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {levels.map((lvl) => (
              <div key={lvl.label} className="text-center p-2 rounded bg-background/60 border border-border/40">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{lvl.label}</p>
                <p className="text-xs font-extrabold font-mono text-foreground">{lvl.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* New Trader Tip */}
        <div className="rounded-lg bg-success/5 border border-success/20 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <GraduationCap className="h-3 w-3 text-success" />
            <span className="text-[10px] font-bold text-success uppercase tracking-wider">New Trader Tip</span>
          </div>
          <p className="text-xs text-foreground leading-relaxed">{newTraderTip}</p>
        </div>
      </CardContent>
    </Card>
  );
}
