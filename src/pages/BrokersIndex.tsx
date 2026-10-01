import { Link } from "react-router-dom";
import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, ExternalLink, BarChart3, Brain, Copy, Bot, UserPlus } from "lucide-react";
import { brokerReviews } from "@/data/brokerReviews";

/**
 * Public brokers hub. Lists every editorial broker review with a summary card
 * plus a comparison table for scanning at a glance.
 *
 * Commercial links are secondary to the editorial/research journey: users are
 * encouraged to compare a broker, inspect Botvio market tools, then choose an
 * account when ready.
 */
export default function BrokersIndex() {
  const brokers = Object.values(brokerReviews);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Best Forex Brokers 2026 — Independent Reviews",
    inLanguage: "en-US",
    hasPart: brokers.map((b) => ({
      "@type": "Review",
      itemReviewed: { "@type": "FinancialService", name: b.name },
      url: `https://botvio.live/brokers/${b.slug}`,
    })),
  };
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Best Forex Brokers 2026 — Independent Reviews by Botvio"
        description="Independent broker reviews of Deriv, Exness, HFM, XM, Weltrade, IC Markets and FP Markets. Compare regulation, spreads, platforms and deposits — updated for 2026."
      />
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <nav className="text-xs text-muted-foreground mb-4" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1">
            <li><Link to="/" className="hover:text-primary">Home</Link></li>
            <li>/</li>
            <li className="text-foreground font-semibold">Brokers</li>
          </ol>
        </nav>

        <section className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight">
            Best Forex Brokers 2026 — Independent Reviews
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-3 max-w-3xl leading-relaxed">
            The Botvio Editorial Team reviews retail forex, CFD and synthetic
            indices brokers using the same framework every time: regulation,
            trading conditions, platforms, deposits and withdrawals, instrument
            depth, support and the specific traders each broker actually suits.
            No pay-to-play rankings — commercial links are always disclosed.
          </p>
        </section>

        {/* Research-first conversion path */}
        <section className="mb-10" aria-labelledby="next-step">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card">
            <CardContent className="p-5 md:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">Botvio trading workflow</p>
                  <h2 id="next-step" className="text-xl md:text-2xl font-extrabold mt-1">Research first. Choose a broker when you are ready.</h2>
                  <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                    Compare broker conditions, then use Botvio's market tools to study the instrument you want to trade. Create a free account for deeper AI analysis, signals, copy trading and automation.
                  </p>
                </div>
                <Link to="/?authRequired=1&next=/dashboard">
                  <Button size="lg" className="font-bold shrink-0 gap-2"><UserPlus className="h-4 w-4" /> Create free account</Button>
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-5">
                <Link to="/markets" className="rounded-lg border border-border/60 p-3 hover:border-primary/50 transition-colors">
                  <BarChart3 className="h-4 w-4 text-primary mb-1" /><span className="text-xs font-semibold">Markets</span>
                </Link>
                <Link to="/chart/XAUUSD" className="rounded-lg border border-border/60 p-3 hover:border-primary/50 transition-colors">
                  <Brain className="h-4 w-4 text-primary mb-1" /><span className="text-xs font-semibold">AI charts</span>
                </Link>
                <Link to="/signals" className="rounded-lg border border-border/60 p-3 hover:border-primary/50 transition-colors">
                  <ArrowRight className="h-4 w-4 text-primary mb-1" /><span className="text-xs font-semibold">Signals</span>
                </Link>
                <Link to="/copy-trading" className="rounded-lg border border-border/60 p-3 hover:border-primary/50 transition-colors">
                  <Copy className="h-4 w-4 text-primary mb-1" /><span className="text-xs font-semibold">Copy trading</span>
                </Link>
                <Link to="/bots" className="rounded-lg border border-border/60 p-3 hover:border-primary/50 transition-colors">
                  <Bot className="h-4 w-4 text-primary mb-1" /><span className="text-xs font-semibold">AI bots</span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Cards */}
        <section aria-labelledby="broker-cards" className="mb-10">
          <h2 id="broker-cards" className="text-xl md:text-2xl font-extrabold text-foreground mb-3">Compare brokers</h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-3xl">
            Start with the full review. When a broker fits your needs, its account link is available as a clearly marked commercial option.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {brokers.map((b) => (
              <Card key={b.slug} className="h-full hover:border-primary/50 transition-colors flex flex-col">
                <CardContent className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-extrabold text-foreground">{b.logoEmoji} {b.name}</h3>
                    <Badge variant="outline" className="text-[10px]">Min {b.minDeposit}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.tagline}</p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {b.regulation.slice(0, 3).map((r) => (
                      <Badge key={r} variant="outline" className="text-[10px]">
                        <Shield className="h-3 w-3 mr-1" /> {r.split(" ")[0]}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-auto pt-4 flex gap-2">
                    <Link to={`/brokers/${b.slug}`} className="flex-1">
                      <Button variant="outline" className="w-full font-bold gap-1">
                        Read review <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                    {b.affiliateUrl && (
                      <a href={b.affiliateUrl} target="_blank" rel="sponsored noopener noreferrer">
                        <Button className="font-bold gap-1" title={`Open ${b.name} account`}>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Comparison table */}
        <section className="mb-10">
          <h2 className="text-lg md:text-xl font-extrabold text-foreground mb-3">Comparison table</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left p-3 font-bold">Broker</th>
                  <th className="text-left p-3 font-bold">Min deposit</th>
                  <th className="text-left p-3 font-bold">Spreads from</th>
                  <th className="text-left p-3 font-bold">Platforms</th>
                  <th className="text-left p-3 font-bold">Best for</th>
                </tr>
              </thead>
              <tbody>
                {brokers.map((b) => (
                  <tr key={b.slug} className="border-t border-border">
                    <td className="p-3 font-extrabold text-foreground">
                      <Link to={`/brokers/${b.slug}`} className="hover:text-primary">
                        {b.logoEmoji} {b.name}
                      </Link>
                    </td>
                    <td className="p-3 text-muted-foreground">{b.minDeposit}</td>
                    <td className="p-3 text-muted-foreground">{b.spreadsFrom}</td>
                    <td className="p-3 text-muted-foreground">{b.platforms.slice(0, 2).join(", ")}</td>
                    <td className="p-3 text-muted-foreground">{b.bestFor[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="text-xs text-muted-foreground">
          Some broker links on this page are affiliate links. Botvio may earn a
          commission if you open an account through them — this never changes
          our editorial view. See our{" "}
          <Link to="/affiliate-disclosure" className="underline hover:text-primary">
            affiliate disclosure
          </Link>{" "}
          and{" "}
          <Link to="/editorial-policy" className="underline hover:text-primary">
            editorial policy
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
