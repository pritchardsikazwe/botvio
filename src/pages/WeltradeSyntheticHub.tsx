import { useState } from "react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { PageBanner } from "@/components/layout/PageBanner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Activity,
  BarChart3,
  Signal,
  Sparkles,
  Crosshair,
  LayoutDashboard,
  Layers,
  Newspaper,
  ShieldCheck,
  Clock,
  TrendingUp,
} from "lucide-react";
import { WeltradeSignalsEngine } from "@/components/weltrade/WeltradeSignalsEngine";
import { SyntxSignalsSection } from "@/components/weltrade/SyntxSignalsSection";
import { SyntxStrategyHub } from "@/components/weltrade/SyntxStrategyHub";
import { SyntxBotvioStrategy } from "@/components/weltrade/SyntxHauzaStrategy";

const QUICK_STATS = [
  { icon: BarChart3, label: "Live Source", value: "Weltrade MT5 / API Studio" },
  { icon: Clock, label: "Market", value: "24/7 Synthetic" },
  { icon: TrendingUp, label: "Analysis", value: "BOTVIO SyntX Engine" },
  { icon: ShieldCheck, label: "Feed Rule", value: "Real data only" },
];

export default function WeltradeSyntheticHub() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        seoKey="weltrade-syntx"
        title="Weltrade SyntX Trading Hub – Live Charts, Signals & Strategies"
        description="Live Weltrade SyntX charts powered by a connected MT5 API Studio data feed, with BOTVIO signals, family-aware strategies and technical analysis."
      />
      <Header />

      <main className="container mx-auto space-y-6 px-4 py-6">
        <PageBanner
          title="Weltrade SyntX"
          accent="Trading Hub"
          description="A dedicated synthetic-indices workspace using live Weltrade MT5/API Studio prices — with the same chart-first experience used across BOTVIO's specialist trading hubs."
          crumbs={[
            { label: "Home", to: "/" },
            { label: "Trading Hubs", to: "/markets" },
            { label: "Weltrade SyntX" },
          ]}
          action={
            <>
              <Badge className="border-warning/30 bg-warning/20 font-mono text-xs text-warning">WELTRADE SYNTX</Badge>
              <Badge variant="outline" className="border-success/40 text-xs text-success">
                <Activity className="mr-1 h-3 w-3" /> LIVE MT5 FEED
              </Badge>
              <Badge variant="outline" className="border-primary/30 text-xs">
                <Sparkles className="mr-1 h-3 w-3" /> BOTVIO AI
              </Badge>
            </>
          }
          stats={QUICK_STATS.map((s) => ({ icon: s.icon, value: s.value, label: s.label }))}
        />

        <Card className="border border-warning/20 bg-card/70">
          <CardContent className="grid gap-3 p-4 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-warning" />
              <div>
                <p className="text-xs font-bold">Live chart</p>
                <p className="text-[10px] text-muted-foreground">Real Weltrade MT5 quotes + history</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Signal className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs font-bold">Chart signals</p>
                <p className="text-[10px] text-muted-foreground">Entry, SL, TP and confidence from the same candles</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Layers className="h-5 w-5 text-success" />
              <div>
                <p className="text-xs font-bold">SyntX families</p>
                <p className="text-[10px] text-muted-foreground">GainX, PainX, FlipX, SwitchX, BreakX and more</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 border border-border/50 bg-card p-1 md:grid-cols-5">
            <TabsTrigger value="overview" className="gap-1.5 text-xs font-bold data-[state=active]:bg-warning/10 data-[state=active]:text-warning">
              <LayoutDashboard className="h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="signals" className="gap-1.5 text-xs font-bold data-[state=active]:bg-warning/10 data-[state=active]:text-warning">
              <Signal className="h-4 w-4" /> Signals
            </TabsTrigger>
            <TabsTrigger value="strategy" className="gap-1.5 text-xs font-bold data-[state=active]:bg-warning/10 data-[state=active]:text-warning">
              <Crosshair className="h-4 w-4" /> Strategy
            </TabsTrigger>
            <TabsTrigger value="families" className="gap-1.5 text-xs font-bold data-[state=active]:bg-warning/10 data-[state=active]:text-warning">
              <Layers className="h-4 w-4" /> Families
            </TabsTrigger>
            <TabsTrigger value="feed" className="gap-1.5 text-xs font-bold data-[state=active]:bg-warning/10 data-[state=active]:text-warning">
              <Activity className="h-4 w-4" /> Live Feed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <section aria-labelledby="weltrade-live-chart">
              <div className="mb-3">
                <h2 id="weltrade-live-chart" className="flex items-center gap-2 text-lg font-black">
                  <BarChart3 className="h-5 w-5 text-warning" /> Live SyntX Chart & BOTVIO Engine
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Choose the Weltrade synthetic instrument and timeframe. The chart, indicators and signals all use the same live MT5/API Studio candle stream.
                </p>
              </div>
              <WeltradeSignalsEngine />
            </section>

            <Card className="border-primary/20 bg-card">
              <CardContent className="grid gap-4 p-5 md:grid-cols-3">
                <div>
                  <p className="text-sm font-bold text-foreground">Real market data</p>
                  <p className="mt-1 text-xs text-muted-foreground">No synthetic replacement from Deriv is used for this hub.</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Family-aware signals</p>
                  <p className="mt-1 text-xs text-muted-foreground">Signal logic follows the selected Weltrade SyntX family.</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Chart-first workflow</p>
                  <p className="mt-1 text-xs text-muted-foreground">Select an instrument, inspect the chart, then review the matching signal and strategy.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signals" className="mt-6">
            <SyntxSignalsSection />
          </TabsContent>

          <TabsContent value="strategy" className="mt-6 space-y-6">
            <SyntxStrategyHub />
            <SyntxBotvioStrategy />
          </TabsContent>

          <TabsContent value="families" className="mt-6 space-y-4">
            <Card className="border-warning/20 bg-card">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-warning" />
                  <h2 className="text-base font-black">Weltrade SyntX Families</h2>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Use the instrument selector inside the live chart to move between the available Weltrade families. Each family keeps its own strategy profile and signal framework rather than being treated like a Deriv synthetic symbol.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["FX Vol.", "SFX Vol.", "GainX", "PainX", "FlipX", "SwitchX", "BreakX", "TrendX", "Progression"].map((name) => (
                    <Badge key={name} variant="outline" className="border-warning/30 text-xs">
                      {name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
            <WeltradeSignalsEngine />
          </TabsContent>

          <TabsContent value="feed" className="mt-6 space-y-4">
            <Card className="border-success/20 bg-card">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <Activity className="mt-0.5 h-5 w-5 text-success" />
                  <div>
                    <h2 className="text-sm font-black">Weltrade Live Data Feed</h2>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      This workspace uses the connected Weltrade MT5 account through API Studio for quotes and historical candles. It is a data source for analysis and signals, separate from TradeCopy execution.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="outline" className="border-success/40 text-success">LIVE MT5 DATA</Badge>
                      <Badge variant="outline">API STUDIO</Badge>
                      <Badge variant="outline">TRADECOPY INDEPENDENT</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <WeltradeSignalsEngine />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
