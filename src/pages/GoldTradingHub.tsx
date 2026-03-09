import { useState } from "react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoldChartSection } from "@/components/gold/GoldChartSection";
import { GoldSignalsSection } from "@/components/gold/GoldSignalsSection";
import { GoldTipsSection } from "@/components/gold/GoldTipsSection";
import { GoldCommunitySection } from "@/components/gold/GoldCommunitySection";
import { GoldSentimentGauge } from "@/components/gold/GoldSentimentGauge";
import { GoldPriceHeader } from "@/components/gold/GoldPriceHeader";
import { GoldHauzaStrategy } from "@/components/gold/GoldHauzaStrategy";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Signal, Lightbulb, Users, Crosshair, Target, TrendingUp, Clock, ShieldCheck } from "lucide-react";

const QUICK_STATS = [
  { icon: Target, label: "Key Levels", value: "S/R + Round Numbers", color: "text-primary" },
  { icon: Clock, label: "Best Sessions", value: "London & NY Overlap", color: "text-warning" },
  { icon: TrendingUp, label: "Strategy Focus", value: "Hauza Sniper", color: "text-success" },
  { icon: ShieldCheck, label: "Risk Rule", value: "Max 2% per trade", color: "text-destructive" },
];

const GoldTradingHub = () => {
  const [activeTab, setActiveTab] = useState("charts");

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Gold Trading Hub – Live XAUUSD Charts, Signals & Strategies"
        description="Your complete gold trading terminal. Real-time XAUUSD charts with Hauza Sniper strategies, AI-powered signals, expert analysis, risk management tips, and a community of gold traders."
      />
      <Header />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 md:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-warning/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-primary/20 text-primary border-primary/30 font-mono text-xs">XAUUSD</Badge>
                <Badge variant="outline" className="border-success/40 text-success text-xs">Market Open</Badge>
                <Badge variant="outline" className="border-warning/30 text-warning text-xs">Hauza Strategies Live</Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
                Gold Trading <span className="text-primary">Hub</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-lg">
                Real-time charts with built-in Hauza Sniper strategies, AI signals, expert tips & community — everything you need to trade gold profitably.
              </p>
            </div>
            <GoldPriceHeader />
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {QUICK_STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Card key={i} className="bg-card border-border/50">
                <CardContent className="p-3 flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${stat.color} shrink-0`} />
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">{stat.label}</p>
                    <p className="text-xs font-bold text-foreground">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Sentiment Gauge Row */}
        <GoldSentimentGauge />

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
          </TabsContent>
          <TabsContent value="signals" className="mt-6">
            <GoldSignalsSection />
          </TabsContent>
          <TabsContent value="strategy" className="mt-6">
            <GoldHauzaStrategy />
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
