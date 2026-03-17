import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSignalBrokers, useTrackBrokerClick, rankBrokersForSignal } from "@/hooks/useSignalBrokers";
import { ManualSignalCard } from "@/components/signals/ManualSignalCard";
import { useManualSignals } from "@/hooks/useManualSignals";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ExternalLink, Shield, Zap, Clock, TrendingUp, Star, ArrowLeft,
  Target, BarChart3, Brain, Activity, Layers, Flame, ArrowUpDown, RefreshCw, Sparkles
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrokerButtons } from "@/components/signals/BrokerButtons";

// ── Broker-specific strategies ──
const BROKER_STRATEGIES: Record<string, Array<{
  name: string; icon: string; description: string; bestExpiry: string;
  winRate: string; markets: string[]; difficulty: string;
}>> = {
  "pocket-option": [
    { name: "Momentum Continuation", icon: "🔥", description: "Ride strong OTC breakout candles with EMA alignment. Enter on pullback confirmation for 60s expiry.", bestExpiry: "60s", winRate: "72%", markets: ["EURUSD_otc", "GBPUSD_otc", "USDJPY_otc"], difficulty: "Beginner" },
    { name: "S/R Rejection Scalp", icon: "🛡️", description: "Identify key support/resistance levels on OTC pairs. Trade rejection wicks with tight 30–60s entries.", bestExpiry: "30-60s", winRate: "68%", markets: ["EURUSD_otc", "AUDUSD_otc"], difficulty: "Intermediate" },
    { name: "Exhaustion Reversal", icon: "♻️", description: "3–5 consecutive candles in one direction signal exhaustion. Enter reverse on wick confirmation.", bestExpiry: "60s", winRate: "65%", markets: ["GBPUSD_otc", "EURJPY_otc"], difficulty: "Intermediate" },
    { name: "OTC Range Fade", icon: "📊", description: "Trade edges of compressed OTC ranges. Fade support/resistance touches during low-volatility windows.", bestExpiry: "120s", winRate: "70%", markets: ["EURUSD_otc", "USDJPY_otc"], difficulty: "Beginner" },
    { name: "News Spike Recovery", icon: "📰", description: "After major news spikes, wait for reversion to mean. Enter with trend alignment post-cooldown.", bestExpiry: "300s", winRate: "62%", markets: ["XAUUSD", "GBPUSD"], difficulty: "Advanced" },
  ],
  "quotex": [
    { name: "EMA Crossover Entry", icon: "📈", description: "Use 5/20 EMA cross on 1-min chart. Enter CALL on bullish cross, PUT on bearish. Clean signals on Quotex charts.", bestExpiry: "60s", winRate: "69%", markets: ["EURUSD", "GBPUSD", "BTCUSD"], difficulty: "Beginner" },
    { name: "Bollinger Bounce", icon: "🎯", description: "Enter when price touches outer Bollinger Band and reverses. Best during ranging sessions.", bestExpiry: "60-120s", winRate: "71%", markets: ["EURUSD_otc", "AUDUSD_otc"], difficulty: "Beginner" },
    { name: "Breakout Retest", icon: "🚀", description: "Wait for a key level to break, then enter on the retest. Continuation candle confirms direction.", bestExpiry: "120s", winRate: "67%", markets: ["GBPJPY", "EURJPY"], difficulty: "Intermediate" },
    { name: "Micro Pullback", icon: "⚡", description: "In strong trends, enter on small 1–2 candle pullbacks. Use momentum indicators for confirmation.", bestExpiry: "60s", winRate: "73%", markets: ["XAUUSD", "EURUSD"], difficulty: "Intermediate" },
  ],
  "deriv": [
    { name: "Boom & Crash Sniper", icon: "💥", description: "Detect spike patterns on Boom 500/1000 and Crash indices. Enter after spike confirmation with tight SL.", bestExpiry: "5 ticks", winRate: "74%", markets: ["Boom 500", "Boom 1000", "Crash 500", "Crash 1000"], difficulty: "Advanced" },
    { name: "V75 Momentum Rider", icon: "🌊", description: "Volatility 75 Index trending strategy. Use EMA 9/20 alignment with RSI confirmation for direction.", bestExpiry: "1-5 min", winRate: "70%", markets: ["Volatility 75", "Volatility 100"], difficulty: "Intermediate" },
    { name: "Step Index Range", icon: "📏", description: "Step Index moves in fixed increments. Trade range boundaries with high probability reversals.", bestExpiry: "10 ticks", winRate: "76%", markets: ["Step Index"], difficulty: "Beginner" },
    { name: "Multiplier Trend Follow", icon: "✖️", description: "Use Deriv multipliers to ride trends. AI detects trend start, sets multiplier + stop out level.", bestExpiry: "Open", winRate: "66%", markets: ["EURUSD", "BTCUSD", "XAUUSD"], difficulty: "Advanced" },
    { name: "Accumulator Edge", icon: "📐", description: "Trade accumulators on low-volatility pairs. AI picks optimal growth rate and barrier distance.", bestExpiry: "Open", winRate: "68%", markets: ["EURUSD", "GBPUSD", "AUDUSD"], difficulty: "Intermediate" },
  ],
  "iq-option": [
    { name: "Alligator Trend Entry", icon: "🐊", description: "Use Bill Williams Alligator indicator for trend detection. Enter when jaws open with momentum confirmation.", bestExpiry: "3-5 min", winRate: "67%", markets: ["EURUSD", "GBPUSD", "USDJPY"], difficulty: "Intermediate" },
    { name: "RSI Divergence", icon: "📉", description: "Spot bullish/bearish RSI divergence for reversal entries. Works best on higher timeframes.", bestExpiry: "5 min", winRate: "64%", markets: ["XAUUSD", "EURUSD", "GBPJPY"], difficulty: "Advanced" },
    { name: "Stock Binary Scalp", icon: "🏢", description: "Trade stock binaries during market hours. Use pre-market data for directional bias.", bestExpiry: "5 min", winRate: "62%", markets: ["AAPL", "TSLA", "AMZN"], difficulty: "Advanced" },
    { name: "Crypto Breakout", icon: "₿", description: "Trade crypto binaries on breakout from consolidation. Use volume proxy for confirmation.", bestExpiry: "3 min", winRate: "65%", markets: ["BTCUSD", "ETHUSD"], difficulty: "Intermediate" },
  ],
  "binomo": [
    { name: "Simple Trend Follow", icon: "📈", description: "Follow the dominant 5-min trend with 1-min entries. Best for beginners learning directional trading.", bestExpiry: "60s", winRate: "70%", markets: ["EURUSD", "GBPUSD"], difficulty: "Beginner" },
    { name: "Candle Pattern Entry", icon: "🕯️", description: "Identify basic patterns like engulfing, doji, hammer. Enter on confirmation candle close.", bestExpiry: "60-120s", winRate: "66%", markets: ["EURUSD_otc", "AUDUSD_otc"], difficulty: "Beginner" },
    { name: "Tournament Scalp", icon: "🏆", description: "Quick aggressive entries for Binomo tournaments. High frequency, low risk per trade.", bestExpiry: "30s", winRate: "58%", markets: ["EURUSD_otc", "GBPUSD_otc"], difficulty: "Intermediate" },
  ],
};

