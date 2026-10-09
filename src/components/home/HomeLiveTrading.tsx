import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, ArrowRight, BarChart3, Copy, Crown, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useHomeMt5Trades } from "@/hooks/useHomeMt5Trades";
import { closedTradeResult, tradeFeedForSymbol } from "@/lib/liveTrading";

type FeedTab = "deriv" | "syntx" | "weltrade" | "copy";

type LiveTrade = {
  id: string;
  market: string;
  symbol: string;
  direction: string;
  status: string;
  pnl: number | null;
  openedAt: string;
  source: FeedTab;
  environment?: string;
};

const DERIV_SYMBOLS = [
  { symbol: "BOOM500", label: "Boom 500" },
  { symbol: "R_75", label: "Volatility 75" },
  { symbol: "CRASH500", label: "Crash 500" },
  { symbol: "R_10", label: "Volatility 10" },
];

const SYNTX_SYMBOLS = ["GainX 600", "FlipX 1", "SwitchX 600", "PainX 600"];

function sourceForSymbol(symbol: string): FeedTab {
  return tradeFeedForSymbol(symbol);
}

function marketLabel(symbol: string) {
  const found = [...DERIV_SYMBOLS, ...SYNTX_SYMBOLS.map((label) => ({ label, symbol: label }))].find(
    (x) => x.symbol.toUpperCase() === symbol.toUpperCase() || x.label.toUpperCase() === symbol.toUpperCase(),
  );
  return found?.label ?? symbol;
}

