import { useState } from "react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Signal, Lightbulb, Crosshair, Target, TrendingUp, Clock, ShieldCheck, ExternalLink, Zap, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DerivLiveChart } from "@/components/chart/DerivLiveChart";
import { TradingViewAdvancedChart } from "@/components/chart/TradingViewAdvancedChart";
import { MarketClosedBanner } from "@/components/trading/MarketClosedBanner";
import { BotvioScalpRobot } from "@/components/chart/BotvioScalpRobot";
import { AssetSignalButton } from "./AssetSignalButton";
import { AssetSignalsList } from "./AssetSignalsList";
import { DemoMt5Card } from "@/components/broker/DemoMt5Card";
import { UpgradePrompt } from "@/components/billing/UpgradePrompt";
import { useSubscriptionGate } from "@/hooks/useSubscriptionGate";

export interface AssetTradingHubConfig {
  seoKey?: string;
  seoTitle: string;
  seoDescription: string;
  assetLabel: string;
  displaySymbol: string;
  sessionSymbol: string;
  persistSymbol: string;
  category: string;
  symbolPatterns: string[];
  alwaysOpen?: boolean;
  tagline: string;
  quickStats?: { label: string; value: string }[];
  tips: { title: string; body: string }[];
  strategies: {
    title: string;
    icon: typeof Target;
    tf: string;
    color: string;
    bgColor: string;
    quickSteps: string[];
    note: string;
  }[];
  siblingScalp?: { displaySymbol: string; assetLabel: string };
  /**
   * Chart provider:
   *  - "deriv" (default): live Deriv WebSocket candles + Hauza overlay + Botvio Scalp Robot.
   *  - "tradingview": TradingView Advanced Chart iframe (used for stocks and any symbols Deriv doesn't list).
   */
  chartProvider?: "deriv" | "tradingview";
  /** TradingView symbol (required when chartProvider === "tradingview"), e.g. "NASDAQ:NVDA". */
  tvSymbol?: string;
}

const DEFAULT_QUICK_STATS = [
  { label: "Key Levels", value: "S/R + Round Numbers" },
  { label: "Best Sessions", value: "London & NY Overlap" },
  { label: "Strategy Focus", value: "Botvio AI" },
  { label: "Risk Rule", value: "Max 2% per trade" },
];

const STAT_ICONS = [Target, Clock, TrendingUp, ShieldCheck];
const STAT_COLORS = ["text-primary", "text-warning", "text-success", "text-destructive"];

