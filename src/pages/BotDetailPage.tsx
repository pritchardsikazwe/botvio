import { useParams, Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { botPages, AFFILIATE_LINKS } from "@/content/seoTrafficPages";
import { Bot, ExternalLink, Shield, Zap } from "lucide-react";

const BotDetailPage = () => {
  const { botSlug } = useParams<{ botSlug: string }>();
  const page = botPages[botSlug || ""];

  if (!page) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Bot not found</h1>
          <Link to="/bots"><Button>View All Bots</Button></Link>
        </main>
      </div>
    );
  }

  const brokerLink = page.brokerCTA === "binance" ? AFFILIATE_LINKS.binance : page.brokerCTA === "deriv" ? AFFILIATE_LINKS.deriv : AFFILIATE_LINKS.exness;
  const brokerName = page.brokerCTA === "binance" ? "Binance" : page.brokerCTA === "deriv" ? "Deriv" : "Exness";

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${page.name} — AI ${page.market} Trading Bot`}
        description={page.description}
      />
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-3xl">
        <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
          <Bot className="h-3 w-3 mr-1" /> AI Trading Bot
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">{page.name}</h1>
        <p className="text-muted-foreground mb-2">Market: <strong className="text-foreground">{page.market}</strong></p>
        <p className="text-lg text-muted-foreground mb-8">{page.description}</p>

        <section className="mb-10 rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" /> Strategy
          </h2>
          <p className="text-muted-foreground">{page.strategy}</p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Risk Management
          </h2>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Maximum 1-2% risk per trade</li>
            <li>Daily loss limit protection</li>
            <li>Configurable position sizing</li>
            <li>Automatic stop-loss on every trade</li>
          </ul>
        </section>

        <section className="mb-10 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-xl font-semibold">Start Using {page.name}</h3>
          <p className="mt-2 text-muted-foreground mb-4">
            Open a {brokerName} account and connect to Botvio to activate this bot.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a href={brokerLink} target="_blank" rel="noopener noreferrer">
              <Button variant="gold" size="lg">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open {brokerName} Account
              </Button>
            </a>
            <Link to="/">
              <Button variant="outline" size="lg">Join Botvio Free</Button>
            </Link>
          </div>
        </section>

        <p className="text-xs text-muted-foreground">
          ⚠️ <strong>Risk Disclaimer:</strong> Trading involves significant risk. No guaranteed returns. Trade responsibly.
        </p>
      </main>
    </div>
  );
};

export default BotDetailPage;
