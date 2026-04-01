import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Expiry options by broker type ───
const EXPIRY_OPTIONS: Record<string, number[]> = {
  otc: [30, 60, 120, 300],
  synthetic: [5, 10, 30, 60, 300], // 5/10 = ticks for synthetics
  universal: [60, 180, 300],
};

interface ExpiryFeatures {
  // Price speed
  move_5s: number;
  move_15s: number;
  move_30s: number;
  tick_acceleration: number;
  // Candle structure
  body_ratio: number;
  wick_ratio: number;
  close_position: number; // 0-1 where in candle range
  is_engulfing: boolean;
  is_rejection: boolean;
  // Trend context
  ema_slope: number;
  ma_spacing: number;
  trend_persistence: number;
  // Volatility
  atr_short: number;
  atr_expansion: number;
  compression: number;
  burst_score: number;
  noise_score: number;
  // Market context
  session: string;
  hour: number;
  is_otc: boolean;
}

// ─── Feature extraction from candle data ───
function extractFeatures(candles: any[], symbol: string, broker: string): ExpiryFeatures {
  const len = candles.length;
  const last = candles[len - 1];
  const prev = candles[len - 2];
  const prev2 = candles[len - 3];

  const closes = candles.map((c: any) => c.close);
  const highs = candles.map((c: any) => c.high);
  const lows = candles.map((c: any) => c.low);

  // Price speed (use close deltas as proxy)
  const move_5s = len >= 2 ? Math.abs(closes[len - 1] - closes[len - 2]) : 0;
  const move_15s = len >= 4 ? Math.abs(closes[len - 1] - closes[len - 4]) : 0;
  const move_30s = len >= 7 ? Math.abs(closes[len - 1] - closes[len - 7]) : 0;
  const tick_acceleration = move_5s > 0 && move_15s > 0 ? move_5s / (move_15s / 3) : 1;

  // Candle structure
  const body = Math.abs(last.close - last.open);
  const totalRange = last.high - last.low || 0.0001;
  const body_ratio = body / totalRange;
  const upperWick = last.high - Math.max(last.close, last.open);
  const lowerWick = Math.min(last.close, last.open) - last.low;
  const wick_ratio = (upperWick + lowerWick) / totalRange;
  const close_position = (last.close - last.low) / totalRange;

  const is_engulfing = prev
    ? body > Math.abs(prev.close - prev.open) * 1.2 &&
      ((last.close > last.open && prev.close < prev.open) ||
       (last.close < last.open && prev.close > prev.open))
    : false;

  const is_rejection = wick_ratio > 0.6 && body_ratio < 0.3;

  // Trend context (simple EMA slope proxy)
  const ema20 = closes.slice(-20).reduce((a: number, b: number) => a + b, 0) / Math.min(20, len);
  const ema20_prev = closes.slice(-21, -1).reduce((a: number, b: number) => a + b, 0) / Math.min(20, len - 1);
  const ema_slope = ema20 - ema20_prev;

  const ema50 = closes.slice(-50).reduce((a: number, b: number) => a + b, 0) / Math.min(50, len);
  const ma_spacing = Math.abs(ema20 - ema50) / (ema50 || 1);

  // Trend persistence: count consecutive same-direction candles
  let trend_persistence = 0;
  const lastDir = last.close > last.open ? 1 : -1;
  for (let i = len - 1; i >= 0; i--) {
    const dir = candles[i].close > candles[i].open ? 1 : -1;
    if (dir === lastDir) trend_persistence++;
    else break;
  }

  // Volatility
  const ranges = candles.slice(-14).map((c: any) => c.high - c.low);
  const atr_short = ranges.reduce((a: number, b: number) => a + b, 0) / ranges.length;
  const recent_atr = candles.slice(-5).map((c: any) => c.high - c.low).reduce((a: number, b: number) => a + b, 0) / 5;
  const atr_expansion = atr_short > 0 ? recent_atr / atr_short : 1;
  const compression = atr_expansion < 0.6 ? 1 : 0;
  const burst_score = atr_expansion > 1.5 ? Math.min(1, (atr_expansion - 1.5) / 1.5) : 0;

  // Noise score: ratio of wicks to bodies in recent candles
  const recentCandles = candles.slice(-10);
  const avgWickRatio = recentCandles.reduce((sum: number, c: any) => {
    const r = c.high - c.low || 0.0001;
    const b = Math.abs(c.close - c.open);
    return sum + (1 - b / r);
  }, 0) / recentCandles.length;
  const noise_score = avgWickRatio;

  // Session detection
  const hour = new Date().getUTCHours();
  let session = "off-hours";
  if (hour >= 7 && hour < 16) session = "london";
  else if (hour >= 13 && hour < 21) session = "new-york";
  else if (hour >= 0 && hour < 9) session = "asian";

  const is_otc = symbol.includes("_otc") || broker.includes("pocket") || broker.includes("quotex");

  return {
    move_5s, move_15s, move_30s, tick_acceleration,
    body_ratio, wick_ratio, close_position, is_engulfing, is_rejection,
    ema_slope, ma_spacing, trend_persistence,
    atr_short, atr_expansion, compression, burst_score, noise_score,
    session, hour, is_otc,
  };
}

