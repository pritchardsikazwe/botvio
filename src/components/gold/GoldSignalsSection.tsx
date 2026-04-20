import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Target, Shield, Crosshair, Clock, ExternalLink, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function GoldSignalsSection() {
  const { data: signals, isLoading } = useQuery({
    queryKey: ["gold-hub-signals"],
    queryFn: async () => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("trading_signals")
        .select("*")
        .or("symbol.ilike.%XAU%,symbol.ilike.%GOLD%")
        .eq("status", "ACTIVE")
        .gte("created_at", oneDayAgo)
        .order("created_at", { ascending: false })
        .limit(6);
      // Filter out expired by expires_at
      const now = Date.now();
      return (data ?? []).filter((s: any) => !s.expires_at || new Date(s.expires_at).getTime() > now);
    },
    refetchInterval: 30000,
  });

  const { data: aiSignal } = useQuery({
    queryKey: ["gold-hub-ai-signal"],
    queryFn: async () => {
      const assetRes = await supabase.from("assets").select("id").eq("symbol", "XAUUSD").maybeSingle();
      if (!assetRes.data) return null;
      const { data } = await supabase
        .from("ai_signals")
        .select("*")
        .eq("asset_id", assetRes.data.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    refetchInterval: 30000,
  });

  const signalColor = (type: string) => {
    const t = type?.toUpperCase();
    if (t === "BUY" || t === "STRONG_BUY") return "text-success border-success/30 bg-success/10";
    if (t === "SELL" || t === "STRONG_SELL") return "text-destructive border-destructive/30 bg-destructive/10";
    return "text-muted-foreground border-muted-foreground/30 bg-muted/10";
  };

  return (
    <div className="space-y-6">
      {/* AI Signal Card */}
      {aiSignal && (
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Crosshair className="h-4 w-4 text-primary" />
              AI-Powered Signal
              <Badge className={signalColor(aiSignal.signal)}>{aiSignal.signal?.toUpperCase().replace("_", " ")}</Badge>
              <Badge variant="outline" className="ml-auto text-xs font-mono">{aiSignal.confidence}% confidence</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{aiSignal.ai_summary}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {aiSignal.entry_price && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Entry</p>
                  <p className="text-sm font-bold font-mono text-foreground">${aiSignal.entry_price.toFixed(2)}</p>
                </div>
              )}
              {aiSignal.stop_loss && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                  <p className="text-xs text-destructive">Stop Loss</p>
                  <p className="text-sm font-bold font-mono text-foreground">${aiSignal.stop_loss.toFixed(2)}</p>
                </div>
              )}
              {aiSignal.take_profit_1 && (
                <div className="bg-success/5 border border-success/20 rounded-lg p-3">
                  <p className="text-xs text-success">TP 1</p>
                  <p className="text-sm font-bold font-mono text-foreground">${aiSignal.take_profit_1.toFixed(2)}</p>
                </div>
              )}
              {aiSignal.take_profit_2 && (
                <div className="bg-success/5 border border-success/20 rounded-lg p-3">
                  <p className="text-xs text-success">TP 2</p>
                  <p className="text-sm font-bold font-mono text-foreground">${aiSignal.take_profit_2.toFixed(2)}</p>
                </div>
              )}
            </div>
            {aiSignal.risk_reward && (
              <p className="text-xs text-muted-foreground">Risk/Reward: <span className="text-foreground font-bold">1:{aiSignal.risk_reward.toFixed(1)}</span></p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Manual/Provider Signals */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" /> Active Gold Signals
        </h3>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <Card key={i} className="bg-card border-border/50 animate-pulse h-40" />
            ))}
          </div>
        ) : signals && signals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {signals.map((sig: any) => {
              const isBuy = sig.direction?.toUpperCase() === "BUY";
              return (
                <Card key={sig.id} className={`bg-card border-border/50 hover:border-primary/30 transition-colors`}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isBuy ? <ArrowUpRight className="h-5 w-5 text-success" /> : <ArrowDownRight className="h-5 w-5 text-destructive" />}
                        <span className="font-bold text-sm text-foreground">{sig.pair}</span>
                      </div>
                      <Badge className={isBuy ? "bg-success/10 text-success border-success/30" : "bg-destructive/10 text-destructive border-destructive/30"}>
                        {sig.direction?.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-muted/50 rounded-lg p-2">
                        <p className="text-[10px] text-muted-foreground">Entry</p>
                        <p className="text-xs font-bold font-mono">{sig.entry_price ?? "—"}</p>
                      </div>
                      <div className="bg-destructive/5 rounded-lg p-2">
                        <p className="text-[10px] text-destructive">SL</p>
                        <p className="text-xs font-bold font-mono">{sig.stop_loss ?? "—"}</p>
                      </div>
                      <div className="bg-success/5 rounded-lg p-2">
                        <p className="text-[10px] text-success">TP</p>
                        <p className="text-xs font-bold font-mono">{sig.take_profit ?? "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(sig.created_at), { addSuffix: true })}
                      </span>
                      {sig.confidence && <span className="font-mono font-bold text-foreground">{sig.confidence}%</span>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-card border-border/50">
            <CardContent className="p-8 text-center">
              <Target className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-bold text-foreground">No active gold signals right now</p>
              <p className="text-xs text-muted-foreground mt-1">New signals are generated when clear setups form. Check back soon.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Broker CTA */}
      <Card className="border border-success/30 bg-success/5">
        <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-success" />
            <div>
              <p className="text-sm font-bold text-foreground">Execute these signals</p>
              <p className="text-xs text-muted-foreground">Open a broker account with tight gold spreads</p>
            </div>
          </div>
          <a href="https://one.exness-track.com/a/ts1kvs1k" target="_blank" rel="noopener noreferrer">
            <Button className="bg-success hover:bg-success/90 text-success-foreground font-bold text-xs">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Trade on Exness
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
