import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TopAsset {
  symbol: string;
  score: number;
  accuracy_today: number;
  opportunities_today: number;
  best_broker: string;
  best_expiry: number;
  best_strategy: string;
  volatility_quality: number;
  trend_cleanliness: number;
}

interface TopAssetsResponse {
  rankings: TopAsset[];
  cached: boolean;
  date: string;
  ranking_type: string;
}

export function useTopAssets(type: string = "global", broker: string = "", limit: number = 5) {
  return useQuery<TopAssetsResponse>({
    queryKey: ["top-assets", type, broker, limit],
    queryFn: async () => {
      const params = new URLSearchParams({ type, limit: String(limit) });
      if (broker) params.set("broker", broker);

      const { data, error } = await supabase.functions.invoke("top-assets-ranking", {
        body: null,
        headers: { "Content-Type": "application/json" },
      });

      // If edge function fails, try cached snapshots
      if (error || !data) {
        const today = new Date().toISOString().split("T")[0];
        const { data: cached } = await supabase
          .from("top_asset_snapshots")
          .select("*")
          .eq("snapshot_date", today)
          .eq("ranking_type", type)
          .order("rank_position", { ascending: true })
          .limit(limit);

        if (cached && cached.length > 0) {
          return {
            rankings: cached.map((c: any) => ({
              symbol: c.asset_id || "EURUSD",
              score: c.score,
              accuracy_today: c.accuracy_today || 0,
              opportunities_today: c.opportunities_today || 0,
              best_broker: c.best_broker || broker || "pocket-option",
              best_expiry: c.best_expiry_seconds || 60,
              best_strategy: c.best_strategy || "Botvio AI",
              volatility_quality: c.metadata_json?.volatility_quality || 50,
              trend_cleanliness: c.metadata_json?.trend_cleanliness || 50,
            })),
            cached: true,
            date: today,
            ranking_type: type,
          };
        }

        // Return defaults
        return getDefaultRankings(type, broker);
      }

      return data as TopAssetsResponse;
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
    refetchInterval: 10 * 60 * 1000, // refresh every 10 min
  });
}

function getDefaultRankings(type: string, broker: string): TopAssetsResponse {
  const defaults: Record<string, TopAsset[]> = {
    otc: [
      { symbol: "EURUSD", score: 85, accuracy_today: 72, opportunities_today: 12, best_broker: broker || "pocket-option", best_expiry: 60, best_strategy: "Momentum Continuation", volatility_quality: 75, trend_cleanliness: 80 },
      { symbol: "GBPUSD", score: 82, accuracy_today: 68, opportunities_today: 10, best_broker: broker || "pocket-option", best_expiry: 60, best_strategy: "S/R Rejection", volatility_quality: 70, trend_cleanliness: 75 },
      { symbol: "USDJPY", score: 78, accuracy_today: 65, opportunities_today: 8, best_broker: broker || "quotex", best_expiry: 120, best_strategy: "Range Fade", volatility_quality: 65, trend_cleanliness: 70 },
      { symbol: "AUDUSD", score: 75, accuracy_today: 64, opportunities_today: 7, best_broker: broker || "pocket-option", best_expiry: 60, best_strategy: "EMA Crossover", volatility_quality: 68, trend_cleanliness: 72 },
      { symbol: "EURJPY", score: 72, accuracy_today: 60, opportunities_today: 6, best_broker: broker || "quotex", best_expiry: 120, best_strategy: "Breakout Retest", volatility_quality: 62, trend_cleanliness: 65 },
    ],
    synthetic: [
      { symbol: "Volatility 75", score: 88, accuracy_today: 74, opportunities_today: 15, best_broker: "deriv", best_expiry: 300, best_strategy: "V75 Momentum Rider", volatility_quality: 82, trend_cleanliness: 78 },
      { symbol: "Volatility 100", score: 84, accuracy_today: 70, opportunities_today: 12, best_broker: "deriv", best_expiry: 300, best_strategy: "EMA Crossover", volatility_quality: 78, trend_cleanliness: 72 },
      { symbol: "Crash 500", score: 80, accuracy_today: 68, opportunities_today: 10, best_broker: "deriv", best_expiry: 5, best_strategy: "Boom & Crash Sniper", volatility_quality: 85, trend_cleanliness: 65 },
      { symbol: "Boom 500", score: 77, accuracy_today: 66, opportunities_today: 9, best_broker: "deriv", best_expiry: 5, best_strategy: "Spike Drought", volatility_quality: 82, trend_cleanliness: 62 },
      { symbol: "Volatility 50", score: 74, accuracy_today: 62, opportunities_today: 8, best_broker: "deriv", best_expiry: 60, best_strategy: "Range Scalp", volatility_quality: 60, trend_cleanliness: 70 },
    ],
    global: [
      { symbol: "EURUSD", score: 87, accuracy_today: 73, opportunities_today: 14, best_broker: "pocket-option", best_expiry: 60, best_strategy: "Momentum Continuation", volatility_quality: 76, trend_cleanliness: 80 },
      { symbol: "Volatility 75", score: 85, accuracy_today: 72, opportunities_today: 13, best_broker: "deriv", best_expiry: 300, best_strategy: "V75 Momentum Rider", volatility_quality: 80, trend_cleanliness: 76 },
      { symbol: "GBPUSD", score: 82, accuracy_today: 70, opportunities_today: 11, best_broker: "quotex", best_expiry: 60, best_strategy: "EMA Crossover", volatility_quality: 72, trend_cleanliness: 74 },
      { symbol: "XAUUSD", score: 79, accuracy_today: 67, opportunities_today: 9, best_broker: "iq-option", best_expiry: 300, best_strategy: "Trend Follow", volatility_quality: 85, trend_cleanliness: 68 },
      { symbol: "BTCUSD", score: 76, accuracy_today: 64, opportunities_today: 8, best_broker: "quotex", best_expiry: 300, best_strategy: "Crypto Breakout", volatility_quality: 88, trend_cleanliness: 60 },
    ],
  };

  const rankings = defaults[type] || defaults.global;
  return { rankings, cached: false, date: new Date().toISOString().split("T")[0], ranking_type: type };
}
