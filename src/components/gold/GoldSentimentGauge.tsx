import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, Calendar, Newspaper } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function GoldSentimentGauge() {
  const { data: signal } = useQuery({
    queryKey: ["gold-hub-signal"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_signals")
        .select("*")
        .eq("asset_id", (await supabase.from("assets").select("id").eq("symbol", "XAUUSD").maybeSingle()).data?.id ?? "")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    refetchInterval: 30000,
  });

  const sentiment = signal?.signal?.toUpperCase() ?? "NEUTRAL";
  const confidence = signal?.confidence ?? 50;
  const bullish = sentiment === "BUY" || sentiment === "STRONG_BUY";
  const bearish = sentiment === "SELL" || sentiment === "STRONG_SELL";

  const bullPct = bullish ? Math.min(confidence + 15, 95) : bearish ? Math.max(100 - confidence - 15, 15) : 50;
  const bearPct = 100 - bullPct;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Sentiment Bar */}
      <Card className="md:col-span-2 bg-card border-border/50">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Market Sentiment
            </h3>
            <Badge variant="outline" className={`text-xs font-bold ${bullish ? "border-success/40 text-success" : bearish ? "border-destructive/40 text-destructive" : "border-muted-foreground/40 text-muted-foreground"}`}>
              {sentiment.replace("_", " ")}
            </Badge>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-1 text-success text-xs font-bold">
              <TrendingUp className="h-3.5 w-3.5" /> {bullPct}% Bulls
            </div>
            <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-success to-success/60 rounded-full transition-all duration-700"
                style={{ width: `${bullPct}%` }}
              />
            </div>
            <div className="flex items-center gap-1 text-destructive text-xs font-bold">
              {bearPct}% Bears <TrendingDown className="h-3.5 w-3.5" />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            AI confidence: <span className="text-foreground font-mono font-bold">{confidence}%</span> — Based on technical analysis of XAUUSD price action.
          </p>
        </CardContent>
      </Card>

      {/* Quick Info Cards */}
      <div className="space-y-4">
        <Card className="bg-card border-border/50">
          <CardContent className="p-4 flex items-start gap-3">
            <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-foreground">Key Events</p>
              <p className="text-xs text-muted-foreground">Fed rate decision, NFP, CPI data impact gold prices significantly.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4 flex items-start gap-3">
            <Newspaper className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-foreground">News Sentiment</p>
              <p className="text-xs text-muted-foreground">USD weakness & inflation fears tend to push gold higher.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
