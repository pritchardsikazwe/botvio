import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Target, Clock, ExternalLink, ArrowUpRight, ArrowDownRight, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const WELTRADE_LINK = "https://gowt.net/ib67505";

export function SyntxSignalsSection() {
  const { data: signals, isLoading } = useQuery({
    queryKey: ["syntx-hub-signals"],
    queryFn: async () => {
      const { data } = await supabase
        .from("trading_signals")
        .select("*")
        .contains("broker", ["weltrade"])
        .eq("status", "ACTIVE")
        .order("created_at", { ascending: false })
        .limit(6);
      return data ?? [];
    },
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" /> Active SyntX Signals
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
                <Card key={sig.id} className="bg-card border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isBuy ? <ArrowUpRight className="h-5 w-5 text-success" /> : <ArrowDownRight className="h-5 w-5 text-destructive" />}
                        <span className="font-bold text-sm text-foreground">{sig.symbol}</span>
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
              <p className="text-sm font-bold text-foreground">No active SyntX signals right now</p>
              <p className="text-xs text-muted-foreground mt-1">New signals are posted when clear setups form. Check back soon.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* CTA */}
      <Card className="border border-success/30 bg-success/5">
        <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-success" />
            <div>
              <p className="text-sm font-bold text-foreground">Execute these signals</p>
              <p className="text-xs text-muted-foreground">Open a Weltrade account to trade SyntX indices</p>
            </div>
          </div>
          <a href={WELTRADE_LINK} target="_blank" rel="noopener noreferrer">
            <Button className="bg-success hover:bg-success/90 text-success-foreground font-bold text-xs">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open Weltrade Account
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
