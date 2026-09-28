import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowRight, TrendingUp, Clock, BookOpen, Signal as SignalIcon } from "lucide-react";

const forecasts = [
  {
    pair: "XAUUSD",
    name: "Gold",
    href: "/blog/xauusd-forecast-today-gold-analysis",
    hubHref: "/gold-trading-hub",
    blurb:
      "Daily gold technical and fundamental outlook with key support, resistance, DXY correlation and session-by-session playbook.",
    accent: "from-yellow-500/20 to-amber-600/20",
    emoji: "🥇",
  },
  {
    pair: "EURUSD",
    name: "Euro vs US Dollar",
    href: "/blog/eurusd-forecast-today-analysis",
    hubHref: "/forex/eurusd",
    blurb:
      "ECB vs Fed bias, London-open breakout setups, NY pullback playbook and live EURUSD signals.",
    accent: "from-blue-500/20 to-indigo-600/20",
    emoji: "💶",
  },
  {
    pair: "GBPUSD",
    name: "British Pound vs US Dollar",
    href: "/blog/gbpusd-forecast-today-analysis",
    hubHref: "/forex/gbpusd",
    blurb:
      "Cable analysis with BoE bias, UK data windows and the 30-minute London-open breakout playbook.",
    accent: "from-red-500/20 to-pink-600/20",
    emoji: "💷",
  },
  {
    pair: "BTCUSD",
    name: "Bitcoin",
    href: "/blog/btcusd-forecast-today-analysis",
    hubHref: "/bitcoin-trading-hub",
    blurb:
      "BTC daily bias with ETF-flow context, on-chain accumulation/distribution and key technical levels.",
    accent: "from-orange-500/20 to-yellow-600/20",
    emoji: "₿",
  },
];

const additionalAssets = [
  { name: "USDJPY", href: "/forex/usdjpy", note: "Yen carry-trade & BoJ bias" },
  { name: "AUDUSD", href: "/forex/audusd", note: "Risk-on commodity proxy" },
  { name: "USDCAD", href: "/forex/usdcad", note: "Oil-correlated dollar pair" },
  { name: "US30", href: "/us30", note: "Dow Jones daily playbook" },
  { name: "NAS100", href: "/nas100", note: "Nasdaq tech leadership" },
  { name: "GER40", href: "/ger40", note: "DAX Frankfurt-open setup" },
  { name: "Silver (XAGUSD)", href: "/silver", note: "Industrial + safe-haven hybrid" },
  { name: "Crypto majors", href: "/bots/binance", note: "BTC, ETH & top altcoins" },
];

const sessions = [
  { name: "Sydney", window: "22:00 – 07:00 UTC", focus: "AUD, NZD, JPY ranges" },
  { name: "Tokyo", window: "00:00 – 09:00 UTC", focus: "JPY pairs, Nikkei flow" },
  { name: "London", window: "07:00 – 16:00 UTC", focus: "EURUSD, GBPUSD, XAUUSD breakouts" },
  { name: "New York", window: "12:00 – 21:00 UTC", focus: "US30, NAS100, USD news, gold trend" },
];

const faqs = [
  {
    q: "How often is the daily market analysis updated?",
    a: "Each forecast is refreshed every trading day before the London open and again around the New York open. Live signals on the linked hubs update in real time.",
  },
  {
    q: "Are these forecasts free?",
    a: "Yes. All daily forecasts and the live market analysis hub are free to read. Premium plans unlock auto-execution, WhatsApp alerts and the full signal archive.",
  },
  {
    q: "Which timeframes do the forecasts use?",
    a: "Botvio combines a top-down read on the daily and H4 charts with H1 and M15 execution levels, so the same plan works for swing traders and intraday scalpers.",
  },
  {
    q: "Do you cover gold, indices and crypto?",
    a: "Yes — XAUUSD (gold), EURUSD, GBPUSD, USDJPY, BTCUSD, US30, NAS100 and GER40 are covered daily, plus rotating coverage of silver, oil and major altcoins.",
  },
];

