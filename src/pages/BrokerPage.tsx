import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSignalBrokers, useTrackBrokerClick } from "@/hooks/useSignalBrokers";
import { ManualSignalCard } from "@/components/signals/ManualSignalCard";
import { useManualSignals } from "@/hooks/useManualSignals";
import { ExternalLink, Shield, Zap, Clock, TrendingUp, Star, ArrowLeft } from "lucide-react";

const BROKER_META: Record<string, { title: string; description: string; features: string[]; bestFor: string[]; color: string }> = {
  "pocket-option": {
    title: "Pocket Option Signals — AI Trading Signals for Pocket Option",
    description: "Get real-time AI-powered trading signals optimized for Pocket Option. 1-minute binary options, OTC signals, and high-confidence setups.",
    features: ["Fast execution (< 1s)", "High payouts up to 92%", "OTC market access 24/7", "Demo account available", "$5 minimum deposit"],
    bestFor: ["OTC binary options", "1-minute expiry signals", "Quick scalping", "Weekend trading"],
    color: "from-blue-600 to-blue-400",
  },
  "quotex": {
    title: "Quotex Signals — Free Trading Signals for Quotex Platform",
    description: "Premium AI trading signals for Quotex binary options. Real-time alerts for forex, crypto, and OTC markets with entry times and expiry.",
    features: ["Modern charting interface", "High payouts up to 95%", "Copy trading feature", "Demo with $10,000", "$10 minimum deposit"],
    bestFor: ["Beginner binary trading", "Copy trading", "Crypto binary options", "Advanced charting"],
    color: "from-emerald-600 to-emerald-400",
  },
  "deriv": {
    title: "Deriv Signals — AI Signals for Synthetics, Forex & Binary",
    description: "Botvio AI signals for Deriv platform. Trade synthetic indices, Boom & Crash, multipliers, and forex with automated execution.",
    features: ["Official API for automation", "Synthetic indices 24/7", "Boom & Crash indices", "Multipliers & Accumulators", "$5 minimum deposit"],
    bestFor: ["Synthetic indices", "Automated trading", "Boom & Crash", "API-based execution"],
    color: "from-red-600 to-red-400",
  },
  "iq-option": {
    title: "IQ Option Signals — Professional Binary Options Signals",
    description: "AI-powered trading signals for IQ Option. Professional-grade forex, crypto, and stock signals with clear entry points.",
    features: ["Professional interface", "Stock & ETF trading", "Education center", "Social trading", "$10 minimum deposit"],
    bestFor: ["Professional traders", "Stock binary options", "Long-term expiries", "Education"],
    color: "from-amber-600 to-amber-400",
  },
  "binomo": {
    title: "Binomo Signals — Beginner Trading Signals for Binomo",
    description: "Easy-to-follow AI trading signals for Binomo platform. Perfect for beginners starting their binary options journey.",
    features: ["Simplest UI available", "Tournaments & bonuses", "Fixed-time trades", "Demo account", "$10 minimum deposit"],
    bestFor: ["Complete beginners", "Tournament trading", "Low capital start", "Mobile trading"],
    color: "from-purple-600 to-purple-400",
  },
};

const BrokerPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: brokers } = useSignalBrokers();
  const { data: signals } = useManualSignals({ status: "ACTIVE" });
  const trackClick = useTrackBrokerClick();

  const broker = brokers?.find((b) => b.slug === slug);
  const meta = BROKER_META[slug || ""] || {
    title: "Broker Signals",
    description: "AI-powered signals",
    features: [],
    bestFor: [],
    color: "from-primary to-primary/80",
  };

  const handleOpenBroker = () => {
    if (broker) {
      trackClick.mutate({ brokerId: broker.id });
      window.open(broker.affiliate_url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={meta.title} description={meta.description} />
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Back link */}
        <Link to="/signals" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Signals
        </Link>

        {/* Hero */}
        <div className={`rounded-2xl bg-gradient-to-r ${meta.color} p-8 mb-8`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <Badge className="bg-white/20 text-white border-white/30 mb-3">Official Partner</Badge>
              <h1 className="text-3xl font-bold text-white mb-2">{broker?.name || slug} Trading Signals</h1>
              <p className="text-white/80 max-w-xl">
                {broker?.description || meta.description}
              </p>
            </div>
            <Button
              size="lg"
              className="bg-white text-foreground hover:bg-white/90 shrink-0"
              onClick={handleOpenBroker}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open {broker?.name || slug}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold">Live Signals for {broker?.name}</h2>
            {signals && signals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {signals.slice(0, 6).map((signal) => (
                  <ManualSignalCard key={signal.id} signal={signal} compact />
                ))}
              </div>
            ) : (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No active signals right now. Check back soon.</p>
                </CardContent>
              </Card>
            )}

            {/* How it works */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>How Botvio Signals Work with {broker?.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/20 shrink-0"><Zap className="h-4 w-4 text-primary" /></div>
                  <div>
                    <h3 className="font-semibold">1. AI Generates Signal</h3>
                    <p className="text-sm text-muted-foreground">Our engine analyzes price action, momentum, volatility, and support/resistance in real-time.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/20 shrink-0"><Clock className="h-4 w-4 text-primary" /></div>
                  <div>
                    <h3 className="font-semibold">2. Entry Window Opens</h3>
                    <p className="text-sm text-muted-foreground">You receive the signal with asset, direction, entry price, and recommended expiry.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/20 shrink-0"><Shield className="h-4 w-4 text-primary" /></div>
                  <div>
                    <h3 className="font-semibold">3. Execute on {broker?.name}</h3>
                    <p className="text-sm text-muted-foreground">Open {broker?.name}, select the asset, set the direction and expiry, then place your trade.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Features */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-warning" /> Key Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {meta.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Best for */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Best For</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {meta.bestFor.map((b) => (
                    <Badge key={b} variant="outline">{b}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <Card className="glass-card border-primary/30">
              <CardContent className="py-6 text-center">
                <h3 className="font-bold mb-2">Start Trading Now</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Open a free {broker?.name} account and start receiving signals.
                </p>
                <Button className="w-full" onClick={handleOpenBroker}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open {broker?.name} Account
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  ⚠️ Trading involves risk. Only trade with money you can afford to lose.
                </p>
              </CardContent>
            </Card>

            {/* Other brokers */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Other Supported Brokers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {brokers
                    ?.filter((b) => b.slug !== slug)
                    .map((b) => (
                      <Link key={b.slug} to={`/brokers/${b.slug}`}>
                        <Button variant="ghost" className="w-full justify-start text-sm">
                          <ExternalLink className="h-3.5 w-3.5 mr-2" />
                          {b.name} Signals
                        </Button>
                      </Link>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Risk Disclaimer */}
        <div className="mt-12 p-4 rounded-lg bg-muted/30 border border-border text-center">
          <p className="text-xs text-muted-foreground">
            ⚠️ <strong>Risk Disclaimer:</strong> Trading binary options and financial markets involves substantial risk and may not be suitable for all investors.
            Past performance is not indicative of future results. Botvio provides signals for educational purposes only.
            Always use proper risk management and only trade with capital you can afford to lose.
          </p>
        </div>
      </main>
    </div>
  );
};

export default BrokerPage;
