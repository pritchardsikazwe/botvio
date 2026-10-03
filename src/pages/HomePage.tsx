import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { SEOHead } from "@/components/seo/SEOHead";
import { HomeSignalsWidget } from "@/components/signals/HomeSignalsWidget";
import { HomeChartAnalyzer } from "@/components/home/HomeChartAnalyzer";
import { HomeMarketCharts } from "@/components/home/HomeMarketCharts";
import { GoldPriceHeader } from "@/components/gold/GoldPriceHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, BarChart3, Bell, Bot, Check, ChevronRight, Globe2,
  LineChart, Menu, ShieldCheck, Sparkles, TrendingUp, Users, Zap,
} from "lucide-react";

const markets = [
  { name: "Gold", symbol: "XAU/USD", to: "/gold", tag: "Popular" },
  { name: "Bitcoin", symbol: "BTC/USD", to: "/bitcoin", tag: "24/7" },
  { name: "EUR/USD", symbol: "Forex", to: "/eur-usd", tag: "FX" },
  { name: "NAS100", symbol: "Index", to: "/nas100", tag: "Index" },
  { name: "US30", symbol: "Index", to: "/us30", tag: "Index" },
  { name: "Synthetic Indices", symbol: "Boom • Crash • Volatility", to: "/synthetic-hub", tag: "Deriv" },
];

const capabilities = [
  { icon: LineChart, title: "Live Markets", text: "Research forex, gold, crypto, indices and synthetic markets in one place.", to: "/markets" },
  { icon: Sparkles, title: "AI Chart Analysis", text: "Turn a chart into a structured market read with trend, levels and risk context.", to: "/chart/XAUUSD" },
  { icon: Bell, title: "Trading Signals", text: "Discover live opportunities and review signal history before taking action.", to: "/signals" },
  { icon: Users, title: "Copy Trading", text: "Explore providers and strategies designed for traders who want automation.", to: "/copy-trading" },
  { icon: Bot, title: "AI Trading Bots", text: "Explore automated strategies and connect supported trading workflows.", to: "/bots" },
  { icon: Globe2, title: "Broker Hub", text: "Compare brokers and choose the account that fits your market and strategy.", to: "/brokers" },
];

const brokers = [
  { name: "Deriv", text: "Synthetic indices, options and CFD markets", to: "/brokers/deriv" },
  { name: "Exness", text: "Forex, gold and multi-asset trading", to: "/brokers/exness" },
  { name: "Weltrade", text: "MT5 and multi-market trading", to: "/brokers/weltrade" },
  { name: "Binance", text: "Crypto trading and automation", to: "/brokers/binance" },
  { name: "Pocket Option", text: "Digital/options-focused trading", to: "/brokers/pocket-option" },
];