export default function MarketAnalysis() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://botvio.lovable.app/" },
      { "@type": "ListItem", position: 2, name: "Market Analysis", item: "https://botvio.lovable.app/market-analysis" },
    ],
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  useEffect(() => {
    const nodes: HTMLScriptElement[] = [];
    [breadcrumbJsonLd, faqJsonLd].forEach((data) => {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.text = JSON.stringify(data);
      s.dataset.botvioJsonld = "market-analysis";
      document.head.appendChild(s);
      nodes.push(s);
    });
    return () => nodes.forEach((n) => n.remove());
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Daily Market Analysis — Gold, EURUSD, GBPUSD & BTCUSD Forecast"
        description="Daily forex and crypto market analysis from Botvio. Gold (XAUUSD), EURUSD, GBPUSD and BTCUSD forecasts updated every trading day with key levels and trade setups."
      />
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-6xl">
        <nav aria-label="Breadcrumb" className="mb-6 text-xs text-muted-foreground">
          <ol className="flex items-center gap-2">
            <li><Link to="/" className="hover:text-primary">Home</Link></li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-foreground">Market Analysis</li>
          </ol>
        </nav>

        <header className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            <TrendingUp className="w-3.5 h-3.5" />
            UPDATED DAILY
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Daily Market Analysis
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Fresh forex and crypto forecasts every trading day — XAUUSD (gold),
            EURUSD, GBPUSD and BTCUSD. Key levels, session playbooks, and live
            signals you can act on.
          </p>
        </header>

        <section className="grid md:grid-cols-2 gap-6">
          {forecasts.map((f) => (
            <Card
              key={f.pair}
              className={`bg-gradient-to-br ${f.accent} border-border/50`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">
                    <span className="mr-2 text-3xl">{f.emoji}</span>
                    {f.pair} Forecast
                  </CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">{f.name}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-6 leading-relaxed">{f.blurb}</p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="default" size="sm">
                    <Link to={f.href}>
                      Read today's analysis <ArrowRight className="ml-1 w-4 h-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to={f.hubHref}>Open live hub</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" /> Live Trading Sessions
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Every forecast is timed to these sessions. Pick the window that
            matches your strategy and instrument.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {sessions.map((s) => (
              <div key={s.name} className="p-4 rounded-lg border border-border bg-card">
                <p className="font-semibold">{s.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.window}</p>
                <p className="text-xs mt-2">{s.focus}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <SignalIcon className="w-5 h-5 text-primary" /> More Instruments Covered
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {additionalAssets.map((a) => (
              <Link
                key={a.name}
                to={a.href}
                className="block p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-card/80 transition-colors"
              >
                <p className="font-semibold text-sm">{a.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{a.note}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-12 grid lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-lg border border-border bg-card">
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> How We Build Each Forecast
            </h2>
            <ol className="list-decimal list-inside text-sm space-y-2 text-muted-foreground">
              <li>Top-down read of the daily and H4 chart for bias.</li>
              <li>Mark key support / resistance, prior day high & low and weekly pivots.</li>
              <li>Overlay EMA 20/50 + RSI + ATR (Hauxa strategy) for confluence.</li>
              <li>Cross-check the economic calendar to avoid blind news entries.</li>
              <li>Publish entry, stop and 2 take-profit targets per setup.</li>
            </ol>
          </div>
          <div className="p-6 rounded-lg border border-border bg-card">
            <h2 className="text-xl font-bold mb-3">Trade the Analysis Live</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Forecasts pair directly with Botvio live signals, AI chart
              analysis and auto-execution on supported brokers. No setup
              needed for free signals.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm"><Link to="/signals">Live signals</Link></Button>
              <Button asChild variant="outline" size="sm"><Link to="/chart">AI chart analyzer</Link></Button>
              <Button asChild variant="outline" size="sm"><Link to="/learn">Free course</Link></Button>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section className="mt-12 p-6 rounded-lg border border-border bg-card">
          <h2 className="text-xl font-semibold mb-3">More from Botvio</h2>
          <ul className="grid md:grid-cols-3 gap-3 text-sm">
            <li><Link className="text-primary hover:underline" to="/signals">Live trading signals →</Link></li>
            <li><Link className="text-primary hover:underline" to="/news-calendar">Economic news calendar →</Link></li>
            <li><Link className="text-primary hover:underline" to="/blog">All trading articles →</Link></li>
            <li><Link className="text-primary hover:underline" to="/chart">AI chart analyzer →</Link></li>
            <li><Link className="text-primary hover:underline" to="/learn">Free beginner course →</Link></li>
            <li><Link className="text-primary hover:underline" to="/strategies">Strategy library →</Link></li>
          </ul>
        </section>
      </main>
    </div>
  );
}
