import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Signal, ArrowRight, TrendingUp, TrendingDown, Clock, AlertCircle, Trophy, XCircle as XIcon, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import type { ManualSignal } from "@/hooks/useManualSignals";

const EXNESS_LINK = "https://one.exness-track.com/a/ts1kvs1k";
const DERIV_LINK = "https://deriv.partners/rx?sidi=F9C8D3BF-5854-499A-8497-F5C370F804DC&utm_campaign=dynamicworks&utm_medium=affiliate&utm_source=CU23827";
const WELTRADE_LINK = "https://gowt.net/ib67505";

function getBrokerForSymbol(symbol: string): { name: string; link: string; color: string } {
  const s = (symbol || "").toUpperCase();
  // Deriv synthetics
  if (/^(R_|1HZ|BOOM|CRASH|STEP|JUMP|RANGE|VOL)/i.test(s)) {
    return { name: "Trade on Deriv", link: DERIV_LINK, color: "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20" };
  }
  // Crypto
  if (/BTC|ETH|SOL|BNB|XRP|DOGE|ADA|DOT|AVAX|MATIC|CRYPTO/i.test(s)) {
    return { name: "Trade on Deriv", link: DERIV_LINK, color: "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20" };
  }
  // Forex & Metals → Exness primary, Weltrade secondary
  if (/XAU|XAG|GOLD|SILVER/i.test(s)) {
    return { name: "Trade on Exness", link: EXNESS_LINK, color: "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20" };
  }
  // Default forex pairs → Exness
  return { name: "Trade on Exness", link: EXNESS_LINK, color: "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20" };
}

// Map timeframe to ms for expiration
function timeframeToMs(timeframe: string): number {
  const map: Record<string, number> = {
    M1: 60_000, M5: 300_000, M15: 900_000, M30: 1_800_000,
    H1: 3_600_000, H4: 14_400_000, D1: 86_400_000,
  };
  return map[timeframe] || 300_000;
}

function isSignalExpired(signal: { created_at: string; expires_at?: string | null; timeframe?: string }): boolean {
  const now = new Date();
  if (signal.expires_at) return new Date(signal.expires_at) < now;
  const createdAt = new Date(signal.created_at);
  return new Date(createdAt.getTime() + timeframeToMs(signal.timeframe || "M5")) < now;
}

function getTimeRemaining(signal: { created_at: string; expires_at?: string | null; timeframe?: string; outcome?: string | null }): string {
  const now = new Date();

  // Won signals show time remaining in 24h showcase window
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

// Check if a won signal is still within its 24h showcase window
function isWinShowcaseActive(signal: ManualSignal): boolean {
  if (signal.outcome !== "win") return false;
  const updatedAt = signal.outcome_updated_at;
  if (!updatedAt) return false;
  const showcaseEnd = new Date(new Date(updatedAt).getTime() + 24 * 60 * 60 * 1000);
  return showcaseEnd > new Date();
}

export const HomeSignalsWidget = () => {
  const { data: signals, isLoading } = useQuery({
    queryKey: ["home-signals-with-wins"],
    queryFn: async () => {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      // Fetch active signals + recently won signals
      const { data, error } = await supabase
        .from("trading_signals")
        .select("*")
        .or(`status.eq.ACTIVE,outcome.eq.win`)
        .gte("created_at", twoDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return (data || []) as ManualSignal[];
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Signal className="h-5 w-5 text-primary" />
            Latest Trading Signals
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
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

  // Show: active non-expired signals + won signals within 24h showcase
  const displaySignals = (signals || []).filter(s => {
    // Won signals stay for 24h after being marked
    if (s.outcome === "win" && isWinShowcaseActive(s)) return true;
    // Active signals that haven't expired
    if (s.status === "ACTIVE" && !isSignalExpired(s)) return true;
    return false;
  }).slice(0, 3);

  if (displaySignals.length === 0) {
    return (
      <div className="mt-8">
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
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-1">No Active Signals</h3>
            <p className="text-sm text-muted-foreground">
              Signals expire based on their timeframe. Check back soon for new opportunities.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-8">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displaySignals.map((signal) => {
          const isWin = signal.outcome === "win";
          const isLoss = signal.outcome === "loss";

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
                    <Badge variant="outline">{signal.timeframe}</Badge>
                  </div>
                </div>
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

                  {/* Broker CTA */}
                  {(() => {
                    const broker = getBrokerForSymbol(signal.symbol);
                    return (
                      <a href={broker.link} target="_blank" rel="noopener noreferrer" className="block">
                        <Button
                          variant="outline"
                          size="sm"
                          className={`w-full font-bold text-xs mt-1 ${broker.color}`}
                        >
                          <ExternalLink className="h-3 w-3 mr-1.5" />
                          {broker.name}
                        </Button>
                      </a>
                    );
                  })()}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
