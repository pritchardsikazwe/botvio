import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { DerivConnection } from "@/components/trading/DerivConnection";
import { TradeModesGrid } from "@/components/trading/TradeModesGrid";
import { DerivAffiliateButton } from "@/components/trading/DerivAffiliateButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Zap, Shield, BarChart3, TrendingUp, Clock, Globe,
  Layers, ArrowRight, BookOpen, Bot, Activity,
  AlertTriangle, CheckCircle, XCircle, Lightbulb,
  Timer, Hash, Target, Crosshair, Wifi
} from "lucide-react";

const API_FEATURES = [
  { icon: Zap, title: "Real-Time Execution", desc: "Sub-second trade placement via WebSocket API", color: "text-amber-400" },
  { icon: Shield, title: "Risk Controls", desc: "Built-in stop-loss, take-profit & stake limits", color: "text-emerald-400" },
  { icon: BarChart3, title: "Live Tick Stream", desc: "Real-time price feeds for all synthetic indices", color: "text-blue-400" },
  { icon: Bot, title: "Auto Trading Bots", desc: "Hauza Sniper & custom strategy automation", color: "text-violet-400" },
  { icon: Globe, title: "50+ Markets", desc: "Synthetics, forex, commodities, crypto & stocks", color: "text-cyan-400" },
  { icon: Layers, title: "Multi-Contract", desc: "Digits, Multipliers, Rise/Fall, Accumulators & more", color: "text-pink-400" },
];

const SUPPORTED_CONTRACTS = [
  { name: "Digits (Matches/Differs)", icon: Hash, badge: "Fast", color: "text-violet-400", border: "border-violet-500/30" },
  { name: "Rise / Fall", icon: TrendingUp, badge: "Beginner", color: "text-emerald-400", border: "border-emerald-500/30" },
  { name: "Multipliers (10x–1000x)", icon: Layers, badge: "All Markets", color: "text-blue-400", border: "border-blue-500/30" },
  { name: "Accumulators", icon: BarChart3, badge: "Steady", color: "text-teal-400", border: "border-teal-500/30" },
  { name: "Boom / Crash Spikes", icon: Zap, badge: "Advanced", color: "text-orange-400", border: "border-orange-500/30" },
  { name: "Ticks Trading", icon: Timer, badge: "Ultra-Fast", color: "text-pink-400", border: "border-pink-500/30" },
  { name: "Higher / Lower", icon: Target, badge: "Timed", color: "text-sky-400", border: "border-sky-500/30" },
  { name: "Turbo Contracts", icon: Crosshair, badge: "Speed", color: "text-amber-400", border: "border-amber-500/30" },
];

const POPULAR_MARKETS = [
  { symbol: "Volatility 75 Index", code: "R_75", type: "Synthetic", volatility: "High" },
  { symbol: "Volatility 100 Index", code: "R_100", type: "Synthetic", volatility: "Very High" },
  { symbol: "Boom 1000 Index", code: "BOOM1000", type: "Synthetic", volatility: "Extreme" },
  { symbol: "Crash 1000 Index", code: "CRASH1000", type: "Synthetic", volatility: "Extreme" },
  { symbol: "EUR/USD", code: "frxEURUSD", type: "Forex", volatility: "Medium" },
  { symbol: "Gold (XAU/USD)", code: "frxXAUUSD", type: "Commodity", volatility: "High" },
  { symbol: "Step Index", code: "stpRNG", type: "Synthetic", volatility: "Low" },
  { symbol: "Jump 75 Index", code: "JD75", type: "Synthetic", volatility: "High" },
];

const DOS = [
  "Always start with a Demo account to practice risk-free",
  "Set Stop Loss on every Multiplier trade",
  "Use the Hauza Sniper strategy guides for each mode",
  "Start with small stakes ($0.35 – $1.00)",
  "Diversify across contract types, don't stick to one",
  "Monitor your daily P&L and set loss limits",
  "Use 5-tick contracts for Digit trading precision",
  "Wait for spike droughts before entering Boom/Crash",
];

const DONTS = [
  "Don't trade with money you can't afford to lose",
  "Don't chase losses with larger stakes",
  "Don't use maximum multiplier (1000x) without experience",
  "Don't trade during high-impact news without a plan",
  "Don't skip risk management settings",
  "Don't overtrade — quality over quantity",
  "Don't ignore the API connection status before placing trades",
  "Don't run multiple bots without monitoring them",
];

const PRO_TIPS = [
  "Use Digit Differs on V75 — 90%+ baseline win rate with proper timing",
  "Accumulators work best in calm, ranging markets — avoid during spikes",
  "Combine Rise/Fall with support/resistance levels for higher accuracy",
  "Set Take Profit on Accumulators to lock gains before range break",
  "Use the demo token (03Ddx1HRu2yFRJ8) to test strategies before going live",
];

