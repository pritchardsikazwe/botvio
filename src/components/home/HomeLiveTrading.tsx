import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, ArrowRight, BarChart3, Bot, Copy, Crown, Users } from "lucide-react";

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
};

const DERIV_SYMBOLS = [
  { symbol: "BOOM500", label: "Boom 500" },
  { symbol: "R_75", label: "Volatility 75" },
  { symbol: "CRASH500", label: "Crash 500" },
  { symbol: "R_10", label: "Volatility 10" },
];

const SYNTX_SYMBOLS = ["GainX 600", "FlipX 1", "SwitchX 600", "PainX 600"];

function sourceForSymbol(symbol: string): FeedTab {
  const s = symbol.toUpperCase();
  if (s.includes("GAINX") || s.includes("PAINX") || s.includes("FLIPX") || s.includes("SWITCHX") || s.includes("BREAKX") || s.includes("TRENDX") || s.includes("VOL ")) return "syntx";
  if (s.includes("BOOM") || s.includes("CRASH") || s.startsWith("R_") || s.includes("VOLATILITY")) return "deriv";
  return "weltrade";
}

function marketLabel(symbol: string) {
  const found = [...DERIV_SYMBOLS, ...SYNTX_SYMBOLS.map((label) => ({ label, symbol: label }))].find(
    (x) => x.symbol.toUpperCase() === symbol.toUpperCase() || x.label.toUpperCase() === symbol.toUpperCase(),
  );
  return found?.label ?? symbol;
}

export const HomeLiveTrading = () => {
  const [tab, setTab] = useState<FeedTab>("deriv");

  const { data: providerTrades = [] } = useQuery({
    queryKey: ["home-live-provider-trades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_trades")
        .select("id,symbol,direction,status,profit_loss,created_at,broker")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) return [];
      return (data ?? []).map((t: any): LiveTrade => ({
        id: t.id,
        market: marketLabel(t.symbol),
        symbol: t.symbol,
        direction: t.direction,
        status: "Running",
        pnl: t.profit_loss == null ? null : Number(t.profit_loss),
        openedAt: t.created_at,
        source: String(t.broker).toLowerCase() === "weltrade" ? "weltrade" : sourceForSymbol(t.symbol),
      }));
    },
    refetchInterval: 15_000,
  });

  const { data: copyTrades = [] } = useQuery({
    queryKey: ["home-live-copy-trades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("copied_trades")
        .select("id,symbol,direction,status,profit_loss,opened_at")
        .eq("status", "open")
        .order("opened_at", { ascending: false })
        .limit(20);
      if (error) return [];
      return (data ?? []).map((t: any): LiveTrade => ({
        id: t.id,
        market: marketLabel(t.symbol),
        symbol: t.symbol,
        direction: t.direction,
        status: "Running",
        pnl: t.profit_loss == null ? null : Number(t.profit_loss),
        openedAt: t.opened_at,
        source: "copy",
      }));
    },
    refetchInterval: 15_000,
  });

  const trades = useMemo(() => {
    if (tab === "copy") return copyTrades;
    return providerTrades.filter((t) => t.source === tab);
  }, [copyTrades, providerTrades, tab]);

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
                  Live Trading — Real Trades Running Now
                </h2>
                <Badge className="bg-success/15 text-success border-success/30"><span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-success inline-block" />LIVE</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Live positions only — no signal cards and no entry prices shown.</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button asChild size="sm" variant="outline" className="text-xs"><Link to="/copy-trading">Copy Trading <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link></Button>
              <Button asChild size="sm" className="text-xs font-black"><Link to="/billing"><Crown className="mr-1.5 h-3.5 w-3.5" />Subscribe</Link></Button>
            </div>
          </div>

          <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold transition-colors ${tab === id ? "border-primary/50 bg-primary/10 text-primary" : "border-border/50 bg-background/30 text-muted-foreground hover:text-foreground"}`}
              >
                <Icon className="h-3 w-3" />{label}
              </button>
            ))}
          </div>

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
                    <Badge variant="outline" className="w-fit border-success/30 text-[9px] text-success">Running</Badge>
                    <span className={`text-right font-mono font-bold ${trade.pnl != null && trade.pnl < 0 ? "text-destructive" : "text-success"}`}>
                      {trade.pnl == null ? "—" : `${trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-5 text-center">
                <Users className="mx-auto h-5 w-5 text-muted-foreground" />
                <p className="mt-1 text-xs font-bold">No live trades in this feed right now</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  Botvio will show actual running positions here when they are active.
                </p>
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
