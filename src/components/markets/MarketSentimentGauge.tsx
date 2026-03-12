import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const MarketSentimentGauge = ({ bullish = 62, label = "Market Sentiment" }: { bullish?: number; label?: string }) => {
  const bearish = 100 - bullish;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-success">Bullish {bullish}%</span>
          <span className="text-destructive">Bearish {bearish}%</span>
        </div>
        <div className="h-2.5 bg-destructive/30 rounded-full overflow-hidden">
          <div className="h-full bg-success rounded-full transition-all" style={{ width: `${bullish}%` }} />
        </div>
      </CardContent>
    </Card>
  );
};
