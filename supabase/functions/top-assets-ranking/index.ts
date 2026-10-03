import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { assertAutomationKey } from "../_shared/automationAuth.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Default assets to rank when no data exists ───
const DEFAULT_ASSETS: Record<string, string[]> = {
  otc: ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "EURJPY", "GBPJPY"],
  synthetic: ["R_75", "R_100", "R_50", "BOOM500", "CRASH500", "1HZ75V"],
  forex: ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "BTCUSD"],
  global: ["EURUSD", "GBPUSD", "R_75", "XAUUSD", "BTCUSD", "USDJPY", "R_100", "AUDUSD"],
};

const BROKER_ENGINES: Record<string, string> = {
  "pocket-option": "otc",
  "quotex": "otc",
  "deriv": "synthetic",
  "iq-option": "forex",
  "binomo": "forex",
};

// ─── Ranking formula ───
// 0.25 * Today Accuracy
// 0.20 * Signal Opportunity Score
// 0.15 * Volatility Quality
// 0.10 * Trend Cleanliness
// 0.10 * Strategy Match Score
// 0.10 * Session Fit
// 0.10 * Reliability Score

interface AssetRank {
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  assertAutomationKey(req);

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const url = new URL(req.url);
    const rankingType = url.searchParams.get("type") || "global";
    const brokerFilter = url.searchParams.get("broker") || "";
    const expiryFilter = url.searchParams.get("expiry") || "";
    const limit = parseInt(url.searchParams.get("limit") || "5");
    const forceRefresh = url.searchParams.get("refresh") === "true";

    const today = new Date().toISOString().split("T")[0];

    // Check cache first
    if (!forceRefresh) {
      const { data: cached } = await supabase
        .from("top_asset_snapshots")
        .select("*")
        .eq("snapshot_date", today)
        .eq("ranking_type", rankingType)
        .order("rank_position", { ascending: true })
        .limit(limit);

      if (cached && cached.length >= 3) {
        return new Response(JSON.stringify({ rankings: cached, cached: true, date: today }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ─── Compute rankings ───
    const engineType = BROKER_ENGINES[brokerFilter] || rankingType;
    const symbolPool = DEFAULT_ASSETS[engineType] || DEFAULT_ASSETS.global;

    const rankings: AssetRank[] = [];

    for (const symbol of symbolPool) {
      const cleanSymbol = symbol.replace("_otc", "");

      // 1. Today's accuracy from settled signals
      const todayStart = `${today}T00:00:00Z`;
      const { data: todaySignals } = await supabase
        .from("trading_signals")
        .select("status, confidence, strategy_name, expiry_seconds, broker")
        .eq("symbol", cleanSymbol)
        .gte("created_at", todayStart)
        .in("status", ["WON", "LOST", "ACTIVE", "EXPIRED"])
        .limit(50);

      const settled = (todaySignals || []).filter((s: any) => s.status === "WON" || s.status === "LOST");
      const wins = settled.filter((s: any) => s.status === "WON").length;
      const accuracy_today = settled.length > 0 ? Math.round((wins / settled.length) * 100) : 50;
      const opportunities_today = (todaySignals || []).length;

      // 2. Signal opportunity score
      const opportunityScore = Math.min(100, opportunities_today * 10 + 20);

      // 3. Volatility quality from asset_daily_scores
      let volatilityQuality = 50;
      const { data: dailyScore } = await supabase
        .from("asset_daily_scores")
        .select("volatility_score, trend_score, reliability_score")
        .eq("score_date", today)
        .limit(1)
        .maybeSingle();

      if (dailyScore) {
        volatilityQuality = dailyScore.volatility_score || 50;
      }

      // 4. Trend cleanliness
      let trendCleanliness = 50;
      if (dailyScore) {
        trendCleanliness = dailyScore.trend_score || 50;
      }

      // 5. Strategy match - use most frequent winning strategy
      const winningStrategies = (todaySignals || [])
        .filter((s: any) => s.status === "WON")
        .map((s: any) => s.strategy_name);
      const strategyMatch = winningStrategies.length > 0 ? 70 : 40;
      const bestStrategy = winningStrategies[0] || "Botvio AI";

      // 6. Session fit
      const hour = new Date().getUTCHours();
      let sessionFit = 50;
      if (hour >= 8 && hour < 16) sessionFit = 80;
      else if (hour >= 13 && hour < 20) sessionFit = 75;
      else if (hour >= 0 && hour < 8) sessionFit = 55;

      // 7. Reliability
      let reliability = dailyScore?.reliability_score || 50;

      // Best expiry from today's wins
      const winExpiries = (todaySignals || [])
        .filter((s: any) => s.status === "WON" && s.expiry_seconds)
        .map((s: any) => s.expiry_seconds);
      const bestExpiry = winExpiries.length > 0
        ? winExpiries.sort((a: number, b: number) =>
            winExpiries.filter((v: number) => v === b).length - winExpiries.filter((v: number) => v === a).length
          )[0]
        : 60;

      // Best broker
      const winBrokers = (todaySignals || [])
        .filter((s: any) => s.status === "WON" && s.broker)
        .flatMap((s: any) => s.broker || []);
      const bestBroker = winBrokers.length > 0
        ? winBrokers.sort((a: string, b: string) =>
            winBrokers.filter((v: string) => v === b).length - winBrokers.filter((v: string) => v === a).length
          )[0]
        : brokerFilter || "pocket-option";

      // Final score
      const finalScore = Math.round(
        0.25 * accuracy_today +
        0.20 * opportunityScore +
        0.15 * volatilityQuality +
        0.10 * trendCleanliness +
        0.10 * strategyMatch +
        0.10 * sessionFit +
        0.10 * reliability
      );

      rankings.push({
        symbol: cleanSymbol,
        score: finalScore,
        accuracy_today,
        opportunities_today,
        best_broker: bestBroker,
        best_expiry: bestExpiry,
        best_strategy: bestStrategy,
        volatility_quality: volatilityQuality,
        trend_cleanliness: trendCleanliness,
      });
    }

    // Sort and take top N
    rankings.sort((a, b) => b.score - a.score);
    const topN = rankings.slice(0, limit);

    // Cache to top_asset_snapshots
    for (let i = 0; i < topN.length; i++) {
      const r = topN[i];
      // Get asset_id
      const { data: asset } = await supabase
        .from("assets")
        .select("id")
        .eq("symbol", r.symbol)
        .maybeSingle();

      await supabase.from("top_asset_snapshots").upsert(
        {
          snapshot_date: today,
          ranking_type: rankingType,
          asset_id: asset?.id || null,
          rank_position: i + 1,
          score: r.score,
          best_broker: r.best_broker,
          best_expiry_seconds: r.best_expiry,
          best_strategy: r.best_strategy,
          accuracy_today: r.accuracy_today,
          opportunities_today: r.opportunities_today,
          metadata_json: {
            volatility_quality: r.volatility_quality,
            trend_cleanliness: r.trend_cleanliness,
          },
        },
        { onConflict: "snapshot_date,ranking_type,asset_id" }
      );
    }

    return new Response(
      JSON.stringify({ rankings: topN, cached: false, date: today, ranking_type: rankingType }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Top assets ranking error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
