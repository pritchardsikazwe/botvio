import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { ChartView } from "@/components/chart/ChartView";
import { ChartAnalysisPanel } from "@/components/chart/ChartAnalysisPanel";
import { TradePlanBox } from "@/components/chart/TradePlanBox";
import { ChartHeader } from "@/components/chart/ChartHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const ChartPage = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState("1h");
  const [showSessions, setShowSessions] = useState(true);
  const [showLevels, setShowLevels] = useState(true);
  const [showNews, setShowNews] = useState(true);

  // Decode symbol: XAUUSD -> XAU/USD
  const displaySymbol = symbol
    ? symbol.replace(/([A-Z]{3})([A-Z]{3,})/, "$1/$2")
    : "";

  // Fetch asset
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

  // Fetch latest quote
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
    refetchInterval: 30000,
  });

  // Fetch latest AI signal
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
  });

  // Fetch card metrics
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
  });

  // Fetch indicators
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
  });

  // Fetch candles for chart
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
    staleTime: 60000,
  });

  const isLoading = !asset;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${displaySymbol} Chart — Botvio`}
        description={`Live ${displaySymbol} chart with AI signals, support/resistance levels, and market analysis`}
        noIndex
      />
      <Header />

      <main className="container mx-auto px-4 py-4">
        {/* Back Button */}
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
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-[500px] rounded-xl" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Chart Header */}
            <ChartHeader
              symbol={displaySymbol}
              price={quote?.price ?? null}
              changePercent={quote?.change_percent_24h ?? null}
              signal={signal?.signal ?? null}
              confidence={signal?.confidence ?? null}
              trend={indicator?.trend as string | null}
            />

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Chart */}
              <div className="lg:col-span-8 xl:col-span-9">
                <ChartView
                  candles={candles || []}
                  symbol={displaySymbol}
                  timeframe={timeframe}
                  onTimeframeChange={setTimeframe}
                  showSessions={showSessions}
                  showLevels={showLevels}
                  showNews={showNews}
                  onToggleSessions={() => setShowSessions(!showSessions)}
                  onToggleLevels={() => setShowLevels(!showLevels)}
                  onToggleNews={() => setShowNews(!showNews)}
                  metrics={metrics}
                  signal={signal}
                />
              </div>

              {/* Analysis Panel */}
              <div className="lg:col-span-4 xl:col-span-3 space-y-4">
                <ChartAnalysisPanel
                  signal={signal}
                  metrics={metrics}
                  indicator={indicator}
                  symbol={displaySymbol}
                />
                <TradePlanBox
                  signal={signal}
                  symbol={displaySymbol}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ChartPage;
