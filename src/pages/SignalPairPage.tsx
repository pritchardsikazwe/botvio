import { useParams, Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { signalPairPages, AFFILIATE_LINKS } from "@/content/seoTrafficPages";
import { ExternalLink, BarChart3, Signal, TrendingUp } from "lucide-react";

const SignalPairPage = () => {
  const { pair } = useParams<{ pair: string }>();
  const page = signalPairPages[pair || ""];

  if (!page) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Signal pair not found</h1>
          <Link to="/signals"><Button>View All Signals</Button></Link>
        </main>
      </div>
    );
  }

  const brokerLink = page.brokerCTA === "binance" ? AFFILIATE_LINKS.binance : AFFILIATE_LINKS.exness;
  const brokerName = page.brokerCTA === "binance" ? "Binance" : "Exness";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${page.displayName} Trading Signals`,
    description: page.description,
    url: `https://botvio.live/signals/${pair}`,
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${page.displayName} Signals — Free AI Trading Analysis & Live Alerts`}
        description={`Get free ${page.displayName} trading signals powered by AI analysis. Real-time entry prices, stop loss & take profit levels for ${page.pair}. Updated daily with confidence scores and market context.`}
        jsonLd={jsonLd}
      />
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-3xl">
        <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
          {page.category === "forex" ? "Forex" : page.category === "gold" ? "Gold" : page.category === "crypto" ? "Crypto" : "Index"} Signals
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">{page.displayName} Trading Signals</h1>
        <p className="text-lg text-muted-foreground mb-8">{page.description}</p>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Signal className="h-5 w-5 text-primary" />
            AI Signal Analysis for {page.displayName}
          </h2>
          <p className="text-muted-foreground mb-4">
            Botvio's AI engine scans {page.displayName} charts across multiple timeframes to identify
            high-probability trade setups. Each signal includes specific entry price, stop loss, and take profit levels.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {["Entry Price", "Stop Loss", "Take Profit"].map((level) => (
              <div key={level} className="rounded-xl border border-border bg-card p-4 text-center">
                <p className="text-sm text-muted-foreground">{level}</p>
                <p className="text-lg font-bold text-primary">AI Calculated</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            How to Trade {page.displayName}
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Open a free {brokerName} account</li>
            <li>Connect to Botvio for AI signals</li>
            <li>Monitor {page.pair} signal feed</li>
            <li>Execute signals with proper risk management</li>
            <li>Track performance and adjust strategy</li>
          </ol>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Trade {page.displayName} Now
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <a href={brokerLink} target="_blank" rel="noopener noreferrer">
              <Button variant="gold" size="lg">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open {brokerName} Account
              </Button>
            </a>
            <Link to="/chart/XAUUSD">
              <Button variant="outline" size="lg">View Live Chart</Button>
            </Link>
            <Link to="/">
              <Button variant="outline" size="lg">Join Botvio Free</Button>
            </Link>
          </div>
        </section>

        <p className="text-xs text-muted-foreground mt-8">
          ⚠️ <strong>Risk Disclaimer:</strong> Trading involves significant risk. Capital can be lost. No guaranteed returns. Trade responsibly.
        </p>
      </main>
    </div>
  );
};

export default SignalPairPage;
