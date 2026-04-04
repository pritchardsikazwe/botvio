import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEOHead } from "@/components/seo/SEOHead";
import {
  TrendingUp, TrendingDown, Zap, Shield, Target, Clock,
  ArrowUpDown, Coins, Rocket, BarChart3, Activity,
  RefreshCw, Crown, Lock, Flame
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

// ── Binance Crypto Signals (from trading_signals table) ──
function useBinanceSignals(category?: string) {
  return useQuery({
    queryKey: ["binance-signals", category],
    queryFn: async () => {
      let q = supabase
        .from("trading_signals")
        .select("*")
        .contains("broker", ["binance"])
        .order("created_at", { ascending: false })
        .limit(30);
      if (category) q = q.eq("category", category);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30_000,
  });
}

// ── Generate signals (admin) ──
function useGenerateBinanceSignals() {
  return useMutation({
    mutationFn: async (type: string) => {
      const { data, error } = await supabase.functions.invoke("generate-binance-signals", {
        body: { signal_type: type },
      });
      if (error) throw error;
      return data;
    },
  });
}

// ── Signal Card Component ──
const CryptoSignalCard = ({ signal }: { signal: any }) => {
  const isBuy = signal.direction === "BUY" || signal.direction === "LONG";
  const isSell = signal.direction === "SELL" || signal.direction === "SHORT";
  const isFutures = signal.strategy_name?.includes("Futures");
  const leverage = signal.reason?.match(/Leverage:\s*x?(\d+)/i)?.[1];

  return (
    <Card className={`border-l-4 ${isBuy ? "border-l-emerald-500" : isSell ? "border-l-red-500" : "border-l-yellow-500"}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isBuy ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
              {isBuy ? <TrendingUp className="w-5 h-5 text-emerald-500" /> : <TrendingDown className="w-5 h-5 text-red-500" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">{signal.symbol}</span>
                {isFutures && <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-500">FUTURES</Badge>}
              </div>
              <span className={`text-sm font-semibold ${isBuy ? "text-emerald-500" : "text-red-500"}`}>
                {signal.direction} {leverage ? `x${leverage}` : ""}
              </span>
            </div>
          </div>
          <div className="text-right">
            <Badge variant={signal.status === "ACTIVE" ? "default" : "secondary"} className="text-xs">
              {signal.status}
            </Badge>
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {new Date(signal.created_at).toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Confidence */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Confidence:</span>
          <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${signal.confidence >= 75 ? "bg-emerald-500" : signal.confidence >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
              style={{ width: `${signal.confidence}%` }}
            />
          </div>
          <span className={`text-sm font-mono font-bold ${signal.confidence >= 75 ? "text-emerald-500" : signal.confidence >= 50 ? "text-yellow-500" : "text-muted-foreground"}`}>
            {signal.confidence}%
          </span>
        </div>

        {/* Price levels */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-secondary/50 rounded-lg p-2 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="w-3 h-3 text-primary" />
              <span className="text-[10px] text-muted-foreground uppercase">Entry</span>
            </div>
            <p className="font-mono text-sm font-semibold">${Number(signal.entry_price).toLocaleString()}</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-2 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Shield className="w-3 h-3 text-red-500" />
              <span className="text-[10px] text-muted-foreground uppercase">SL</span>
            </div>
            <p className="font-mono text-sm font-semibold text-red-500">
              {signal.stop_loss ? `$${Number(signal.stop_loss).toLocaleString()}` : "—"}
            </p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-2 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] text-muted-foreground uppercase">TP</span>
            </div>
            <p className="font-mono text-sm font-semibold text-emerald-500">
              {signal.take_profit ? `$${Number(signal.take_profit).toLocaleString()}` : "—"}
            </p>
          </div>
        </div>

        {signal.reason && (
          <p className="text-xs text-muted-foreground bg-secondary/30 rounded p-2">{signal.reason}</p>
        )}
      </CardContent>
    </Card>
  );
};

// ── Arbitrage Scanner Card ──
const ArbitrageScanner = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-lg flex items-center gap-2">
        <ArrowUpDown className="h-5 w-5 text-primary" /> Arbitrage Scanner
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <p className="text-sm text-muted-foreground">Buy low on spot, sell higher on futures — real-time spread detection.</p>
      {[
        { pair: "BTC/USDT", spread: "+0.12%", status: "Active" },
        { pair: "ETH/USDT", spread: "+0.08%", status: "Active" },
        { pair: "SOL/USDT", spread: "+0.15%", status: "Hot" },
      ].map((item) => (
        <div key={item.pair} className="flex items-center justify-between bg-secondary/30 rounded-lg p-3">
          <span className="font-semibold text-sm">{item.pair}</span>
          <span className="text-emerald-500 font-mono text-sm">{item.spread}</span>
          <Badge variant={item.status === "Hot" ? "destructive" : "secondary"} className="text-xs">
            {item.status === "Hot" ? <Flame className="w-3 h-3 mr-1" /> : null}
            {item.status}
          </Badge>
        </div>
      ))}
      <p className="text-[10px] text-muted-foreground text-center">Live data requires Binance API connection</p>
    </CardContent>
  </Card>
);

// ── Staking Opportunities ──
const StakingCard = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-lg flex items-center gap-2">
        <Coins className="h-5 w-5 text-yellow-500" /> Staking & Earn
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <p className="text-sm text-muted-foreground">Lock crypto → earn passive income. Best APY opportunities.</p>
      {[
        { coin: "ETH", apy: "3.2%", lock: "Flexible" },
        { coin: "BNB", apy: "5.8%", lock: "30 days" },
        { coin: "USDT", apy: "6.5%", lock: "60 days" },
        { coin: "SOL", apy: "7.1%", lock: "90 days" },
      ].map((s) => (
        <div key={s.coin} className="flex items-center justify-between bg-secondary/30 rounded-lg p-3">
          <span className="font-semibold text-sm">{s.coin}</span>
          <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">{s.apy} APY</Badge>
          <span className="text-xs text-muted-foreground">{s.lock}</span>
        </div>
      ))}
      <Button variant="outline" className="w-full text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/10" asChild>
        <a href="https://www.binance.com/en/earn" target="_blank" rel="noopener noreferrer">
          Explore on Binance <Coins className="ml-2 h-4 w-4" />
        </a>
      </Button>
    </CardContent>
  </Card>
);

// ── Launchpad ──
const LaunchpadCard = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-lg flex items-center gap-2">
        <Rocket className="h-5 w-5 text-purple-500" /> Launchpad & New Coins
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <p className="text-sm text-muted-foreground">Get early access to new token launches on Binance.</p>
      <div className="bg-gradient-to-r from-purple-500/10 to-primary/10 rounded-lg p-4 border border-purple-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Rocket className="h-5 w-5 text-purple-500" />
          <span className="font-bold">New Listing Alerts</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Botvio AI scans Binance announcements and alerts you to upcoming token launches before they go live.
        </p>
        <Badge variant="outline" className="text-purple-400 border-purple-400/30">Coming Soon</Badge>
      </div>
      <Button variant="outline" className="w-full text-purple-400 border-purple-400/30 hover:bg-purple-500/10" asChild>
        <a href="https://www.binance.com/en/launchpad" target="_blank" rel="noopener noreferrer">
          Binance Launchpad <Rocket className="ml-2 h-4 w-4" />
        </a>
      </Button>
    </CardContent>
  </Card>
);

// ── Scalping Section ──
const ScalpingCard = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-lg flex items-center gap-2">
        <Activity className="h-5 w-5 text-emerald-500" /> AI Scalping Signals
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <p className="text-sm text-muted-foreground">Fast in-and-out trades powered by Botvio AI. High frequency, data-driven.</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <BarChart3 className="h-6 w-6 mx-auto mb-1 text-primary" />
          <p className="text-xs font-semibold">Win Rate Tracking</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <Zap className="h-6 w-6 mx-auto mb-1 text-yellow-500" />
          <p className="text-xs font-semibold">Sub-5min Trades</p>
        </div>
      </div>
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
        <p className="text-sm font-semibold text-emerald-500">Powered by Botvio AI Engine</p>
        <p className="text-xs text-muted-foreground">Gemini-driven analysis on 1H klines</p>
      </div>
    </CardContent>
  </Card>
);

// ═══════════════════════════ MAIN PAGE ═══════════════════════════
const BinanceHub = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState("all");
  const { data: signals, isLoading, refetch } = useBinanceSignals(tab === "all" ? undefined : tab);
  const generate = useGenerateBinanceSignals();

  const isAdmin = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["admin", "super_admin"])
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const handleGenerate = async (type: string) => {
    try {
      const res = await generate.mutateAsync(type);
      toast.success(`Generated ${res?.signals_posted ?? 0} signals`);
      refetch();
    } catch (e: any) {
      toast.error(e.message || "Signal generation failed");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Binance Crypto Trading Hub — Botvio"
        description="Live Binance crypto signals: spot, futures, arbitrage scanner, staking & launchpad alerts powered by Botvio AI."
      />
      <Header />
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Hero */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold flex items-center justify-center gap-2">
            <Flame className="h-7 w-7 text-yellow-500" /> Binance Trading Hub
          </h1>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            Spot & Futures signals, Arbitrage scanner, Staking yields, Launchpad alerts — all powered by Botvio AI.
          </p>
        </div>

        {/* Admin Controls */}
        {isAdmin.data && (
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="h-5 w-5 text-yellow-500" />
                <span className="font-bold text-sm">Admin: Generate Signals</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => handleGenerate("spot")} disabled={generate.isPending}>
                  <RefreshCw className={`h-4 w-4 mr-1 ${generate.isPending ? "animate-spin" : ""}`} />
                  Spot Signals
                </Button>
                <Button size="sm" variant="outline" className="border-yellow-500/30 text-yellow-500" onClick={() => handleGenerate("futures")} disabled={generate.isPending}>
                  <Zap className="h-4 w-4 mr-1" />
                  Futures Signals
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Signal Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="all">🔥 All</TabsTrigger>
            <TabsTrigger value="crypto">📊 Spot</TabsTrigger>
            <TabsTrigger value="futures">⚡ Futures</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-40 bg-secondary/30 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : signals && signals.length > 0 ? (
              <div className="space-y-3">
                {signals.map((s: any) => (
                  <CryptoSignalCard key={s.id} signal={s} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="font-semibold">No Binance signals yet</p>
                  <p className="text-sm text-muted-foreground">Signals are generated by Botvio AI and posted automatically.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ScalpingCard />
          <ArbitrageScanner />
          <StakingCard />
          <LaunchpadCard />
        </div>

        {/* CTA */}
        <Card className="bg-gradient-to-r from-yellow-500/10 to-primary/10 border-yellow-500/20">
          <CardContent className="py-6 text-center space-y-3">
            <h3 className="text-xl font-bold">Get VIP Futures Signals</h3>
            <p className="text-sm text-muted-foreground">
              Unlock high-leverage futures signals, advanced arbitrage alerts, and priority Launchpad notifications.
            </p>
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold" asChild>
              <Link to="/billing">
                <Crown className="mr-2 h-4 w-4" /> Upgrade to VIP
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default BinanceHub;
