import { useState } from "react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { PageBanner } from "@/components/layout/PageBanner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoldChartSection } from "@/components/gold/GoldChartSection";
import { DemoMt5Card } from "@/components/broker/DemoMt5Card";
import { GoldSignalsSection } from "@/components/gold/GoldSignalsSection";
import { GoldTipsSection } from "@/components/gold/GoldTipsSection";
import { GoldCommunitySection } from "@/components/gold/GoldCommunitySection";
import { GoldSentimentGauge } from "@/components/gold/GoldSentimentGauge";
import { GoldPriceHeader } from "@/components/gold/GoldPriceHeader";
import { GoldBotvioStrategy } from "@/components/gold/GoldHauzaStrategy";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Signal, Lightbulb, Users, Crosshair, Target, TrendingUp, Clock, ShieldCheck } from "lucide-react";

const QUICK_STATS = [
  { icon: Target, label: "Key Levels", value: "S/R + Round Numbers", color: "text-primary" },
  { icon: Clock, label: "Best Sessions", value: "London & NY Overlap", color: "text-warning" },
  { icon: TrendingUp, label: "Strategy Focus", value: "Botvio AI", color: "text-success" },
  { icon: ShieldCheck, label: "Risk Rule", value: "Max 2% per trade", color: "text-destructive" },
];

const GoldTradingHub = () => {
  const [activeTab, setActiveTab] = useState("charts");

  return (
    <div className="min-h-screen bg-background">
      <SEOHead seoKey="gold"
        title="Gold Trading Hub – Live XAUUSD Charts, Signals & Strategies"
        description="Your complete gold trading terminal. Real-time XAUUSD charts with Botvio AI strategies, AI-powered signals, expert analysis, risk management tips, and a community of gold traders."
      />
      <Header />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <PageBanner
          title="Gold Trading"
          accent="Hub"
          description="Real-time XAU/USD charts with built-in Botvio AI strategies, AI signals, expert tips & community — everything you need to trade gold with a plan."
          crumbs={[{ label: "Home", to: "/" }, { label: "Trading Hubs", to: "/markets" }, { label: "Gold (XAU/USD)" }]}
          action={
            <>
              <Badge className="border-primary/30 bg-primary/20 font-mono text-xs text-primary">XAUUSD</Badge>
              <Badge variant="outline" className="border-success/40 text-xs text-success">Market Open</Badge>
              <Badge variant="outline" className="border-warning/30 text-xs text-warning">Botvio AI Strategies Live</Badge>
            </>
          }
          aside={<GoldPriceHeader />}
          stats={QUICK_STATS.map((s) => ({ icon: s.icon, value: s.value, label: s.label }))}
        />

        {/* Sentiment Gauge Row */}
        <GoldSentimentGauge />

        {/* Chart-dominant workspace */}
        <GoldChartSection />

        {/* Tabbed Sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-3 gap-1 border border-border/50 bg-card p-1 md:grid-cols-6">
            <TabsTrigger value="overview" className="gap-1.5 text-xs font-bold data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <LayoutDashboard className="h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-1.5 text-xs font-bold data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Sparkles className="h-4 w-4" /> AI Analysis
            </TabsTrigger>
            <TabsTrigger value="signals" className="gap-1.5 text-xs font-bold data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Signal className="h-4 w-4" /> Signals
            </TabsTrigger>
            <TabsTrigger value="strategy" className="gap-1.5 text-xs font-bold data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Crosshair className="h-4 w-4" /> Strategy
            </TabsTrigger>
            <TabsTrigger value="levels" className="gap-1.5 text-xs font-bold data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Layers className="h-4 w-4" /> S&amp;R
            </TabsTrigger>
            <TabsTrigger value="news" className="gap-1.5 text-xs font-bold data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Newspaper className="h-4 w-4" /> News
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-foreground">
                <Signal className="h-5 w-5 text-primary" /> Active Gold Signals
              </h2>
              <GoldSignalsSection />
            </div>
            <SessionsPanel />
            <DemoMt5Card symbol="XAUUSD" source="gold-hub" />
            <GoldCommunitySection />
          </TabsContent>
          <TabsContent value="ai" className="mt-6 space-y-4">
            <GoldBotvioStrategy />
            <Card className="border-primary/20 bg-card">
              <CardContent className="flex flex-col items-start justify-between gap-3 p-5 md:flex-row md:items-center">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                    <Sparkles className="h-4 w-4 text-primary" /> Upload your own gold chart
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Botvio AI returns trend, structure, support/resistance, entry zone and risk guidance.
                  </p>
                </div>
                <Link to="/chart/XAUUSD">
                  <Button className="text-xs font-bold">Open AI Chart Analysis</Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="signals" className="mt-6">
            <GoldSignalsSection />
          </TabsContent>
          <TabsContent value="strategy" className="mt-6">
            <GoldBotvioStrategy />
          </TabsContent>
          <TabsContent value="levels" className="mt-6 space-y-4">
            <GoldSentimentGauge />
            <Card className="border-border/50 bg-card">
              <CardContent className="space-y-2 p-5 text-xs leading-relaxed text-muted-foreground">
                <p className="text-sm font-bold text-foreground">How to read the XAU/USD levels</p>
                <p>
                  Gold respects round numbers ($10 and $50 increments) and prior session highs/lows. Treat a level as
                  valid while price rejects it with wicks; treat it as broken only after a candle body closes beyond it.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="news" className="mt-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <NewsEventsCard metrics={null} />
              <Card className="border-border/50 bg-card">
                <CardContent className="space-y-3 p-5">
                  <p className="text-sm font-bold text-foreground">News discipline for gold</p>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li>• Gold reacts hardest to US CPI, NFP and FOMC — flatten 15 minutes before.</li>
                    <li>• Wait for spreads to normalise before re-entering.</li>
                    <li>• Never widen a stop because news moved against the position.</li>
                  </ul>
                  <Link to="/news-calendar">
                    <Button variant="outline" className="text-xs font-bold">Full economic calendar</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
            <GoldTipsSection />
          </TabsContent>
        </Tabs>

      </main>
    </div>
  );
};

export default GoldTradingHub;
