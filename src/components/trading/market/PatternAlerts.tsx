import { Target, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PatternAlert {
  symbol: string;
  pattern: string;
  timeframe: string;
  direction: "bullish" | "bearish" | "neutral";
  suggestedEntry?: number | null;
  suggestedSL?: number | null;
}

function formatPriceShort(p: number | null | undefined): string {
  if (p == null) return "—";
  return p >= 100 ? p.toFixed(2) : p.toFixed(5);
}

interface PatternAlertsProps {
  patterns: PatternAlert[];
}

export function PatternAlerts({ patterns }: PatternAlertsProps) {
  if (!patterns.length) return null;

  return (
    <div className="rounded-xl border border-accent/30 bg-accent/5 px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <Target className="h-4 w-4 text-primary" />
        <span className="text-sm font-bold text-foreground">
          Patterns Spotted
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {patterns.map((p, i) => (
          <div
            key={i}
            className="flex items-center gap-2 bg-background/80 rounded-lg border border-border/50 px-3 py-1.5"
          >
            {p.direction === "bullish" ? (
              <TrendingUp className="h-3.5 w-3.5 text-success" />
            ) : p.direction === "bearish" ? (
              <TrendingDown className="h-3.5 w-3.5 text-destructive" />
            ) : null}
            <span className="text-xs font-bold text-foreground">{p.symbol}</span>
            <span className="text-xs text-muted-foreground">{p.pattern}</span>
            <Badge variant="outline" className="text-[10px] py-0">
              {p.timeframe}
            </Badge>
            {p.suggestedEntry != null && (
              <span className="text-[10px] text-success font-mono">
                Entry: {formatPriceShort(p.suggestedEntry)}
              </span>
            )}
            {p.suggestedSL != null && (
              <span className="text-[10px] text-destructive font-mono">
                SL: {formatPriceShort(p.suggestedSL)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