const HomePage = () => {
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const start = () => setAuthOpen(true);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <SEOHead
        title="Botvio | AI Trading Intelligence, Signals, Copy Trading & Bots"
        description="Botvio combines live market research, AI chart analysis, trading signals, copy trading and automated trading tools for forex, gold, crypto, indices and synthetic markets."
      />
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />

      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="Botvio home">
            <img src="/botvio-logo.png" alt="Botvio" className="h-9 w-9 rounded-xl" />
            <div className="leading-none">
              <div className="text-lg font-black tracking-tight">BOTVIO</div>
              <div className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">AI Trading Intelligence</div>
            </div>
          </Link>

          <nav className="mx-auto hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
            {[['Markets','/markets'],['AI Analysis','/chart/XAUUSD'],['Signals','/signals'],['Copy Trading','/copy-trading'],['Bots','/bots'],['Brokers','/brokers'],['Learn','/learn']].map(([label,to]) => (
              <Link key={to} to={to} className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground">{label}</Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <Button size="sm" asChild className="font-bold"><Link to="/dashboard">Dashboard</Link></Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={start} className="hidden sm:inline-flex">Log in</Button>
                <Button size="sm" onClick={start} className="font-bold">Start Free</Button>
              </>
            )}
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(v => !v)} aria-label="Open menu" aria-expanded={mobileOpen}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
        {mobileOpen && (
          <nav className="border-t border-border/60 bg-background px-4 py-3 lg:hidden">
            <div className="grid grid-cols-2 gap-2">
              {[['Markets','/markets'],['AI Analysis','/chart/XAUUSD'],['Signals','/signals'],['Copy Trading','/copy-trading'],['Bots','/bots'],['Brokers','/brokers'],['Learn','/learn']].map(([label,to]) => (
                <Link key={to} onClick={() => setMobileOpen(false)} to={to} className="rounded-lg border border-border/60 px-3 py-3 text-sm font-semibold">{label}</Link>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-border/50">
          <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-32 top-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="container relative mx-auto grid gap-10 px-4 py-12 sm:py-16 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:py-20">
            <div>
              <Badge variant="outline" className="mb-5 gap-2 rounded-full border-primary/40 bg-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                <Sparkles className="h-3 w-3" /> AI-powered market intelligence
              </Badge>
              <h1 className="max-w-3xl text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
                See the market.
                <span className="block text-primary">Understand the setup.</span>
                <span className="block">Trade with a plan.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                Botvio brings live markets, AI chart analysis, signals, copy trading and automated trading tools into one trader workflow.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" onClick={start} className="h-12 px-7 font-bold">Create Free Account <ArrowRight className="ml-2 h-4 w-4" /></Button>
                <Button size="lg" variant="outline" asChild className="h-12 px-7 font-semibold"><Link to="/markets">Explore Live Markets</Link></Button>
              </div>
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                {['Market research','AI analysis','Signals','Copy trading','Trading bots'].map(x => <span key={x} className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" />{x}</span>)}
              </div>
            </div>

            <div className="rounded-3xl border border-border/70 bg-card/80 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Live market desk</p>
                  <h2 className="mt-1 text-xl font-black">XAU/USD</h2>
                </div>
                <Badge className="gap-1.5 bg-success/15 text-success hover:bg-success/15"><span className="h-1.5 w-1.5 rounded-full bg-success" /> Live</Badge>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                <GoldPriceHeader />
                <div className="mt-4 h-44 overflow-hidden rounded-xl border border-border/50 bg-card/50">
                  <div className="flex h-full items-center justify-center px-5">
                    <div className="w-full">
                      <div className="mb-2 flex items-center justify-between text-[10px] text-muted-foreground"><span>AI market view</span><span>Trend • Levels • Momentum</span></div>
                      <div className="relative h-24 overflow-hidden rounded-lg bg-secondary/40">
                        <svg viewBox="0 0 500 120" className="h-full w-full" preserveAspectRatio="none" aria-label="Market trend preview">
                          <polyline points="0,90 45,78 80,82 120,62 165,70 205,45 245,53 290,31 335,42 375,22 420,35 455,15 500,24" fill="none" className="stroke-primary" strokeWidth="3" />
                          <polyline points="0,110 500,110" fill="none" className="stroke-border" strokeWidth="1" />
                        </svg>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]">
                        <div className="rounded-lg bg-secondary/60 p-2"><span className="block text-muted-foreground">Trend</span><strong className="text-success">Bullish</strong></div>
                        <div className="rounded-lg bg-secondary/60 p-2"><span className="block text-muted-foreground">Momentum</span><strong>Strong</strong></div>
                        <div className="rounded-lg bg-secondary/60 p-2"><span className="block text-muted-foreground">Risk</span><strong>Manage</strong></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[['AI Analyze','/chart/XAUUSD'],['Signals','/signals'],['Copy Trade','/copy-trading']].map(([label,to]) => <Button key={to} variant="outline" size="sm" asChild className="text-xs font-bold"><Link to={to}>{label}</Link></Button>)}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border/50 bg-card/20">
          <div className="container mx-auto px-4 py-5">
            <div className="mb-3 flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Explore markets</p><Link to="/markets" className="text-xs font-semibold text-primary">All markets <ChevronRight className="inline h-3 w-3" /></Link></div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {markets.map(m => <Link key={m.to} to={m.to} className="group rounded-xl border border-border/60 bg-card/70 p-3 transition hover:-translate-y-0.5 hover:border-primary/50"><div className="flex items-center justify-between"><span className="text-sm font-bold">{m.name}</span><Badge variant="outline" className="text-[8px]">{m.tag}</Badge></div><p className="mt-1 truncate text-[10px] text-muted-foreground">{m.symbol}</p><div className="mt-3 flex items-center gap-1 text-[10px] font-semibold text-primary opacity-80 group-hover:opacity-100">Open hub <ArrowRight className="h-3 w-3" /></div></Link>)}
            </div>
          </div>
        </section>

        <HomeMarketCharts />

        <section className="container mx-auto px-4 py-12 sm:py-16">
          <div className="mx-auto max-w-2xl text-center"><Badge variant="outline" className="mb-3 border-primary/30 text-primary">One workflow</Badge><h2 className="text-3xl font-black sm:text-4xl">From market research to action</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Start with information. Validate the setup. Then choose the trading workflow that fits you.</p></div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map(({icon: Icon,title,text,to}) => <Link key={title} to={to} className="group rounded-2xl border border-border/60 bg-card/60 p-5 transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div><h3 className="text-base font-bold">{title}</h3><p className="mt-2 min-h-10 text-xs leading-5 text-muted-foreground">{text}</p><span className="mt-4 inline-flex items-center text-xs font-bold text-primary">Explore <ArrowRight className="ml-1 h-3 w-3 transition group-hover:translate-x-1" /></span></Link>)}
          </div>
        </section>

        <section className="border-y border-border/50 bg-card/20">
          <div className="container mx-auto grid gap-8 px-4 py-12 lg:grid-cols-[.7fr_1.3fr] lg:items-center">
            <div><Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/10">AI CHART ANALYSIS</Badge><h2 className="text-3xl font-black">Turn charts into a clearer trading plan.</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Use Botvio to inspect market structure, trend, support and resistance and risk context before deciding what to do next.</p><ul className="mt-5 space-y-2 text-xs text-muted-foreground">{['Multi-timeframe market context','Trend and market structure','Key support and resistance','Entry, target and risk context'].map(x => <li key={x} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" />{x}</li>)}</ul><Button asChild className="mt-6 font-bold"><Link to="/chart/XAUUSD">Open AI Chart Analysis <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div>
            <div className="rounded-2xl border border-border/60 bg-card/70 p-4"><HomeChartAnalyzer /></div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 sm:py-16">
          <div className="mb-6 flex items-end justify-between gap-4"><div><Badge variant="outline" className="mb-2">LIVE</Badge><h2 className="text-2xl font-black sm:text-3xl">Signals worth researching</h2><p className="mt-1 text-xs text-muted-foreground">Review the setup before you trade. Past performance does not guarantee future results.</p></div><Link to="/signals" className="hidden text-xs font-bold text-primary sm:block">View all signals <ArrowRight className="inline h-3 w-3" /></Link></div>
          <HomeSignalsWidget />
        </section>

        <section className="border-y border-border/50 bg-card/20">
          <div className="container mx-auto px-4 py-12 sm:py-16">
            <div className="mx-auto max-w-2xl text-center"><Badge variant="outline" className="mb-3">TRADING WORKFLOWS</Badge><h2 className="text-3xl font-black">Choose how you want to trade</h2><p className="mt-3 text-sm text-muted-foreground">Research manually, follow signals, copy a provider or explore automation.</p></div>
            <div className="mt-8 grid gap-4 md:grid-cols-3"><Link to="/signals" className="rounded-2xl border border-border/60 bg-card p-5"><Bell className="h-6 w-6 text-primary" /><h3 className="mt-4 font-bold">Signals</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">Track opportunities and signal history.</p></Link><Link to="/copy-trading" className="rounded-2xl border border-border/60 bg-card p-5"><Users className="h-6 w-6 text-primary" /><h3 className="mt-4 font-bold">Copy Trading</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">Compare providers and follow strategies.</p></Link><Link to="/bots" className="rounded-2xl border border-border/60 bg-card p-5"><Bot className="h-6 w-6 text-primary" /><h3 className="mt-4 font-bold">AI Bots</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">Explore supported automated strategies.</p></Link></div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 sm:py-16">
          <div className="rounded-3xl border border-border/70 bg-card p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><Badge className="bg-primary/10 text-primary hover:bg-primary/10">BROKER HUB</Badge><h2 className="mt-3 text-2xl font-black">Choose the broker for your strategy</h2><p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground">Compare broker features, markets and trading workflows before opening an account.</p></div><Link to="/brokers" className="text-xs font-bold text-primary">Compare all brokers <ArrowRight className="inline h-3 w-3" /></Link></div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {brokers.map(b => <Link key={b.name} to={b.to} className="rounded-xl border border-border/60 bg-background/60 p-4 transition hover:border-primary/50"><div className="flex items-center justify-between"><span className="font-bold">{b.name}</span><ChevronRight className="h-4 w-4 text-muted-foreground" /></div><p className="mt-2 text-[11px] leading-4 text-muted-foreground">{b.text}</p><span className="mt-3 block text-[10px] font-bold text-primary">Read review</span></Link>)}
            </div>
            <p className="mt-5 text-[10px] leading-4 text-muted-foreground">Some broker links on Botvio may be affiliate links. If you open an account through an affiliate link, Botvio may receive compensation at no additional cost to you. Trading involves risk.</p>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-14">
          <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-primary/10 px-6 py-10 text-center sm:px-10"><div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10" /><div className="relative"><ShieldCheck className="mx-auto h-8 w-8 text-primary" /><h2 className="mt-3 text-3xl font-black">Build your trading workflow with Botvio</h2><p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">Create a free account, explore the markets and unlock the tools that fit your strategy.</p><Button size="lg" onClick={start} className="mt-6 px-8 font-bold">Start Free <ArrowRight className="ml-2 h-4 w-4" /></Button></div></div>
        </section>
      </main>

      <footer className="border-t border-border/60 bg-card/20">
        <div className="container mx-auto flex flex-col gap-4 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><div><span className="font-bold text-foreground">BOTVIO</span> · AI Trading Intelligence</div><div className="flex flex-wrap gap-4"><Link to="/about">About</Link><Link to="/affiliate-disclosure">Affiliate Disclosure</Link><Link to="/disclaimer">Risk Disclaimer</Link><Link to="/privacy">Privacy</Link><Link to="/contact">Contact</Link></div></div>
      </footer>
    </div>
  );
};

export default HomePage;
