import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Shield, Target } from "lucide-react";

export function StrategyNotesPanel() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="bg-card border-border/50 rounded-xl">
        <CardContent className="p-4">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-primary" /> Entry Checklist
          </h4>
          <ul className="space-y-2">
            {[
              "Identify trend direction on H4/D1",
              "Wait for pullback to key level (S/R)",
              "Confirm with candlestick pattern (engulfing, pin bar)",
              "Check RSI for confirmation (not overbought/oversold)",
              "Ensure no high-impact news within 30 min",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="bg-card border-border/50 rounded-xl">
        <CardContent className="p-4">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-warning" /> Confirmation Checklist
          </h4>
          <ul className="space-y-2">
            {[
              "EMA 20 aligned with trade direction",
              "Volume increasing on breakout",
              "MACD histogram supports entry",
              "Price respecting trendline or channel",
              "Multiple timeframe alignment",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="bg-card border-border/50 rounded-xl">
        <CardContent className="p-4">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-destructive" /> Risk Rules
          </h4>
          <ul className="space-y-2">
            {[
              "Max 1-2% risk per trade",
              "Always set stop loss before entry",
              "Never move stop loss against you",
              "Max 3 trades per session",
              "Stop trading after 2 consecutive losses",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="bg-card border-border/50 rounded-xl">
        <CardContent className="p-4">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-success" /> Exit Rules
          </h4>
          <ul className="space-y-2">
            {[
              "Take partial profit at TP1 (50%)",
              "Move SL to breakeven after TP1 hit",
              "Trail stop using EMA 20 on lower TF",
              "Close if momentum reverses sharply",
              "Close all positions before weekend",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
