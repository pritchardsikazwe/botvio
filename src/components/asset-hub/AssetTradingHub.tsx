import { useState } from "react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { PageBanner } from "@/components/layout/PageBanner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart3, Signal, Crosshair, Target, TrendingUp, Clock, ShieldCheck,
  ExternalLink, Zap, Layers, Lock, Sparkles, Newspaper, LayoutDashboard, ScanSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DerivLiveChart } from "@/components/chart/DerivLiveChart";
import { TradingViewAdvancedChart } from "@/components/chart/TradingViewAdvancedChart";
import { MarketClosedBanner } from "@/components/trading/MarketClosedBanner";
import { BotvioScalpRobot } from "@/components/chart/BotvioScalpRobot";
import { SessionsPanel } from "@/components/chart/SessionsPanel";
import { NewsEventsCard } from "@/components/chart/NewsEventsCard";
import { AssetSignalButton } from "./AssetSignalButton";
import { AssetSignalsList } from "./AssetSignalsList";
import { DemoMt5Card } from "@/components/broker/DemoMt5Card";
import { UpgradePrompt } from "@/components/billing/UpgradePrompt";
import { useSubscriptionGate } from "@/hooks/useSubscriptionGate";
import { useAuth } from "@/contexts/AuthContext";
import { isPublicPreviewActive } from "@/config/access";
import { TradingHubSignalHorizons } from "@/components/signals/TradingHubSignalHorizons";

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
  /** When true, bypass the VIP/paid lock for this hub (free public access). */
  publicAccess?: boolean;
  /**
   * Optional accent color (CSS string) applied to the Deriv chart Hauza overlay
   * (trendlines, breakouts, S/R, HH/HL channel). Used by index hubs.
   */
  accentColor?: string;
  /**
   * Enable the Hauza pivot S/R + breakout engine for the signal button
   * (used by index hubs: US30, NAS100, GER40).
   */
  useHauzaBreakouts?: boolean;
}

const DEFAULT_QUICK_STATS = [
  { label: "Key Levels", value: "S/R + Round Numbers" },
  { label: "Best Sessions", value: "London & NY Overlap" },
  { label: "Strategy Focus", value: "Botvio AI" },
  { label: "Risk Rule", value: "Max 2% per trade" },
];

const STAT_ICONS = [Target, Clock, TrendingUp, ShieldCheck];

