import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { ChartView } from "@/components/chart/ChartView";
import { SymbolHeaderCard } from "@/components/chart/SymbolHeaderCard";
import { MarketClosedBanner } from "@/components/trading/MarketClosedBanner";
import { KeyLevelsCard } from "@/components/chart/KeyLevelsCard";
import { TradeIdeaCard } from "@/components/chart/TradeIdeaCard";
import { MarketStructureCard } from "@/components/chart/MarketStructureCard";
import { NewsEventsCard } from "@/components/chart/NewsEventsCard";
import { QuickActionsCard } from "@/components/chart/QuickActionsCard";
import { MarketStatsCard } from "@/components/chart/MarketStatsCard";
import { WatchlistCard } from "@/components/chart/WatchlistCard";

import { EducationMiniCard } from "@/components/chart/EducationMiniCard";
import { ChartAnalysisPanel } from "@/components/chart/ChartAnalysisPanel";
import { ChartBrokerLinks } from "@/components/chart/ChartBrokerLinks";
import { BotvioStrategyCard } from "@/components/chart/HauzaStrategyCard";
import { ChartTipsPanel } from "@/components/chart/ChartTipsPanel";

import { StrategyNotesPanel } from "@/components/chart/StrategyNotesPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, TrendingUp, TrendingDown, Target, Shield, BarChart3, Activity, Newspaper, Clock, BookOpen } from "lucide-react";
import { useState } from "react";

const EXNESS_LINK = "https://one.exness-track.com/a/ts1kvs1k";

