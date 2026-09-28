import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Target, Clock, ExternalLink, ArrowUpRight, ArrowDownRight, Shield, RefreshCw, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const WELTRADE_LINK = "https://gowt.net/ib67505";

export function SyntxSignalsSection() {
  const [symbol, setSymbol] = useState("all");
  const [timeframe, setTimeframe] = useState("all");
  const [direction, setDirection] = useState("all");
  const [status, setStatus] = useState("all");
  const { data: signals, isLoading, isError, dataUpdatedAt, refetch, isFetching } = useQuery({
    queryKey: ["syntx-hub-signals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trading_signals")
        .select("*")
        .contains("broker", ["weltrade"])
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30000,
  });
  const symbols = useMemo(() => [...new Set((signals ?? []).map((item) => item.symbol).filter(Boolean))].sort(), [signals]);
  const timeframes = useMemo(() => [...new Set((signals ?? []).map((item) => item.timeframe).filter(Boolean))].sort(), [signals]);
  const filtered = useMemo(() => (signals ?? []).filter((item) =>
    (symbol === "all" || item.symbol === symbol) &&
    (timeframe === "all" || item.timeframe === timeframe) &&
    (direction === "all" || item.direction?.toUpperCase() === direction) &&
    (status === "all" || item.status?.toUpperCase() === status)
  ), [signals, symbol, timeframe, direction, status]);

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="flex items-center gap-2 text-sm font-bold text-foreground"><Target className="h-4 w-4 text-primary" /> Weltrade Signals</h3><p className="mt-1 text-xs text-muted-foreground">Last refreshed {dataUpdatedAt ? formatDistanceToNow(new Date(dataUpdatedAt), { addSuffix: true }) : "Not available"}</p></div><Button variant="outline" className="min-h-11" onClick={() => refetch()} disabled={isFetching}><RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />Refresh</Button></div>
        <div className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <Select value={symbol} onValueChange={setSymbol}><SelectTrigger aria-label="Filter by symbol" className="min-h-11"><SelectValue placeholder="Symbol" /></SelectTrigger><SelectContent><SelectItem value="all">All symbols</SelectItem>{symbols.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
          <Select value={timeframe} onValueChange={setTimeframe}><SelectTrigger aria-label="Filter by timeframe" className="min-h-11"><SelectValue placeholder="Timeframe" /></SelectTrigger><SelectContent><SelectItem value="all">All timeframes</SelectItem>{timeframes.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
          <Select value={direction} onValueChange={setDirection}><SelectTrigger aria-label="Filter by direction" className="min-h-11"><SelectValue placeholder="Direction" /></SelectTrigger><SelectContent><SelectItem value="all">All directions</SelectItem><SelectItem value="BUY">Buy</SelectItem><SelectItem value="SELL">Sell</SelectItem></SelectContent></Select>
          <Select value={status} onValueChange={setStatus}><SelectTrigger aria-label="Filter by status" className="min-h-11"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="ACTIVE">Live / active</SelectItem><SelectItem value="CLOSED">Closed</SelectItem><SelectItem value="EXPIRED">Expired</SelectItem><SelectItem value="EDUCATIONAL">Educational</SelectItem></SelectContent></Select>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <Card key={i} className="bg-card border-border/50 animate-pulse h-40" />
            ))}
          </div>
        ) : isError ? (
          <Card className="border-destructive/30"><CardContent className="p-8 text-center"><AlertTriangle className="mx-auto mb-3 h-8 w-8 text-destructive" /><p className="text-sm font-bold text-foreground">Signals could not be loaded</p><p className="mt-1 text-xs text-muted-foreground">Your market chart remains available. Try refreshing the signal feed.</p></CardContent></Card>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((sig) => {
              const isBuy = sig.direction?.toUpperCase() === "BUY";
              return (
                <Link key={sig.id} to={`/chart/${encodeURIComponent(sig.symbol)}?signal=${encodeURIComponent(sig.id)}`} className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Open ${sig.symbol} ${sig.direction} signal chart`}>
                <Card className="h-full bg-card border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isBuy ? <ArrowUpRight className="h-5 w-5 text-success" /> : <ArrowDownRight className="h-5 w-5 text-destructive" />}
                        <span className="font-bold text-sm text-foreground">{sig.symbol}</span>
                      </div>
                       <div className="flex gap-1"><Badge className={isBuy ? "bg-success/10 text-success border-success/30" : "bg-destructive/10 text-destructive border-destructive/30"}>{sig.direction?.toUpperCase()}</Badge><Badge variant="outline">{sig.status === "ACTIVE" ? "LIVE / ACTIVE" : sig.status ?? "ANALYSIS"}</Badge></div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-muted/50 rounded-lg p-2">
                        <p className="text-[10px] text-muted-foreground">Entry</p>
                         <p className="text-xs font-bold font-mono">{sig.entry_price ?? "Not available"}</p>
                      </div>
                      <div className="bg-destructive/5 rounded-lg p-2">
                        <p className="text-[10px] text-destructive">SL</p>
                         <p className="text-xs font-bold font-mono">{sig.stop_loss ?? "Not available"}</p>
                      </div>
                      <div className="bg-success/5 rounded-lg p-2">
                        <p className="text-[10px] text-success">TP</p>
                         <p className="text-xs font-bold font-mono">{sig.take_profit ?? "Not available"}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(sig.created_at), { addSuffix: true })}
                      </span>
                       <span>{sig.timeframe ?? "Timeframe not available"} · {sig.strategy_name ?? "Botvio / Weltrade"}</span>
                       {sig.confidence != null && <span className="font-mono font-bold text-foreground">{sig.confidence}%</span>}
                    </div>
                  </CardContent>
                 </Card></Link>
              );
            })}
          </div>
        ) : (
          <Card className="bg-card border-border/50">
            <CardContent className="p-8 text-center">
              <Target className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
               <p className="text-sm font-bold text-foreground">No matching Weltrade signals</p>
               <p className="text-xs text-muted-foreground mt-1">Adjust the filters or check back after new real-data analysis is published.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <p className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs leading-relaxed text-muted-foreground"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />Signals are informational analysis, not guaranteed results. SyntX families behave differently, and leveraged trading can cause rapid losses.</p>

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
          <Button asChild className="bg-success hover:bg-success/90 text-success-foreground font-bold text-xs">
            <a href={WELTRADE_LINK} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open Weltrade Account
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
