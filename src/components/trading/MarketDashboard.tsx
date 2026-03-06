import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp, TrendingDown, Minus, Activity, Sparkles, Clock,
  Newspaper, BarChart3, Shield, Target, Lightbulb, ArrowDown, ArrowUp,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { TradingChecklist } from "./market/TradingChecklist";
import { NewsImpactBanner } from "./market/NewsImpactBanner";
import { PatternAlerts } from "./market/PatternAlerts";

interface Asset {
  id: string;
  symbol: string;
  asset_type: string;
}

interface Quote {
  asset_id: string;
  price: number;
  change_percent_24h: number | null;
}

interface Indicator {
  asset_id: string;
  rsi_14: number | null;
  trend: string | null;
}

interface AiSignal {
  asset_id: string;
  signal: string;
  confidence: number;
  ai_summary: string;
  entry_price: number | null;
  stop_loss: number | null;
  take_profit_1: number | null;
}

interface CardMetrics {
  asset_id: string;
  current_session: string | null;
  next_session: string | null;
  next_session_open_at: string | null;
  next_high_impact_event: string | null;
  next_high_impact_currency: string | null;
  next_high_impact_level: string | null;
  next_high_impact_time: string | null;
  day_low: number | null;
  day_high: number | null;
  current_4h_block: string | null;
  current_4h_high: number | null;
  current_4h_low: number | null;
  support_1: number | null;
  support_2: number | null;
  resistance_1: number | null;
  resistance_2: number | null;
  market_tip: string | null;
}

const ASSET_ICONS: Record<string, string> = {
  "XAU/USD": "🥇", "XAG/USD": "🥈", "BTC/USD": "₿",
  "GBP/USD": "£", "USD/JPY": "¥", "EUR/USD": "€", "AUD/USD": "🇦🇺",
};

const SIGNAL_COLORS: Record<string, string> = {
  buy: "bg-success/20 text-success border-success/40 shadow-success/10 shadow-sm",
  sell: "bg-destructive/20 text-destructive border-destructive/40 shadow-destructive/10 shadow-sm",
  hold: "bg-warning/20 text-warning border-warning/40",
  avoid: "bg-muted text-muted-foreground border-border",
};

const SIGNAL_CARD_GLOW: Record<string, string> = {
  buy: "border-success/30 shadow-[0_0_15px_-3px_hsl(var(--success)/0.15)]",
  sell: "border-destructive/30 shadow-[0_0_15px_-3px_hsl(var(--destructive)/0.15)]",
  hold: "border-warning/20",
  avoid: "",
};

const TREND_ICONS: Record<string, React.ReactNode> = {
  bullish: <TrendingUp className="h-4 w-4 text-success" />,
  bearish: <TrendingDown className="h-4 w-4 text-destructive" />,
  neutral: <Minus className="h-4 w-4 text-muted-foreground" />,
};

function formatPrice(price: number | null, symbol: string): string {
  if (price == null) return "—";
  if (symbol.includes("JPY")) return price.toFixed(3);
  if (symbol.includes("BTC")) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (symbol.includes("XAU") || symbol.includes("XAG")) return price.toFixed(2);
  return price.toFixed(5);
}

function Countdown({ targetTime }: { targetTime: string }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(targetTime).getTime() - Date.now();
      if (diff <= 0) { setRemaining("Now"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(`${h}h ${String(m).padStart(2, "0")}m`);
    };
    update();
    const iv = setInterval(update, 60000);
    return () => clearInterval(iv);
  }, [targetTime]);

  return <span className="font-mono text-xs font-semibold text-primary">{remaining}</span>;
}

function SessionBlock({ metrics }: { metrics: CardMetrics }) {
  if (!metrics.current_session) return null;
  return (
    <div className="flex items-center justify-between text-xs bg-muted/30 rounded-lg px-3 py-2">
      <span className="text-foreground/70 flex items-center gap-1.5 font-medium">
        <Clock className="h-3.5 w-3.5 text-primary" /> Session
      </span>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-[10px] py-0 border-primary/50 text-primary font-bold bg-primary/10">
          {metrics.current_session}
        </Badge>
        {metrics.next_session && metrics.next_session_open_at && (
          <span className="text-foreground/60 text-[10px]">
            → {metrics.next_session} in <Countdown targetTime={metrics.next_session_open_at} />
          </span>
        )}
      </div>
    </div>
  );
}

