import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Signal Quality Score formula ───
// 0.25 * Model Probability
// 0.20 * Strategy Health
// 0.15 * Asset Health
// 0.10 * Expiry Fit
// 0.10 * Session Fit
// 0.10 * Volatility Fit
// 0.10 * Historical Reliability

interface QualityInput {
  signal_id: string;
  symbol: string;
  broker: string;
  strategy_name: string;
  model_score: number; // raw AI/model confidence 0-100
  expiry_seconds: number;
  direction: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body: QualityInput = await req.json();
    const { signal_id, symbol, broker, strategy_name, model_score, expiry_seconds } = body;

    const cleanSymbol = symbol.replace("_otc", "");

    // ─── 1. Asset Health (from asset_daily_scores) ───
    let assetHealth = 50; // default
    const { data: assetScore } = await supabase
      .from("asset_daily_scores")
      .select("final_score, accuracy_score, volatility_score, sample_size")
      .eq("broker_slug", broker)
      .eq("score_date", new Date().toISOString().split("T")[0])
      .limit(1)
      .maybeSingle();

    if (assetScore && assetScore.sample_size > 5) {
      assetHealth = assetScore.final_score;
    }

    // ─── 2. Strategy Health (from strategy_daily_scores) ───
    let strategyHealth = 50;
    const { data: stratScore } = await supabase
      .from("strategy_daily_scores")
      .select("health_score, wins, losses")
      .eq("strategy_name", strategy_name)
      .eq("broker_slug", broker)
      .eq("score_date", new Date().toISOString().split("T")[0])
      .maybeSingle();

    if (stratScore) {
      strategyHealth = stratScore.health_score;
      // Loss cluster protection: if 3+ consecutive losses, penalize heavily
      const totalToday = (stratScore.wins || 0) + (stratScore.losses || 0);
      if (totalToday > 0) {
        const winRate = (stratScore.wins || 0) / totalToday;
        if (winRate < 0.3 && totalToday >= 5) {
          strategyHealth = Math.max(10, strategyHealth - 30); // cooldown penalty
        }
      }
    }

    // ─── 3. Expiry Fit (from asset_expiry_performance) ───
    let expiryFit = 50;
    const { data: expiryPerf } = await supabase
      .from("asset_expiry_performance")
      .select("win_rate, sample_size")
      .eq("broker_slug", broker)
      .eq("expiry_seconds", expiry_seconds)
      .maybeSingle();

    if (expiryPerf && expiryPerf.sample_size >= 10) {
      expiryFit = Math.round(expiryPerf.win_rate * 100);
    }

    // ─── 4. Session Fit ───
    const hour = new Date().getUTCHours();
    let sessionFit = 50;
    // Best sessions for binary options
    if (hour >= 8 && hour < 16) sessionFit = 80; // London
    else if (hour >= 13 && hour < 20) sessionFit = 75; // NY overlap
    else if (hour >= 0 && hour < 8) sessionFit = 55; // Asian
    else sessionFit = 40; // off-hours

    // OTC always available
    if (broker === "pocket-option" || broker === "quotex") {
      sessionFit = Math.max(sessionFit, 60); // OTC baseline
    }
    // Synthetics 24/7
    if (broker === "deriv") {
      sessionFit = Math.max(sessionFit, 65);
    }

    // ─── 5. Volatility Fit ───
    let volatilityFit = 50;
    if (assetScore) {
      volatilityFit = assetScore.volatility_score || 50;
    }

    // ─── 6. Historical Reliability ───
    let historicalReliability = 50;
    // Use recent settled signals for this symbol+broker
    const { data: recentSignals } = await supabase
      .from("trading_signals")
      .select("status")
      .eq("symbol", cleanSymbol)
      .contains("broker", [broker])
      .in("status", ["WON", "LOST", "EXPIRED"])
      .order("created_at", { ascending: false })
      .limit(20);

    if (recentSignals && recentSignals.length >= 5) {
      const wins = recentSignals.filter((s: any) => s.status === "WON").length;
      historicalReliability = Math.round((wins / recentSignals.length) * 100);
    }

    // ─── Compute Final Quality Score ───
    const finalScore = Math.round(
      0.25 * model_score +
      0.20 * strategyHealth +
      0.15 * assetHealth +
      0.10 * expiryFit +
      0.10 * sessionFit +
      0.10 * volatilityFit +
      0.10 * historicalReliability
    );

    // ─── Decision ───
    let approved = false;
    let rejectionReason: string | null = null;

    if (finalScore >= 78) {
      approved = true;
    } else if (finalScore >= 70) {
      // Borderline — check sub-scores
      if (strategyHealth < 30) {
        rejectionReason = "Strategy in cooldown (poor health today)";
      } else if (assetHealth < 25) {
        rejectionReason = "Asset health too low today";
      } else {
        approved = true; // borderline pass
      }
    } else {
      rejectionReason = `Quality score too low (${finalScore}/100)`;
    }

    // ─── Duplicate suppression ───
    if (approved) {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: recent } = await supabase
        .from("trading_signals")
        .select("id")
        .eq("symbol", cleanSymbol)
        .contains("broker", [broker])
        .eq("status", "ACTIVE")
        .gte("created_at", fiveMinAgo)
        .limit(1);

      if (recent && recent.length > 0) {
        approved = false;
        rejectionReason = "Duplicate suppression: active signal exists for this asset";
      }
    }

    // ─── Save quality log ───
    await supabase.from("signal_quality_logs").insert({
      signal_id,
      model_score,
      asset_health: assetHealth,
      strategy_health: strategyHealth,
      expiry_fit: expiryFit,
      session_fit: sessionFit,
      volatility_fit: volatilityFit,
      historical_reliability: historicalReliability,
      final_quality_score: finalScore,
      approved,
      rejection_reason: rejectionReason,
    });

    // Confidence tier
    let confidence_tier = "low";
    if (finalScore >= 85) confidence_tier = "premium";
    else if (finalScore >= 78) confidence_tier = "high";
    else if (finalScore >= 70) confidence_tier = "medium";

    return new Response(
      JSON.stringify({
        signal_id,
        final_quality_score: finalScore,
        approved,
        rejection_reason: rejectionReason,
        confidence_tier,
        breakdown: {
          model_score: Math.round(model_score),
          asset_health: Math.round(assetHealth),
          strategy_health: Math.round(strategyHealth),
          expiry_fit: Math.round(expiryFit),
          session_fit: Math.round(sessionFit),
          volatility_fit: Math.round(volatilityFit),
          historical_reliability: Math.round(historicalReliability),
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Signal quality optimizer error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
