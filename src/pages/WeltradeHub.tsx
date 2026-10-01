import { useState } from "react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, Signal, Users, Sparkles, ExternalLink, Crosshair } from "lucide-react";
import { WeltradeSignalsEngine } from "@/components/weltrade/WeltradeSignalsEngine";
import { SyntxSignalsSection } from "@/components/weltrade/SyntxSignalsSection";
import { SyntxCommunitySection } from "@/components/weltrade/SyntxCommunitySection";
import { SyntxBotvioStrategy } from "@/components/weltrade/SyntxHauzaStrategy";
import { SyntxStrategyHub } from "@/components/weltrade/SyntxStrategyHub";
import { WeltradeAccountGuide } from "@/components/weltrade/WeltradeAccountGuide";

const WELTRADE_LINK = "https://gowt.net/ib67505";

const WeltradeHub = () => {
  const [activeTab, setActiveTab] = useState("charts");

  return (
    <div className="min-h-screen bg-background">
      <SEOHead seoKey="weltrade"
        title="Weltrade Hub – GainX, PainX, FlipX, SwitchX & FX Charts & Signals"
        description="Weltrade analysis hub with family-aware SyntX strategies, live MT5 bridge charts, signals, account comparisons and educational risk guidance."
        ogImage="https://botvio.live/icon-512.png"
      />
      <Header />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Hero — compact, matches SyntheticHub */}
        <div className="relative overflow-hidden rounded-2xl border border-warning/20 bg-gradient-to-br from-warning/10 via-card to-card p-6 md:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-warning/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge className="bg-warning/20 text-warning border-warning/30 font-mono text-xs">SYNTX</Badge>
                <Badge variant="outline" className="border-success/40 text-success text-xs">24/5 Market</Badge>
                <Badge variant="outline" className="border-warning/30 text-warning text-xs">
                  <Sparkles className="h-3 w-3 mr-1" /> Live Bridge Feed
                </Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
                Weltrade <span className="text-warning">Hub</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                 Family-aware SyntX charts and signals for FX Vol., SFX Vol., PainX, GainX, FlipX, SwitchX, BreakX, TrendX and progression indices.
              </p>
            </div>
            <a href={WELTRADE_LINK} target="_blank" rel="noopener noreferrer">
              <Button variant="gold" className="font-bold">
                <ExternalLink className="h-4 w-4 mr-2" /> Open Weltrade
              </Button>
            </a>
          </div>
        </div>

        <WeltradeAccountGuide />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 bg-card border border-border/50 h-12">
            <TabsTrigger value="charts" className="data-[state=active]:bg-warning/10 data-[state=active]:text-warning font-bold text-xs gap-1.5">
              <BarChart3 className="h-4 w-4" /> Charts
            </TabsTrigger>
            <TabsTrigger value="signals" className="data-[state=active]:bg-warning/10 data-[state=active]:text-warning font-bold text-xs gap-1.5">
              <Signal className="h-4 w-4" /> Signals
            </TabsTrigger>
            <TabsTrigger value="strategy" className="data-[state=active]:bg-warning/10 data-[state=active]:text-warning font-bold text-xs gap-1.5">
              <Crosshair className="h-4 w-4" /> Strategy
            </TabsTrigger>
            <TabsTrigger value="community" className="data-[state=active]:bg-warning/10 data-[state=active]:text-warning font-bold text-xs gap-1.5">
              <Users className="h-4 w-4" /> Community
            </TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="mt-6">
            <WeltradeSignalsEngine />
          </TabsContent>
          <TabsContent value="signals" className="mt-6">
            <SyntxSignalsSection />
          </TabsContent>
          <TabsContent value="strategy" className="mt-6">
            <div className="space-y-6">
              <SyntxStrategyHub />
              <SyntxBotvioStrategy />
            </div>
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
