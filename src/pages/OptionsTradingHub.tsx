import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowRight, Bot, BookOpen, CheckCircle2, Clock3, ExternalLink, LineChart, ShieldCheck, Sparkles, Target, Wallet } from "lucide-react";
import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDerivLiveTicks } from "@/hooks/useDerivLiveTicks";
import { brokerReviews } from "@/data/brokerReviews";
import { rsi, riseFallEngine } from "@/lib/signalEngines";

const DERIV_SIGNUP = brokerReviews.deriv.affiliateUrl || "https://t.deriv.link?t=8U3QNKP9UA9G";
const EXNESS_SIGNUP = brokerReviews.exness.affiliateUrl || "https://www.exness.com/";

const WATCHLIST = [
  { symbol: "1HZ100V", name: "Volatility 100 (1s)" },
  { symbol: "R_75", name: "Volatility 75" },
  { symbol: "BOOM500", name: "Boom 500" },
  { symbol: "CRASH500", name: "Crash 500" },
];

function SignalPreview({ symbol, name }: { symbol: string; name: string }) {
  const { tick, connected, derivSupported } = useDerivLiveTicks(symbol);
  const [ticks, setTicks] = useState<number[]>([]);

  useEffect(() => {
    if (tick?.price == null) return;
    setTicks((p) => [...p, tick.price].slice(-120));
  }, [tick]);

  const signal = useMemo(() => {
    if (ticks.length < 30) {
      return { direction: "WAIT", confidence: 0, reason: "Collecting market ticks" };
    }
    const value = rsi(ticks, Math.min(14, Math.max(5, ticks.length - 1)));
    const engine = riseFallEngine(ticks);
    if (engine.signal === "RISE") return { direction: "RISE", confidence: Math.round(Math.min(95, Math.max(50, 55 + (50 - value))),), reason: "Momentum engine is pointing higher" };
    if (engine.signal === "FALL") return { direction: "FALL", confidence: Math.round(Math.min(95, Math.max(50, 55 + (value - 50))),), reason: "Momentum engine is pointing lower" };
    return { direction: "WAIT", confidence: 0, reason: "No aligned setup yet" };
  }, [ticks]);

  const positive = signal.direction === "RISE";

  return (
    <Card className="glass-card overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-bold">{name}</p>
            <p className="text-[11px] text-muted-foreground">{symbol}</p>
          </div>
          <Badge variant="outline" className={connected ? "border-success/40 text-success" : "text-muted-foreground"}>
            <Activity className="mr-1 h-3 w-3" />{connected ? "Live" : "Connecting"}
          </Badge>
        </div>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-2xl font-black tabular-nums">{tick?.price ?? "—"}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{signal.reason}</p>
          </div>
          <div className={signal.direction === "WAIT" ? "text-muted-foreground" : positive ? "text-success" : "text-destructive"}>
            <p className="text-lg font-black">{signal.direction}</p>
            {signal.confidence > 0 && <p className="text-[10px] text-right">{signal.confidence}% engine score</p>}
          </div>
        </div>
        {!derivSupported && <p className="mt-2 text-[10px] text-warning">This symbol is not currently supported by the public feed.</p>}
      </CardContent>
    </Card>
  );
}

