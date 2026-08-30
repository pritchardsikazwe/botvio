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

        {/* Active Gold Signals */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <Signal className="h-5 w-5 text-primary" />
            Active Gold Signals
          </h2>
          <GoldSignalsSection />
        </div>

        {/* Tabbed Sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-5 bg-card border border-border/50 h-12">
            <TabsTrigger value="charts" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-bold text-xs gap-1.5">
              <BarChart3 className="h-4 w-4" /> Charts
            </TabsTrigger>
            <TabsTrigger value="signals" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-bold text-xs gap-1.5">
              <Signal className="h-4 w-4" /> Signals
            </TabsTrigger>
            <TabsTrigger value="strategy" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-bold text-xs gap-1.5">
              <Crosshair className="h-4 w-4" /> Strategy
            </TabsTrigger>
            <TabsTrigger value="tips" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-bold text-xs gap-1.5">
              <Lightbulb className="h-4 w-4" /> Tips
            </TabsTrigger>
            <TabsTrigger value="community" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-bold text-xs gap-1.5">
              <Users className="h-4 w-4" /> Community
            </TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="mt-6">
            <GoldChartSection />
            <div className="mt-6">
              <DemoMt5Card symbol="XAUUSD" source="gold-hub" />
            </div>
          </TabsContent>
          <TabsContent value="signals" className="mt-6">
            <GoldSignalsSection />
          </TabsContent>
          <TabsContent value="strategy" className="mt-6">
            <GoldBotvioStrategy />
          </TabsContent>
          <TabsContent value="tips" className="mt-6">
            <GoldTipsSection />
          </TabsContent>
          <TabsContent value="community" className="mt-6">
            <GoldCommunitySection />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default GoldTradingHub;
