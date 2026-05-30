import { useParams, Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, TrendingUp, Shield, ArrowRight } from "lucide-react";
import { countryData } from "@/content/countryData";
import { DerivAffiliateButton } from "@/components/trading/DerivAffiliateButton";
import { TradeTip } from "@/components/trading/TradeTip";

const blogLinks = [
  { slug: "how-to-start-forex-trading", title: "How to Start Forex Trading" },
  { slug: "how-to-earn-money-online-trading", title: "How to Earn Money Online" },
  { slug: "how-to-make-money-online-deriv", title: "Make Money with Deriv" },
  { slug: "deriv-binary-options-complete-guide", title: "Deriv Binary Options Guide" },
  { slug: "what-is-botvio-ai-trading-bot", title: "What is Botvio AI Bot?" },
];

const CountryPage = () => {
  const { country } = useParams<{ country: string }>();
  
  // Skip file-like paths (e.g. sitemap.xml, robots.txt) — let static files serve
  if (country?.includes(".")) {
    return null;
  }

  const info = countryData[country || ""];

  if (!info) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Country not found</h1>
          <Link to="/"><Button>Go Home</Button></Link>
        </main>
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Botvio AI Trading Bot in ${info.name}`,
    description: info.metaDescription,
    url: `https://botvio.live/${country}`,
    publisher: { "@type": "Organization", name: "Botvio" },
    inLanguage: "en",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://botvio.live/" },
        { "@type": "ListItem", position: 2, name: info.name, item: `https://botvio.live/${country}` },
      ],
    },
  };

  const title = `Botvio AI Trading Bot in ${info.name} — Forex, Gold & Deriv Signals`;
  const ogImage = `/blog/botvio-in-${country}-country-page.png`;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={title}
        description={info.metaDescription}
        ogImage={ogImage}
        ogType="website"
        jsonLd={jsonLd}
      />
      <Header />
      <main className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-10">
            <section className="text-center space-y-4 py-8">
              <Badge variant="outline" className="text-lg px-4 py-1">{info.flag} {info.name}</Badge>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                Botvio AI Trading Bot in {info.name}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{info.heroText}</p>
              <div className="flex gap-3 justify-center">
                <DerivAffiliateButton size="lg" label="Start Trading on Deriv" />
                <Link to="/learn"><Button size="lg" variant="outline">Learn More</Button></Link>
              </div>
            </section>

            <section className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Bot, title: "AI-Powered Trading", desc: `Botvio automates trading on Deriv synthetic indices for traders in ${info.name}.` },
                { icon: TrendingUp, title: "8 Trading Modes", desc: `${info.name} traders use Botvio for Digits, Multipliers, Rise/Fall, Boom/Crash, and more.` },
                { icon: Shield, title: "Secure & Reliable", desc: `Enterprise-grade security with 24/7 automated execution for ${info.name} users.` },
              ].map((f, i) => (
                <Card key={i} className="text-center">
                  <CardContent className="pt-6 space-y-3">
                    <f.icon className="h-10 w-10 mx-auto text-primary" />
                    <h3 className="font-bold text-lg">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Why {info.name} Traders Choose Botvio</h2>
              <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: info.whyContent }} />
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Popular Strategies in {info.name}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {info.popularStrategies.map((s, i) => (
                  <Card key={i}>
                    <CardContent className="pt-5">
                      <h3 className="font-semibold mb-1">{s.name}</h3>
                      <p className="text-sm text-muted-foreground">{s.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Getting Started in {info.name}</h2>
              <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: info.gettingStarted }} />
            </section>

            {info.localPayments && (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold">Payment Methods in {info.name}</h2>
                <p className="text-muted-foreground">{info.localPayments}</p>
              </section>
            )}

            <TradeTip type="disclaimer" tip={`⚠️ Trading involves significant risk. Botvio does not guarantee profits. ${info.name} users should only trade with funds they can afford to lose.`} />

            <section className="bg-gradient-to-r from-primary/10 to-warning/10 rounded-xl p-8 text-center space-y-4">
              <h2 className="text-2xl font-bold">Ready to Start Trading with Botvio?</h2>
              <p className="text-muted-foreground">Join thousands of traders in {info.name} who use Botvio for automated Deriv trading.</p>
              <DerivAffiliateButton size="lg" label="Create Free Deriv Account" />
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-primary/10 to-warning/10 border-primary/30">
              <CardContent className="pt-6 space-y-3 text-center">
                <TrendingUp className="h-10 w-10 mx-auto text-primary" />
                <h3 className="font-bold text-sm">Open Deriv Account</h3>
                <p className="text-xs text-muted-foreground">Start trading with Botvio AI.</p>
                <DerivAffiliateButton size="sm" className="w-full" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 space-y-1">
                <h3 className="font-semibold text-sm mb-3">📚 Recommended Reading</h3>
                {blogLinks.map(b => (
                  <Link key={b.slug} to={`/blog/${b.slug}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors py-1.5">
                    <ArrowRight className="h-3 w-3 shrink-0" />
                    {b.title}
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card className="border-destructive/20">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">
                  <strong>⚠️ Risk Warning:</strong> Binary options trading carries a high level of risk. Never trade with money you can't afford to lose.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CountryPage;
