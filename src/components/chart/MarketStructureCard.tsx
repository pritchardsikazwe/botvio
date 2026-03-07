import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, TrendingDown, Zap, BarChart3 } from "lucide-react";

interface MarketStructureCardProps {
  indicator: any;
  metrics: any;
}

export function MarketStructureCard({ indicator, metrics }: MarketStructureCardProps) {
  const trend = indicator?.trend || "neutral";
  const rsi = indicator?.rsi_14 ? Number(indicator.rsi_14) : null;
  const macd = indicator?.macd ? Number(indicator.macd) : null;
  const atr = indicator?.atr_14 ? Number(indicator.atr_14) : null;

  const isBullish = trend === "bullish";
  const isBearish = trend === "bearish";

  const momentum = rsi
    ? rsi > 60 ? "Strong Bullish" : rsi > 40 ? "Neutral" : "Strong Bearish"
    : "Unknown";

  const volatility = atr
    ? atr > 2 ? "High" : atr > 1 ? "Medium" : "Low"
    : "Unknown";

  return (
    <Card className="bg-card border-border/50 rounded-xl">
      <CardContent className="p-4 space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" /> Market Structure
        </h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Trend Direction</span>
            <Badge variant="outline" className={`text-[10px] font-bold ${isBullish ? "text-success border-success/40" : isBearish ? "text-destructive border-destructive/40" : "text-muted-foreground"}`}>
              {isBullish && <TrendingUp className="h-3 w-3 mr-1" />}
              {isBearish && <TrendingDown className="h-3 w-3 mr-1" />}
              {trend}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Structure</span>
            <span className="text-xs font-bold text-foreground">
              {isBullish ? "Higher Highs / Higher Lows" : isBearish ? "Lower Highs / Lower Lows" : "Consolidating"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Break of Structure</span>
            <Badge variant="outline" className={`text-[10px] font-bold ${macd && macd > 0 ? "text-success border-success/30" : "text-destructive border-destructive/30"}`}>
              {macd && macd > 0 ? "Bullish BOS" : "Bearish BOS"}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Zap className="h-3 w-3" /> Momentum
            </span>
            <span className={`text-xs font-bold ${momentum.includes("Bullish") ? "text-success" : momentum.includes("Bearish") ? "text-destructive" : "text-muted-foreground"}`}>
              {momentum}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <BarChart3 className="h-3 w-3" /> Volatility
            </span>
            <Badge variant="outline" className={`text-[10px] font-bold ${volatility === "High" ? "text-warning border-warning/30" : "text-muted-foreground"}`}>
              {volatility}
            </Badge>
          </div>

          {rsi != null && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">RSI (14)</span>
              <span className={`text-xs font-mono font-bold ${rsi > 70 ? "text-destructive" : rsi < 30 ? "text-success" : "text-foreground"}`}>
                {rsi.toFixed(1)}
                {rsi > 70 && " — Overbought"}
                {rsi < 30 && " — Oversold"}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
