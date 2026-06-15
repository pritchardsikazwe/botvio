import { Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp } from "lucide-react";

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

export default function MarketAnalysis() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Daily Market Analysis — Gold, EURUSD, GBPUSD & BTCUSD Forecast"
        description="Daily forex and crypto market analysis from Botvio. Gold (XAUUSD), EURUSD, GBPUSD and BTCUSD forecasts updated every trading day with key levels and trade setups."
      />
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-6xl">
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