function NewsBlock({ metrics }: { metrics: CardMetrics }) {
  if (!metrics.next_high_impact_event) return null;
  return (
    <div className="bg-destructive/10 border border-destructive/25 rounded-lg px-3 py-2">
      <div className="flex items-center gap-1.5 mb-1">
        <Newspaper className="h-3.5 w-3.5 text-destructive" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-destructive">
          Impact News
        </span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="truncate max-w-[60%] text-foreground font-medium">
          {metrics.next_high_impact_currency} — {metrics.next_high_impact_event}
        </span>
        {metrics.next_high_impact_time && (
          <span className="text-destructive font-bold text-[11px]">
            <Countdown targetTime={metrics.next_high_impact_time} />
          </span>
        )}
      </div>
    </div>
  );
}

function DayRangeBlock({ metrics, symbol }: { metrics: CardMetrics; symbol: string }) {
  if (metrics.day_low == null && metrics.day_high == null) return null;
  const range = metrics.day_high != null && metrics.day_low != null
    ? Math.abs(metrics.day_high - metrics.day_low) : null;

  return (
    <div className="grid grid-cols-3 gap-1.5 text-[11px]">
      <div className="bg-success/10 border border-success/20 rounded-lg px-2 py-1.5 text-center">
        <div className="text-foreground/50 flex items-center justify-center gap-0.5 text-[9px] font-semibold uppercase">
          <ArrowDown className="h-2.5 w-2.5 text-success" /> Low
        </div>
        <div className="font-bold text-success mt-0.5">{formatPrice(metrics.day_low ? Number(metrics.day_low) : null, symbol)}</div>
      </div>
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-2 py-1.5 text-center">
        <div className="text-foreground/50 flex items-center justify-center gap-0.5 text-[9px] font-semibold uppercase">
          <ArrowUp className="h-2.5 w-2.5 text-destructive" /> High
        </div>
        <div className="font-bold text-destructive mt-0.5">{formatPrice(metrics.day_high ? Number(metrics.day_high) : null, symbol)}</div>
      </div>
      <div className="bg-muted/50 border border-border/30 rounded-lg px-2 py-1.5 text-center">
        <div className="text-foreground/50 text-[9px] font-semibold uppercase">Range</div>
        <div className="font-bold text-foreground mt-0.5">{range != null ? formatPrice(range, symbol) : "—"}</div>
      </div>
    </div>
  );
}

function H4Block({ metrics, symbol }: { metrics: CardMetrics; symbol: string }) {
  if (!metrics.current_4h_block) return null;
  return (
    <div className="flex items-center justify-between text-xs bg-muted/30 rounded-lg px-3 py-2">
      <span className="text-foreground/70 flex items-center gap-1.5 font-medium">
        <BarChart3 className="h-3.5 w-3.5 text-primary" /> 4H Block
      </span>
      <div className="flex items-center gap-2 text-[10px]">
        <Badge variant="outline" className="py-0 text-[10px] font-bold bg-primary/10 border-primary/30 text-primary">{metrics.current_4h_block}</Badge>
        {metrics.current_4h_high != null && (
          <span className="text-foreground/60">
            H: <span className="text-foreground font-mono font-bold">{formatPrice(Number(metrics.current_4h_high), symbol)}</span>
            {" "}L: <span className="text-foreground font-mono font-bold">{formatPrice(Number(metrics.current_4h_low), symbol)}</span>
          </span>
        )}
      </div>
    </div>
  );
}

