import { Link } from "react-router-dom";
import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, ExternalLink } from "lucide-react";
import { brokerReviews } from "@/data/brokerReviews";

/**
 * Public brokers hub. Lists every editorial broker review with a summary card
 * plus a comparison table for scanning at a glance.
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

        {/* Cards */}
        <section aria-labelledby="broker-cards" className="mb-10">
          <h2 id="broker-cards" className="sr-only">Broker reviews</h2>
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