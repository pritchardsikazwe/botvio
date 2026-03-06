import { useLocation, Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { countryTrafficSlugs, AFFILIATE_LINKS } from "@/content/seoTrafficPages";
import { ExternalLink, Globe, GraduationCap, Signal, BarChart3 } from "lucide-react";

const CountryTrafficPage = () => {
  const location = useLocation();
  const slug = location.pathname.replace(/^\//, "");
  
  // Parse: forex-trading-{country}, exness-{country}, gold-trading-{country}
  let countrySlug = "";
  let pageType: "forex" | "exness" | "gold" = "forex";
  
  if (slug.startsWith("forex-trading-")) {
    countrySlug = slug.replace("forex-trading-", "");
    pageType = "forex";
  } else if (slug.startsWith("exness-")) {
    countrySlug = slug.replace("exness-", "");
    pageType = "exness";
  } else if (slug.startsWith("gold-trading-")) {
    countrySlug = slug.replace("gold-trading-", "");
    pageType = "gold";
  }

  const countryData = countryTrafficSlugs.find(c => c.slug === countrySlug);

  if (!countryData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Page not found</h1>
          <Link to="/"><Button>Go Home</Button></Link>
        </main>
      </div>
    );
  }

  const { country, flag } = countryData;

  const titles = {
    forex: `Forex Trading ${country} — Signals, Mentorship & AI Analysis`,
    exness: `Exness ${country} — Open Account, Gold & Forex Signals`,
    gold: `Gold Trading ${country} — XAUUSD Signals & AI Analysis`,
  };

  const h1s = {
    forex: `Forex Trading in ${country} ${flag}`,
    exness: `Exness in ${country} ${flag} — Start Trading Today`,
    gold: `Gold Trading in ${country} ${flag} — XAUUSD Signals`,
  };

  const descriptions = {
    forex: `Trade forex in ${country} with Botvio AI signals. Free forex signals, mentorship, and chart analysis for ${country} traders on Exness and Deriv.`,
    exness: `Open an Exness account in ${country}. Get free gold & forex signals, AI chart analysis, and copy trading for ${country} traders.`,
    gold: `Trade gold (XAUUSD) in ${country} with AI signals. Free gold analysis, scalping strategies, and Exness integration for ${country} traders.`,
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={titles[pageType]}
        description={descriptions[pageType]}
      />
      <Header />

      {/* Affiliate Banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-primary/10 to-warning/10 border-b border-border/30">
        <div className="container mx-auto px-4 py-2.5 flex items-center justify-between flex-wrap gap-3">
          <span className="text-sm font-medium">🚀 Start trading with Exness — Tight spreads & instant withdrawals</span>
          <a href={AFFILIATE_LINKS.exness} target="_blank" rel="noopener noreferrer">
            <Button variant="gold" size="sm"><ExternalLink className="h-3 w-3 mr-1" /> Open Exness Account</Button>
          </a>
        </div>
      </div>

      <main className="container mx-auto px-4 py-10 max-w-3xl">
        <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
          <Globe className="h-3 w-3 mr-1" /> {country} {flag}
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-bold mb-6">{h1s[pageType]}</h1>

        {/* Market Overview */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" /> Market Overview
          </h2>
          <p className="text-muted-foreground mb-4">
            {country} has a growing community of forex and gold traders. With platforms like Exness and Deriv,
            traders in {country} can access global markets including XAUUSD (gold), EUR/USD, GBP/USD, and
            synthetic indices 24/7.
          </p>
          <p className="text-muted-foreground">
            Botvio provides {country} traders with free AI-powered chart analysis, forex signals, gold signals,
            and copy trading capabilities — all from a single platform.
          </p>
        </section>

        {/* Botvio Tools */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Signal className="h-5 w-5 text-primary" /> Botvio Tools for {country} Traders
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: "AI Chart Analysis", desc: "Upload any chart for instant AI technical analysis" },
              { title: "Free Forex Signals", desc: "Daily signals for gold, EUR/USD & more" },
              { title: "Copy Trading", desc: "Follow expert gold & forex traders" },
              { title: "Forex Mentorship", desc: "Free beginner courses with expert guidance" },
            ].map(t => (
              <div key={t.title} className="rounded-xl border border-border bg-card p-4">
                <p className="font-semibold text-foreground">{t.title}</p>
                <p className="text-sm text-muted-foreground">{t.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Strategy */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" /> Getting Started in {country}
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Open a free Exness or Deriv account</li>
            <li>Join Botvio for AI signals and chart analysis</li>
            <li>Start with a demo account to practice</li>
            <li>Follow signal providers or use AI signals</li>
            <li>Join the free forex mentorship program</li>
            <li>Trade with proper risk management</li>
          </ol>
        </section>

        {/* CTAs */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm mb-8">
          <h3 className="text-xl font-semibold mb-2">Start Trading in {country} Today</h3>
          <p className="text-muted-foreground mb-4">Open a broker account and connect to Botvio for free AI signals.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a href={AFFILIATE_LINKS.exness} target="_blank" rel="noopener noreferrer">
              <Button variant="gold" size="lg"><ExternalLink className="h-4 w-4 mr-2" /> Open Exness Account</Button>
            </a>
            <a href={AFFILIATE_LINKS.deriv} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg"><ExternalLink className="h-4 w-4 mr-2" /> Open Deriv Account</Button>
            </a>
            <Link to="/">
              <Button variant="outline" size="lg">Join Botvio Free</Button>
            </Link>
          </div>
        </section>

        {/* Related Pages */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Link to={`/forex-trading-${countrySlug}`}><Badge variant="outline">Forex Trading {country}</Badge></Link>
          <Link to={`/exness-${countrySlug}`}><Badge variant="outline">Exness {country}</Badge></Link>
          <Link to={`/gold-trading-${countrySlug}`}><Badge variant="outline">Gold Trading {country}</Badge></Link>
          <Link to="/signals/gold"><Badge variant="outline">Gold Signals</Badge></Link>
          <Link to="/forex-signals"><Badge variant="outline">Forex Signals</Badge></Link>
        </div>

        <p className="text-xs text-muted-foreground">
          ⚠️ <strong>Risk Disclaimer:</strong> Trading involves significant risk. Capital can be lost. No guaranteed returns. Trade responsibly and only with funds you can afford to lose.
        </p>
      </main>
    </div>
  );
};

export default CountryTrafficPage;
