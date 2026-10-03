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
  { value: "M15", label: "15M · Intraday" },
  { value: "H1", label: "1H · Swing" },
  { value: "D1", label: "1D · Position" },
];

function timeframeLabel(timeframe?: string | null): string {
  switch ((timeframe || "").toUpperCase()) {
    case "M1": return "1M · SCALPING";
    case "M15": return "15M · INTRADAY";
    case "H1": return "1H · SWING";
    case "D1": return "1D · POSITION";
    default: return (timeframe || "M5").toUpperCase();
  }
}

function selectHomeSignalsByHorizon(items: ManualSignal[], limit = 6): ManualSignal[] {
  const horizons = ["M1", "M15", "H1", "D1"];
  const buckets = new Map<string, ManualSignal[]>(
    horizons.map(tf => [tf, items.filter(signal => (signal.timeframe || "").toUpperCase() === tf)])
  );
  const selected: ManualSignal[] = [];
  let index = 0;

  while (selected.length < limit && index < limit) {
    for (const tf of horizons) {
      const bucket = buckets.get(tf) || [];
      if (bucket[index]) selected.push(bucket[index]);
      if (selected.length >= limit) break;
    }
    index += 1;
  }

  // If a horizon has no currently valid signal, fill remaining slots with
  // the newest signals from any horizon rather than inventing data.
  if (selected.length < limit) {
    const selectedIds = new Set(selected.map(signal => signal.id));
    for (const signal of items) {
      if (!selectedIds.has(signal.id)) {
        selected.push(signal);
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

function timeframeToMs(timeframe: string): number {
  const map: Record<string, number> = {
    M1: 60_000, M5: 300_000, M15: 900_000, M30: 1_800_000,
    H1: 3_600_000, H4: 14_400_000, D1: 86_400_000,
  };
  return map[timeframe] || 300_000;
}

// Weltrade SyntX chart signals stay live until TP/SL resolves them (max 60 min).
const SYNTX_LIVE_MS = 60 * 60 * 1000;
function isSyntx(signal: any): boolean { return signal?.category === "syntx"; }

function isSignalExpired(signal: { created_at: string; expires_at?: string | null; timeframe?: string; category?: string }): boolean {
  const now = new Date();
  if (isSyntx(signal) && !signal.expires_at) return new Date(signal.created_at).getTime() + SYNTX_LIVE_MS < now.getTime();
  if (signal.expires_at) return new Date(signal.expires_at) < now;
  const createdAt = new Date(signal.created_at);
  return new Date(createdAt.getTime() + timeframeToMs(signal.timeframe || "M5")) < now;
}

function getTimeRemaining(signal: { created_at: string; expires_at?: string | null; timeframe?: string; outcome?: string | null }): string {
  const now = new Date();
  if (signal.outcome === "win") {
    const updatedAt = (signal as any).outcome_updated_at;
    if (updatedAt) {
      const showcaseEnd = new Date(new Date(updatedAt).getTime() + 24 * 60 * 60 * 1000);
      const diffMs = showcaseEnd.getTime() - now.getTime();
      if (diffMs <= 0) return "Expired";
      const hours = Math.floor(diffMs / 3_600_000);
      const minutes = Math.floor((diffMs % 3_600_000) / 60_000);
      return `${hours}h ${minutes}m`;
    }
  }
  let expiresAt: Date;
  if (signal.expires_at) {
    expiresAt = new Date(signal.expires_at);
  } else if (isSyntx(signal)) {
    expiresAt = new Date(new Date(signal.created_at).getTime() + SYNTX_LIVE_MS);
  } else {
    const createdAt = new Date(signal.created_at);
    expiresAt = new Date(createdAt.getTime() + timeframeToMs(signal.timeframe || "M5"));
  }
  const diffMs = expiresAt.getTime() - now.getTime();
  if (diffMs <= 0) return "Expired";
  const hours = Math.floor(diffMs / 3_600_000);
  const minutes = Math.floor((diffMs % 3_600_000) / 60_000);
  const seconds = Math.floor((diffMs % 60_000) / 1000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function isWinShowcaseActive(signal: ManualSignal): boolean {
  if (signal.outcome !== "win") return false;
  const updatedAt = signal.outcome_updated_at;
  if (!updatedAt) return false;
  const showcaseEnd = new Date(new Date(updatedAt).getTime() + 24 * 60 * 60 * 1000);
  return showcaseEnd > new Date();
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
      const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
      const { data, error } = await supabase
        .from("trading_signals")
        .select("*")
        .or(`status.eq.ACTIVE,outcome.eq.win`)
        .gte("created_at", fourDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      // Weltrade SyntX signals are fetched separately so the high-volume
      // automated feeds never crowd them out of the 100-row window.
      const { data: wt } = await supabase
        .from("trading_signals")
        .select("*")
        .eq("category", "syntx")
        .eq("status", "ACTIVE")
        .gte("created_at", new Date(now.getTime() - SYNTX_LIVE_MS).toISOString())
        .order("created_at", { ascending: false })
        .limit(10);
      const ids = new Set((data || []).map((d: any) => d.id));
      return [...(wt || []).filter((d: any) => !ids.has(d.id)), ...(data || [])] as ManualSignal[];
    },
    refetchInterval: 30000,
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

  // Filter: active non-expired + won showcase
  let displaySignals = (signals || []).filter(s => {
    if (s.outcome === "win" && isWinShowcaseActive(s)) return true;
    if (s.status === "ACTIVE" && !isSignalExpired(s)) return true;
    return false;
  });

  // Apply broker filter
  if (brokerFilter !== "all") {
    displaySignals = displaySignals.filter(s => {
      const brokers = (s as any).broker as string[] | null;
      if (!brokers || brokers.length === 0) return true; // show untagged signals in all filters
      return brokers.includes(brokerFilter);
    });
  }

  // The ALL view deliberately rotates through the four engine horizons so
  // frequent M1 scalps do not crowd out 15M / 1H / 1D setups.
  if (timeframeFilter !== "all") {
    displaySignals = displaySignals
      .filter(s => (s.timeframe || "").toUpperCase() === timeframeFilter)
      .slice(0, 6);
  } else {
    // Reserve up to 2 slots for live Weltrade SyntX signals.
    const wt = displaySignals.filter(isSyntx).slice(0, 2);
    const rest = selectHomeSignalsByHorizon(displaySignals.filter(s => !isSyntx(s)), 6 - wt.length);
    displaySignals = [...wt, ...rest];
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
                : "Signals expire based on their timeframe. Check back soon for new opportunities."}
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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {displaySignals.map((signal) => {
          const isWin = signal.outcome === "win";
          const isLoss = signal.outcome === "loss";
          const signalBrokers = (signal as any).broker as string[] | null;

          return (
            <Card
              key={signal.id}
              className={`glass-card hover:border-primary/50 transition-all ${
                isWin ? "border-success/50 ring-1 ring-success/20" : ""
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{signal.symbol}</CardTitle>
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
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Entry</p>
                    <p className="font-mono font-medium">{signal.entry_price}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">TP</p>
                    <p className="font-mono text-success">{signal.take_profit || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">SL</p>
                    <p className="font-mono text-destructive">{signal.stop_loss || "-"}</p>
                  </div>
                </div>

                {signal.reason && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {signal.reason}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-1 text-xs">
                    {isWin ? (
                      <>
                        <Trophy className="h-3 w-3 text-success" />
                        <span className="text-success font-medium">
                          Showcase: {getTimeRemaining(signal)}
                        </span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3 text-warning" />
                        <span className="text-warning font-medium">
                          Expires: {getTimeRemaining(signal)}
                        </span>
                      </>
                    )}
                  </div>
                  {signal.confidence && (
                    <Badge variant="outline" className="text-xs">
                      {signal.confidence}% confidence
                    </Badge>
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

                {/* Broker CTAs */}
                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="flex gap-1.5">
                    <a href={EXNESS_LINK} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full font-bold text-[10px] px-1.5 py-1 h-7 bg-warning/15 text-warning border-warning/30 hover:bg-warning/25">
                        <ExternalLink className="h-2.5 w-2.5 mr-0.5 shrink-0" />
                        Exness
                      </Button>
                    </a>
                    <a href={DERIV_LINK} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full font-bold text-[10px] px-1.5 py-1 h-7 bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20">
                        <ExternalLink className="h-2.5 w-2.5 mr-0.5 shrink-0" />
                        Deriv
                      </Button>
                    </a>
                  </div>
                  <a href={WELTRADE_LINK} target="_blank" rel="noopener noreferrer" className="w-full">
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