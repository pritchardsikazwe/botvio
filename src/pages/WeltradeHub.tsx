import { useState } from "react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, Signal, Lightbulb, Users, Crosshair, ExternalLink } from "lucide-react";
import { SyntxChartSection } from "@/components/weltrade/SyntxChartSection";
import { SyntxSignalsSection } from "@/components/weltrade/SyntxSignalsSection";
import { SyntxHauzaStrategy } from "@/components/weltrade/SyntxHauzaStrategy";
import { SyntxTipsSection } from "@/components/weltrade/SyntxTipsSection";
import { SyntxCommunitySection } from "@/components/weltrade/SyntxCommunitySection";

const WELTRADE_LINK = "https://gowt.net/ib67505";

const WeltradeHub = () => {
  const [activeTab, setActiveTab] = useState("charts");

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Weltrade Hub – PainX, GainX & TrendX Charts & Signals"
        description="Your complete SyntX trading terminal. Live PainX, GainX, TrendX charts, Hauza Sniper strategies, signals, tips & community for Weltrade synthetic indices."
        ogImage="https://botvio.live/icon-512.png"
      />
      <Header />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl border border-warning/20 bg-gradient-to-br from-warning/10 via-card to-card p-6 md:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-warning/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-warning/20 text-warning border-warning/30 font-mono text-xs">SyntX</Badge>
                <Badge variant="outline" className="border-success/40 text-success text-xs">24/5 Market</Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
                Weltrade <span className="text-warning">Hub</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-lg">
                PainX, GainX, TrendX & Volatility indices — charts, Hauza strategies, signals & community all in one place.
              </p>
            </div>
            <a href={WELTRADE_LINK} target="_blank" rel="noopener noreferrer">
              <Button variant="gold" className="font-bold">
                <ExternalLink className="h-4 w-4 mr-2" /> Open Weltrade
              </Button>
            </a>
          </div>
        </div>

        {/* Strategy & Tips — Always visible outside tabs */}
        <section className="space-y-6">
          <SyntxHauzaStrategy />
          <SyntxTipsSection />
        </section>

        {/* Tabs for Charts, Signals, Community */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-card border border-border/50 h-12">
            <TabsTrigger value="charts" className="data-[state=active]:bg-warning/10 data-[state=active]:text-warning font-bold text-xs gap-1.5">
              <BarChart3 className="h-4 w-4" /> Charts
            </TabsTrigger>
            <TabsTrigger value="signals" className="data-[state=active]:bg-warning/10 data-[state=active]:text-warning font-bold text-xs gap-1.5">
              <Signal className="h-4 w-4" /> Signals
            </TabsTrigger>
            <TabsTrigger value="community" className="data-[state=active]:bg-warning/10 data-[state=active]:text-warning font-bold text-xs gap-1.5">
              <Users className="h-4 w-4" /> Community
            </TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="mt-6">
            <SyntxChartSection />
          </TabsContent>
          <TabsContent value="signals" className="mt-6">
            <SyntxSignalsSection />
          </TabsContent>
          <TabsContent value="community" className="mt-6">
            <SyntxCommunitySection />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default WeltradeHub;
