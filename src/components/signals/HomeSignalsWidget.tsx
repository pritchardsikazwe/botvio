import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Signal, ArrowRight, TrendingUp, TrendingDown, Clock, AlertCircle, Trophy, XCircle as XIcon, ExternalLink, Sparkles, BarChart3, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import type { ManualSignal } from "@/hooks/useManualSignals";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionGate } from "@/hooks/useSubscriptionGate";

const EXNESS_LINK = "https://one.exness-track.com/a/ts1kvs1k";
const DERIV_LINK = "https://track.deriv.com/_a_gq1w0BG0D1hit6RV3zsGNd7ZgqdRLk/1/";
const WELTRADE_LINK = "https://gowt.net/ib67505";

const BROKER_FILTERS = [
  { value: "all", label: "All" },
  { value: "exness", label: "Exness" },
  { value: "deriv", label: "Deriv" },
  { value: "weltrade", label: "Weltrade" },
  { value: "binance", label: "Binance" },
  { value: "pocket-option", label: "Pocket Option" },
  { value: "iq-option", label: "IQ Option" },
  { value: "binomo", label: "Binomo" },
];

const TIMEFRAME_FILTERS = [
  { value: "all", label: "All Horizons" },
  { value: "M1", label: "1M · Scalping" },
  { value: "M5", label: "5M · Momentum" },
  { value: "M15", label: "15M · Intraday" },
  { value: "H1", label: "1H · Swing" },
  { value: "D1", label: "1D · Position" },
];

function normTf(timeframe?: string | null): string {
  const t = (timeframe || "").toUpperCase().trim();
  const m = t.match(/^(\d+)\s*([MHD])$/);
  return m ? `${m[2]}${m[1]}` : t;
}

function fmtPrice(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(Number(v))) return "-";
  const n = Number(v);
  const d = Math.abs(n) >= 1000 ? 2 : Math.abs(n) >= 10 ? 3 : 5;
  return n.toLocaleString(undefined, { maximumFractionDigits: d });
}

function timeframeLabel(timeframe?: string | null): string {
  switch (normTf(timeframe)) {
    case "M1": return "1M · SCALPING";
    case "M5": return "5M · MOMENTUM";
    case "M15": return "15M · INTRADAY";
    case "H1": return "1H · SWING";
    case "D1": return "1D · POSITION";
    default: return (timeframe || "M5").toUpperCase();
  }
}

function selectHomeSignalsByHorizon(items: ManualSignal[], limit = 6): ManualSignal[] {
  const horizons = ["M1", "M5", "M15", "H1", "D1"];
  const weltrade = items.filter(signal => {
    const brokers = (signal as any).broker as string[] | null;
    return Array.isArray(brokers) && brokers.includes("weltrade");
  });
  const other = items.filter(signal => {
    const brokers = (signal as any).broker as string[] | null;
    return !Array.isArray(brokers) || !brokers.includes("weltrade");
  });

  // Home prominently carries 3–4 real Weltrade signals when available,
  // then uses up to two additional non-Weltrade signals.
  const selected: ManualSignal[] = [];
  const used = new Set<string>();

  const addByHorizon = (source: ManualSignal[], maxCount: number) => {
    const buckets = new Map<string, ManualSignal[]>(
      horizons.map(tf => [tf, source.filter(signal => normTf(signal.timeframe) === tf)])
    );
    let index = 0;
    while (selected.length < limit && maxCount > 0 && index < limit) {
      for (const tf of horizons) {
        const bucket = buckets.get(tf) || [];
        const signal = bucket[index];
        if (signal && !used.has(signal.id)) {
          selected.push(signal);
          used.add(signal.id);
          maxCount -= 1;
        }
        if (selected.length >= limit || maxCount <= 0) break;
      }
      index += 1;
    }
  };

  addByHorizon(weltrade, Math.min(4, limit));
  addByHorizon(other, Math.min(2, limit - selected.length));

  // If fewer Weltrade signals are available, fill remaining slots with the
  // newest valid signals rather than inventing data.
  if (selected.length < limit) {
    for (const signal of items) {
      if (!used.has(signal.id)) {
        selected.push(signal);
        used.add(signal.id);
        if (selected.length >= limit) break;
      }
    }
  }

  return selected.slice(0, limit);
}

