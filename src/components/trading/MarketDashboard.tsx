import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp, TrendingDown, Minus, BarChart3, Activity, Target, Sparkles,
} from "lucide-react";

interface Asset {
  id: string;
  symbol: string;
  asset_type: string;
  base_currency: string;
  quote_currency: string;
}

interface Quote {
  asset_id: string;
  price: number;
  change_percent_24h: number | null;
  fetched_at: string;
}

interface Indicator {
  asset_id: string;
  timeframe: string;
  ema_20: number | null;
  ema_50: number | null;
  rsi_14: number | null;
  atr_14: number | null;
  support_1: number | null;
  resistance_1: number | null;
  trend: string | null;
}

interface AiSignal {
  asset_id: string;
  timeframe: string;
  signal: string;
  confidence: number;
  entry_price: number | null;
  stop_loss: number | null;
  take_profit_1: number | null;
  take_profit_2: number | null;
  risk_reward: number | null;
  ai_summary: string;
  created_at: string;
}

const ASSET_ICONS: Record<string, string> = {
  "XAU/USD": "🥇",
  "XAG/USD": "🥈",
  "BTC/USD": "₿",
  "GBP/USD": "£",
  "USD/JPY": "¥",
  "EUR/USD": "€",
  "AUD/USD": "🇦🇺",
};

const SIGNAL_COLORS: Record<string, string> = {
  buy: "bg-success/15 text-success border-success/30",
  sell: "bg-destructive/15 text-destructive border-destructive/30",
  hold: "bg-warning/15 text-warning border-warning/30",
  avoid: "bg-muted text-muted-foreground border-border",
};

const TREND_ICONS: Record<string, React.ReactNode> = {
  bullish: <TrendingUp className="h-3.5 w-3.5 text-success" />,
  bearish: <TrendingDown className="h-3.5 w-3.5 text-destructive" />,
  neutral: <Minus className="h-3.5 w-3.5 text-muted-foreground" />,
};

function formatPrice(price: number | null, symbol: string): string {
  if (price == null) return "—";
  if (symbol.includes("JPY")) return price.toFixed(3);
  if (symbol.includes("BTC")) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (symbol.includes("XAU") || symbol.includes("XAG")) return price.toFixed(2);
  return price.toFixed(5);
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
      // Get latest quote per asset using distinct on
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
          .select("asset_id, timeframe, ema_20, ema_50, rsi_14, atr_14, support_1, resistance_1, trend")
          .eq("asset_id", assetId)
          .eq("timeframe", "15min")
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
          .select("asset_id, timeframe, signal, confidence, entry_price, stop_loss, take_profit_1, take_profit_2, risk_reward, ai_summary, created_at")
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

  const quoteMap = new Map(quotes?.map((q) => [q.asset_id, q]) || []);
  const indicatorMap = new Map(indicators?.map((i) => [i.asset_id, i]) || []);
  const signalMap = new Map(signals?.map((s) => [s.asset_id, s]) || []);

  if (assetsLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Live Market Intelligence</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!assets?.length) return null;

  const hasData = quotes && quotes.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Live Market Intelligence</h2>
        </div>
        {!hasData && (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            Awaiting data feed
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {assets.map((asset) => {
          const quote = quoteMap.get(asset.id);
          const ind = indicatorMap.get(asset.id);
          const sig = signalMap.get(asset.id);

          return (
            <Card
              key={asset.id}
              className="glass-card hover:border-primary/50 transition-all hover:scale-[1.01] overflow-hidden"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{ASSET_ICONS[asset.symbol] || "📊"}</span>
                    <div>
                      <CardTitle className="text-base">{asset.symbol}</CardTitle>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {asset.asset_type}
                      </span>
                    </div>
                  </div>
                  {sig && (
                    <Badge className={`text-[10px] uppercase font-bold ${SIGNAL_COLORS[sig.signal] || ""}`}>
                      {sig.signal}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                {/* Price */}
                <div>
                  <span className="text-2xl font-bold tabular-nums">
                    {quote ? formatPrice(quote.price, asset.symbol) : "—"}
                  </span>
                  {quote?.change_percent_24h != null && (
                    <span
                      className={`ml-2 text-xs font-medium ${
                        quote.change_percent_24h >= 0 ? "text-success" : "text-destructive"
                      }`}
                    >
                      {quote.change_percent_24h >= 0 ? "+" : ""}
                      {quote.change_percent_24h.toFixed(2)}%
                    </span>
                  )}
                </div>

                {/* Indicators */}
                {ind && (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Trend</span>
                      <span className="flex items-center gap-1 font-medium capitalize">
                        {TREND_ICONS[ind.trend || "neutral"]}
                        {ind.trend || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">RSI</span>
                      <span className={`font-medium ${
                        (ind.rsi_14 || 0) > 70 ? "text-destructive" : (ind.rsi_14 || 0) < 30 ? "text-success" : ""
                      }`}>
                        {ind.rsi_14 != null ? Number(ind.rsi_14).toFixed(1) : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">S1</span>
                      <span className="font-medium text-success">
                        {ind.support_1 != null ? formatPrice(Number(ind.support_1), asset.symbol) : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">R1</span>
                      <span className="font-medium text-destructive">
                        {ind.resistance_1 != null ? formatPrice(Number(ind.resistance_1), asset.symbol) : "—"}
                      </span>
                    </div>
                  </div>
                )}

                {/* AI Signal details */}
                {sig && (
                  <div className="border-t border-border/50 pt-2 space-y-1.5">
                    <div className="flex items-center gap-1 mb-1">
                      <Sparkles className="h-3 w-3 text-primary" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                        AI Signal
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {Math.round(sig.confidence)}% conf
                      </span>
                    </div>
                    {(sig.signal === "buy" || sig.signal === "sell") && (
                      <div className="grid grid-cols-3 gap-1 text-[10px]">
                        <div className="bg-muted/50 rounded px-1.5 py-1 text-center">
                          <div className="text-muted-foreground">Entry</div>
                          <div className="font-semibold">{sig.entry_price ? formatPrice(Number(sig.entry_price), asset.symbol) : "—"}</div>
                        </div>
                        <div className="bg-destructive/10 rounded px-1.5 py-1 text-center">
                          <div className="text-muted-foreground">SL</div>
                          <div className="font-semibold text-destructive">{sig.stop_loss ? formatPrice(Number(sig.stop_loss), asset.symbol) : "—"}</div>
                        </div>
                        <div className="bg-success/10 rounded px-1.5 py-1 text-center">
                          <div className="text-muted-foreground">TP1</div>
                          <div className="font-semibold text-success">{sig.take_profit_1 ? formatPrice(Number(sig.take_profit_1), asset.symbol) : "—"}</div>
                        </div>
                      </div>
                    )}
                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                      {sig.ai_summary}
                    </p>
                  </div>
                )}

                {/* Empty state */}
                {!quote && !sig && (
                  <div className="text-center py-3">
                    <BarChart3 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">
                      Awaiting market data
                    </p>
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
