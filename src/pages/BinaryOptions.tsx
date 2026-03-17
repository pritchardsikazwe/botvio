import { Link } from "react-router-dom";
import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { useSignalBrokers } from "@/hooks/useSignalBrokers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, TrendingUp, Shield, Zap, Star, ArrowRight } from "lucide-react";

const BROKER_DETAILS: Record<string, { emoji: string; color: string; features: string[]; minDeposit: string; payout: string }> = {
  "deriv": { emoji: "🔴", color: "border-destructive/40", features: ["Synthetic Indices", "Boom & Crash", "Volatility Index", "24/7 Trading"], minDeposit: "$5", payout: "Up to 95%" },
  "pocket-option": { emoji: "🔵", color: "border-blue-500/40", features: ["OTC Markets", "1-Min Trades", "Social Trading", "50+ Assets"], minDeposit: "$5", payout: "Up to 92%" },
  "quotex": { emoji: "🟢", color: "border-green-500/40", features: ["Fast Execution", "Copy Trading", "Demo Account", "OTC Pairs"], minDeposit: "$10", payout: "Up to 98%" },
  "iq-option": { emoji: "🟡", color: "border-yellow-500/40", features: ["300+ Assets", "Tournaments", "Education Hub", "Multi-Chart"], minDeposit: "$10", payout: "Up to 95%" },
  "binomo": { emoji: "🟣", color: "border-purple-500/40", features: ["Easy Interface", "Low Entry", "Quick Trades", "Mobile App"], minDeposit: "$10", payout: "Up to 90%" },
};

const BinaryOptions = () => {
  const { data: brokers, isLoading } = useSignalBrokers();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Binary Options Brokers — Compare & Trade"
        description="Compare the best binary options brokers. Find the right platform for synthetic indices, OTC markets, forex, and crypto binary trading."
      />
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Hero */}
        <div className="glass-card p-6 mb-6 text-center">
          <h1 className="text-3xl font-extrabold mb-2">🎯 Binary Options Brokers</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose your preferred broker and start trading binary options with expert signals, AI analysis, and proven strategies.
          </p>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="glass-card text-center p-4">
            <TrendingUp className="h-5 w-5 text-success mx-auto mb-1" />
            <p className="text-xl font-bold">5+</p>
            <p className="text-xs text-muted-foreground">Supported Brokers</p>
          </Card>
          <Card className="glass-card text-center p-4">
            <Zap className="h-5 w-5 text-warning mx-auto mb-1" />
            <p className="text-xl font-bold">24/7</p>
            <p className="text-xs text-muted-foreground">Trading Available</p>
          </Card>
          <Card className="glass-card text-center p-4">
            <Shield className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold">AI</p>
            <p className="text-xs text-muted-foreground">Signal Routing</p>
          </Card>
          <Card className="glass-card text-center p-4">
            <Star className="h-5 w-5 text-warning mx-auto mb-1" />
            <p className="text-xl font-bold">Free</p>
            <p className="text-xs text-muted-foreground">Signals Included</p>
          </Card>
        </div>

        {/* Broker Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="glass-card animate-pulse">
                <CardContent className="p-6"><div className="h-48 bg-muted/30 rounded-lg" /></CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(brokers || []).map((broker) => {
              const details = BROKER_DETAILS[broker.slug] || { emoji: "⚪", color: "border-border", features: [], minDeposit: "—", payout: "—" };
              return (
                <Card key={broker.id} className={`glass-card ${details.color} hover:shadow-lg transition-all`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span className="text-2xl">{details.emoji}</span>
                        {broker.name}
                      </CardTitle>
                      {broker.best_for && (
                        <Badge variant="outline" className="text-[10px]">{broker.best_for}</Badge>
                      )}
                    </div>
                    {broker.description && (
                      <p className="text-sm text-muted-foreground">{broker.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Key Stats */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-muted/30 p-2 text-center">
                        <p className="text-xs text-muted-foreground">Min Deposit</p>
                        <p className="font-bold text-sm">{details.minDeposit}</p>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-2 text-center">
                        <p className="text-xs text-muted-foreground">Payout</p>
                        <p className="font-bold text-sm text-success">{details.payout}</p>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="flex flex-wrap gap-1">
                      {details.features.map((f) => (
                        <Badge key={f} variant="secondary" className="text-[10px]">{f}</Badge>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button className="flex-1" asChild>
                        <a href={broker.affiliate_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                          Trade Now
                        </a>
                      </Button>
                      <Button variant="outline" className="flex-1" asChild>
                        <Link to={`/brokers/${broker.slug}`}>
                          Signals & Strategies <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <Card className="glass-card mt-8 border-primary/30">
          <CardContent className="py-6 text-center">
            <h3 className="font-bold text-lg mb-2">Need Help Choosing?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Our AI signal router automatically picks the best broker for each trade based on asset type and market conditions.
            </p>
            <Button asChild>
              <Link to="/signals">View Live Signals <ArrowRight className="h-4 w-4 ml-2" /></Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default BinaryOptions;