const BROKER_META: Record<string, {
  title: string; description: string; features: string[]; bestFor: string[];
  color: string; gradient: string; signalTypes: string[];
  pros: string[]; cons: string[];
}> = {
  "pocket-option": {
    title: "Pocket Option Signals — AI Trading Signals for Binary Options",
    description: "Get real-time AI-powered trading signals optimized for Pocket Option. 1-minute binary options, OTC signals, and high-confidence setups.",
    features: ["Fast execution (< 1s)", "High payouts up to 92%", "OTC market access 24/7", "Demo account available", "$5 minimum deposit", "Social trading"],
    bestFor: ["OTC binary options", "1-minute expiry signals", "Quick scalping", "Weekend trading"],
    color: "text-blue-400", gradient: "from-blue-600 to-blue-400",
    signalTypes: ["CALL/PUT", "OTC Forex", "1-min Expiry", "Turbo Trades"],
    pros: ["Fastest OTC execution", "Highest payout rates", "24/7 OTC availability", "Copy trading built-in"],
    cons: ["No official API", "Limited automation", "Manual execution required"],
  },
  "quotex": {
    title: "Quotex Signals — Free Trading Signals for Quotex Platform",
    description: "Premium AI trading signals for Quotex binary options. Real-time alerts for forex, crypto, and OTC markets.",
    features: ["Modern charting interface", "High payouts up to 95%", "Copy trading feature", "Demo with $10,000", "$10 minimum deposit", "Crypto deposits"],
    bestFor: ["Beginner binary trading", "Copy trading", "Crypto binary options", "Advanced charting"],
    color: "text-emerald-400", gradient: "from-emerald-600 to-emerald-400",
    signalTypes: ["CALL/PUT", "Crypto Binary", "Copy Signals", "OTC Pairs"],
    pros: ["Best charting tools", "Highest payouts (95%)", "Crypto payment support", "Clean modern UI"],
    cons: ["Newer platform", "Limited education", "No API access"],
  },
  "deriv": {
    title: "Deriv Signals — AI Signals for Synthetics, Forex & Binary",
    description: "Botvio AI signals for Deriv platform. Trade synthetic indices, Boom & Crash, multipliers, and forex.",
    features: ["Official API for automation", "Synthetic indices 24/7", "Boom & Crash indices", "Multipliers & Accumulators", "$5 minimum deposit", "DTrader + DBot"],
    bestFor: ["Synthetic indices", "Automated trading", "Boom & Crash", "API-based execution"],
    color: "text-red-400", gradient: "from-red-600 to-red-400",
    signalTypes: ["Synthetics", "Boom/Crash", "Multipliers", "Accumulators", "Rise/Fall"],
    pros: ["Full API automation", "Unique synthetic markets", "24/7 trading", "Regulated & trusted"],
    cons: ["Complex for beginners", "Synthetic-only unique", "Higher learning curve"],
  },
  "iq-option": {
    title: "IQ Option Signals — Professional Binary Options Signals",
    description: "AI-powered trading signals for IQ Option. Professional-grade forex, crypto, and stock signals.",
    features: ["Professional interface", "Stock & ETF trading", "Education center", "Social trading", "$10 minimum deposit", "CFD trading"],
    bestFor: ["Professional traders", "Stock binary options", "Long-term expiries", "Education"],
    color: "text-amber-400", gradient: "from-amber-600 to-amber-400",
    signalTypes: ["CALL/PUT", "Stock Binary", "CFD Signals", "Crypto Binary"],
    pros: ["Most recognized brand", "Stock & ETF access", "Great education", "Professional tools"],
    cons: ["Restricted in some countries", "Lower OTC payouts", "No API"],
  },
  "binomo": {
    title: "Binomo Signals — Beginner Trading Signals for Binomo",
    description: "Easy-to-follow AI trading signals for Binomo. Perfect for beginners starting binary options.",
    features: ["Simplest UI available", "Tournaments & bonuses", "Fixed-time trades", "Demo account", "$10 minimum deposit", "Mobile-first"],
    bestFor: ["Complete beginners", "Tournament trading", "Low capital start", "Mobile trading"],
    color: "text-purple-400", gradient: "from-purple-600 to-purple-400",
    signalTypes: ["CALL/PUT", "Fixed-Time", "Tournament", "OTC"],
    pros: ["Easiest to learn", "Fun tournaments", "Great mobile app", "Low minimum"],
    cons: ["Limited assets", "Lower payouts", "Basic charting"],
  },
};

const BrokerPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: brokers } = useSignalBrokers();
  const { data: signals, refetch } = useManualSignals({ status: "ACTIVE", broker: slug || "all" });
  const trackClick = useTrackBrokerClick();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  const broker = brokers?.find((b) => b.slug === slug);
  const meta = BROKER_META[slug || ""] || {
    title: "Broker Signals", description: "AI-powered signals", features: [], bestFor: [],
    color: "text-primary", gradient: "from-primary to-primary/80", signalTypes: [],
    pros: [], cons: [],
  };
  const strategies = BROKER_STRATEGIES[slug || ""] || [];

  const handleOpenBroker = () => {
    if (broker) {
      trackClick.mutate({ brokerId: broker.id });
      window.open(broker.affiliate_url, "_blank", "noopener,noreferrer");
    }
  };

  const handleGenerateSignals = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-binary-signals", {
        body: { broker: slug, count: 3 },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`${data.generated || 0} live signals generated for ${broker?.name || slug}!`);
      queryClient.invalidateQueries({ queryKey: ["manual-signals"] });
      refetch();
    } catch (err: any) {
      toast.error(`Signal generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const getDifficultyColor = (d: string) => {
    if (d === "Beginner") return "bg-success/20 text-success border-success/30";
    if (d === "Intermediate") return "bg-warning/20 text-warning border-warning/30";
    return "bg-destructive/20 text-destructive border-destructive/30";
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={meta.title} description={meta.description} />
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Back link */}
        <Link to="/binary-options" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Binary Options
        </Link>

        {/* Hero */}
        <div className={`rounded-2xl bg-gradient-to-r ${meta.gradient} p-8 mb-8`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <Badge className="bg-white/20 text-white border-white/30 mb-3">Official Partner</Badge>
              <h1 className="text-3xl font-bold text-white mb-2">{broker?.name || slug} Binary Options Signals</h1>
              <p className="text-white/80 max-w-xl">{broker?.description || meta.description}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {meta.signalTypes.map(t => (
                  <Badge key={t} className="bg-white/15 text-white border-white/20">{t}</Badge>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3 shrink-0">
              <Button size="lg" className="bg-white text-foreground hover:bg-white/90" onClick={handleOpenBroker}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open {broker?.name || slug}
              </Button>
              <p className="text-white/60 text-xs text-center">Free demo account available</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="signals" className="mb-8">
          <TabsList className="bg-card border border-border mb-6">
            <TabsTrigger value="signals" className="gap-2"><Activity className="h-4 w-4" /> Live Signals</TabsTrigger>
            <TabsTrigger value="strategies" className="gap-2"><Brain className="h-4 w-4" /> Strategies</TabsTrigger>
            <TabsTrigger value="about" className="gap-2"><Star className="h-4 w-4" /> Platform Info</TabsTrigger>
          </TabsList>

          {/* ── SIGNALS TAB ── */}
          <TabsContent value="signals">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {/* Deriv API Contract Type Cards */}
                {slug === "deriv" && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Layers className="h-5 w-5 text-primary" /> Deriv API Trade Types
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        {
                          name: "Digits (Matches/Differs)",
                          icon: "🔢",
                          desc: "Predict the last digit of the price. Matches = exact digit, Differs = not that digit. Fast 5-tick contracts.",
                          markets: ["Volatility 10", "Volatility 25", "Volatility 50", "Volatility 75", "Volatility 100"],
                          expiry: "5 Ticks",
                          payout: "Up to 900%",
                          color: "border-primary/40",
                          tradeRoute: "/trade/style/digits",
                          brokers: ["Deriv"],
                        },
                        {
                          name: "Ticks (Rise/Fall)",
                          icon: "📊",
                          desc: "Predict if price will rise or fall after 1–10 ticks. Fastest binary contract on Deriv.",
                          markets: ["Volatility 10", "Volatility 25", "Volatility 50", "Volatility 75", "Volatility 100"],
                          expiry: "1-10 Ticks",
                          payout: "Up to 95%",
                          color: "border-success/40",
                          tradeRoute: "/trade/style/ticks",
                          brokers: ["Deriv"],
                        },
                        {
                          name: "Multipliers",
                          icon: "✖️",
                          desc: "Amplify profits without losing more than your stake. Ride trends with x10–x1000 leverage on synthetics & forex.",
                          markets: ["Volatility 75", "Boom 500", "Crash 1000", "EURUSD", "XAUUSD"],
                          expiry: "Open-ended",
                          payout: "Unlimited upside",
                          color: "border-warning/40",
                          tradeRoute: "/trade/style/multipliers",
                          brokers: ["Deriv", "Exness"],
                        },
                        {
                          name: "Accumulators",
                          icon: "📐",
                          desc: "Grow your payout with each tick the price stays within a barrier range. Pick 1%–5% growth rate.",
                          markets: ["Volatility 10", "Volatility 25", "Volatility 50", "Volatility 75", "Volatility 100"],
                          expiry: "Open-ended",
                          payout: "Compounding",
                          color: "border-purple-500/40",
                          tradeRoute: "/trade/style/accumulators",
                          brokers: ["Deriv"],
                        },
                        {
                          name: "Boom & Crash",
                          icon: "💥",
                          desc: "Trade unique spike indices. Boom = upward spikes, Crash = downward spikes. Use multipliers or accumulators.",
                          markets: ["Boom 500", "Boom 1000", "Crash 500", "Crash 1000"],
                          expiry: "Varies",
                          payout: "Up to 95%",
                          color: "border-destructive/40",
                          tradeRoute: "/trade/style/boom-crash",
                          brokers: ["Deriv", "Weltrade"],
                        },
                        {
                          name: "Higher/Lower",
                          icon: "⬆️⬇️",
                          desc: "Predict if exit price will be higher or lower than a barrier. Longer duration than Rise/Fall for bigger moves.",
                          markets: ["Volatility 75", "Volatility 100", "EURUSD", "GBPUSD"],
                          expiry: "5 min – 24h",
                          payout: "Up to 95%",
                          color: "border-blue-500/40",
                          tradeRoute: "/trade/style/higher-lower",
                          brokers: ["Deriv", "Exness", "Weltrade"],
                        },
                      ].map((contract) => (
                        <Card key={contract.name} className={`glass-card ${contract.color} hover:shadow-lg transition-all`}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                              <span className="text-xl">{contract.icon}</span>
                              {contract.name}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <p className="text-xs text-muted-foreground">{contract.desc}</p>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="rounded bg-muted/30 p-1.5 text-center">
                                <p className="text-[10px] text-muted-foreground">Expiry</p>
                                <p className="font-bold text-xs">{contract.expiry}</p>
                              </div>
                              <div className="rounded bg-muted/30 p-1.5 text-center">
                                <p className="text-[10px] text-muted-foreground">Payout</p>
                                <p className="font-bold text-xs text-success">{contract.payout}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {contract.markets.slice(0, 3).map((m) => (
                                <Badge key={m} variant="secondary" className="text-[9px]">{m}</Badge>
                              ))}
                              {contract.markets.length > 3 && (
                                <Badge variant="secondary" className="text-[9px]">+{contract.markets.length - 3}</Badge>
                              )}
                            </div>
                            {/* Recommended Brokers */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-muted-foreground">Trade on:</span>
                              {contract.brokers.map((b) => (
                                <Badge key={b} variant="outline" className={`text-[9px] px-1.5 py-0 ${
                                  b === "Deriv" ? "border-destructive/40 text-destructive" :
                                  b === "Exness" ? "border-warning/40 text-warning" :
                                  "border-primary/40 text-primary"
                                }`}>
                                  {b}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" className="flex-1" asChild>
                                <Link to={contract.tradeRoute}>
                                  <Zap className="h-3 w-3 mr-1" /> Trade Now
                                </Link>
                              </Button>
                              <Button size="sm" variant="outline" className="flex-1" asChild>
                                <Link to="/deriv-options">Learn More</Link>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live Signals */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" /> Live Signals for {broker?.name}
                  </h2>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{signals?.length || 0} active</Badge>
                    <Button
                      size="sm"
                      onClick={handleGenerateSignals}
                      disabled={isGenerating}
                      className="gap-1.5"
                    >
                      {isGenerating ? (
                        <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Generating...</>
                      ) : (
                        <><Sparkles className="h-3.5 w-3.5" /> Generate AI Signals</>
                      )}
                    </Button>
                  </div>
                </div>
                {signals && signals.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {signals.slice(0, 8).map((signal) => (
                      <ManualSignalCard key={signal.id} signal={signal} />
                    ))}
                  </div>
                ) : (
                  <Card className="glass-card">
                    <CardContent className="py-12 text-center">
                      <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No active signals right now. Check back soon.</p>
                      <Button variant="outline" className="mt-4" onClick={handleOpenBroker}>
                        Practice on {broker?.name} Demo
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Trade CTA */}
                <Card className="glass-card border-primary/30">
                  <CardContent className="py-6 text-center">
                    <Flame className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h3 className="font-bold mb-2">Start Trading Now</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Open {broker?.name} and start executing signals instantly.
                    </p>
                    <Button className="w-full" onClick={handleOpenBroker}>
                      <ExternalLink className="h-4 w-4 mr-2" /> Open {broker?.name}
                    </Button>
                  </CardContent>
                </Card>

                {/* How it works */}
                <Card className="glass-card">
                  <CardHeader><CardTitle className="text-base">How It Works</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { icon: Brain, title: "AI Generates Signal", desc: "Real-time analysis of momentum, price action & levels" },
                      { icon: Zap, title: "You Get Alerted", desc: "Asset, direction, expiry & confidence score" },
                      { icon: Target, title: `Execute on ${broker?.name}`, desc: "Open your broker, match the setup, place trade" },
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="p-1.5 rounded-lg bg-primary/20 shrink-0">
                          <step.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{i + 1}. {step.title}</p>
                          <p className="text-xs text-muted-foreground">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Other brokers */}
                <Card className="glass-card">
                  <CardHeader><CardTitle className="text-base">Also Trade On</CardTitle></CardHeader>
                  <CardContent className="space-y-1.5">
                    {brokers?.filter(b => b.slug !== slug).map(b => {
                      const bMeta = BROKER_META[b.slug];
                      return (
                        <Link key={b.slug} to={`/brokers/${b.slug}`}>
                          <Button variant="ghost" className="w-full justify-between text-sm h-auto py-2">
                            <span className={`font-semibold ${bMeta?.color || "text-foreground"}`}>{b.name}</span>
                            <Badge variant="outline" className="text-[10px]">{b.best_for?.split("&")[0]?.trim()}</Badge>
                          </Button>
                        </Link>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ── STRATEGIES TAB ── */}
          <TabsContent value="strategies">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" /> {broker?.name} Strategies
                </h2>
                <Badge variant="secondary">{strategies.length} strategies</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {strategies.map((s, i) => (
                  <Card key={i} className="glass-card hover:border-primary/50 transition-all group overflow-hidden">
                    <div className={`h-1 bg-gradient-to-r ${meta.gradient}`} />
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <span className="text-lg">{s.icon}</span> {s.name}
                        </CardTitle>
                        <Badge variant="outline" className={getDifficultyColor(s.difficulty)}>
                          {s.difficulty}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded bg-background/50 border border-border/50">
                          <span className="text-muted-foreground">Best Expiry</span>
                          <p className="font-bold mt-0.5">{s.bestExpiry}</p>
                        </div>
                        <div className="p-2 rounded bg-success/10 border border-success/20">
                          <span className="text-success">Win Rate</span>
                          <p className="font-bold text-success mt-0.5">{s.winRate}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {s.markets.map(m => (
                          <Badge key={m} variant="secondary" className="text-[10px] px-1.5">{m}</Badge>
                        ))}
                      </div>

                      <Button className="w-full mt-2" size="sm" onClick={handleOpenBroker}>
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Try on {broker?.name}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Strategy disclaimer */}
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <p className="text-xs text-muted-foreground">
                  ⚠️ Win rates are based on historical backtesting and may vary. Past performance does not guarantee future results.
                  Always practice on a demo account before trading live.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* ── ABOUT TAB ── */}
          <TabsContent value="about">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pros & Cons */}
              <Card className="glass-card">
                <CardHeader><CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-warning" /> Why {broker?.name}?</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-success mb-2">✅ Advantages</h4>
                    <ul className="space-y-1.5">
                      {meta.pros.map(p => (
                        <li key={p} className="flex items-center gap-2 text-sm">
                          <div className="h-1.5 w-1.5 rounded-full bg-success shrink-0" />{p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-destructive mb-2">⚠️ Limitations</h4>
                    <ul className="space-y-1.5">
                      {meta.cons.map(c => (
                        <li key={c} className="flex items-center gap-2 text-sm">
                          <div className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />{c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Features */}
              <Card className="glass-card">
                <CardHeader><CardTitle className="flex items-center gap-2"><Layers className="h-5 w-5 text-primary" /> Key Features</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {meta.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Best for */}
              <Card className="glass-card">
                <CardHeader><CardTitle>Best For</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {meta.bestFor.map(b => <Badge key={b} variant="outline">{b}</Badge>)}
                  </div>
                </CardContent>
              </Card>

              {/* CTA */}
              <Card className="glass-card border-primary/30">
                <CardContent className="py-8 text-center">
                  <Flame className="h-10 w-10 text-primary mx-auto mb-3" />
                  <h3 className="text-xl font-bold mb-2">Ready to Trade?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your free {broker?.name} account and start receiving AI-powered signals.
                  </p>
                  <Button size="lg" className="w-full" onClick={handleOpenBroker}>
                    <ExternalLink className="h-4 w-4 mr-2" /> Open Free {broker?.name} Account
                  </Button>
                  <p className="text-xs text-muted-foreground mt-3">
                    ⚠️ Trading involves risk. Only trade with money you can afford to lose.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Broker comparison strip */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5 text-primary" /> Compare Brokers
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {brokers?.map(b => {
              const bMeta = BROKER_META[b.slug];
              const isCurrent = b.slug === slug;
              return (
                <Link key={b.slug} to={`/brokers/${b.slug}`}>
                  <Card className={`glass-card text-center p-4 transition-all hover:border-primary/50 ${isCurrent ? "border-primary ring-1 ring-primary" : ""}`}>
                    <p className={`font-bold text-sm ${bMeta?.color || "text-foreground"}`}>{b.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{b.best_for}</p>
                    {isCurrent && <Badge className="mt-2 text-[10px]">Current</Badge>}
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Risk Disclaimer */}
        <div className="p-4 rounded-lg bg-muted/30 border border-border text-center">
          <p className="text-xs text-muted-foreground">
            ⚠️ <strong>Risk Disclaimer:</strong> Trading binary options involves substantial risk and may not be suitable for all investors.
            Past performance is not indicative of future results. Botvio provides signals for educational purposes only.
            Always use proper risk management and only trade with capital you can afford to lose.
          </p>
        </div>
      </main>
    </div>
  );
};

export default BrokerPage;