export const HomeLiveTrading = () => {
  const [tab, setTab] = useState<FeedTab>("syntx");
  const [view, setView] = useState<"running" | "results">("running");
  const { user, loading: authLoading } = useAuth();
  const mt5 = useHomeMt5Trades(tab);

  const providerQuery = useQuery({
    queryKey: ["home-live-provider-trades", user?.id, tab, view],
    enabled: !!user && tab === "deriv",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_trades")
        .select("id,symbol,direction,status,profit_loss,created_at,broker")
        .in("status", view === "running" ? ["open"] : ["closed", "won", "lost", "win", "loss"])
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw new Error("Unable to load provider trades.");
      return (data ?? []).map((t): LiveTrade => ({
        id: t.id,
        market: marketLabel(t.symbol),
        symbol: t.symbol,
        direction: t.direction,
        status: t.status === "open" ? "Running" : closedTradeResult(t.profit_loss == null ? null : Number(t.profit_loss)),
        pnl: t.profit_loss == null ? null : Number(t.profit_loss),
        openedAt: t.created_at,
        source: tradeFeedForSymbol(t.symbol, String(t.broker)),
      }));
    },
    refetchInterval: 15_000,
  });

  const copyQuery = useQuery({
    queryKey: ["home-live-copy-trades", user?.id, tab, view],
    enabled: !!user && tab === "copy",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("copied_trades")
        .select("id,symbol,direction,status,profit_loss,opened_at")
        .in("status", view === "running" ? ["open"] : ["closed", "won", "lost", "win", "loss"])
        .order("opened_at", { ascending: false })
        .limit(20);
      if (error) throw new Error("Unable to load copied trades.");
      return (data ?? []).map((t): LiveTrade => ({
        id: t.id,
        market: marketLabel(t.symbol),
        symbol: t.symbol,
        direction: t.direction,
        status: t.status === "open" ? "Running" : closedTradeResult(t.profit_loss == null ? null : Number(t.profit_loss)),
        pnl: t.profit_loss == null ? null : Number(t.profit_loss),
        openedAt: t.opened_at,
        source: "copy",
      }));
    },
    refetchInterval: 15_000,
  });

  const trades = useMemo(() => {
    const brokerTrades = (mt5.data?.trades ?? []).filter((trade) => (trade.status === "Running") === (view === "running"));
    const legacyTrades = tab === "copy" ? copyQuery.data ?? [] : tab === "deriv" ? providerQuery.data ?? [] : [];
    return [...brokerTrades, ...legacyTrades.filter((trade) => trade.source === tab)]
      .sort((a, b) => b.openedAt.localeCompare(a.openedAt));
  }, [copyQuery.data, providerQuery.data, mt5.data, tab, view]);
  const pending = authLoading || (!!user && (mt5.isLoading || (tab === "deriv" && providerQuery.isLoading) || (tab === "copy" && copyQuery.isLoading)));
  const unavailable = mt5.isError || (mt5.data?.unavailable ?? 0) > 0 || (tab === "deriv" && providerQuery.isError) || (tab === "copy" && copyQuery.isError);
  const runningCount = (mt5.data?.trades ?? []).filter((trade) => trade.status === "Running").length;

  const tabs = [
    { id: "deriv" as const, label: "Deriv Synthetic Indices", icon: BarChart3 },
    { id: "syntx" as const, label: "Weltrade SyntX", icon: Activity },
    { id: "weltrade" as const, label: "Weltrade Forex", icon: Activity },
    { id: "copy" as const, label: "Copy Trading", icon: Copy },
  ];

  return (
    <section aria-labelledby="home-live-trading">
      <Card className="overflow-hidden border-success/30 bg-gradient-to-br from-success/10 via-card to-card">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="home-live-trading" className="flex items-center gap-2 text-lg font-black sm:text-xl">
                  <Activity className="h-5 w-5 text-success" />
                  Live Trading — Running Trades & Results
                </h2>
                <Badge variant="outline" className={user && !mt5.isFetching && !unavailable && !mt5.data?.simulated && runningCount > 0 ? "border-success/30 text-success" : "text-muted-foreground"}>
                  {!user ? "SIGN IN" : pending ? "CHECKING" : unavailable ? "UNAVAILABLE" : mt5.data?.simulated ? "MOCK" : runningCount > 0 ? "LIVE" : "NO OPEN TRADES"}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">MT5 positions and closed results from the last 24 hours. Demo accounts are labelled.</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button asChild size="sm" variant="outline" className="text-xs"><Link to="/marketplace">Copy Trading <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link></Button>
              <Button asChild size="sm" className="text-xs font-black"><Link to="/billing"><Crown className="mr-1.5 h-3.5 w-3.5" />Subscribe</Link></Button>
            </div>
          </div>

          <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                onClick={() => setTab(id)}
                variant="outline"
                size="sm"
                aria-pressed={tab === id}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold transition-colors ${tab === id ? "border-primary/50 bg-primary/10 text-primary" : "border-border/50 bg-background/30 text-muted-foreground hover:text-foreground"}`}
              >
                <Icon className="h-3 w-3" />{label}
              </Button>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <Button size="sm" variant={view === "running" ? "default" : "outline"} aria-pressed={view === "running"} onClick={() => setView("running")}>Running</Button>
            <Button size="sm" variant={view === "results" ? "default" : "outline"} aria-pressed={view === "results"} onClick={() => setView("results")}>Results</Button>
          </div>
          {user && unavailable && <p role="status" className="mt-2 text-xs text-destructive">Some account trades could not be verified. <Link className="underline" to="/connections">Check MT5 connections</Link></p>}

          <div className="mt-3 overflow-hidden rounded-xl border border-border/50 bg-background/40">
            {trades.length > 0 ? (
              <div className="divide-y divide-border/40">
                <div className="grid grid-cols-[1.4fr_.8fr_.8fr_.8fr] gap-2 px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  <span>Market</span><span>Direction</span><span>Status</span><span className="text-right">P/L</span>
                </div>
                {trades.slice(0, 6).map((trade) => (
                  <div key={trade.id} className="grid grid-cols-[1.4fr_.8fr_.8fr_.8fr] items-center gap-2 px-3 py-2.5 text-xs">
                    <div className="min-w-0">
                      <p className="truncate font-bold">{trade.market}</p>
                      <p className="truncate font-mono text-[9px] text-muted-foreground">{trade.symbol}</p>
                    </div>
                    <span className={trade.direction === "BUY" ? "font-bold text-success" : "font-bold text-destructive"}>{trade.direction}</span>
                    <div className="min-w-0"><Badge variant="outline" className={`w-fit text-[9px] ${trade.status === "Loss" ? "text-destructive" : "text-success"}`}>{trade.status}</Badge>{trade.environment && <p className="mt-1 text-[9px] text-muted-foreground">{trade.environment}</p>}</div>
                    <span className={`text-right font-mono font-bold ${trade.pnl != null && trade.pnl < 0 ? "text-destructive" : "text-success"}`}>
                      {trade.pnl == null ? "—" : `${trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-5 text-center">
                <Users className="mx-auto h-5 w-5 text-muted-foreground" />
                <p className="mt-1 text-xs font-bold">{pending ? "Checking trades…" : !user ? "Sign in to view authorized trades" : unavailable ? "Trade feed unavailable" : mt5.data?.simulated ? "TradeCopy is in MOCK mode — no verified trades" : view === "results" ? "No verified closed results in this feed" : "No verified running trades in this feed"}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {!user ? "Private trading accounts are not shown to guests." : "Only broker-confirmed positions and recorded trade results appear here."}
                </p>
                {user && <Button asChild size="sm" variant="outline" className="mt-3"><Link to="/connections">MT5 connections <ArrowRight className="ml-1 h-3 w-3" /></Link></Button>}
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
            <span className="font-bold text-foreground">Synthetic markets:</span>
            <span>Deriv: Boom 500 · Volatility 75</span>
            <span>•</span>
            <span>Weltrade SyntX: GainX 600 · FlipX 1</span>
            <span>•</span>
            <span>Copy Trading</span>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
