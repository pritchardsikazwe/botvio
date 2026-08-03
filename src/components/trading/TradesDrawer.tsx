import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart3, Clock, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { DerivTrade } from "@/hooks/useDerivTrades";

export const TradesDrawer = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [trades, setTrades] = useState<DerivTrade[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"running" | "closed">("running");

  const fetchTrades = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("deriv_trades" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (!error && data) {
        // Numeric columns can arrive as strings — coerce so `.toFixed()` never
        // throws and blanks the whole drawer/page.
        setTrades(
          (data as any[]).map((r) => ({
            ...r,
            buy_price: r.buy_price != null ? Number(r.buy_price) : 0,
            payout: r.payout != null ? Number(r.payout) : null,
            profit: r.profit != null ? Number(r.profit) : null,
            sell_price: r.sell_price != null ? Number(r.sell_price) : null,
          })) as unknown as DerivTrade[]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Always keep open trades loaded (not just while the drawer is open) so the
  // badge count and running list survive navigation between pages.
  useEffect(() => {
    if (!user) return;
    fetchTrades();
    const id = window.setInterval(fetchTrades, open ? 5000 : 20000);
    const onFocus = () => fetchTrades();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [open, user]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("trades-drawer")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deriv_trades", filter: `user_id=eq.${user.id}` },
        () => fetchTrades()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const running = trades.filter(t => t.status === "RUNNING");
  const closed = trades.filter(t => t.status !== "RUNNING");
  const totalPnl = closed.reduce((sum, t) => sum + (t.profit ?? 0), 0);
  const wins = closed.filter(t => t.outcome === "WIN").length;
  const losses = closed.filter(t => t.outcome === "LOSS").length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <BarChart3 className="h-4 w-4" />
          <span className="hidden sm:inline ml-1 text-xs">Trades</span>
          {running.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-[9px] text-primary-foreground flex items-center justify-center font-bold">
              {running.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[380px] sm:w-[420px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Trade History
          </SheetTitle>
        </SheetHeader>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 mt-4 mb-3">
          <div className="text-center p-2 rounded-lg bg-primary/10">
            <div className="text-lg font-bold">{running.length}</div>
            <div className="text-[10px] text-muted-foreground">Running</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-success/10">
            <div className="text-lg font-bold text-success">{wins}</div>
            <div className="text-[10px] text-muted-foreground">Won</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-destructive/10">
            <div className="text-lg font-bold text-destructive">{losses}</div>
            <div className="text-[10px] text-muted-foreground">Lost</div>
          </div>
        </div>

        {totalPnl !== 0 && (
          <div className={`text-center p-2 rounded-lg border mb-3 ${totalPnl >= 0 ? 'border-success/20 bg-success/5' : 'border-destructive/20 bg-destructive/5'}`}>
            <span className="text-xs text-muted-foreground">Total P&L: </span>
            <span className={`font-bold ${totalPnl >= 0 ? 'text-success' : 'text-destructive'}`}>
              {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
            </span>
          </div>
        )}

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="w-full">
            <TabsTrigger value="running" className="flex-1 text-xs">
              Running ({running.length})
            </TabsTrigger>
            <TabsTrigger value="closed" className="flex-1 text-xs">
              Closed ({closed.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="running">
            <ScrollArea className="h-[calc(100vh-320px)]">
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : running.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No running trades.</p>
              ) : (
                <div className="space-y-2 pr-2">
                  {running.map(t => (
                    <TradeRow key={t.id} trade={t} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="closed">
            <ScrollArea className="h-[calc(100vh-320px)]">
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : closed.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No closed trades.</p>
              ) : (
                <div className="space-y-2 pr-2">
                  {closed.map(t => (
                    <TradeRow key={t.id} trade={t} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

const TradeRow = ({ trade }: { trade: DerivTrade }) => {
  const isRunning = trade.status === "RUNNING";
  const isWin = trade.outcome === "WIN";
  const started = trade.started_at ? new Date(trade.started_at) : null;
  const time =
    started && !Number.isNaN(started.getTime())
      ? started.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "--:--";

  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg text-xs border ${
      isRunning ? "border-primary/20 bg-primary/5" :
      isWin ? "border-success/20 bg-success/5" :
      "border-destructive/20 bg-destructive/5"
    }`}>
      {isRunning ? (
        <Clock className="h-3.5 w-3.5 text-primary animate-pulse shrink-0" />
      ) : isWin ? (
        <TrendingUp className="h-3.5 w-3.5 text-success shrink-0" />
      ) : (
        <TrendingDown className="h-3.5 w-3.5 text-destructive shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="font-medium truncate">{trade.symbol}</span>
          {trade.contract_type && (
            <Badge variant="outline" className="text-[8px] px-1 py-0">{trade.contract_type}</Badge>
          )}
          <Badge variant="outline" className="text-[8px] px-1 py-0">
            {trade.is_virtual ? "DEMO" : "REAL"}
          </Badge>
        </div>
        <span className="text-muted-foreground">{time} · ${Number(trade.buy_price ?? 0).toFixed(2)}</span>
      </div>
      <div className="text-right shrink-0">
        {isRunning ? (
          <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/20">Running</Badge>
        ) : (
          <span className={`font-bold ${isWin ? "text-success" : "text-destructive"}`}>
            {Number(trade.profit ?? 0) >= 0 ? '+' : ''}${Number(trade.profit ?? 0).toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
};