export function AssetTradingHub({ config }: { config: AssetTradingHubConfig }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [activeStrat, setActiveStrat] = useState<number | null>(0);
  const stats = config.quickStats ?? DEFAULT_QUICK_STATS;
  const { isPaid, isLoading: gateLoading } = useSubscriptionGate();
  const { isAdmin, isSuperAdmin } = useAuth();
  const locked =
    !isPublicPreviewActive() &&
    !config.publicAccess && !gateLoading && !isPaid && !isAdmin && !isSuperAdmin;

  const chart =
    config.chartProvider === "tradingview" && config.tvSymbol ? (
      <TradingViewAdvancedChart
        symbol={config.tvSymbol}
        label={`${config.assetLabel} · TradingView`}
        height={520}
        interval="60"
        withHauza
      />
    ) : (
      <DerivLiveChart
        displaySymbol={config.displaySymbol}
        height={520}
        defaultGranularity={300}
        showHauza
        accentColor={config.accentColor}
      />
    );

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        seoKey={config.seoKey}
        title={config.seoTitle}
        description={config.seoDescription}
      />
      <Header />

      <main className="container mx-auto space-y-6 px-4 py-6">
        <PageBanner
          title={`${config.assetLabel} Trading`}
          accent="Hub"
          description={config.tagline}
          crumbs={[
            { label: "Home", to: "/" },
            { label: "Trading Hubs", to: "/markets" },
            { label: config.assetLabel },
          ]}
          action={
            <>
              <Badge className="border-primary/30 bg-primary/20 font-mono text-xs text-primary">
                {config.displaySymbol}
              </Badge>
              {config.alwaysOpen && (
                <Badge variant="outline" className="border-success/40 text-xs text-success">24/7 Market</Badge>
              )}
              <Badge variant="outline" className="border-warning/30 text-xs text-warning">
                Botvio AI Strategies Live
              </Badge>
            </>
          }
          stats={stats.map((s, i) => ({
            icon: STAT_ICONS[i % STAT_ICONS.length],
            value: s.value,
            label: s.label,
          }))}
        />

        <MarketClosedBanner symbol={config.sessionSymbol} />

        <TradingHubSignalHorizons symbol={config.persistSymbol || config.displaySymbol} />

        {/* ── Chart-dominant workspace ─────────────────────────────── */}
        {locked ? (
          <UpgradePrompt
            feature={`the ${config.assetLabel} live chart & Botvio scalp signals`}
            requiredPlan="Basic"
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <div className="min-w-0 lg:col-span-3">{chart}</div>
            <div className="space-y-4 lg:col-span-1">
              <AssetSignalButton
                displaySymbol={config.displaySymbol}
                assetLabel={config.assetLabel.toUpperCase()}
                sessionSymbol={config.sessionSymbol}
                persistSymbol={config.persistSymbol}
                category={config.category}
                alwaysOpen={config.alwaysOpen}
                useHauzaBreakouts={config.useHauzaBreakouts}
              />
              <Card className="border-border/50 bg-card">
                <CardContent className="space-y-2 p-4">
                  <p className="text-xs font-bold text-foreground">Quick actions</p>
                  <Link to={`/chart/${config.persistSymbol}`} className="block">
                    <Button variant="outline" className="w-full justify-start text-xs font-bold">
                      <ScanSearch className="mr-1.5 h-3.5 w-3.5" /> AI Chart Analysis
                    </Button>
                  </Link>
                  <Link to="/signals" className="block">
                    <Button variant="outline" className="w-full justify-start text-xs font-bold">
                      <Signal className="mr-1.5 h-3.5 w-3.5" /> All Live Signals
                    </Button>
                  </Link>
                  <Link to="/news-calendar" className="block">
                    <Button variant="outline" className="w-full justify-start text-xs font-bold">
                      <Newspaper className="mr-1.5 h-3.5 w-3.5" /> Economic Calendar
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ── Workspace tabs ───────────────────────────────────────── */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            if (locked && v !== "overview") return;
            setActiveTab(v);
          }}
          className="w-full"
        >
          <TabsList className="grid h-auto w-full grid-cols-3 gap-1 border border-border/50 bg-card p-1 md:grid-cols-6">
            <TabsTrigger value="overview" className="gap-1.5 text-xs font-bold data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <LayoutDashboard className="h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="ai" disabled={locked} className="gap-1.5 text-xs font-bold data-[state=active]:bg-primary/10 data-[state=active]:text-primary disabled:opacity-60">
              {locked ? <Lock className="h-3.5 w-3.5" /> : <Sparkles className="h-4 w-4" />} AI Analysis
            </TabsTrigger>
            <TabsTrigger value="signals" disabled={locked} className="gap-1.5 text-xs font-bold data-[state=active]:bg-primary/10 data-[state=active]:text-primary disabled:opacity-60">
              {locked ? <Lock className="h-3.5 w-3.5" /> : <Signal className="h-4 w-4" />} Signals
            </TabsTrigger>
            <TabsTrigger value="strategy" disabled={locked} className="gap-1.5 text-xs font-bold data-[state=active]:bg-primary/10 data-[state=active]:text-primary disabled:opacity-60">
              {locked ? <Lock className="h-3.5 w-3.5" /> : <Crosshair className="h-4 w-4" />} Strategy
            </TabsTrigger>
            <TabsTrigger value="levels" disabled={locked} className="gap-1.5 text-xs font-bold data-[state=active]:bg-primary/10 data-[state=active]:text-primary disabled:opacity-60">
              {locked ? <Lock className="h-3.5 w-3.5" /> : <Layers className="h-4 w-4" />} S&amp;R
            </TabsTrigger>
            <TabsTrigger value="news" disabled={locked} className="gap-1.5 text-xs font-bold data-[state=active]:bg-primary/10 data-[state=active]:text-primary disabled:opacity-60">
              {locked ? <Lock className="h-3.5 w-3.5" /> : <Newspaper className="h-4 w-4" />} News
            </TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="mt-6 space-y-4">
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-foreground">
                <Signal className="h-5 w-5 text-primary" />
                Active {config.assetLabel} Signals
              </h2>
              {locked ? (
                <UpgradePrompt feature={`${config.assetLabel} live signals`} requiredPlan="Basic" />
              ) : (
                <AssetSignalsList symbolPatterns={config.symbolPatterns} assetLabel={config.assetLabel} />
              )}
            </div>

            <SessionsPanel />

            <DemoMt5Card symbol={config.displaySymbol} source={`hub:${config.assetLabel}`} />

            <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
              <CardContent className="flex flex-col items-center justify-between gap-4 p-5 md:flex-row">
                <div>
                  <h3 className="text-sm font-extrabold text-foreground">Ready to trade {config.assetLabel}?</h3>
                  <p className="text-xs text-muted-foreground">Open your broker account and execute when your setup is confirmed.</p>
                </div>
                <div className="flex gap-2">
                  <a href="https://one.exness-track.com/a/ts1kvs1k" target="_blank" rel="noopener noreferrer">
                    <Button className="bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/90">
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Trade on Exness
                    </Button>
                  </a>
                  <a href="https://gowt.net/ib67505" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="text-xs font-bold">
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Weltrade
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Analysis */}
          <TabsContent value="ai" className="mt-6 space-y-4">
            {config.chartProvider !== "tradingview" && (
              <BotvioScalpRobot displaySymbol={config.displaySymbol} assetLabel={config.assetLabel} />
            )}

            {config.siblingScalp && (
              <BotvioScalpRobot
                displaySymbol={config.siblingScalp.displaySymbol}
                assetLabel={config.siblingScalp.assetLabel}
              />
            )}

            <Card className="border-primary/20 bg-card">
              <CardContent className="flex flex-col items-start justify-between gap-3 p-5 md:flex-row md:items-center">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                    <Sparkles className="h-4 w-4 text-primary" /> Upload your own {config.assetLabel} chart
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Botvio AI returns trend, structure, support/resistance, entry zone and risk guidance.
                  </p>
                </div>
                <Link to={`/chart/${config.persistSymbol}`}>
                  <Button className="text-xs font-bold">
                    <ScanSearch className="mr-1.5 h-3.5 w-3.5" /> Open AI Chart Analysis
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Signals */}
          <TabsContent value="signals" className="mt-6">
            <AssetSignalsList symbolPatterns={config.symbolPatterns} assetLabel={config.assetLabel} />
          </TabsContent>

          {/* Strategy */}
          <TabsContent value="strategy" className="mt-6">
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-foreground">
                <Crosshair className="h-4 w-4 text-primary" />
                Botvio AI {config.assetLabel} Strategies — Quick Reference
                <Badge variant="outline" className="border-primary/30 text-[10px] text-primary">Use with chart above</Badge>
              </h3>

              <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
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
                      <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${s.bgColor}`}>
                        <Icon className={`h-4 w-4 ${s.color}`} />
                      </div>
                      <p className="text-xs font-bold text-foreground">{s.title}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">📊 {s.tf}</p>
                    </button>
                  );
                })}
              </div>

              {activeStrat !== null && config.strategies[activeStrat] && (
                <Card className="animate-in slide-in-from-top-2 border-primary/20 bg-card duration-200">
                  <CardContent className="space-y-3 p-4">
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
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{si + 1}</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                    <div className="flex items-center gap-2 border-t border-border/30 pt-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-warning" />
                      <span className="text-[10px] font-semibold text-warning">{config.strategies[activeStrat].note}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Support & Resistance */}
          <TabsContent value="levels" className="mt-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card className="border-border/50 bg-card">
                <CardContent className="flex items-start gap-3 p-4">
                  <TrendingUp className="h-5 w-5 shrink-0 text-success" />
                  <div>
                    <p className="text-xs font-bold text-foreground">Botvio S/R Overlay</p>
                    <p className="text-xs text-muted-foreground">Pivot-based support &amp; resistance — auto-drawn on the chart above.</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card">
                <CardContent className="flex items-start gap-3 p-4">
                  <Layers className="h-5 w-5 shrink-0 text-warning" />
                  <div>
                    <p className="text-xs font-bold text-foreground">Breakout Detection</p>
                    <p className="text-xs text-muted-foreground">Live BO markers when price closes beyond a pivot — confirm with volume.</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card">
                <CardContent className="flex items-start gap-3 p-4">
                  <BarChart3 className="h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs font-bold text-foreground">RSI (14)</p>
                    <p className="text-xs text-muted-foreground">Overbought (&gt;70) or oversold (&lt;30) zones for timing entries.</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/50 bg-card">
              <CardContent className="space-y-2 p-5 text-xs leading-relaxed text-muted-foreground">
                <p className="text-sm font-bold text-foreground">How to read the {config.assetLabel} levels</p>
                <p>
                  Levels are derived from recent swing pivots on the active timeframe. Treat a level as valid while
                  price respects it with wick rejections; treat it as broken only after a candle body closes beyond it.
                </p>
                <p>
                  Round numbers and prior session highs/lows often overlap with pivots — those confluence zones are the
                  highest-quality entries for the strategies in the Strategy tab.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* News */}
          <TabsContent value="news" className="mt-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <NewsEventsCard metrics={null} />
              <Card className="border-border/50 bg-card">
                <CardContent className="space-y-3 p-5">
                  <p className="text-sm font-bold text-foreground">News discipline for {config.assetLabel}</p>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li>• Flatten or reduce size 15 minutes before high-impact releases.</li>
                    <li>• Wait for spreads to normalise (about 5–15 minutes) before re-entering.</li>
                    <li>• Never widen a stop because news moved against the position.</li>
                  </ul>
                  <Link to="/news-calendar">
                    <Button variant="outline" className="text-xs font-bold">
                      <Newspaper className="mr-1.5 h-3.5 w-3.5" /> Full economic calendar
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {config.tips.map((tip, i) => (
                <Card key={i} className="border-border/50 bg-card">
                  <CardContent className="flex items-start gap-3 p-4">
                    <Zap className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                    <div>
                      <p className="mb-1 text-sm font-bold text-foreground">{tip.title}</p>
                      <p className="text-xs leading-relaxed text-muted-foreground">{tip.body}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {locked && (
          <UpgradePrompt
            feature={`full ${config.assetLabel} signals, strategies & tips`}
            requiredPlan="Basic"
          />
        )}
      </main>
    </div>
  );
}