const DerivOptions = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Deriv Options & API Trading | Botvio"
        description="Trade Deriv options with Botvio — Digits, Multipliers, Rise/Fall, Boom/Crash, Accumulators & more. Connect via API and execute trades instantly."
      />
      <Header />

      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Hero */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
            <Wifi className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Deriv API Integration</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold">
            Deriv Options & <span className="text-primary">API Trading</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Connect your Deriv account, choose from 8+ contract types, and trade 50+ markets — all powered by Botvio's intelligent execution engine.
          </p>
          <div className="flex items-center justify-center gap-3">
            <DerivAffiliateButton label="Open Deriv Account" />
            <Button variant="outline" asChild>
              <Link to="/connections">
                <Activity className="h-4 w-4 mr-2" /> Manage Connections
              </Link>
            </Button>
          </div>
        </section>

        {/* API Connection */}
        <section>
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <Wifi className="h-5 w-5 text-primary" /> Connect Your Deriv Account
          </h2>
          <DerivConnection />
        </section>

        {/* API Features Grid */}
        <section>
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-primary" /> API Capabilities
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {API_FEATURES.map((f) => (
              <Card key={f.title} className="glass-card hover:border-primary/40 transition-colors">
                <CardContent className="pt-6 flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-muted/50 ${f.color}`}>
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{f.title}</p>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Supported Contract Types */}
        <section>
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <Layers className="h-5 w-5 text-primary" /> Supported Contract Types
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {SUPPORTED_CONTRACTS.map((c) => (
              <Card key={c.name} className={`glass-card ${c.border} hover:scale-[1.02] transition-transform cursor-pointer`}>
                <CardContent className="pt-5 pb-4 flex flex-col items-center text-center gap-2">
                  <div className={`p-2.5 rounded-xl bg-muted/50 ${c.color}`}>
                    <c.icon className="h-6 w-6" />
                  </div>
                  <p className="font-bold text-sm">{c.name}</p>
                  <Badge variant="outline" className="text-[10px]">{c.badge}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Trade Modes Grid (full interactive) */}
        <section>
          <TradeModesGrid />
        </section>

        {/* Popular Markets */}
        <section>
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-primary" /> Popular Markets
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {POPULAR_MARKETS.map((m) => (
              <Card key={m.code} className="glass-card hover:border-primary/40 transition-colors">
                <CardContent className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Activity className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{m.symbol}</p>
                      <p className="text-xs text-muted-foreground font-mono">{m.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{m.type}</Badge>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        m.volatility === "Extreme" ? "text-destructive border-destructive/30"
                        : m.volatility === "Very High" ? "text-orange-400 border-orange-400/30"
                        : m.volatility === "High" ? "text-amber-400 border-amber-400/30"
                        : m.volatility === "Medium" ? "text-blue-400 border-blue-400/30"
                        : "text-emerald-400 border-emerald-400/30"
                      }`}
                    >
                      {m.volatility}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Do's & Don'ts */}
        <section>
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-primary" /> Trading Do's & Don'ts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="glass-card border-emerald-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-emerald-400">
                  <CheckCircle className="h-5 w-5" /> Do's
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {DOS.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">{tip}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="glass-card border-destructive/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-destructive">
                  <XCircle className="h-5 w-5" /> Don'ts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {DONTS.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">{tip}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Pro Tips */}
        <section>
          <Card className="glass-card border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-amber-400">
                <Lightbulb className="h-5 w-5" /> Pro Tips from Botvio
              </CardTitle>
              <CardDescription>Maximize your edge with these proven strategies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {PRO_TIPS.map((tip, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <Lightbulb className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-sm">{tip}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Quick Links */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link to="/bots">
                <Bot className="h-5 w-5 text-primary" />
                <span className="text-xs font-bold">Trading Bots</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link to="/signals">
                <Target className="h-5 w-5 text-primary" />
                <span className="text-xs font-bold">Signals</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link to="/connections">
                <Wifi className="h-5 w-5 text-primary" />
                <span className="text-xs font-bold">Connections</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link to="/learn">
                <BookOpen className="h-5 w-5 text-primary" />
                <span className="text-xs font-bold">Learn</span>
              </Link>
            </Button>
          </div>
        </section>

        {/* Disclaimer */}
        <section>
          <Card className="glass-card border-destructive/20">
            <CardContent className="py-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong className="text-destructive">Risk Warning:</strong> Trading binary options and CFDs involves significant risk. You may lose some or all of your invested capital.</p>
                <p>Botvio is powered by Deriv API. Botvio is not affiliated with or endorsed by Deriv. Past performance is not indicative of future results.</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default DerivOptions;