function getBrokerForSymbol(symbol: string): { name: string; link: string; color: string } {
  const s = (symbol || "").toUpperCase();
  if (/^(R_|1HZ|BOOM|CRASH|STEP|JUMP|RANGE|VOL)/i.test(s)) {
    return { name: "Trade on Deriv", link: DERIV_LINK, color: "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20" };
  }
  if (/BTC|ETH|SOL|BNB|XRP|DOGE|ADA|DOT|AVAX|MATIC|CRYPTO/i.test(s)) {
    return { name: "Trade on Binance", link: "https://www.binance.com/en/trade", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/20" };
  }
  if (/XAU|XAG|GOLD|SILVER/i.test(s)) {
    return { name: "Trade on Exness", link: EXNESS_LINK, color: "bg-warning/15 text-warning border-warning/30 hover:bg-warning/25" };
  }
  return { name: "Trade on Exness", link: EXNESS_LINK, color: "bg-warning/15 text-warning border-warning/30 hover:bg-warning/25" };
}

// Home live-feed retention is intentionally fixed at 15 minutes for every signal.
// This only controls visibility on Home; signals remain stored in history and
// any MT5/copy-trading execution is unaffected.
const HOME_SIGNAL_LIVE_MS = 15 * 60 * 1000;
function isSyntx(signal: any): boolean { return signal?.category === "syntx"; }
function marketLabel(signal: any): string {
  const category = String(signal?.category || "").toLowerCase();
  const symbol = String(signal?.symbol || "").toUpperCase();
  if (category === "synthetic" || /^(R_|1HZ|BOOM|CRASH|STEP|JUMP|RANGE|VOL)/.test(symbol)) return "SYNTHETIC";
  if (category === "syntx") return "WELTRADE SyntX";
  if (/XAU|GOLD/.test(symbol)) return "GOLD";
  if (/BTC|ETH|SOL|BNB|XRP/.test(symbol)) return "CRYPTO";
  if (/EUR|GBP|JPY|AUD|CAD|CHF|NZD/.test(symbol)) return "FOREX";
  return category ? category.toUpperCase() : "MARKET";
}
function riskReward(signal: any): string {
  const entry = Number(signal?.entry_price), tp = Number(signal?.take_profit), sl = Number(signal?.stop_loss);
  if (![entry,tp,sl].every(Number.isFinite)) return "—";
  const risk = Math.abs(entry-sl), reward = Math.abs(tp-entry);
  return risk > 0 ? `1:${(reward/risk).toFixed(1)}` : "—";
}

function homeExpiresAt(signal: { created_at: string }): Date {
  return new Date(new Date(signal.created_at).getTime() + HOME_SIGNAL_LIVE_MS);
}

function isSignalExpired(signal: { created_at: string }): boolean {
  return homeExpiresAt(signal).getTime() <= Date.now();
}

function getTimeRemaining(signal: { created_at: string }): string {
  const diffMs = homeExpiresAt(signal).getTime() - Date.now();
  if (diffMs <= 0) return "Expired";
  const minutes = Math.floor(diffMs / 60_000);
  const seconds = Math.floor((diffMs % 60_000) / 1000);
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}


export const HomeSignalsWidget = () => {
  const [brokerFilter, setBrokerFilter] = useState("all");
  const [timeframeFilter, setTimeframeFilter] = useState("all");
  const { user } = useAuth();
  const { isBasicOrAbove } = useSubscriptionGate();

  const { data: signals, isLoading } = useQuery({
    queryKey: ["home-signals-with-wins"],
    queryFn: async () => {
      const now = new Date();
      const fifteenMinutesAgo = new Date(now.getTime() - HOME_SIGNAL_LIVE_MS);
      const { data, error } = await supabase
        .from("trading_signals")
        .select("*")
        .gte("created_at", fifteenMinutesAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as ManualSignal[];
    },
    refetchInterval: 15000,
  });

  const headerSection = (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Signal className="h-5 w-5 text-primary" />
        Latest Trading Signals
      </h2>
      <Button variant="ghost" size="sm" asChild>
        <Link to="/signals">
          View All <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );

  const brokerTabs = (
    <div className="space-y-2 mb-4">
      <div className="flex flex-wrap gap-1.5">
        {TIMEFRAME_FILTERS.map(t => (
          <Button
            key={t.value}
            variant={timeframeFilter === t.value ? "default" : "outline"}
            size="sm"
            className="h-7 text-[11px] px-3 font-bold"
            onClick={() => setTimeframeFilter(t.value)}
          >
            {t.label}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {BROKER_FILTERS.map(b => (
          <Button
            key={b.value}
            variant={brokerFilter === b.value ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs px-3"
            onClick={() => setBrokerFilter(b.value)}
          >
            {b.label}
          </Button>
        ))}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="mt-8">
        {headerSection}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="glass-card animate-pulse">
              <CardContent className="p-4">
                <div className="h-32 bg-muted/30 rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Home is a live 15-minute feed. Do not delete or alter the underlying signal.
  let displaySignals = (signals || []).filter(s => !isSignalExpired(s));

  // Apply broker filter
  if (brokerFilter !== "all") {
    displaySignals = displaySignals.filter(s => {
      const brokers = (s as any).broker as string[] | null;
      if (!brokers || brokers.length === 0) return true; // show untagged signals in all filters
      return brokers.includes(brokerFilter);
    });
  }

  // The ALL view deliberately rotates through the four engine horizons while
  // keeping every displayed signal inside the 15-minute Home retention window.
  if (timeframeFilter !== "all") {
    displaySignals = displaySignals
      .filter(s => normTf(s.timeframe) === timeframeFilter)
      .slice(0, 6);
  } else {
    displaySignals = selectHomeSignalsByHorizon(displaySignals, 6);
  }

  if (displaySignals.length === 0) {
    return (
      <div className="mt-8">
        {headerSection}
        {brokerTabs}
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-1">No Active Signals</h3>
            <p className="text-sm text-muted-foreground">
              {brokerFilter !== "all"
                ? `No active signals for ${BROKER_FILTERS.find(b => b.value === brokerFilter)?.label}. Try "All" or check back soon.`
                : "Signals remain on Home for 15 minutes. Check back soon for new signals."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-8">
      {headerSection}
      {brokerTabs}

      {/* Subscribe CTA Banner */}
      {!isBasicOrAbove && (
        <Card className="mb-4 border-2 border-primary/30 bg-gradient-to-r from-primary/10 via-warning/5 to-transparent overflow-hidden">
          <CardContent className="py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-warning flex items-center justify-center shrink-0">
                <Crown className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">🔓 Unlock All Signals & AI Chart Analysis</p>
                <p className="text-xs text-muted-foreground">
                  Subscribe to get unlimited signals, premium AI chart uploads, and advanced market intelligence.
                </p>
              </div>
            </div>
            <Button asChild className="shrink-0">
              <Link to="/billing">
                <Sparkles className="h-4 w-4 mr-1" /> Subscribe Now
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displaySignals.map((signal) => {
          const isWin = signal.outcome === "win";
          const isLoss = signal.outcome === "loss";
          const signalBrokers = (signal as any).broker as string[] | null;
          const signalCategory = String((signal as any).category || "MARKET").toUpperCase();

          return (
            <Card
              key={signal.id}
              className={`glass-card hover:border-primary/50 transition-all ${
                isWin ? "border-success/50 ring-1 ring-success/20" : ""
              }`}
            >
              <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 via-transparent to-transparent">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-success">LIVE</span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-5">{marketLabel(signal)}</Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{getTimeRemaining(signal)}</span>
                </div>
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <div className="min-w-0"><CardTitle className="text-lg truncate">{signal.symbol}</CardTitle><div className="flex items-center gap-1.5 mt-0.5"><span className="inline-flex h-1.5 w-1.5 rounded-full bg-success animate-pulse" /><span className="text-[9px] uppercase tracking-wider text-success font-bold">Live Posted</span><Badge variant="outline" className="text-[8px] h-4">{signalCategory}</Badge></div></div>
                    <Badge
                      variant={signal.direction === "BUY" ? "default" : "destructive"}
                      className={signal.direction === "BUY" ? "bg-success text-success-foreground" : ""}
                    >
                      {signal.direction === "BUY" ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {signal.direction}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isWin && (
                      <Badge className="bg-success/15 text-success border-success/30 text-xs">
                        <Trophy className="h-3 w-3 mr-1" />
                        WIN
                      </Badge>
                    )}
                    {isLoss && (
                      <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-xs">
                        <XIcon className="h-3 w-3 mr-1" />
                        LOSS
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[9px] font-bold">
                      {timeframeLabel(signal.timeframe)}
                    </Badge>
                  </div>
                </div>
                {/* Broker tags */}
                {signalBrokers && signalBrokers.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {signalBrokers.map(b => (
                      <Badge key={b} variant="outline" className="text-[9px] px-1.5 py-0 h-4 text-muted-foreground">
                        {b}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-sm min-w-0 [&>div]:min-w-0">
                  <div>
                    <p className="text-muted-foreground text-xs">Entry</p>
                    <p className="font-mono font-medium text-xs sm:text-sm truncate">{fmtPrice(signal.entry_price)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">TP</p>
                    <p className="font-mono text-success text-xs sm:text-sm truncate">{fmtPrice(signal.take_profit)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">SL</p>
                    <p className="font-mono text-destructive text-xs sm:text-sm truncate">{fmtPrice(signal.stop_loss)}</p>
                  </div>
                </div>

                {signal.reason && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {signal.reason}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                  <div className="rounded-md bg-muted/30 px-2 py-1.5">
                    <p className="text-[9px] uppercase tracking-wide text-muted-foreground">Risk / Reward</p>
                    <p className="text-xs font-bold">{riskReward(signal)}</p>
                  </div>
                  <div className="rounded-md bg-muted/30 px-2 py-1.5">
                    <p className="text-[9px] uppercase tracking-wide text-muted-foreground">Confidence</p>
                    <p className="text-xs font-bold text-primary">{signal.confidence ? `${signal.confidence}%` : "—"}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                  <div className="flex items-center gap-1 text-xs">
                    <Clock className="h-3 w-3 text-warning" />
                    <span className="text-warning font-medium">
                      Expires in {getTimeRemaining(signal)}
                    </span>
                  </div>
                  {signal.confidence && (
                    
                  )}
                </div>

                {/* Posted time */}
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="h-2.5 w-2.5" />
                  <span>
                    Posted {new Date(signal.created_at).toLocaleString([], {
                      month: "short", day: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Home keeps only two actions per signal: open the matching chart and trade on Weltrade. */}
                <div className="flex gap-1.5 mt-1">
                  <Link to={`/chart/${encodeURIComponent(signal.symbol)}?signal=${encodeURIComponent(signal.id)}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full font-bold text-[10px] px-1.5 py-1 h-7">
                      <BarChart3 className="h-2.5 w-2.5 mr-0.5 shrink-0" />
                      View Chart
                    </Button>
                  </Link>
                  <a href={WELTRADE_LINK} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full font-bold text-[10px] px-1.5 py-1 h-7 bg-primary/10 text-primary border-primary/30 hover:bg-primary/20">
                      <ExternalLink className="h-2.5 w-2.5 mr-0.5 shrink-0" />
                      Weltrade
                    </Button>
                  </a>
                </div>

              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};