export function AssetTradingHub({ config }: { config: AssetTradingHubConfig }) {
  const [activeTab, setActiveTab] = useState("charts");
  const [activeStrat, setActiveStrat] = useState<number | null>(0);
  const stats = config.quickStats ?? DEFAULT_QUICK_STATS;
  const { isPaid, isLoading: gateLoading } = useSubscriptionGate();
  const locked = !gateLoading && !isPaid;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        seoKey={config.seoKey}
        title={config.seoTitle}
        description={config.seoDescription}
      />
      <Header />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 md:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-warning/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge className="bg-primary/20 text-primary border-primary/30 font-mono text-xs">{config.displaySymbol}</Badge>
              {config.alwaysOpen && (
                <Badge variant="outline" className="border-success/40 text-success text-xs">24/7 Market</Badge>
              )}
              <Badge variant="outline" className="border-warning/30 text-warning text-xs">Botvio AI Strategies Live</Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              {config.assetLabel} Trading <span className="text-primary">Hub</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-lg">{config.tagline}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((stat, i) => {
            const Icon = STAT_ICONS[i % STAT_ICONS.length];
            const color = STAT_COLORS[i % STAT_COLORS.length];
            return (
              <Card key={i} className="bg-card border-border/50">
                <CardContent className="p-3 flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${color} shrink-0`} />
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">{stat.label}</p>
                    <p className="text-xs font-bold text-foreground">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {locked && (
          <UpgradePrompt
            feature={`the ${config.assetLabel} Trading Hub`}
            requiredPlan="Basic"
          />
        )}

        {!locked && (
        <>
        <div>
          <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <Signal className="h-5 w-5 text-primary" />
            Active {config.assetLabel} Signals
          </h2>
          <AssetSignalsList symbolPatterns={config.symbolPatterns} assetLabel={config.assetLabel} />
        </div>

        <DemoMt5Card symbol={config.displaySymbol} source={`hub:${config.assetLabel}`} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 bg-card border border-border/50 h-12">
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
          </TabsList>

          <TabsContent value="charts" className="mt-6 space-y-4">
            <MarketClosedBanner symbol={config.sessionSymbol} />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-1">
                <AssetSignalButton
                  displaySymbol={config.displaySymbol}
                  assetLabel={config.assetLabel.toUpperCase()}
                  sessionSymbol={config.sessionSymbol}
                  persistSymbol={config.persistSymbol}
                  category={config.category}
                  alwaysOpen={config.alwaysOpen}
                />
              </div>
              <div className="lg:col-span-3">
                {config.chartProvider === "tradingview" && config.tvSymbol ? (
                  <TradingViewAdvancedChart
                    symbol={config.tvSymbol}
                    label={`${config.assetLabel} · TradingView`}
                    height={420}
                    interval="60"
                    withHauza
                  />
                ) : (
                  <DerivLiveChart
                    displaySymbol={config.displaySymbol}
                    height={420}
                    defaultGranularity={300}
                    showHauza
                  />
                )}
              </div>
            </div>

            {config.chartProvider !== "tradingview" && (
              <BotvioScalpRobot displaySymbol={config.displaySymbol} assetLabel={config.assetLabel} />
            )}

            {config.siblingScalp && (
              <BotvioScalpRobot
                displaySymbol={config.siblingScalp.displaySymbol}
                assetLabel={config.siblingScalp.assetLabel}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-card border-border/50">
                <CardContent className="p-4 flex items-start gap-3">
                  <BarChart3 className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-foreground">RSI (14)</p>
                    <p className="text-xs text-muted-foreground">Overbought (&gt;70) or oversold (&lt;30) zones for timing entries.</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border/50">
                <CardContent className="p-4 flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-success shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-foreground">Botvio S/R Overlay</p>
                    <p className="text-xs text-muted-foreground">Pivot-based support & resistance — auto-drawn on the chart above.</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border/50">
                <CardContent className="p-4 flex items-start gap-3">
                  <Layers className="h-5 w-5 text-warning shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-foreground">Breakout Detection</p>
                    <p className="text-xs text-muted-foreground">Live BO markers when price closes beyond a pivot — confirm with volume.</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
              <CardContent className="p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-extrabold text-foreground">Ready to trade {config.assetLabel}?</h3>
                  <p className="text-xs text-muted-foreground">Open your broker account and execute when your setup is confirmed.</p>
                </div>
                <div className="flex gap-2">
                  <a href="https://one.exness-track.com/a/ts1kvs1k" target="_blank" rel="noopener noreferrer">
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs">
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Trade on Exness
                    </Button>
                  </a>
                  <a href="https://gowt.net/ib67505" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="font-bold text-xs">
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Weltrade
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signals" className="mt-6">
            <AssetSignalsList symbolPatterns={config.symbolPatterns} assetLabel={config.assetLabel} />
          </TabsContent>

          <TabsContent value="strategy" className="mt-6">
            <div>
              <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2 mb-3">
                <Crosshair className="h-4 w-4 text-primary" />
                Botvio AI {config.assetLabel} Strategies — Quick Reference
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">Use with chart above</Badge>
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                {config.strategies.map((s, i) => {
                  const Icon = s.icon;
                  const isActive = activeStrat === i;
                  return (
                    <button
                      key={i}
                      onClick={() => setActiveStrat(isActive ? null : i)}
                      className={`rounded-xl border p-3 text-left transition-all ${
                        isActive
                          ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                          : "border-border/50 bg-card hover:border-primary/30"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg ${s.bgColor} flex items-center justify-center mb-2`}>
                        <Icon className={`h-4 w-4 ${s.color}`} />
                      </div>
                      <p className="text-xs font-bold text-foreground">{s.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">📊 {s.tf}</p>
                    </button>
                  );
                })}
              </div>

              {activeStrat !== null && config.strategies[activeStrat] && (
                <Card className="bg-card border-primary/20 animate-in slide-in-from-top-2 duration-200">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const Icon = config.strategies[activeStrat].icon;
                          return <Icon className={`h-4 w-4 ${config.strategies[activeStrat].color}`} />;
                        })()}
                        <span className="text-sm font-bold text-foreground">{config.strategies[activeStrat].title}</span>
                        <Badge variant="outline" className="text-[10px]">{config.strategies[activeStrat].tf}</Badge>
                      </div>
                      <button onClick={() => setActiveStrat(null)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
                    </div>
                    <ol className="space-y-2">
                      {config.strategies[activeStrat].quickSteps.map((step, si) => (
                        <li key={si} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                          <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-primary">{si + 1}</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                    <div className="flex items-center gap-2 pt-1 border-t border-border/30">
                      <ShieldCheck className="h-3.5 w-3.5 text-warning" />
                      <span className="text-[10px] text-warning font-semibold">{config.strategies[activeStrat].note}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="tips" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {config.tips.map((tip, i) => (
                <Card key={i} className="bg-card border-border/50">
                  <CardContent className="p-4 flex items-start gap-3">
                    <Zap className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">{tip.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{tip.body}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        </>
        )}
      </main>
    </div>
  );
}
