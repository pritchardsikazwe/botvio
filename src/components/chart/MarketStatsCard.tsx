import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

interface MarketStatsCardProps {
  metrics: any;
  indicator: any;
}

export function MarketStatsCard({ metrics, indicator }: MarketStatsCardProps) {
  const dayHigh = metrics?.day_high ? Number(metrics.day_high) : null;
  const dayLow = metrics?.day_low ? Number(metrics.day_low) : null;
  const dailyRange = dayHigh && dayLow ? (dayHigh - dayLow).toFixed(2) : "—";
  const atr = indicator?.atr_14 ? Number(indicator.atr_14).toFixed(2) : "—";
  const rsi = indicator?.rsi_14 ? Number(indicator.rsi_14).toFixed(1) : "—";

  const sentiment = indicator?.rsi_14
    ? Number(indicator.rsi_14) > 50 ? `${Math.round(Number(indicator.rsi_14))}% Bullish` : `${Math.round(100 - Number(indicator.rsi_14))}% Bearish`
    : "—";

  const volatility = indicator?.atr_14
    ? Number(indicator.atr_14) > 2 ? "High" : Number(indicator.atr_14) > 1 ? "Medium" : "Low"
    : "—";

  const stats = [
    { label: "Daily Range", value: dailyRange },
    { label: "ATR (14)", value: atr },
    { label: "RSI (14)", value: rsi },
    { label: "Sentiment", value: sentiment },
    { label: "Volatility", value: volatility },
  ];

  return (
    <Card className="bg-card border-border/50 rounded-xl">
      <CardContent className="p-4 space-y-2">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-2">
          <BarChart3 className="h-4 w-4 text-primary" /> Market Stats
        </h3>
        {stats.map((s, i) => (
          <div key={i} className="flex items-center justify-between py-1 border-b border-border/20 last:border-0">
            <span className="text-xs text-muted-foreground">{s.label}</span>
            <span className="text-xs font-bold text-foreground font-mono">{s.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
