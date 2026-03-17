import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ScoringInput {
  symbol: string;
  direction: "CALL" | "PUT" | "BUY" | "SELL";
  strategy: string;
  timeframe: string;
  entry_price: number;
  category?: string;
  expiry_seconds?: number;
  candles?: Array<{ open: number; high: number; low: number; close: number; time: string }>;
  features?: Record<string, number>;
}

// Layer 1: Fast rule-based score
function computeRuleScore(input: ScoringInput, candles: any[]): { score: number; reasons: string[] } {
  let score = 50;
  const reasons: string[] = [];

  if (candles.length < 3) return { score, reasons: ["insufficient_data"] };

  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const prev2 = candles[candles.length - 3];

  const isBullish = (c: any) => c.close > c.open;
  const isBearish = (c: any) => c.close < c.open;
  const bodySize = (c: any) => Math.abs(c.close - c.open);
  const range = (c: any) => c.high - c.low;

  // Trend alignment
  const bullCount = candles.slice(-5).filter(isBullish).length;
  const bearCount = candles.slice(-5).filter(isBearish).length;
  const dirBull = input.direction === "CALL" || input.direction === "BUY";

  if (dirBull && bullCount >= 3) { score += 8; reasons.push("trend_alignment"); }
  if (!dirBull && bearCount >= 3) { score += 8; reasons.push("trend_alignment"); }

  // Candle quality - strong body
  if (range(last) > 0 && bodySize(last) / range(last) > 0.6) {
    score += 6; reasons.push("strong_candle_body");
  }

  // Rejection wick
  const upperWick = last.high - Math.max(last.open, last.close);
  const lowerWick = Math.min(last.open, last.close) - last.low;
  if (!dirBull && upperWick > bodySize(last) * 1.5) { score += 7; reasons.push("upper_wick_rejection"); }
  if (dirBull && lowerWick > bodySize(last) * 1.5) { score += 7; reasons.push("lower_wick_rejection"); }

  // Momentum (3 consecutive candles)
  if (dirBull && isBullish(last) && isBullish(prev) && isBullish(prev2)) {
    score += 5; reasons.push("momentum_continuation");
  }
  if (!dirBull && isBearish(last) && isBearish(prev) && isBearish(prev2)) {
    score += 5; reasons.push("momentum_continuation");
  }

  // Volatility fit
  const avgRange = candles.slice(-10).reduce((s, c) => s + range(c), 0) / Math.min(candles.length, 10);
  if (range(last) > avgRange * 0.5 && range(last) < avgRange * 2.0) {
    score += 4; reasons.push("volatility_normal");
  }
  if (range(last) > avgRange * 2.5) {
    score -= 5; reasons.push("volatility_extreme");
  }

  // Strategy-specific bonuses
  if (input.strategy === "momentum_continuation" && bullCount >= 4) { score += 5; }
  if (input.strategy === "exhaustion_reversal") {
    const sameDir = candles.slice(-5).filter(dirBull ? isBearish : isBullish).length;
    if (sameDir >= 4) { score += 8; reasons.push("exhaustion_detected"); }
  }
  if (input.strategy === "support_resistance_rejection") {
    score += 5; reasons.push("level_interaction");
  }

  return { score: Math.max(0, Math.min(100, score)), reasons };
}

// Layer 2: Simple ML proxy (feature-based scoring)
function computeMLScore(features: Record<string, number>): number {
  let score = 0.5;

  // Weighted feature contributions
  if (features.rsi_14) {
    if (features.rsi_14 > 70) score -= 0.1; // overbought
    else if (features.rsi_14 < 30) score += 0.1; // oversold for reversal
    else if (features.rsi_14 > 50 && features.rsi_14 < 70) score += 0.05;
  }
  if (features.ema_alignment) score += features.ema_alignment * 0.15;
  if (features.trend_persistence) score += features.trend_persistence * 0.1;
  if (features.volatility_compression) score += features.volatility_compression * 0.08;

  return Math.max(0, Math.min(1, score));
}

// Final confidence formula
function computeFinalConfidence(
  strategyScore: number,
  mlProbability: number,
  marketContext: number,
  volatilityFit: number,
  sessionFit: number,
  assetReliability: number
): number {
  return Math.round(
    0.25 * strategyScore +
    0.30 * (mlProbability * 100) +
    0.15 * marketContext +
    0.10 * volatilityFit +
    0.10 * sessionFit +
    0.10 * assetReliability
  );
}

// Session fitness
function getSessionFitScore(): number {
  const hour = new Date().getUTCHours();
  // London + NY overlap (13-17 UTC) = best
  if (hour >= 13 && hour <= 17) return 85;
  // London (7-16 UTC) or NY (13-22 UTC)
  if ((hour >= 7 && hour <= 16) || (hour >= 13 && hour <= 22)) return 70;
  // Asian (23-8 UTC)
  if (hour >= 23 || hour <= 8) return 55;
  return 50; // OTC / off-hours
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const input: ScoringInput = await req.json();
    const candles = input.candles || [];
    const features = input.features || {};

    // Layer 1: Rule score
    const { score: ruleScore, reasons } = computeRuleScore(input, candles);

    // Layer 2: ML probability
    const mlProb = computeMLScore(features);

    // Context scores
    const sessionFit = getSessionFitScore();
    const volatilityFit = candles.length > 5 ? 70 : 50;
    const marketContext = candles.length > 10 ? 75 : 55;
    const assetReliability = 65; // default, can be per-asset later

    // Final confidence
    const confidence = computeFinalConfidence(ruleScore, mlProb, marketContext, volatilityFit, sessionFit, assetReliability);

    // Decision
    let decision: "emit" | "reject" | "low_confidence" = "emit";
    if (confidence < 60) decision = "reject";
    else if (confidence < 70) decision = "low_confidence";

    // Recommended expiry
    let recommendedExpiry = input.expiry_seconds || 60;
    if (input.timeframe === "M1") recommendedExpiry = 60;
    else if (input.timeframe === "M5") recommendedExpiry = 300;
    else if (input.timeframe === "M15") recommendedExpiry = 900;

    const result = {
      confidence_score: confidence,
      win_probability: Math.round(mlProb * 100) / 100,
      decision,
      recommended_expiry: recommendedExpiry,
      strategy_quality_score: ruleScore,
      market_context_score: marketContext,
      volatility_fit_score: volatilityFit,
      session_fit_score: sessionFit,
      explanation: {
        reason_codes: reasons,
        strategy: input.strategy,
        model_version: "v1.0-hybrid",
      },
    };

    // If approved, optionally save to DB
    if (decision === "emit") {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const sb = createClient(supabaseUrl, supabaseKey);

      await sb.from("trading_signals").insert({
        symbol: input.symbol,
        direction: input.direction === "CALL" ? "BUY" : input.direction === "PUT" ? "SELL" : input.direction,
        entry_price: input.entry_price,
        timeframe: input.timeframe,
        category: input.category || "forex",
        confidence: confidence,
        strategy_name: input.strategy,
        status: "ACTIVE",
        is_manual: false,
        ai_win_probability: mlProb,
        ai_model_version: "v1.0-hybrid",
        strategy_quality_score: ruleScore,
        market_context_score: marketContext,
        volatility_fit_score: volatilityFit,
        session_fit_score: sessionFit,
        explanation_json: result.explanation,
        expiry_seconds: recommendedExpiry,
        signal_lifecycle: "approved",
        reason: reasons.slice(0, 3).join(", "),
        broker: ["pocket-option", "quotex", "deriv"],
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI scoring error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Scoring failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
