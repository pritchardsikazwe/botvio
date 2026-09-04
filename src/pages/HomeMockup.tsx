import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { HomeChartAnalyzer } from "@/components/home/HomeChartAnalyzer";
import { HomeSignalsWidget } from "@/components/signals/HomeSignalsWidget";
import { GoldPriceHeader } from "@/components/gold/GoldPriceHeader";
import { GoldSentimentGauge } from "@/components/gold/GoldSentimentGauge";
import { GoldChartSection } from "@/components/gold/GoldChartSection";
import { GoldSignalsSection } from "@/components/gold/GoldSignalsSection";

import { Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search, Globe, Sparkles, ArrowRight, ArrowUpRight, TrendingUp, TrendingDown,
  BarChart3, Bell, Zap, Layers, Upload, Check, Star, Users, ShieldCheck,
  Headphones, Flame, Bitcoin, LineChart, Trophy, Menu,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────
   BOTVIO — premium homepage composition.
   Presentational mockup: static, realistic sample market data.
   ──────────────────────────────────────────────────────────── */

const NAV = [
  { label: "Markets", to: "/markets" },
  { label: "Signals", to: "/signals" },
  { label: "AI Analysis", to: "/chart/XAUUSD" },
  { label: "Trading Hubs", to: "/gold" },
  { label: "Copy Trading", to: "/copy-trading" },
  { label: "Learn", to: "/learn", badge: "New" },
  { label: "More", to: "/about" },
];

const TICKER = [
  { name: "GOLD", sub: "(XAU/USD)", price: "2,384.65", change: "+0.52%", up: true },
  { name: "BTC/USD", sub: "", price: "67,891.55", change: "+1.32%", up: true },
  { name: "EUR/USD", sub: "", price: "1.0894", change: "-0.12%", up: false },
  { name: "GBP/USD", sub: "", price: "1.2721", change: "-0.08%", up: false },
  { name: "NAS100", sub: "", price: "18,732.45", change: "+0.65%", up: true },
  { name: "US30", sub: "", price: "39,812.20", change: "+0.15%", up: true },
];

const FEATURES = [
  { icon: BarChart3, title: "Live Markets", desc: "Real-time prices, charts and market overview.", cta: "Explore Markets", to: "/markets" },
  { icon: Sparkles, title: "AI Analysis", desc: "Upload a chart and get instant AI trading insights.", cta: "Analyze Chart", to: "/chart/XAUUSD" },
  { icon: Bell, title: "Trading Signals", desc: "High-probability trading signals updated live.", cta: "View Signals", to: "/signals" },
  { icon: Zap, title: "Trading Hubs", desc: "Access 50+ markets, tools and trading environments.", cta: "Explore Hubs", to: "/markets" },
];

const SHORTCUTS: { label: string; to: string; icon: typeof BarChart3 }[] = [
  { label: "Gold Hub", to: "/gold", icon: LineChart },
  { label: "Bitcoin Hub", to: "/bitcoin", icon: Bitcoin },
  { label: "US30 Hub", to: "/us30", icon: BarChart3 },
  { label: "NAS100 Hub", to: "/nas100", icon: TrendingUp },
  { label: "GER40 Hub", to: "/ger40", icon: Layers },
  { label: "Deriv AI Options", to: "/deriv-options", icon: Zap },
  { label: "Rise & Fall", to: "/rise-fall", icon: TrendingUp },
  { label: "Synthetic Hub", to: "/synthetic-hub", icon: Sparkles },
  { label: "AI Chart Analysis", to: "/chart/XAUUSD", icon: Upload },
  { label: "Live Signals", to: "/signals", icon: Bell },
];


const HUBS = [
  { name: "Gold", sub: "(XAU/USD)", to: "/gold", tint: "text-warning" },
  { name: "Bitcoin", sub: "(BTC/USD)", to: "/bitcoin", tint: "text-warning" },
  { name: "EUR/USD", sub: "Forex", to: "/eur-usd", tint: "text-primary" },
  { name: "NAS100", sub: "Index", to: "/nas100", tint: "text-success" },
  { name: "US30", sub: "Index", to: "/us30", tint: "text-primary" },
  { name: "GER40", sub: "Index", to: "/ger40", tint: "text-destructive" },
];

const COURSES = [
  { title: "Forex From Zero", level: "Beginner Course", to: "/learn" },
  { title: "Strategy Builder", level: "Intermediate", to: "/strategies" },
  { title: "Prop Firm Mastery", level: "Advanced", to: "/learning-paths" },
  { title: "Risk Management", level: "Essentials", to: "/learn/botvio-sniper/risk-management" },
];

const BROKERS = [
  { name: "Deriv", desc: "Synthetic Indices & Forex", to: "/brokers/deriv" },
  { name: "Exness", desc: "Forex • Gold • Ultra-low spreads", to: "/brokers/exness" },
  { name: "Weltrade", desc: "MT5 • Synthetic Indices", to: "/brokers/weltrade" },
  { name: "Binance", desc: "Crypto Exchange", to: "/brokers/binance" },
];

const TRUST = [
  { icon: Users, big: "100K+", small: "Active Traders" },
  { icon: Layers, big: "8+", small: "Markets" },
  { icon: Globe, big: "50+", small: "Trading Hubs" },
  { icon: Headphones, big: "24/7", small: "Live Support" },
  { icon: ShieldCheck, big: "Secure & Trusted", small: "Your funds, your control" },
];

const TESTIMONIALS = [
  { quote: "Botvio's AI chart analysis changed how I trade. The insights are accurate, fast and easy to understand.", name: "Daniel K.", role: "Full-time Trader" },
  { quote: "The signals are high quality and the trading hubs make execution so much smoother. Great platform!", name: "Amanda T.", role: "Swing Trader" },
  { quote: "Finally a platform that combines markets, AI analysis, and education in one place. Highly recommended.", name: "Kevin M.", role: "Prop Firm Trader" },
];

const FOOTER_COLS = [
  { title: "Markets", links: [["Forex", "/eur-usd"], ["Gold", "/gold"], ["Crypto", "/markets/crypto"], ["Indices", "/us30"], ["Synthetic Indices", "/synthetic"], ["All Markets", "/markets"]] },
  { title: "Signals", links: [["Live Signals", "/signals"], ["Signal History", "/signals-history"], ["Performance", "/performance-transparency"], ["VIP Signals", "/billing"]] },
  { title: "AI Tools", links: [["AI Chart Analysis", "/chart/XAUUSD"], ["Chart Upload", "/chart/XAUUSD"], ["Market Scanner", "/market-analysis"], ["Economic Calendar", "/news-calendar"]] },
  { title: "Learn", links: [["Courses", "/learn"], ["Strategy Library", "/strategies"], ["Trading Blog", "/blog"], ["Learning Paths", "/learning-paths"]] },
  { title: "Company", links: [["About Us", "/about"], ["Affiliates", "/affiliate"], ["Press", "/press"], ["Contact Us", "/contact"]] },
  { title: "Support", links: [["Help Center", "/faq"], ["Docs", "/docs"], ["Community", "/live"], ["Trust Center", "/trust"]] },
];

/* ── tiny inline chart primitives ─────────────────────────── */

function Sparkline({ up = true, className = "" }: { up?: boolean; className?: string }) {
  const pts = up
    ? "0,22 10,18 20,20 30,13 40,15 50,8 60,10 70,4 80,6"
    : "0,6 10,9 20,7 30,13 40,11 50,16 60,14 70,20 80,19";
  return (
    <svg viewBox="0 0 80 26" className={`h-6 w-20 ${className}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        strokeWidth="1.6"
        className={up ? "stroke-success" : "stroke-destructive"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const CANDLES = [
  [42, 62, 40, 58], [58, 66, 54, 56], [56, 60, 46, 49], [49, 54, 42, 52], [52, 63, 50, 61],
  [61, 68, 58, 64], [64, 70, 56, 58], [58, 62, 50, 54], [54, 72, 52, 70], [70, 78, 66, 74],
  [74, 80, 68, 71], [71, 76, 62, 65], [65, 84, 63, 82], [82, 90, 78, 86], [86, 92, 80, 83],
  [83, 88, 76, 79], [79, 96, 77, 94], [94, 100, 88, 91], [91, 98, 86, 96], [96, 104, 92, 101],
];

function CandleChart() {
  const min = 36, max = 108;
  const y = (v: number) => 200 - ((v - min) / (max - min)) * 180;
  const step = 15;
  return (
    <svg viewBox="0 0 320 210" className="h-44 w-full" role="img" aria-label="XAU/USD candlestick chart">
      <defs>
        <linearGradient id="botvio-glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.18" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1="0" x2="320" y1={20 + i * 55} y2={20 + i * 55} className="stroke-border/40" strokeWidth="0.5" />
      ))}
      <rect x="0" y="20" width="320" height="180" fill="url(#botvio-glow)" />
      {CANDLES.map(([o, h, l, c], i) => {
        const x = 12 + i * step;
        const up = c >= o;
        return (
          <g key={i} className={up ? "fill-success stroke-success" : "fill-destructive stroke-destructive"}>
            <line x1={x} x2={x} y1={y(h)} y2={y(l)} strokeWidth="1" />
            <rect x={x - 4} y={y(Math.max(o, c))} width="8" height={Math.max(2, Math.abs(y(o) - y(c)))} rx="1" />
          </g>
        );
      })}
      <polyline
        points={CANDLES.map(([, , , c], i) => `${12 + i * step},${y(c) + 8}`).join(" ")}
        fill="none"
        className="stroke-primary/70"
        strokeWidth="1.4"
      />
    </svg>
  );
}

/* ── page ─────────────────────────────────────────────────── */

const HomeMockup = () => {
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Botvio — AI Trading Intelligence, Live Markets & Signals"
        description="Live markets, AI chart analysis, trading signals and intelligent trading tools — built for modern traders. Explore Botvio's trading hubs, education and verified brokers."
      />
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/botvio-logo.png" alt="Botvio logo" className="h-8 w-8 rounded-lg" />
            <span className="leading-none">
              <span className="block text-lg font-extrabold tracking-tight text-foreground">BOTVIO</span>
              <span className="block text-[8px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                AI Trading Intelligence
              </span>
            </span>
          </Link>

          <nav className="mx-auto hidden items-center gap-1 lg:flex" aria-label="Primary">
            {NAV.map((n) => (
              <Link
                key={n.label}
                to={n.to}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
              >
                {n.label}
                {n.badge && (
                  <Badge className="h-4 bg-success/20 px-1.5 text-[9px] font-bold text-success hover:bg-success/20">
                    {n.badge}
                  </Badge>
                )}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
            <Button variant="ghost" size="icon" aria-label="Search" asChild className="hidden sm:inline-flex">
              <Link to="/markets"><Search className="h-4 w-4" /></Link>
            </Button>
            {user ? (
              <>
                <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
                <Button size="sm" asChild className="font-bold">
                  <Link to="/signals">Live Signals</Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => setAuthOpen(true)} className="hidden sm:inline-flex">
                  Log in
                </Button>
                <Button size="sm" onClick={() => setAuthOpen(true)} className="font-bold">
                  Sign Up Free
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {menuOpen && (
          <nav className="border-t border-border/60 bg-background/95 px-4 py-3 lg:hidden" aria-label="Mobile">
            <div className="grid grid-cols-2 gap-2">
              {NAV.map((n) => (
                <Link
                  key={n.label}
                  to={n.to}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg border border-border/60 px-3 py-2 text-sm font-semibold text-foreground"
                >
                  {n.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>


      <main>
        {/* ── Hero ── */}
        <section className="relative overflow-hidden border-b border-border/40">
          <div className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-primary/10 blur-[120px]" />
          <div className="container relative mx-auto grid gap-10 px-4 py-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:py-16">
            <div>
              <Badge variant="outline" className="mb-6 gap-1.5 rounded-full border-primary/40 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                <Sparkles className="h-3 w-3" /> AI-Powered Trading Intelligence
              </Badge>
              <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
                Trade Smarter.
                <span className="mt-1 block text-primary">See the Market Clearly.</span>
              </h1>
              <p className="mt-5 max-w-md text-base text-muted-foreground">
                Live markets, AI chart analysis, trading signals and intelligent trading tools — built for modern traders.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button size="lg" asChild className="font-bold">
                  <Link to="/markets">
                    Explore Live Markets <ArrowUpRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="border-border/70 font-semibold">
                  <Link to="/chart/XAUUSD">
                    <Sparkles className="mr-1.5 h-4 w-4 text-primary" /> Analyze a Chart
                  </Link>
                </Button>
              </div>
              <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                {["Real-time Data", "AI Insights", "Actionable Signals", "All in One Platform"].map((f) => (
                  <li key={f} className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-success" /> {f}
                  </li>
                ))}
              </ul>
              <div className="mt-8 border-t border-border/50 pt-5">
                <p className="text-xs text-muted-foreground">Trusted by 100,000+ traders worldwide</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {["bg-primary/30", "bg-success/30", "bg-destructive/30", "bg-secondary"].map((c, i) => (
                      <span key={i} className={`h-7 w-7 rounded-full border-2 border-background ${c}`} />
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-primary">
                    {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
                  </div>
                  <span className="text-xs text-muted-foreground">4.8/5 from 2,500+ reviews</span>
                </div>
              </div>
            </div>

            {/* Quick hub shortcuts */}
            <div className="rounded-2xl border border-border/70 bg-card/70 p-5 shadow-2xl backdrop-blur-xl">
              <div className="mb-4 flex items-center gap-2 text-xs font-bold tracking-wide text-foreground">
                <BarChart3 className="h-3.5 w-3.5 text-primary" /> QUICK HUB ACCESS
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Synthetic Hub", sub: "Volatility & Boom/Crash", to: "/synthetic" },
                  { label: "Bitcoin Hub", sub: "BTC/USD 24/7 desk", to: "/bitcoin" },
                  { label: "Weltrade Hub", sub: "Weltrade instruments", to: "/weltrade" },
                ].map((h) => (
                  <Button
                    key={h.to}
                    asChild
                    variant="outline"
                    className="h-auto justify-start rounded-xl border-border/60 bg-background/60 p-4 hover:border-primary/60"
                  >
                    <Link to={h.to} className="flex flex-col items-start gap-1 text-left">
                      <span className="text-sm font-bold text-foreground">{h.label}</span>
                      <span className="text-[11px] font-normal text-muted-foreground">{h.sub}</span>
                    </Link>
                  </Button>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* ── Featured Gold Trading Hub (full preview) ── */}
        <section className="container mx-auto px-4 py-6" aria-label="Gold trading hub preview">
          <div className="rounded-2xl border border-warning/30 bg-gradient-to-b from-card/80 to-card/40 p-5 shadow-2xl">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Badge className="bg-warning/15 text-[10px] font-bold uppercase tracking-widest text-warning hover:bg-warning/15">
                    🥇 Featured Hub
                  </Badge>
                  <Badge variant="outline" className="border-success/40 text-[10px] text-success">Live XAU/USD</Badge>
                </div>
                <h2 className="text-2xl font-extrabold text-foreground">
                  Gold Trading Hub
                </h2>
                <p className="mt-1 max-w-xl text-xs text-muted-foreground">
                  Real-time XAU/USD charts, AI signals, Botvio AI strategies, sentiment and risk guidance — right on your homepage.
                </p>
              </div>
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <GoldPriceHeader />
                <Button size="sm" asChild className="font-bold">
                  <Link to="/gold">
                    Open Full Gold Hub <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <GoldSentimentGauge />

            <div className="mt-4">
              <GoldChartSection />
            </div>

            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <Bell className="h-4 w-4 text-primary" /> Active Gold Signals
                </h3>
                <Link to="/gold" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                  All gold signals <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <GoldSignalsSection />
            </div>
          </div>
        </section>

        {/* ── Ticker ── */}
        <section className="border-b border-border/40" aria-label="Live market prices">
          <div className="container mx-auto px-4 py-4">
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border/60 bg-border/40 sm:grid-cols-3 lg:grid-cols-6">
              {TICKER.map((t) => (
                <div key={t.name} className="flex items-center justify-between gap-2 bg-card/70 px-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-bold text-foreground">
                      {t.name} <span className="font-normal text-muted-foreground">{t.sub}</span>
                    </p>
                    <p className="font-mono text-sm text-foreground">{t.price}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <Sparkline up={t.up} />
                    <span className={`text-[10px] font-semibold ${t.up ? "text-success" : "text-destructive"}`}>{t.change}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Core features ── */}
        <section className="container mx-auto grid gap-4 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-border/60 bg-card/60 p-5 transition-colors hover:border-primary/40">
              <f.icon className="mb-3 h-6 w-6 text-primary" />
              <h2 className="text-base font-bold text-foreground">{f.title}</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
              <Link to={f.to} className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                {f.cta} <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ))}
        </section>

        {/* ── Live signals (real data) ── */}
        <section className="container mx-auto px-4 py-6">
          <HomeSignalsWidget />
        </section>

        {/* ── Quick shortcuts ── */}
        <section className="container mx-auto px-4 py-6">
          <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                <Flame className="h-4 w-4 text-warning" /> Quick Access
              </h2>
              <Link to="/markets" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                All markets <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
              {SHORTCUTS.map((s) => (
                <Link key={s.label} to={s.to} className="block">
                  <Button variant="outline" className="h-12 w-full justify-start gap-2 text-xs font-bold">
                    <s.icon className="h-4 w-4 text-primary" /> {s.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </section>


        {/* ── AI chart analysis ── */}
        <section className="container mx-auto px-4 py-6">
          <div className="rounded-2xl border border-border/60 bg-card/60 p-6">
            <Badge className="mb-4 bg-primary/15 text-[9px] font-bold uppercase tracking-widest text-primary hover:bg-primary/15">
              New · AI Chart Analysis
            </Badge>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,2fr)]">
              <div>
                <h2 className="text-2xl font-extrabold leading-tight text-foreground">
                  Understand the market like never before.
                </h2>
                <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                  {["Multi-timeframe analysis", "Trend direction & structure", "Support & resistance levels", "Optimal entry & exit zones", "Risk management guidance"].map((l) => (
                    <li key={l} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 shrink-0 text-success" /> {l}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-[10px] leading-relaxed text-muted-foreground">
                  Upload a screenshot of any chart and Botvio returns a structured read of the market. Educational
                  analysis only — not financial advice.
                </p>
              </div>

              <HomeChartAnalyzer />
            </div>

          </div>
        </section>

        {/* ── Hubs ── */}
        <section className="container mx-auto px-4 py-6">
          <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Popular Trading Hubs</h2>
              <Link to="/markets" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                Explore all hubs <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              {HUBS.map((h) => (
                <Link key={h.name} to={h.to} className="group rounded-xl border border-border/60 bg-card/70 p-3 transition-colors hover:border-primary/40">
                  <div className="flex items-center gap-2">
                    {h.name === "Bitcoin" ? <Bitcoin className={`h-5 w-5 ${h.tint}`} /> : <LineChart className={`h-5 w-5 ${h.tint}`} />}
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-foreground">{h.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{h.sub}</p>
                    </div>
                  </div>
                  <div className="my-3"><Sparkline up /></div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary">
                    Open Hub <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Learning + brokers ── */}
        <section className="container mx-auto grid gap-4 px-4 py-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Learn Trading the Right Way</h2>
              <Link to="/learn" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                View all courses <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {COURSES.map((c) => (
                <Link key={c.title} to={c.to} className="rounded-xl border border-border/60 bg-card/70 p-3 transition-colors hover:border-primary/40">
                  <div className="mb-3 flex h-16 items-center justify-center rounded-lg border border-border/50 bg-gradient-to-br from-primary/10 to-transparent">
                    <Trophy className="h-6 w-6 text-primary/80" />
                  </div>
                  <p className="text-xs font-bold text-foreground">{c.title}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{c.level}</p>
                  <span className="mt-2 inline-block rounded-md bg-success/15 px-2 py-1 text-[10px] font-semibold text-success">
                    Start Learning
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Top Verified Brokers</h2>
              <Link to="/brokers" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                Compare all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {BROKERS.map((b) => (
                <div key={b.name} className="rounded-xl border border-border/60 bg-card/70 p-3 text-center">
                  <p className="text-xs font-bold text-foreground">{b.name}</p>
                  <p className="mt-1 min-h-[30px] text-[10px] leading-tight text-muted-foreground">{b.desc}</p>
                  <Button asChild size="sm" className="mt-2 h-7 w-full text-[10px] font-bold">
                    <Link to={b.to}>Open Account</Link>
                  </Button>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] leading-tight text-muted-foreground">
              Botvio may earn a commission from partner brokers. This does not affect our reviews.
            </p>
          </div>
        </section>

        {/* ── Trust ── */}
        <section className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border/60 bg-card/40 p-5 md:grid-cols-3 lg:grid-cols-5">
            {TRUST.map((t) => (
              <div key={t.big} className="flex items-center gap-3">
                <t.icon className="h-6 w-6 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">{t.big}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{t.small}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section className="container mx-auto px-4 py-6">
          <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">What Traders Say</h2>
              <Link to="/testimonials" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                View all reviews <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {TESTIMONIALS.map((t) => (
                <figure key={t.name} className="rounded-xl border border-border/60 bg-card/70 p-4">
                  <blockquote className="text-xs leading-relaxed text-muted-foreground">
                    <span className="mr-1 text-lg font-bold text-primary">“</span>{t.quote}
                  </blockquote>
                  <figcaption className="mt-3 flex items-end justify-between">
                    <span>
                      <span className="block text-xs font-bold text-foreground">— {t.name}</span>
                      <span className="block text-[10px] text-muted-foreground">{t.role}</span>
                    </span>
                    <span className="flex gap-0.5 text-primary">
                      {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-3 w-3 fill-current" />)}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-card/60 to-transparent p-6 sm:flex-row">
            <div className="flex items-center gap-4">
              <Trophy className="h-8 w-8 shrink-0 text-primary" />
              <div>
                <h2 className="text-xl font-extrabold text-foreground">Ready to Trade Smarter?</h2>
                <p className="text-xs text-muted-foreground">Join thousands of traders using Botvio every day.</p>
              </div>
            </div>
            <Button size="lg" onClick={() => setAuthOpen(true)} className="font-bold">
              Create Free Account <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </section>

        {/* ── Footer ── */}
        <section className="border-t border-border/40 bg-card/30">
          <div className="container mx-auto grid gap-8 px-4 py-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,3fr)]">
            <div>
              <div className="flex items-center gap-2">
                <img src="/botvio-logo.png" alt="Botvio logo" className="h-8 w-8 rounded-lg" />
                <span>
                  <span className="block text-lg font-extrabold tracking-tight text-foreground">BOTVIO</span>
                  <span className="block text-[8px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    AI Trading Intelligence
                  </span>
                </span>
              </div>
              <p className="mt-3 max-w-xs text-xs leading-relaxed text-muted-foreground">
                AI-powered trading intelligence platform providing live markets, signals, analysis and trading tools for modern traders.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
              {FOOTER_COLS.map((col) => (
                <nav key={col.title} aria-label={col.title}>
                  <h3 className="mb-3 text-xs font-bold text-foreground">{col.title}</h3>
                  <ul className="space-y-2 text-[11px] text-muted-foreground">
                    {col.links.map(([label, to]) => (
                      <li key={label}>
                        <Link to={to} className="hover:text-primary">{label}</Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}
            </div>
          </div>
          <div className="border-t border-border/40">
            <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-4 text-[11px] text-muted-foreground sm:flex-row">
              <p>© {new Date().getFullYear()} Botvio. All rights reserved.</p>
              <nav aria-label="Legal" className="flex flex-wrap items-center gap-4">
                <Link to="/disclaimer" className="hover:text-primary">Risk Disclosure</Link>
                <Link to="/terms" className="hover:text-primary">Terms of Service</Link>
                <Link to="/privacy" className="hover:text-primary">Privacy Policy</Link>
                <Link to="/affiliate-disclosure" className="hover:text-primary">Affiliate Disclosure</Link>
              </nav>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomeMockup;
