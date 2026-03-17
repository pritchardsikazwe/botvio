import { Link } from "react-router-dom";
import { useEffect } from "react";
import { TopAssetsWidget } from "@/components/trading/TopAssetsWidget";
import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { useSignalBrokers, SignalBroker } from "@/hooks/useSignalBrokers";
import { useManualSignals, ManualSignal } from "@/hooks/useManualSignals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, TrendingUp, TrendingDown, Shield, Zap, Star, ArrowRight, Activity, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const BROKER_DETAILS: Record<string, { emoji: string; color: string; features: string[]; minDeposit: string; payout: string }> = {
  "deriv": { emoji: "🔴", color: "border-destructive/40", features: ["Synthetic Indices", "Boom & Crash", "Volatility Index", "24/7 Trading"], minDeposit: "$5", payout: "Up to 95%" },
  "pocket-option": { emoji: "🔵", color: "border-blue-500/40", features: ["OTC Markets", "1-Min Trades", "Social Trading", "50+ Assets"], minDeposit: "$5", payout: "Up to 92%" },
  "quotex": { emoji: "🟢", color: "border-green-500/40", features: ["Fast Execution", "Copy Trading", "Demo Account", "OTC Pairs"], minDeposit: "$10", payout: "Up to 98%" },
  "iq-option": { emoji: "🟡", color: "border-yellow-500/40", features: ["300+ Assets", "Tournaments", "Education Hub", "Multi-Chart"], minDeposit: "$10", payout: "Up to 95%" },
  "binomo": { emoji: "🟣", color: "border-purple-500/40", features: ["Easy Interface", "Low Entry", "Quick Trades", "Mobile App"], minDeposit: "$10", payout: "Up to 90%" },
};

/** Mini signal row for inline display */
const MiniSignalRow = ({ signal }: { signal: ManualSignal }) => {
  const isBuy = signal.direction === "BUY";
  const timeAgo = getTimeAgo(signal.created_at);

  return (
    <div className="flex items-center justify-between gap-2 py-1.5 border-b border-border/30 last:border-0">
      <div className="flex items-center gap-2 min-w-0">
        <Badge className={`text-[10px] px-1.5 py-0 ${isBuy ? "bg-success/20 text-success border-success/30" : "bg-destructive/20 text-destructive border-destructive/30"}`}>
          {isBuy ? <TrendingUp className="h-2.5 w-2.5 mr-0.5" /> : <TrendingDown className="h-2.5 w-2.5 mr-0.5" />}
          {signal.direction}
        </Badge>
        <span className="font-semibold text-xs truncate">{signal.symbol}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] text-muted-foreground">{signal.entry_price}</span>
        <Badge variant="outline" className="text-[9px] px-1 py-0">
          {signal.confidence ? `${signal.confidence}%` : signal.timeframe}
        </Badge>
        <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
          <Clock className="h-2.5 w-2.5" />{timeAgo}
        </span>
      </div>
    </div>
  );
};

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