const ChartPage = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState("1h");
  const [showSessions] = useState(false);
  const [showLevels, setShowLevels] = useState(true);
  const [showNews, setShowNews] = useState(true);

  const displaySymbol = symbol
    ? symbol.replace(/([A-Z]{3})([A-Z]{3,})/, "$1/$2")
    : "";

  const { data: asset } = useQuery({
    queryKey: ["chart-asset", displaySymbol],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("symbol", displaySymbol)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!displaySymbol,
  });

  const LIVE_REFETCH_MS = 10_000;

  const { data: quote } = useQuery({
    queryKey: ["chart-quote", asset?.id],
    queryFn: async () => {
      if (!asset) return null;
      const { data } = await supabase
        .from("market_quotes")
        .select("*")
        .eq("asset_id", asset.id)
        .order("fetched_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!asset,
    refetchInterval: LIVE_REFETCH_MS,
  });

  const { data: signal } = useQuery({
    queryKey: ["chart-signal", asset?.id],
    queryFn: async () => {
      if (!asset) return null;
      const { data } = await supabase
        .from("ai_signals")
        .select("*")
        .eq("asset_id", asset.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!asset,
    refetchInterval: LIVE_REFETCH_MS,
  });

  const { data: metrics } = useQuery({
    queryKey: ["chart-metrics", asset?.id],
    queryFn: async () => {
      if (!asset) return null;
      const { data } = await supabase
        .from("market_card_metrics")
        .select("*")
        .eq("asset_id", asset.id)
        .order("snapshot_time", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!asset,
    refetchInterval: LIVE_REFETCH_MS,
  });

  const { data: indicator } = useQuery({
    queryKey: ["chart-indicator", asset?.id],
    queryFn: async () => {
      if (!asset) return null;
      const { data } = await supabase
        .from("market_indicators")
        .select("*")
        .eq("asset_id", asset.id)
        .eq("timeframe", "1h")
        .order("candle_time", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!asset,
    refetchInterval: LIVE_REFETCH_MS,
  });

  const { data: candles } = useQuery({
    queryKey: ["chart-candles", asset?.id, timeframe],
    queryFn: async () => {
      if (!asset) return [];
      const { data, error } = await supabase
        .from("market_candles")
        .select("*")
        .eq("asset_id", asset.id)
        .eq("timeframe", timeframe)
        .order("candle_time", { ascending: true })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    enabled: !!asset,
    staleTime: 15_000,
    refetchInterval: LIVE_REFETCH_MS,
  });

  const isLoading = !asset;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${displaySymbol} Live Chart — AI Analysis, Key Levels & Trade Ideas`}
        description={`Live ${displaySymbol} chart with TradingView integration, AI-powered signals, support & resistance levels, trade ideas, session timing, and market structure analysis. Free technical analysis tools for smarter trading.`}
        noIndex
      />
      <Header />

      <main className="container mx-auto px-3 md:px-4 py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-3 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-[500px] rounded-xl" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* ── Weekend / Market Closed Banner ─────── */}
            <MarketClosedBanner symbol={displaySymbol} />

            {/* ── Symbol Header ─────────────────────── */}
            <SymbolHeaderCard
              symbol={displaySymbol}
              price={quote?.price ?? null}
              changePercent={quote?.change_percent_24h ?? null}
              signal={signal?.signal ?? null}
              confidence={signal?.confidence ?? null}
              trend={indicator?.trend as string | null}
            />

            {/* ── Main 2-Column Layout ─────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* LEFT COLUMN */}
              <div className="lg:col-span-8 xl:col-span-9 space-y-4">
                {/* Chart */}
                <ChartView
                  candles={candles || []}
                  symbol={displaySymbol}
                  timeframe={timeframe}
                  onTimeframeChange={setTimeframe}
                  showSessions={showSessions}
                  showLevels={showLevels}
                  showNews={showNews}
                  onToggleSessions={() => {}}
                  onToggleLevels={() => setShowLevels(!showLevels)}
                  onToggleNews={() => setShowNews(!showNews)}
                  metrics={metrics}
                  signal={signal}
                />
                <p className="text-[10px] text-muted-foreground text-center italic">
                  Use this chart for analysis. Execute trades through your broker.
                </p>

                {/* Key Levels */}
                <KeyLevelsCard metrics={metrics} price={quote?.price ?? null} />

                {/* Trade Idea */}
                <TradeIdeaCard signal={signal} symbol={displaySymbol} />

                {/* Market Structure */}
                <MarketStructureCard indicator={indicator} metrics={metrics} />

                {/* News & Events */}
                <NewsEventsCard metrics={metrics} />
              </div>

              {/* RIGHT COLUMN (Sidebar) */}
              <div className="lg:col-span-4 xl:col-span-3 space-y-4">
                <QuickActionsCard />
                <BotvioStrategyCard
                  symbol={displaySymbol}
                  signal={signal?.signal ?? null}
                  trend={indicator?.trend as string | null}
                  rsi={indicator?.rsi_14 ? Number(indicator.rsi_14) : null}
                  confidence={signal?.confidence ?? null}
                />
                <MarketStatsCard metrics={metrics} indicator={indicator} />
                <WatchlistCard activeSymbol={displaySymbol} />
                <EducationMiniCard />
                <ChartAnalysisPanel
                  signal={signal}
                  metrics={metrics}
                  indicator={indicator}
                  symbol={displaySymbol}
                />
                <ChartBrokerLinks />
              </div>
            </div>

            {/* ── Bottom Tabs Section ─────────────────────── */}
            <Tabs defaultValue="overview" className="mt-6">
              <TabsList className="w-full flex flex-wrap justify-start gap-1 h-auto p-1 bg-muted/50">
                <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                <TabsTrigger value="technical" className="text-xs">Technical Analysis</TabsTrigger>
                <TabsTrigger value="signals" className="text-xs">Signals</TabsTrigger>
                
                <TabsTrigger value="news" className="text-xs">News</TabsTrigger>
                <TabsTrigger value="strategy" className="text-xs">Strategy Notes</TabsTrigger>
              </TabsList>

              {/* OVERVIEW TAB */}
              <TabsContent value="overview">
                <Card className="bg-card border-border/50 rounded-xl">
                  <CardContent className="p-5 space-y-4">
                    <h3 className="text-lg font-bold text-foreground">{displaySymbol} Market Overview</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {displaySymbol} is currently showing {indicator?.trend || "neutral"} momentum with
                      {indicator?.rsi_14 ? ` RSI at ${Number(indicator.rsi_14).toFixed(1)}` : " mixed signals"}.
                      {metrics?.current_session && ` The ${metrics.current_session} session is active.`}
                      {signal?.ai_summary && ` ${signal.ai_summary}`}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-muted/20 rounded-lg p-3">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase">Trend</span>
                        <p className={`text-sm font-bold capitalize ${indicator?.trend === "bullish" ? "text-success" : indicator?.trend === "bearish" ? "text-destructive" : "text-muted-foreground"}`}>
                          {indicator?.trend || "Neutral"}
                        </p>
                      </div>
                      <div className="bg-muted/20 rounded-lg p-3">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase">Best Session</span>
                        <p className="text-sm font-bold text-foreground">{metrics?.current_session || "London/NY overlap"}</p>
                      </div>
                      <div className="bg-muted/20 rounded-lg p-3">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase">Caution</span>
                        <p className="text-sm font-bold text-warning">
                          {metrics?.next_high_impact_event ? "News approaching" : "Trade with the trend"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TECHNICAL ANALYSIS TAB */}
              <TabsContent value="technical">
                <Card className="bg-card border-border/50 rounded-xl">
                  <CardContent className="p-5 space-y-3">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" /> Technical Analysis
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { label: "EMA Alignment", value: indicator?.ema_20 && indicator?.ema_50 ? (Number(indicator.ema_20) > Number(indicator.ema_50) ? "Bullish (EMA20 > EMA50)" : "Bearish (EMA20 < EMA50)") : "—", color: indicator?.ema_20 && indicator?.ema_50 && Number(indicator.ema_20) > Number(indicator.ema_50) ? "text-success" : "text-destructive" },
                        { label: "RSI Status", value: indicator?.rsi_14 ? `${Number(indicator.rsi_14).toFixed(1)} ${Number(indicator.rsi_14) > 70 ? "(Overbought)" : Number(indicator.rsi_14) < 30 ? "(Oversold)" : "(Neutral)"}` : "—", color: "text-foreground" },
                        { label: "MACD Direction", value: indicator?.macd ? (Number(indicator.macd) > 0 ? "Bullish" : "Bearish") : "—", color: indicator?.macd && Number(indicator.macd) > 0 ? "text-success" : "text-destructive" },
                        { label: "S/R Levels", value: metrics?.support_1 && metrics?.resistance_1 ? `S: ${Number(metrics.support_1).toFixed(2)} / R: ${Number(metrics.resistance_1).toFixed(2)}` : "—", color: "text-foreground" },
                      ].map((item, i) => (
                        <div key={i} className="bg-muted/20 rounded-lg p-3">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase">{item.label}</span>
                          <p className={`text-sm font-bold ${item.color}`}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SIGNALS TAB */}
              <TabsContent value="signals">
                <Card className="bg-card border-border/50 rounded-xl">
                  <CardContent className="p-5">
                    <h3 className="text-lg font-bold text-foreground mb-3">Recent Signals</h3>
                    {signal ? (
                      <div className={`border rounded-lg p-4 ${signal.signal === "buy" ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={signal.signal === "buy" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}>
                              {signal.signal?.toUpperCase()}
                            </Badge>
                            <span className="text-sm font-bold">{displaySymbol}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            {signal.timeframe || "1H"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center text-xs">
                          <div><span className="text-muted-foreground">Entry</span><p className="font-mono font-bold">{signal.entry_price ? Number(signal.entry_price).toFixed(2) : "—"}</p></div>
                          <div><span className="text-muted-foreground">SL</span><p className="font-mono font-bold text-destructive">{signal.stop_loss ? Number(signal.stop_loss).toFixed(2) : "—"}</p></div>
                          <div><span className="text-muted-foreground">TP1</span><p className="font-mono font-bold text-success">{signal.take_profit_1 ? Number(signal.take_profit_1).toFixed(2) : "—"}</p></div>
                          <div><span className="text-muted-foreground">Status</span><p className="font-bold text-primary">Active</p></div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-6">No active signals for {displaySymbol}</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>


              {/* NEWS TAB */}
              <TabsContent value="news">
                <ChartTipsPanel metrics={metrics} signal={signal} symbol={displaySymbol} />
              </TabsContent>

              {/* STRATEGY NOTES TAB */}
              <TabsContent value="strategy">
                <StrategyNotesPanel />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>

      {/* ── Sticky Mobile CTA ─────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden z-50 p-3 bg-background/95 backdrop-blur-sm border-t border-border/50">
        <a href={EXNESS_LINK} target="_blank" rel="noopener noreferrer">
          <Button className="w-full bg-warning hover:bg-warning/90 text-warning-foreground font-extrabold h-12 text-sm shadow-lg shadow-warning/20">
            <ExternalLink className="h-4 w-4 mr-2" />
            Trade on Exness
          </Button>
        </a>
      </div>

      {/* Bottom padding for sticky CTA on mobile */}
      <div className="h-20 lg:hidden" />
    </div>
  );
};

export default ChartPage;
