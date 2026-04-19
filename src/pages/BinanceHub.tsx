import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/trading/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEOHead } from "@/components/seo/SEOHead";
import { Zap, RefreshCw, Crown, Flame } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { CryptoInstrumentCard } from "@/components/binance/CryptoInstrumentCard";
import { BinanceSignalCard } from "@/components/binance/BinanceSignalCard";
import { ArbitrageScanner, StakingCard, LaunchpadCard, ScalpingCard } from "@/components/binance/BinanceFeatureCards";
import { BinanceMarketOverview } from "@/components/binance/BinanceMarketOverview";
import { MultiAssetScalpRobot } from "@/components/chart/MultiAssetScalpRobot";
import { AutoTradePanel } from "@/components/trading/AutoTradePanel";

const SPOT_INSTRUMENTS = [
  { symbol: "BTCUSDT", display: "BTC/USDT", tip: "Bitcoin is the most liquid crypto. Trade breakouts above key round numbers ($60k, $70k). Use the 4H chart for trend direction and 15m for entries." },
  { symbol: "ETHUSDT", display: "ETH/USDT", tip: "Ethereum often follows BTC but with higher beta. Watch ETH/BTC ratio — when it's rising, ETH outperforms. Great for swing trades on support bounces." },
  { symbol: "SOLUSDT", display: "SOL/USDT", tip: "Solana is high-volatility — perfect for scalping. Look for volume spikes on 5m chart and ride momentum. Tight stop losses are essential." },
  { symbol: "BNBUSDT", display: "BNB/USDT", tip: "BNB tends to pump before Binance events (Launchpad, burns). Monitor Binance announcements and accumulate on dips near quarterly burn dates." },
  { symbol: "XRPUSDT", display: "XRP/USDT", tip: "XRP is news-driven — legal/regulatory updates cause big moves. Set alerts and trade breakouts after consolidation. Avoid during low-volume weekends." },
  { symbol: "ADAUSDT", display: "ADA/USDT", tip: "Cardano moves in cycles around network upgrades. Best strategy: buy the rumour on testnet announcements, take profit on mainnet launch." },
  { symbol: "DOGEUSDT", display: "DOGE/USDT", tip: "Meme coin = sentiment-driven. Watch social media trends and whale wallets. Quick scalps work best — don't hold long positions overnight." },
  { symbol: "DOTUSDT", display: "DOT/USDT", tip: "Polkadot parachain auctions drive price action. Trade the cycle: accumulate before auctions, sell the news after slot wins." },
  { symbol: "AVAXUSDT", display: "AVAX/USDT", tip: "Avalanche thrives on DeFi activity. Monitor TVL (Total Value Locked) — rising TVL often precedes price moves. Use EMA 20/50 crossover strategy." },
  { symbol: "LINKUSDT", display: "LINK/USDT", tip: "Chainlink pumps on new integrations and partnerships. Follow LINK staking data and oracle adoption metrics. Mean-reversion works well in ranges." },
];

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

const BinanceHub = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState("all");
  const { data: signals, isLoading, refetch } = useBinanceSignals(tab === "all" ? undefined : tab);

  const isAdmin = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).in("role", ["admin", "super_admin"]).maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const generate = useMutation({
    mutationFn: async (type: string) => {
      const { data, error } = await supabase.functions.invoke("generate-binance-signals", { body: { signal_type: type } });
      if (error) throw error;
      return data;
    },
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
      <SEOHead title="Binance Crypto Trading Hub — Botvio" description="Live Binance crypto signals: spot, futures, arbitrage scanner, staking & launchpad alerts powered by Botvio AI." />
      <Header />
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Hero */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold flex items-center justify-center gap-2">
            <Flame className="h-7 w-7 text-yellow-500" /> Binance Trading Hub
          </h1>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            Live charts, AI signals, arbitrage scanner & more — powered by Botvio AI.
          </p>
        </div>

        {/* Market Overview */}
        <BinanceMarketOverview />

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
                  <RefreshCw className={`h-4 w-4 mr-1 ${generate.isPending ? "animate-spin" : ""}`} /> Spot Signals
                </Button>
                <Button size="sm" variant="outline" className="border-yellow-500/30 text-yellow-500" onClick={() => handleGenerate("futures")} disabled={generate.isPending}>
                  <Zap className="h-4 w-4 mr-1" /> Futures Signals
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botvio Scalp Robot — Crypto (BTC / ETH, 1m / 5m breakouts & S/R breaks) */}
        <div>
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" /> Botvio Scalp Robot — Crypto
          </h2>
          <MultiAssetScalpRobot
            title="Crypto Scalp Robot"
            assets={[
              { displaySymbol: "BTC/USD", label: "Bitcoin", emoji: "₿", cryptoAlwaysOpen: true },
              { displaySymbol: "ETH/USD", label: "Ethereum", emoji: "⟠", cryptoAlwaysOpen: true },
            ]}
          />
        </div>

        {/* Live Spot Instruments */}
        <div>
          <h2 className="text-xl font-bold mb-3">📊 Live Spot Instruments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SPOT_INSTRUMENTS.map((inst) => (
              <CryptoInstrumentCard key={inst.symbol} symbol={inst.symbol} displayName={inst.display} tip={inst.tip} />
            ))}
          </div>
        </div>

        {/* Signal Tabs */}
        <div>
          <h2 className="text-xl font-bold mb-3">⚡ AI Trading Signals</h2>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="all">🔥 All</TabsTrigger>
              <TabsTrigger value="crypto">📊 Spot</TabsTrigger>
              <TabsTrigger value="futures">⚡ Futures</TabsTrigger>
            </TabsList>
            <TabsContent value={tab} className="mt-4">
              {isLoading ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-40 bg-secondary/30 rounded-lg animate-pulse" />)}</div>
              ) : signals && signals.length > 0 ? (
                <div className="space-y-3">{signals.map((s: any) => <BinanceSignalCard key={s.id} signal={s} />)}</div>
              ) : (
                <Card><CardContent className="py-12 text-center">
                  <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="font-semibold">No Binance signals yet</p>
                  <p className="text-sm text-muted-foreground">Signals are generated by Botvio AI and posted automatically.</p>
                </CardContent></Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Feature Cards */}
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
            <p className="text-sm text-muted-foreground">Unlock high-leverage futures signals, advanced arbitrage alerts, and priority Launchpad notifications.</p>
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold" asChild>
              <Link to="/billing"><Crown className="mr-2 h-4 w-4" /> Upgrade to VIP</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default BinanceHub;