// ─── Rule-based expiry scorer ───
function scoreExpiry(expirySeconds: number, features: ExpiryFeatures, engineType: string): number {
  let score = 50; // baseline

  // === 30s expiry: needs fast moves, low noise, strong momentum ===
  if (expirySeconds === 30) {
    score += features.tick_acceleration > 1.3 ? 15 : -10;
    score += features.burst_score > 0.3 ? 10 : -5;
    score += features.noise_score < 0.4 ? 10 : -15;
    score += features.body_ratio > 0.6 ? 10 : -5;
    score += features.trend_persistence >= 3 ? 8 : -3;
    score += features.is_engulfing ? 5 : 0;
    score += features.compression ? -15 : 0; // bad for 30s
    // Session penalty
    if (features.session === "off-hours") score -= 10;
  }

  // === 60s expiry: balanced — needs good momentum + clean candles ===
  if (expirySeconds === 60) {
    score += features.body_ratio > 0.5 ? 10 : -3;
    score += features.trend_persistence >= 2 ? 10 : -2;
    score += features.noise_score < 0.5 ? 8 : -8;
    score += features.burst_score > 0.2 ? 8 : 0;
    score += features.is_engulfing ? 10 : 0;
    score += features.is_rejection ? 8 : 0;
    score += features.atr_expansion > 0.8 && features.atr_expansion < 2.0 ? 10 : -5;
    score += features.ma_spacing > 0.001 ? 5 : 0;
    // OTC bonus (most OTC platforms optimized for 60s)
    if (features.is_otc) score += 8;
  }

  // === 120s expiry: needs trend confirmation + S/R context ===
  if (expirySeconds === 120) {
    score += features.trend_persistence >= 3 ? 12 : -3;
    score += features.ema_slope !== 0 ? 8 : -5;
    score += features.ma_spacing > 0.002 ? 10 : 0;
    score += features.noise_score < 0.5 ? 8 : -5;
    score += features.body_ratio > 0.4 ? 5 : -3;
    score += features.burst_score > 0.1 ? 5 : 0;
    score += features.compression ? 5 : 0; // breakout from compression = good for 120s
    score += features.is_rejection ? 10 : 0;
  }

  // === 300s expiry: needs strong trend, works well in sessions ===
  if (expirySeconds === 300) {
    score += features.trend_persistence >= 4 ? 15 : -5;
    score += features.ma_spacing > 0.003 ? 12 : -3;
    score += features.ema_slope !== 0 ? 10 : -8;
    score += features.noise_score < 0.45 ? 8 : -10;
    score += features.session === "london" || features.session === "new-york" ? 10 : -5;
    score += features.burst_score < 0.5 ? 5 : -5; // too volatile = bad for 300s
    score += features.compression ? 8 : 0; // breakout potential
  }

  // === Tick-based (5 ticks, 10 ticks) — synthetics only ===
  if (expirySeconds === 5 && engineType === "synthetic") {
    score += features.tick_acceleration > 1.5 ? 15 : -5;
    score += features.body_ratio > 0.7 ? 12 : -5;
    score += features.noise_score < 0.3 ? 10 : -15;
    score += features.trend_persistence >= 2 ? 10 : -3;
  }

  if (expirySeconds === 10 && engineType === "synthetic") {
    score += features.trend_persistence >= 2 ? 12 : -3;
    score += features.body_ratio > 0.5 ? 8 : -3;
    score += features.noise_score < 0.4 ? 8 : -10;
    score += features.tick_acceleration > 1.2 ? 10 : -3;
    score += features.is_engulfing ? 8 : 0;
  }

  // === 180s expiry (universal engine) ===
  if (expirySeconds === 180) {
    score += features.trend_persistence >= 3 ? 10 : -3;
    score += features.ma_spacing > 0.002 ? 8 : -2;
    score += features.noise_score < 0.5 ? 8 : -5;
    score += features.is_rejection ? 8 : 0;
    score += features.burst_score > 0.1 && features.burst_score < 0.8 ? 8 : -3;
  }

  // Clamp
  return Math.max(0, Math.min(100, score));
}