const OptionsTradingHub = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="Options Trading Hub — Deriv Signals, Strategies & AI Analysis | BOTVIO"
      description="Learn options trading, explore Deriv Digital Options, review automated signal previews, study strategies and connect your Deriv account through BOTVIO."
    />
    <Header />

    <main className="container mx-auto max-w-6xl px-4 py-6 md:py-10 space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-success/5 p-6 md:p-10">
        <div className="max-w-3xl">
          <Badge className="mb-3"><Sparkles className="mr-1 h-3 w-3" /> BOTVIO OPTIONS HUB</Badge>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">Options trading, signals and strategy research in one place.</h1>
          <p className="mt-4 text-muted-foreground text-base md:text-lg">
            Start with education, test signals on market data, choose a strategy, then connect a Deriv account when you are ready.
            BOTVIO signals are analysis tools — they are not guarantees of results.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <a href={DERIV_SIGNUP} target="_blank" rel="noopener noreferrer">
                Open Deriv Account <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild><Link to="/rise-fall">Open Options Workspace <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">Affiliate disclosure: BOTVIO may receive a commission from qualifying partner activity.</p>
        </div>
      </section>

      <section>
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["1", "Learn", "Understand Digital Options, Rise/Fall, Higher/Lower and risk."],
            ["2", "Watch", "Use public market data and BOTVIO's signal research engine."],
            ["3", "Connect", "Link your Deriv account through the existing secure connection flow."],
            ["4", "Execute", "Use manual trading or, where enabled, controlled automation."],
          ].map(([n, title, text]) => (
            <Card key={n} className="glass-card">
              <CardContent className="p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-sm font-black text-primary">{n}</span>
                <h2 className="mt-3 font-bold">{title}</h2>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between gap-3 mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Live research preview</p>
            <h2 className="text-2xl font-black">Auto-generated options signals</h2>
            <p className="text-sm text-muted-foreground">Signals are generated from live public ticks. WAIT is a valid signal.</p>
          </div>
          <Button variant="outline" asChild><Link to="/signals?market=options&broker=deriv">Options signals <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {WATCHLIST.map((item) => <SignalPreview key={item.symbol} {...item} />)}
        </div>
      </section>

      <section>
        <Card className="glass-card border-primary/20">
          <CardContent className="p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <Badge variant="outline">EXISTING BOTVIO SIGNALS</Badge>
              <h2 className="mt-2 text-xl font-black">Options Signals Center</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your existing signal feed remains the main source for published options signals, history, filters and alerts. The new hub simply gives visitors a clearer route into it.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild><Link to="/signals?market=options&broker=deriv">Open Options Signals</Link></Button>
              <Button variant="outline" asChild><Link to="/signals/history">Signal History</Link></Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="glass-card lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Options learning path</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              ["What are Digital Options?", "/blog/digital-options"],
              ["Rise/Fall strategy research", "/rise-fall"],
              ["Synthetic Indices guide", "/synthetic-hub"],
              ["Trading strategies", "/strategies"],
              ["Risk management tools", "/tools"],
              ["Deriv connection", "/connections"],
            ].map(([title, href]) => (
              <Link key={href} to={href} className="rounded-xl border bg-background/50 p-4 transition hover:border-primary/40 hover:bg-primary/5">
                <p className="font-semibold text-sm">{title}</p>
                <p className="mt-1 text-xs text-muted-foreground">Open guide →</p>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardHeader><CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /> AI workflow</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              "Market data is collected from the supported Deriv public feed.",
              "The engine evaluates recent tick behaviour and technical conditions.",
              "BOTVIO returns RISE, FALL or WAIT rather than forcing a trade.",
              "Users can review the setup before choosing whether to connect and trade.",
            ].map((x) => <div key={x} className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-success mt-0.5" /><span className="text-muted-foreground">{x}</span></div>)}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="glass-card border-primary/20">
          <CardContent className="p-6">
            <Badge variant="outline">OPTIONS PATH</Badge>
            <h2 className="mt-3 text-xl font-black">Deriv Digital Options</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Deriv currently offers Digital Options across forex, stock indices, commodities and Derived Indices, with contract types including Rise/Fall, Higher/Lower and Touch/No Touch.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild><a href={DERIV_SIGNUP} target="_blank" rel="sponsored noopener noreferrer">Open Deriv <ExternalLink className="ml-2 h-4 w-4" /></a></Button>
              <Button variant="outline" asChild><Link to="/brokers/deriv">Read Deriv review</Link></Button>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-warning/20">
          <CardContent className="p-6">
            <Badge variant="outline">FOREX / CFD PATH</Badge>
            <h2 className="mt-3 text-xl font-black">Exness for Forex & Gold</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              If a visitor came for forex, gold or MT5 rather than Digital Options, route them to the separate forex/CFD path instead of forcing an options workflow.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild><a href={EXNESS_SIGNUP} target="_blank" rel="sponsored noopener noreferrer">Open Exness <ExternalLink className="ml-2 h-4 w-4" /></a></Button>
              <Button variant="outline" asChild><Link to="/brokers/exness">Read Exness review</Link></Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="glass-card">
          <CardContent className="p-5">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="mt-3 font-bold">Strategies</h3>
            <p className="mt-1 text-xs text-muted-foreground">Study momentum, mean-reversion, tick and expiry frameworks before using real funds.</p>
            <Button className="mt-4" variant="outline" size="sm" asChild><Link to="/strategies">Explore strategies</Link></Button>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-5">
            <LineChart className="h-5 w-5 text-primary" />
            <h3 className="mt-3 font-bold">AI chart analysis</h3>
            <p className="mt-1 text-xs text-muted-foreground">Upload charts and use BOTVIO analysis alongside the live market feed.</p>
            <Button className="mt-4" variant="outline" size="sm" asChild><Link to="/signals">Open signals</Link></Button>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-5">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h3 className="mt-3 font-bold">Risk-first controls</h3>
            <p className="mt-1 text-xs text-muted-foreground">Set a stake limit, session limit and minimum signal threshold. Never treat an automated signal as certainty.</p>
            <Button className="mt-4" variant="outline" size="sm" asChild><Link to="/rise-fall">Open workspace</Link></Button>
          </CardContent>
        </Card>
      </section>

      <section className="rounded-2xl border bg-muted/20 p-5 md:p-7">
        <h2 className="text-xl font-black">From search visitor to Deriv trader</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-5">
          {[
            [BookOpen, "1. Read", "SEO guide or strategy"],
            [Activity, "2. Watch", "Live signal preview"],
            [Bot, "3. Test", "Demo / research mode"],
            [Wallet, "4. Connect", "Deriv account"],
            [Clock3, "5. Continue", "Signals + controlled execution"],
          ].map(([Icon, title, text]) => (
            <div key={title as string} className="rounded-xl border bg-background p-4">
              <Icon className="h-4 w-4 text-primary" />
              <p className="mt-2 text-sm font-bold">{title as string}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{text as string}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-warning/30 bg-warning/5 p-5">
        <h2 className="font-bold">Risk and availability</h2>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Options are derivatives and can result in loss of the amount staked. Product types, markets, contract durations and availability can vary by account, platform and jurisdiction.
          Check Deriv's current terms and product availability before trading. BOTVIO provides educational information and automated analysis, not personalised investment advice.
        </p>
      </section>
    </main>
  </div>
);

export default OptionsTradingHub;