function LevelsBlock({ metrics, symbol }: { metrics: CardMetrics; symbol: string }) {
  const hasLevels = metrics.support_1 != null || metrics.resistance_1 != null;
  if (!hasLevels) return null;

  return (
    <div className="space-y-1.5 bg-muted/20 rounded-lg px-3 py-2 border border-border/30">
      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-foreground/60">
        <Shield className="h-3.5 w-3.5 text-primary" /> Key Levels
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
        <div className="flex justify-between">
          <span className="text-success font-bold">S1</span>
          <span className="font-mono font-semibold text-foreground">{formatPrice(metrics.support_1 ? Number(metrics.support_1) : null, symbol)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-destructive font-bold">R1</span>
          <span className="font-mono font-semibold text-foreground">{formatPrice(metrics.resistance_1 ? Number(metrics.resistance_1) : null, symbol)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-success/60 font-bold">S2</span>
          <span className="font-mono font-semibold text-foreground/70">{formatPrice(metrics.support_2 ? Number(metrics.support_2) : null, symbol)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-destructive/60 font-bold">R2</span>
          <span className="font-mono font-semibold text-foreground/70">{formatPrice(metrics.resistance_2 ? Number(metrics.resistance_2) : null, symbol)}</span>
        </div>
      </div>
    </div>
  );
}

function TipBlock({ tip }: { tip: string | null }) {
  if (!tip) return null;
  return (
    <div className="bg-primary/8 border border-primary/25 rounded-lg px-3 py-2">
      <div className="flex items-start gap-2">
        <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <p className="text-[11px] text-foreground leading-relaxed font-medium">{tip}</p>
      </div>
    </div>
  );
}

export function MarketDashboard() {
  const { data: assets, isLoading: assetsLoading } = useQuery({
    queryKey: ["market-assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("id, symbol, asset_type, base_currency, quote_currency")
        .eq("is_active", true)
        .order("symbol");
      if (error) throw error;
      return data as Asset[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const assetIds = assets?.map((a) => a.id) || [];

  const { data: quotes } = useQuery({
    queryKey: ["market-quotes", assetIds],
    queryFn: async () => {
      if (!assetIds.length) return [];
      const results: Quote[] = [];
      for (const assetId of assetIds) {
        const { data } = await supabase
          .from("market_quotes")
          .select("asset_id, price, change_percent_24h, fetched_at")
          .eq("asset_id", assetId)
          .order("fetched_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data) results.push(data as Quote);
      }
      return results;
    },
    enabled: assetIds.length > 0,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  const { data: indicators } = useQuery({
    queryKey: ["market-indicators", assetIds],
    queryFn: async () => {
      if (!assetIds.length) return [];
      const results: Indicator[] = [];
      for (const assetId of assetIds) {
        const { data } = await supabase
          .from("market_indicators")
          .select("asset_id, rsi_14, trend")
          .eq("asset_id", assetId)
          .eq("timeframe", "1h")
          .order("candle_time", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data) results.push(data as Indicator);
      }
      return results;
    },
    enabled: assetIds.length > 0,
    staleTime: 60 * 1000,
  });

  const { data: signals } = useQuery({
    queryKey: ["ai-signals", assetIds],
    queryFn: async () => {
      if (!assetIds.length) return [];
      const results: AiSignal[] = [];
      for (const assetId of assetIds) {
        const { data } = await supabase
          .from("ai_signals")
          .select("asset_id, signal, confidence, entry_price, stop_loss, take_profit_1, ai_summary, created_at")
          .eq("asset_id", assetId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data) results.push(data as AiSignal);
      }
      return results;
    },
    enabled: assetIds.length > 0,
    staleTime: 60 * 1000,
  });

  const { data: cardMetrics } = useQuery({
    queryKey: ["card-metrics", assetIds],
    queryFn: async () => {
      if (!assetIds.length) return [];
      const results: CardMetrics[] = [];
      for (const assetId of assetIds) {
        const { data } = await supabase
          .from("market_card_metrics")
          .select("*")
          .eq("asset_id", assetId)
          .order("snapshot_time", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data) results.push(data as CardMetrics);
      }
      return results;
    },
    enabled: assetIds.length > 0,
    staleTime: 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });

  const quoteMap = new Map(quotes?.map((q) => [q.asset_id, q]) || []);
  const indicatorMap = new Map(indicators?.map((i) => [i.asset_id, i]) || []);
  const signalMap = new Map(signals?.map((s) => [s.asset_id, s]) || []);
  const metricsMap = new Map(cardMetrics?.map((m) => [m.asset_id, m]) || []);

  // Collect all news events for the top banner
  const allNewsEvents = useMemo(() => {
    if (!cardMetrics?.length) return [];
    return cardMetrics
      .filter((m) => m.next_high_impact_event && m.next_high_impact_time)
      .map((m) => ({
        event: m.next_high_impact_event!,
        currency: m.next_high_impact_currency || "",
        level: m.next_high_impact_level || "high",
        time: m.next_high_impact_time!,
      }))
      // Deduplicate by event+time
      .filter((e, i, arr) => arr.findIndex((x) => x.event === e.event && x.time === e.time) === i);
  }, [cardMetrics]);

  // Build pattern alerts from AI signals
  const patternAlerts = useMemo(() => {
    if (!signals?.length || !assets?.length) return [];
    const assetMap = new Map(assets.map((a) => [a.id, a]));
    return signals
      .filter((s) => s.ai_summary && (s.signal === "buy" || s.signal === "sell"))
      .map((s) => {
        const asset = assetMap.get(s.asset_id);
        // Extract pattern hint from summary
        const summary = s.ai_summary.toLowerCase();
        let pattern = "Signal Active";
        let timeframe = "1H";
        if (summary.includes("breakout")) pattern = "Breakout";
        else if (summary.includes("rejection")) pattern = "Rejection";
        else if (summary.includes("bounce")) pattern = "Bounce";
        else if (summary.includes("divergence")) pattern = "Divergence";
        else if (summary.includes("crossover")) pattern = "EMA Crossover";
        else if (summary.includes("reversal")) pattern = "Reversal";
        if (summary.includes("4h") || summary.includes("4-hour")) timeframe = "4H";
        else if (summary.includes("daily")) timeframe = "Daily";
        else if (summary.includes("15m") || summary.includes("15 min")) timeframe = "15M";
        else if (summary.includes("1h") || summary.includes("1-hour")) timeframe = "1H";

        return {
          symbol: asset?.symbol || "",
          pattern,
          timeframe,
          direction: s.signal === "buy" ? "bullish" as const : "bearish" as const,
          suggestedEntry: s.entry_price,
          suggestedSL: s.stop_loss,
        };
      })
      .filter((p) => p.symbol);
  }, [signals, assets]);

  if (assetsLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Live Market Intelligence</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-96 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!assets?.length) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">Live Market Intelligence</h2>
      </div>

      {/* Pre-Trade Checklist */}
      <TradingChecklist />

      {/* News Impact Banner (top-level, not per-card) */}
      <NewsImpactBanner newsEvents={allNewsEvents} />

      {/* Pattern Alerts */}
      <PatternAlerts patterns={patternAlerts} />

      {/* Asset Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {assets.map((asset) => {
          const quote = quoteMap.get(asset.id);
          const ind = indicatorMap.get(asset.id);
          const sig = signalMap.get(asset.id);
          const metrics = metricsMap.get(asset.id);
          const glowClass = sig ? (SIGNAL_CARD_GLOW[sig.signal] || "") : "";

          return (
            <Card
              key={asset.id}
              className={`bg-card hover:border-primary/50 transition-all overflow-hidden rounded-xl ${glowClass}`}
            >
              <CardHeader className="pb-2 px-4 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{ASSET_ICONS[asset.symbol] || "📊"}</span>
                    <div>
                      <CardTitle className="text-base font-bold text-foreground">{asset.symbol}</CardTitle>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                        {asset.asset_type}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {ind?.trend && (
                      <span className="flex items-center gap-1 text-[11px] font-bold capitalize">
                        {TREND_ICONS[ind.trend || "neutral"]}
                        <span className={ind.trend === "bullish" ? "text-success" : ind.trend === "bearish" ? "text-destructive" : "text-muted-foreground"}>
                          {ind.trend}
                        </span>
                      </span>
                    )}
                    {sig && (
                      <Badge className={`text-[10px] uppercase font-extrabold px-2 ${SIGNAL_COLORS[sig.signal] || ""}`}>
                        {sig.signal}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-2.5 pt-0 px-4 pb-4">
                {/* Price + Confidence */}
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-extrabold tabular-nums text-foreground">
                      {quote ? formatPrice(quote.price, asset.symbol) : "—"}
                    </span>
                    {quote?.change_percent_24h != null && (
                      <span className={`ml-2 text-sm font-bold ${
                        quote.change_percent_24h >= 0 ? "text-success" : "text-destructive"
                      }`}>
                        {quote.change_percent_24h >= 0 ? "+" : ""}
                        {quote.change_percent_24h.toFixed(2)}%
                      </span>
                    )}
                  </div>
                  {sig && (
                    <span className="text-xs text-foreground/60 font-semibold">
                      {Math.round(sig.confidence)}% conf
                    </span>
                  )}
                </div>

                {/* RSI */}
                {ind?.rsi_14 != null && (
                  <div className="flex items-center justify-between text-xs bg-muted/30 rounded-lg px-3 py-1.5">
                    <span className="text-foreground/60 font-medium">RSI (14)</span>
                    <span className={`font-mono font-bold ${
                      Number(ind.rsi_14) > 70 ? "text-destructive" : Number(ind.rsi_14) < 30 ? "text-success" : "text-foreground"
                    }`}>
                      {Number(ind.rsi_14).toFixed(1)}
                      {Number(ind.rsi_14) > 70 && <span className="text-[9px] ml-1 text-destructive/70">Overbought</span>}
                      {Number(ind.rsi_14) < 30 && <span className="text-[9px] ml-1 text-success/70">Oversold</span>}
                    </span>
                  </div>
                )}

                {/* Session */}
                {metrics && <SessionBlock metrics={metrics} />}

                {/* 4H Block */}
                {metrics && <H4Block metrics={metrics} symbol={asset.symbol} />}

                {/* Day Range */}
                {metrics && <DayRangeBlock metrics={metrics} symbol={asset.symbol} />}

                {/* Key Levels */}
                {metrics && <LevelsBlock metrics={metrics} symbol={asset.symbol} />}

                {/* AI Signal Entry/SL/TP */}
                {sig && (sig.signal === "buy" || sig.signal === "sell") && (
                  <div className="border-t border-border/40 pt-2 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        AI Signal
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                      <div className="bg-primary/10 border border-primary/20 rounded-lg px-2 py-1.5 text-center">
                        <div className="text-foreground/50 text-[9px] font-semibold uppercase">Entry</div>
                        <div className="font-bold text-foreground">{sig.entry_price ? formatPrice(Number(sig.entry_price), asset.symbol) : "—"}</div>
                      </div>
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-2 py-1.5 text-center">
                        <div className="text-foreground/50 text-[9px] font-semibold uppercase">SL</div>
                        <div className="font-bold text-destructive">{sig.stop_loss ? formatPrice(Number(sig.stop_loss), asset.symbol) : "—"}</div>
                      </div>
                      <div className="bg-success/10 border border-success/20 rounded-lg px-2 py-1.5 text-center">
                        <div className="text-foreground/50 text-[9px] font-semibold uppercase">TP1</div>
                        <div className="font-bold text-success">{sig.take_profit_1 ? formatPrice(Number(sig.take_profit_1), asset.symbol) : "—"}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tip */}
                {metrics && <TipBlock tip={metrics.market_tip} />}

                {/* AI Summary */}
                {sig?.ai_summary && (
                  <p className="text-[11px] text-foreground/60 line-clamp-2 border-t border-border/30 pt-2 leading-relaxed">
                    {sig.ai_summary}
                  </p>
                )}

                {/* Empty state */}
                {!quote && !sig && !metrics && (
                  <div className="text-center py-4">
                    <Target className="h-8 w-8 text-muted-foreground/30 mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Awaiting market data</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