// ─── Main handler ───
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json();
    const {
      signal_id,
      symbol = "EURUSD",
      broker = "pocket-option",
      engine_type = "otc",
      candles = [],
      direction = "BUY",
      confidence = 70,
      strategy_name = "",
    } = body;

    if (!candles || candles.length < 10) {
      return new Response(
        JSON.stringify({ error: "Need at least 10 candles for expiry evaluation" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const features = extractFeatures(candles, symbol, broker);
    const expiries = EXPIRY_OPTIONS[engine_type] || EXPIRY_OPTIONS.otc;

    // Score each expiry
    const predictions = expiries.map((expirySeconds) => {
      const rawScore = scoreExpiry(expirySeconds, features, engine_type);

      // Fetch historical performance boost (if available)
      // For now use raw score as calibrated
      const calibrated = rawScore / 100;

      return {
        expiry_seconds: expirySeconds,
        win_probability: rawScore / 100,
        calibrated_probability: calibrated,
        score: rawScore,
      };
    });

    // Sort by score descending
    predictions.sort((a, b) => b.score - a.score);

    // Mark best and backup
    const best = predictions[0];
    const backup = predictions.length > 1 ? predictions[1] : null;

    // Check if we should trade at all
    const MIN_THRESHOLD = 0.55;
    const MIN_GAP = 0.05;
    const shouldTrade = best.calibrated_probability >= MIN_THRESHOLD;
    const hasMargin = backup
      ? best.calibrated_probability - backup.calibrated_probability >= MIN_GAP
      : true;

    const result = {
      symbol,
      broker,
      engine_type,
      direction,
      best_expiry: shouldTrade ? best.expiry_seconds : null,
      best_probability: best.calibrated_probability,
      backup_expiry: backup?.expiry_seconds || null,
      backup_probability: backup?.calibrated_probability || null,
      should_trade: shouldTrade,
      has_margin: hasMargin,
      all_predictions: predictions.map((p) => ({
        expiry_seconds: p.expiry_seconds,
        win_probability: Math.round(p.win_probability * 100),
        calibrated_probability: Math.round(p.calibrated_probability * 100),
        is_recommended: p === best && shouldTrade,
        is_backup: p === backup && shouldTrade,
      })),
      features_snapshot: features,
    };

    // Save predictions to DB if we have a signal_id
    if (signal_id) {
      // Get asset_id
      const { data: asset } = await supabase
        .from("assets")
        .select("id")
        .eq("symbol", symbol.replace("_otc", ""))
        .maybeSingle();

      for (const pred of predictions) {
        await supabase.from("expiry_model_predictions").insert({
          signal_candidate_id: signal_id,
          asset_id: asset?.id || null,
          broker_slug: broker,
          expiry_seconds: pred.expiry_seconds,
          win_probability: pred.win_probability,
          calibrated_probability: pred.calibrated_probability,
          is_recommended: pred === best && shouldTrade,
          is_backup: pred === backup && shouldTrade,
          features_json: features,
        });
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Expiry evaluation error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