const BrokerCardWithSignals = ({ broker, signals }: { broker: SignalBroker; signals: ManualSignal[] }) => {
  const details = BROKER_DETAILS[broker.slug] || { emoji: "⚪", color: "border-border", features: [], minDeposit: "—", payout: "—" };
  const brokerSignals = signals.filter(s => s.broker?.includes(broker.slug));
  const activeSignals = brokerSignals.filter(s => s.status === "ACTIVE");

  return (
    <Card className={`glass-card ${details.color} hover:shadow-lg transition-all`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-2xl">{details.emoji}</span>
            {broker.name}
          </CardTitle>
          <div className="flex items-center gap-1.5">
            {activeSignals.length > 0 && (
              <Badge className="bg-success/20 text-success border-success/30 text-[10px] animate-pulse">
                <Activity className="h-2.5 w-2.5 mr-0.5" />
                {activeSignals.length} Live
              </Badge>
            )}
            {broker.best_for && (
              <Badge variant="outline" className="text-[10px]">{broker.best_for}</Badge>
            )}
          </div>
        </div>
        {broker.description && (
          <p className="text-sm text-muted-foreground">{broker.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Live Signals Section */}
        {activeSignals.length > 0 ? (
          <div className="rounded-lg bg-muted/20 border border-border/40 p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold flex items-center gap-1">
                <Activity className="h-3 w-3 text-success" /> Live Signals
              </p>
              <Link to={`/brokers/${broker.slug}`} className="text-[10px] text-primary hover:underline">
                View all →
              </Link>
            </div>
            <div className="space-y-0">
              {activeSignals.slice(0, 3).map((signal) => (
                <MiniSignalRow key={signal.id} signal={signal} />
              ))}
              {activeSignals.length > 3 && (
                <p className="text-[10px] text-muted-foreground text-center pt-1">
                  +{activeSignals.length - 3} more signals
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-muted/10 border border-dashed border-border/40 p-3 text-center">
            <p className="text-xs text-muted-foreground">No active signals — check back soon</p>
          </div>
        )}

        {/* Key Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-muted/30 p-2 text-center">
            <p className="text-xs text-muted-foreground">Min Deposit</p>
            <p className="font-bold text-sm">{details.minDeposit}</p>
          </div>
          <div className="rounded-lg bg-muted/30 p-2 text-center">
            <p className="text-xs text-muted-foreground">Payout</p>
            <p className="font-bold text-sm text-success">{details.payout}</p>
          </div>
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-1">
          {details.features.map((f) => (
            <Badge key={f} variant="secondary" className="text-[10px]">{f}</Badge>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button className="flex-1" asChild>
            <a href={broker.affiliate_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Trade Now
            </a>
          </Button>
          <Button variant="outline" className="flex-1" asChild>
            <Link to={`/brokers/${broker.slug}`}>
              Signals & Strategies <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const BinaryOptions = () => {
  const { data: brokers, isLoading: brokersLoading } = useSignalBrokers();
  const { data: signals = [], isLoading: signalsLoading } = useManualSignals({ status: "ACTIVE" });
  const queryClient = useQueryClient();

  // Realtime subscription for live signal updates
  useEffect(() => {
    const channel = supabase
      .channel("binary-signals-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "trading_signals" }, () => {
        queryClient.invalidateQueries({ queryKey: ["manual-signals"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const isLoading = brokersLoading || signalsLoading;
  const totalActive = signals.filter(s => s.status === "ACTIVE").length;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Binary Options Brokers — Live Signals & Compare"
        description="Compare the best binary options brokers with live trading signals. Find the right platform for synthetic indices, OTC markets, forex, and crypto binary trading."
      />
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Hero */}
        <div className="glass-card p-6 mb-6 text-center">
          <h1 className="text-3xl font-extrabold mb-2">🎯 Binary Options Brokers</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose your preferred broker and start trading binary options with live signals, AI analysis, and proven strategies.
          </p>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="glass-card text-center p-4">
            <Activity className="h-5 w-5 text-success mx-auto mb-1" />
            <p className="text-xl font-bold">{totalActive}</p>
            <p className="text-xs text-muted-foreground">Live Signals</p>
          </Card>
          <Card className="glass-card text-center p-4">
            <TrendingUp className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold">{brokers?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Supported Brokers</p>
          </Card>
          <Card className="glass-card text-center p-4">
            <Zap className="h-5 w-5 text-warning mx-auto mb-1" />
            <p className="text-xl font-bold">24/7</p>
            <p className="text-xs text-muted-foreground">Trading Available</p>
          </Card>
          <Card className="glass-card text-center p-4">
            <Shield className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold">AI</p>
            <p className="text-xs text-muted-foreground">Smart Routing</p>
          </Card>
        </div>

        {/* Broker Cards with Live Signals */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="glass-card animate-pulse">
                <CardContent className="p-6"><div className="h-64 bg-muted/30 rounded-lg" /></CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(brokers || []).map((broker) => (
              <BrokerCardWithSignals key={broker.id} broker={broker} signals={signals} />
            ))}
          </div>
        )}

        {/* Top 5 Assets Today */}
        <div className="mt-8">
          <TopAssetsWidget />
        </div>

        {/* CTA */}
        <Card className="glass-card mt-8 border-primary/30">
          <CardContent className="py-6 text-center">
            <h3 className="font-bold text-lg mb-2">Need Help Choosing?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Our AI signal router automatically picks the best broker for each trade based on asset type and market conditions.
            </p>
            <Button asChild>
              <Link to="/signals">View All Signals <ArrowRight className="h-4 w-4 ml-2" /></Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default BinaryOptions;
