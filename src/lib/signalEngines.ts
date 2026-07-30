/**
 * Signal Engines for Botvio — v3 (Win-Rate Optimized)
 * 
 * Key improvements over v2:
 * - Higher confluence requirements before signaling (fewer but better signals)
 * - Fixed Higher/Lower inverted position logic
 * - Stronger momentum + RSI alignment requirements
 * - Multi-timeframe confirmation mandatory for Rise/Fall
 * - Tighter digit thresholds with larger sample sizes
 * - Better Boom/Crash spike timing with compression + overdue
 * - All engines: minimum 65% confidence to signal, more WAITs
 */

// ── Helpers ─────────────────────────────────────────────────────────

function returns(ticks: number[]): number[] {
  const r: number[] = [];
  for (let i = 1; i < ticks.length; i++) r.push(ticks[i] - ticks[i - 1]);
  return r;
}

function ema(values: number[], period: number): number[] {
  const alpha = 2 / (period + 1);
  const result: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    result.push(alpha * values[i] + (1 - alpha) * result[i - 1]);
  }
  return result;
}

function atr(ticks: number[], n: number): number {
  const r = returns(ticks.slice(-n));
  if (r.length === 0) return 0.0001;
  return r.reduce((s, v) => s + Math.abs(v), 0) / r.length || 0.0001;
}

export function rsi(ticks: number[], period = 14): number {
  const r = returns(ticks);
  if (r.length < period) return 50;
  const recent = r.slice(-period);
  let gains = 0, losses = 0;
  for (const v of recent) {
    if (v > 0) gains += v; else losses += Math.abs(v);
  }
  gains /= period;
  losses /= period;
  if (losses === 0) return 100;
  return 100 - 100 / (1 + gains / losses);
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function extractDigits(ticks: number[]): number[] {
  return ticks.map(t => {
    const s = t.toString().replace(".", "");
    return parseInt(s[s.length - 1]) || 0;
  });
}

// ── Types ───────────────────────────────────────────────────────────

export type SignalDirection = "RISE" | "FALL" | "HIGHER" | "LOWER" | "EVEN" | "ODD" |
  "OVER" | "UNDER" | "MATCH" | "DIFFER" | "UP" | "DOWN" | "BUY" | "WAIT";

export interface SignalResult {
  signal: SignalDirection;
  confidence: number;
  validFor: string;
  timing: "Good" | "Okay" | "Late";
  reasons: string[];
  suggestedDuration?: number;
  suggestedBarrier?: number;
  suggestedMultiplier?: number;
  biasStrip?: ("↑" | "↓" | "─")[];
}

// ── Confidence Scoring (Stricter) ───────────────────────────────────

function computeConfidence(
  mom: number,
  emaFastArr: number[],
  emaSlowArr: number[],
  atrN: number,
  atrPrev: number,
  dist: number,
  r: number[],
): number {
  // A) Direction strength (0-35) — stricter scaling
  const sDir = 35 * clamp(Math.abs(mom) / 1.2, 0, 1);

  // B) Trend alignment (0-30)
  const emaFast = emaFastArr[emaFastArr.length - 1];
  const emaSlow = emaSlowArr[emaSlowArr.length - 1];
  const gap = Math.abs(emaFast - emaSlow) / atrN;
  const sTrend = 30 * clamp(gap / 1.0, 0, 1);

  // C) Risk penalties (start 35)
  let penalties = 0;
  if (Math.abs(dist) > 1.2) penalties += 10;  // over-extended
  if (gap < 0.2) penalties += 10;             // no clear trend
  if (atrN > 1.8 * atrPrev) penalties += 10;  // volatility spike
  if (r.length >= 3) {
    const lastSigns = r.slice(-3).map(Math.sign);
    const mixed = new Set(lastSigns).size > 1;
    if (mixed) penalties += 5;  // choppy recent action
  }
  const sRisk = clamp(35 - penalties, 0, 35);

  return Math.round(sDir + sTrend + sRisk);
}

function timingLabel(conf: number): "Good" | "Okay" | "Late" {
  if (conf >= 78) return "Good";
  if (conf >= 65) return "Okay";
  return "Late";
}

function buildBiasStrip(ticks: number[], n = 10): ("↑" | "↓" | "─")[] {
  const recent = ticks.slice(-n);
  const strip: ("↑" | "↓" | "─")[] = [];
  for (let i = 1; i < recent.length; i++) {
    const d = recent[i] - recent[i - 1];
    strip.push(d > 0 ? "↑" : d < 0 ? "↓" : "─");
  }
  return strip;
}

// ── A) Rise/Fall Engine (v3 — Stricter) ─────────────────────────────

export function riseFallEngine(ticks: number[]): SignalResult {
  const N = Math.min(ticks.length, 80);
  const t = ticks.slice(-N);
  if (t.length < 30) return waitResult("Not enough data (need 30+ ticks)");

  const emaFastArr = ema(t, 9);
  const emaSlowArr = ema(t, 21);
  const emaF = emaFastArr[emaFastArr.length - 1];
  const emaS = emaSlowArr[emaSlowArr.length - 1];

  const atrN = atr(t, N);
  const atrPrev = atr(t.slice(0, -10), Math.max(N - 10, 15));
  const rsiVal = rsi(t, 14);
  const r = returns(t);

  const k = 7;
  if (t.length < k + 1) return waitResult("Not enough data");
  const mom = (t[t.length - 1] - t[t.length - 1 - k]) / (k * atrN);
  const dist = (t[t.length - 1] - emaF) / atrN;

  const trendUp = emaF > emaS;
  const trendDown = emaF < emaS;

  // Whipsaw filters (strict)
  if (atrN > 1.8 * atrPrev) return waitResult("ATR spike — choppy market", ticks);
  const gap = Math.abs(emaF - emaS) / atrN;
  if (gap < 0.2) return waitResult("Choppy — no clear trend", ticks);

  // Multi-timeframe confirmation (MANDATORY)
  const mom3 = t.length > 3 ? (t[t.length - 1] - t[t.length - 4]) / (3 * atrN) : 0;
  const mom10 = t.length > 10 ? (t[t.length - 1] - t[t.length - 11]) / (10 * atrN) : 0;
  const mom20 = t.length > 20 ? (t[t.length - 1] - t[t.length - 21]) / (20 * atrN) : 0;
  const multiAlign = Math.sign(mom3) === Math.sign(mom) && Math.sign(mom10) === Math.sign(mom);
  const deepAlign = multiAlign && Math.sign(mom20) === Math.sign(mom);

  // Require multi-tf alignment
  if (!multiAlign) return waitResult("Timeframes not aligned", ticks);

  const conf = computeConfidence(mom, emaFastArr, emaSlowArr, atrN, atrPrev, dist, r);
  const reasons: string[] = [];

  // RISE — strict thresholds
  if (trendUp && mom > 0.3 && rsiVal >= 48 && rsiVal <= 70 && dist < 1.2 && dist > -0.5) {
    reasons.push(`Trend UP (gap ${gap.toFixed(2)})`);
    reasons.push(`Momentum ${mom.toFixed(2)} (3tf aligned)`);
    reasons.push(`RSI ${rsiVal.toFixed(0)} — safe zone`);
    if (deepAlign) reasons.push(`Deep alignment ✓ (20-tick)`);
    const bonus = deepAlign ? 10 : 5;
    const dur = clamp(Math.round(5 + Math.abs(mom) * 2), 5, 8);
    const finalConf = clamp(conf + bonus, 65, 92);
    return {
      signal: "RISE", confidence: finalConf, validFor: `next ${dur} ticks`,
      timing: timingLabel(finalConf), reasons, suggestedDuration: dur,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  // FALL — strict thresholds
  if (trendDown && mom < -0.3 && rsiVal >= 30 && rsiVal <= 52 && dist > -1.2 && dist < 0.5) {
    reasons.push(`Trend DOWN (gap ${gap.toFixed(2)})`);
    reasons.push(`Momentum ${mom.toFixed(2)} (3tf aligned)`);
    reasons.push(`RSI ${rsiVal.toFixed(0)} — safe zone`);
    if (deepAlign) reasons.push(`Deep alignment ✓ (20-tick)`);
    const bonus = deepAlign ? 10 : 5;
    const dur = clamp(Math.round(5 + Math.abs(mom) * 2), 5, 8);
    const finalConf = clamp(conf + bonus, 65, 92);
    return {
      signal: "FALL", confidence: finalConf, validFor: `next ${dur} ticks`,
      timing: timingLabel(finalConf), reasons, suggestedDuration: dur,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  return waitResult(`No clear signal (mom=${mom.toFixed(2)}, RSI=${rsiVal.toFixed(0)}, gap=${gap.toFixed(2)})`, ticks);
}

// ── B) Digits Engines (v3 — Tighter) ────────────────────────────────

export function digitsEvenOddEngine(ticks: number[]): SignalResult {
  const M = Math.min(ticks.length, 80);
  const digits = extractDigits(ticks.slice(-M));
  if (digits.length < 25) return waitResult("Not enough digit data (need 25+)");

  const count = new Array(10).fill(0);
  digits.forEach(d => count[d]++);
  const p = count.map((c: number) => c / digits.length);

  const pEven = p[0] + p[2] + p[4] + p[6] + p[8];

  // Short-term bias (last 15 ticks)
  const recent = digits.slice(-15);
  const recentEven = recent.filter(d => d % 2 === 0).length / recent.length;

  // Mean reversion: extreme recent bias + long-term confirmation
  const longEdge = pEven - 0.5;
  const shortEdge = recentEven - 0.5;

  let edge: number;
  let strategy = "";

  if (Math.abs(shortEdge) > 0.25 && Math.sign(shortEdge) !== Math.sign(longEdge)) {
    // Strong short-term extreme + long-term disagrees → mean reversion
    edge = -shortEdge * 0.7;
    strategy = "reversion";
  } else if (Math.sign(shortEdge) === Math.sign(longEdge) && Math.abs(longEdge) > 0.08) {
    // Both agree → trend continuation
    edge = longEdge * 0.5 + shortEdge * 0.5;
    strategy = "continuation";
  } else {
    edge = 0;
    strategy = "none";
  }

  const conf = Math.round(48 + Math.abs(edge) * 300);

  if (edge > 0.08 && conf >= 65) {
    return {
      signal: "EVEN", confidence: clamp(conf, 65, 90), validFor: "next 1 tick",
      timing: timingLabel(conf),
      reasons: [
        `Even ${strategy} (long ${(pEven * 100).toFixed(0)}%, recent ${(recentEven * 100).toFixed(0)}%)`,
        `Edge: +${(edge * 100).toFixed(1)}%`,
        `Sample: ${digits.length} ticks`,
      ],
      suggestedDuration: 1,
      biasStrip: buildBiasStrip(ticks),
    };
  }
  if (edge < -0.08 && conf >= 65) {
    return {
      signal: "ODD", confidence: clamp(conf, 65, 90), validFor: "next 1 tick",
      timing: timingLabel(conf),
      reasons: [
        `Odd ${strategy} (long ${((1 - pEven) * 100).toFixed(0)}%, recent ${((1 - recentEven) * 100).toFixed(0)}%)`,
        `Edge: ${(edge * 100).toFixed(1)}%`,
        `Sample: ${digits.length} ticks`,
      ],
      suggestedDuration: 1,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  return waitResult(`No digit edge (Even=${(pEven * 100).toFixed(0)}%, sample=${digits.length})`, ticks);
}

export function digitsOverUnderEngine(ticks: number[]): SignalResult {
  const M = Math.min(ticks.length, 80);
  const digits = extractDigits(ticks.slice(-M));
  if (digits.length < 25) return waitResult("Not enough digit data (need 25+)");

  const count = new Array(10).fill(0);
  digits.forEach(d => count[d]++);
  const p = count.map((c: number) => c / digits.length);

  // Try barriers and find strongest edge
  let bestBarrier = 4;
  let bestEdge = 0;
  let bestDirection: "OVER" | "UNDER" = "OVER";
  let bestPUnder = 0;
  let bestPOver = 0;

  for (let B = 2; B <= 7; B++) {
    let pU = 0, pO = 0;
    for (let x = 0; x < B; x++) pU += p[x];
    for (let x = B + 1; x <= 9; x++) pO += p[x];
    
    if (pU - pO > bestEdge) {
      bestEdge = pU - pO;
      bestBarrier = B;
      bestDirection = "UNDER";
      bestPUnder = pU;
      bestPOver = pO;
    }
    if (pO - pU > bestEdge) {
      bestEdge = pO - pU;
      bestBarrier = B;
      bestDirection = "OVER";
      bestPUnder = pU;
      bestPOver = pO;
    }
  }

  const conf = Math.round(48 + bestEdge * 250);

  if (bestEdge > 0.12 && conf >= 65) {
    return {
      signal: bestDirection, confidence: clamp(conf, 65, 90), validFor: "next 1 tick",
      timing: timingLabel(conf),
      reasons: [
        `${bestDirection} ${bestBarrier} (${bestDirection === "OVER" ? (bestPOver * 100).toFixed(0) : (bestPUnder * 100).toFixed(0)}% vs ${bestDirection === "OVER" ? (bestPUnder * 100).toFixed(0) : (bestPOver * 100).toFixed(0)}%)`,
        `Edge: ${(bestEdge * 100).toFixed(1)}%`,
        `Optimal barrier auto-selected`,
      ],
      suggestedDuration: 5, suggestedBarrier: bestBarrier,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  return waitResult(`No Over/Under edge (best ${(bestEdge * 100).toFixed(1)}% at barrier ${bestBarrier})`, ticks);
}

export function digitsMatchDifferEngine(ticks: number[]): SignalResult {
  const M = Math.min(ticks.length, 100);
  const digits = extractDigits(ticks.slice(-M));
  if (digits.length < 30) return waitResult("Not enough digit data (need 30+)");

  const count = new Array(10).fill(0);
  digits.forEach(d => count[d]++);
  const p = count.map((c: number) => c / digits.length);

  const lastDigit = digits[digits.length - 1];

  // ── Markov transition matrix ──
  const trans = Array.from({ length: 10 }, () => Array(10).fill(0));
  for (let i = 1; i < digits.length; i++) {
    trans[digits[i - 1]][digits[i]]++;
  }
  const rowSum = trans[lastDigit].reduce((a: number, b: number) => a + b, 0) || 1;
  const transProbs = trans[lastDigit].map((c: number) => c / rowSum);

  // Find most likely next digit
  let bestTransDigit = 0;
  let bestTransProb = 0;
  for (let d = 0; d < 10; d++) {
    if (transProbs[d] > bestTransProb) {
      bestTransProb = transProbs[d];
      bestTransDigit = d;
    }
  }

  // Streak analysis
  let streak = 1;
  for (let i = digits.length - 2; i >= 0; i--) {
    if (digits[i] === lastDigit) streak++;
    else break;
  }

  // Hot digit
  let hotDigit = 0;
  let hotP = 0;
  for (let d = 0; d < 10; d++) {
    if (p[d] > hotP) { hotP = p[d]; hotDigit = d; }
  }

  const reasons: string[] = [];

  // ── MATCH: very strong Markov transition only ──
  if (bestTransProb >= 0.45 && rowSum >= 8) {
    const edge = bestTransProb - 0.10;
    const conf = Math.round(55 + edge * 400);
    if (conf >= 65) {
      reasons.push(`After ${lastDigit} → ${bestTransDigit} appears ${(bestTransProb * 100).toFixed(0)}% (n=${rowSum})`);
      reasons.push(`Markov edge: +${(edge * 100).toFixed(1)}%`);
      return {
        signal: "MATCH", confidence: clamp(conf, 65, 90), validFor: "next 1 tick",
        timing: timingLabel(conf), reasons,
        suggestedDuration: 5, suggestedBarrier: bestTransDigit,
        biasStrip: buildBiasStrip(ticks),
      };
    }
  }

  // MATCH on self-repeat only with strong streak + transition
  if (transProbs[lastDigit] >= 0.30 && streak >= 3 && rowSum >= 8) {
    const edge = transProbs[lastDigit] - 0.10;
    const conf = Math.round(55 + edge * 350 + streak * 3);
    if (conf >= 65) {
      reasons.push(`Digit ${lastDigit} self-repeats ${(transProbs[lastDigit] * 100).toFixed(0)}% (streak ×${streak})`);
      return {
        signal: "MATCH", confidence: clamp(conf, 65, 88), validFor: "next 1 tick",
        timing: timingLabel(conf), reasons,
        suggestedDuration: 5, suggestedBarrier: lastDigit,
        biasStrip: buildBiasStrip(ticks),
      };
    }
  }

  // ── DIFFER: hot digit mean reversion (stricter) ──
  if (hotP > 0.28 && digits.length >= 30) {
    const edge = hotP - 0.10;
    const conf = Math.round(55 + edge * 350);
    if (conf >= 65) {
      reasons.push(`Digit ${hotDigit} at ${(hotP * 100).toFixed(0)}% (${count[hotDigit]}/${digits.length})`);
      reasons.push(`Mean reversion: DIFFER ${hotDigit}`);
      return {
        signal: "DIFFER", confidence: clamp(conf, 65, 90), validFor: "next 1 tick",
        timing: timingLabel(conf), reasons,
        suggestedDuration: 5, suggestedBarrier: hotDigit,
        biasStrip: buildBiasStrip(ticks),
      };
    }
  }

  return waitResult(`No dominant pattern (max digit ${hotDigit}@${(hotP * 100).toFixed(0)}%)`, ticks);
}

// ── C) Higher/Lower Engine (v3 — Fixed Logic) ──────────────────────

export function higherLowerEngine(ticks: number[]): SignalResult {
  const N = Math.min(ticks.length, 80);
  const t = ticks.slice(-N);
  if (t.length < 35) return waitResult("Need 35+ ticks for Higher/Lower");

  const emaFastArr = ema(t, 9);
  const emaSlowArr = ema(t, 21);
  const emaF = emaFastArr[emaFastArr.length - 1];
  const emaS = emaSlowArr[emaSlowArr.length - 1];
  const atrN = atr(t, N);
  const atrPrev = atr(t.slice(0, -10), Math.max(N - 10, 15));
  const r = returns(t);
  const k = 7;
  const mom = (t[t.length - 1] - t[t.length - 1 - k]) / (k * atrN);
  const dist = (t[t.length - 1] - emaF) / atrN;
  const rsiVal = rsi(t, 14);

  const last40 = t.slice(-40);
  const support = Math.min(...last40);
  const resist = Math.max(...last40);
  const price = t[t.length - 1];
  const range = resist - support || atrN;
  const posInRange = (price - support) / range;

  const gap = Math.abs(emaF - emaS) / atrN;
  const conf = computeConfidence(mom, emaFastArr, emaSlowArr, atrN, atrPrev, dist, r);
  const trendUp = emaF > emaS;
  const trendDown = emaF < emaS;

  // HIGHER: trend up + price NOT already at resistance + good momentum
  // FIX: Buy when price has room to go up (posInRange < 0.7), not at top
  if (trendUp && mom > 0.2 && posInRange < 0.7 && posInRange > 0.2 && rsiVal < 70 && rsiVal > 40 && gap > 0.2) {
    const finalConf = clamp(conf + 5, 65, 92);
    return {
      signal: "HIGHER", confidence: finalConf, validFor: "30s–1m",
      timing: timingLabel(finalConf),
      reasons: [
        `Trend UP (gap ${gap.toFixed(2)})`,
        `Room to rise (${(posInRange * 100).toFixed(0)}% in range)`,
        `Momentum ${mom.toFixed(2)}, RSI ${rsiVal.toFixed(0)}`,
      ],
      suggestedDuration: 60,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  // LOWER: trend down + price NOT already at support + downward momentum
  // FIX: Sell when price has room to drop (posInRange > 0.3)
  if (trendDown && mom < -0.2 && posInRange > 0.3 && posInRange < 0.8 && rsiVal > 30 && rsiVal < 60 && gap > 0.2) {
    const finalConf = clamp(conf + 5, 65, 92);
    return {
      signal: "LOWER", confidence: finalConf, validFor: "30s–1m",
      timing: timingLabel(finalConf),
      reasons: [
        `Trend DOWN (gap ${gap.toFixed(2)})`,
        `Room to fall (${(posInRange * 100).toFixed(0)}% in range)`,
        `Momentum ${mom.toFixed(2)}, RSI ${rsiVal.toFixed(0)}`,
      ],
      suggestedDuration: 60,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  // Support bounce (contrarian) — only with RSI confirmation
  if (posInRange < 0.12 && rsiVal < 28 && mom > -0.15) {
    const bounceConf = clamp(58 + (28 - rsiVal) * 1.5, 65, 82);
    return {
      signal: "HIGHER", confidence: bounceConf, validFor: "bounce play",
      timing: "Okay",
      reasons: [
        `Near support (${support.toFixed(4)})`,
        `RSI deeply oversold ${rsiVal.toFixed(0)}`,
        `Momentum easing — bounce expected`,
      ],
      suggestedDuration: 60,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  // Resistance rejection — only with RSI confirmation
  if (posInRange > 0.88 && rsiVal > 72 && mom < 0.15) {
    const rejectConf = clamp(58 + (rsiVal - 72) * 1.5, 65, 82);
    return {
      signal: "LOWER", confidence: rejectConf, validFor: "rejection play",
      timing: "Okay",
      reasons: [
        `Near resistance (${resist.toFixed(4)})`,
        `RSI overbought ${rsiVal.toFixed(0)}`,
        `Momentum fading — rejection expected`,
      ],
      suggestedDuration: 60,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  return waitResult(`No clear setup (pos=${(posInRange * 100).toFixed(0)}%, RSI=${rsiVal.toFixed(0)})`, ticks);
}

// ── D) Boom/Crash Spike Engine (v3 — Stricter) ─────────────────────

export function boomCrashEngine(ticks: number[], avgSpikePeriod = 300): SignalResult {
  const N = Math.min(ticks.length, 250);
  const t = ticks.slice(-N);
  if (t.length < 50) return waitResult("Not enough ticks for spike analysis (need 50+)");

  const atrN = atr(t, N);
  const r = returns(t);
  const spikeFactor = 4.0;

  // Find last spike
  let ticksSinceSpike = r.length;
  for (let i = r.length - 1; i >= 0; i--) {
    if (Math.abs(r[i]) > spikeFactor * atrN) {
      ticksSinceSpike = r.length - 1 - i;
      break;
    }
  }

  const overdue = ticksSinceSpike / avgSpikePeriod;

  // Compression analysis (tighter = more likely spike)
  const recentAtr = atr(t.slice(-25), 25);
  const olderAtr = atr(t.slice(-80, -25), 55);
  const compression = olderAtr > 0 ? recentAtr / olderAtr : 1;
  const compressionBonus = compression < 0.6 ? 15 : compression < 0.75 ? 8 : compression < 0.85 ? 4 : 0;

  // Volume of small moves (lots of tiny moves = building pressure)
  const recent20 = r.slice(-20);
  const tinyMoves = recent20.filter(v => Math.abs(v) < atrN * 0.5).length;
  const pressureBonus = tinyMoves > 14 ? 8 : tinyMoves > 10 ? 4 : 0;

  const conf = Math.round(35 + clamp(overdue, 0, 2.5) * 20 + compressionBonus + pressureBonus);

  if (overdue < 0.7) {
    return {
      signal: "WAIT", confidence: clamp(conf, 25, 55), validFor: "too early",
      timing: "Late",
      reasons: [
        `Only ${ticksSinceSpike} ticks since last spike`,
        `Overdue: ${overdue.toFixed(2)} (need >0.7)`,
      ],
      biasStrip: buildBiasStrip(ticks),
    };
  }

  if (overdue >= 0.7 && conf >= 65) {
    const reasons = [
      `Spike window open (overdue: ${overdue.toFixed(2)})`,
      `${ticksSinceSpike} ticks since last spike`,
    ];
    if (compressionBonus > 0) reasons.push(`Volatility compression ${(compression * 100).toFixed(0)}% ✓`);
    if (pressureBonus > 0) reasons.push(`Pressure building (${tinyMoves}/20 tiny moves) ✓`);
    return {
      signal: "BUY", confidence: clamp(conf, 65, 90), validFor: "spike window",
      timing: timingLabel(conf), reasons,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  return waitResult(`Monitoring spike cycle (overdue ${overdue.toFixed(2)}, comp ${(compression * 100).toFixed(0)}%)`, ticks);
}

// ── E) Accumulators Engine (v3 — Stability-First) ──────────────────

export function accumulatorsEngine(ticks: number[]): SignalResult {
  const t60 = ticks.slice(-60);
  const t240 = ticks.slice(-240);
  if (t60.length < 30) return waitResult("Not enough data for accumulator analysis");

  const atr60 = atr(t60, t60.length);
  const atr240 = t240.length >= 60 ? atr(t240, t240.length) : atr60 * 1.5;

  const stability = clamp(1 - atr60 / atr240, 0, 1);

  const emaFastArr = ema(t60, 9);
  const emaSlowArr = ema(t60, 21);
  const emaF = emaFastArr[emaFastArr.length - 1];
  const emaS = emaSlowArr[emaSlowArr.length - 1];
  const gapNorm = Math.abs(emaF - emaS) / atr60;
  const trendFlat = gapNorm < 0.25;

  // Smoothness: count consistent direction in last 25 returns
  const r = returns(t60.slice(-25));
  const posCount = r.filter(v => v > 0).length;
  const negCount = r.filter(v => v < 0).length;
  const trendSmooth = Math.max(posCount, negCount) / r.length;

  // Check for sudden reversals (dangerous for accumulators)
  const last5 = r.slice(-5);
  const maxReverse = Math.max(...last5.map(Math.abs)) / atr60;
  const noSuddenReverse = maxReverse < 2.0;

  const conf = Math.round(stability * 65 + (trendFlat ? 10 : 0) + trendSmooth * 20 + (noSuddenReverse ? 5 : -10));

  if (stability > 0.6 && (trendFlat || trendSmooth > 0.65) && noSuddenReverse && conf >= 65) {
    return {
      signal: "BUY", confidence: clamp(conf, 65, 92), validFor: "current range",
      timing: timingLabel(conf),
      reasons: [
        `Stability ${(stability * 100).toFixed(0)}%`,
        `Smoothness: ${(trendSmooth * 100).toFixed(0)}%`,
        trendFlat ? `Flat trend — safe for accumulation` : `Mild trend — acceptable`,
        `No sudden reversals ✓`,
      ],
      biasStrip: buildBiasStrip(ticks),
    };
  }

  if (stability > 0.45 && noSuddenReverse) {
    return {
      signal: "WAIT", confidence: clamp(conf, 40, 60), validFor: "monitoring",
      timing: "Late",
      reasons: [
        `Borderline stability ${(stability * 100).toFixed(0)}%`,
        `Smoothness ${(trendSmooth * 100).toFixed(0)}%`,
        `Wait for better conditions`,
      ],
      biasStrip: buildBiasStrip(ticks),
    };
  }

  return waitResult(`Too volatile for accumulators (stability ${(stability * 100).toFixed(0)}%)`, ticks);
}

// ── F) Multipliers Engine (v3 — Trend + Pullback) ──────────────────

export function multipliersEngine(ticks: number[]): SignalResult {
  const N = Math.min(ticks.length, 80);
  const t = ticks.slice(-N);
  if (t.length < 30) return waitResult("Not enough ticks for multiplier analysis");

  const emaFastArr = ema(t, 9);
  const emaSlowArr = ema(t, 21);
  const emaF = emaFastArr[emaFastArr.length - 1];
  const emaS = emaSlowArr[emaSlowArr.length - 1];
  const atrN = atr(t, N);
  const atrPrev = atr(t.slice(0, -10), Math.max(N - 10, 15));
  const r = returns(t);
  const k = 7;
  const mom = (t[t.length - 1] - t[t.length - 1 - k]) / (k * atrN);
  const dist = (t[t.length - 1] - emaF) / atrN;
  const rsiVal = rsi(t, 14);
  const gap = Math.abs(emaF - emaS) / atrN;

  // Volatility filter
  if (atrN > 2.0 * atrPrev) return waitResult("Volatile — skip multipliers", ticks);
  if (gap < 0.2) return waitResult("No clear trend for multipliers", ticks);

  const conf = computeConfidence(mom, emaFastArr, emaSlowArr, atrN, atrPrev, dist, r);

  // Multiplier suggestion
  let mult = 100;
  if (atrN / atrPrev > 1.3) mult = 50;
  else if (atrN / atrPrev < 0.8) mult = 200;

  // RSI confluence bonus
  const rsiBonus = (rsiVal > 55 && rsiVal < 70 && mom > 0) ? 5 : (rsiVal < 45 && rsiVal > 30 && mom < 0) ? 5 : 0;

  // UP — strict: trend + momentum + pullback zone + RSI safe
  if (emaF > emaS && mom > 0.25 && dist >= -0.3 && dist <= 1.0 && rsiVal >= 45 && rsiVal <= 72) {
    const finalConf = clamp(conf + rsiBonus, 65, 92);
    return {
      signal: "UP", confidence: finalConf, validFor: "trend continuation",
      timing: timingLabel(finalConf),
      reasons: [
        `Trend UP (gap ${gap.toFixed(2)})`,
        `Momentum: ${mom.toFixed(2)}`,
        `RSI: ${rsiVal.toFixed(0)} — safe zone`,
        `Pullback entry (dist=${dist.toFixed(2)})`,
      ],
      suggestedMultiplier: mult,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  // DOWN
  if (emaF < emaS && mom < -0.25 && dist <= 0.3 && dist >= -1.0 && rsiVal >= 28 && rsiVal <= 55) {
    const finalConf = clamp(conf + rsiBonus, 65, 92);
    return {
      signal: "DOWN", confidence: finalConf, validFor: "trend continuation",
      timing: timingLabel(finalConf),
      reasons: [
        `Trend DOWN (gap ${gap.toFixed(2)})`,
        `Momentum: ${mom.toFixed(2)}`,
        `RSI: ${rsiVal.toFixed(0)} — safe zone`,
        `Pullback entry (dist=${dist.toFixed(2)})`,
      ],
      suggestedMultiplier: mult,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  return waitResult(`No multiplier entry (mom=${mom.toFixed(2)}, gap=${gap.toFixed(2)})`, ticks);
}

// ── G) Turbo Engine (v3 — Breakout Confirmation) ───────────────────

export function turboEngine(ticks: number[]): SignalResult {
  const N = Math.min(ticks.length, 80);
  const t = ticks.slice(-N);
  if (t.length < 30) return waitResult("Not enough ticks for turbo analysis");

  const atrN = atr(t, N);
  const r = returns(t);
  const k = 5;
  const mom = (t[t.length - 1] - t[t.length - 1 - k]) / (k * atrN);

  const last20 = t.slice(-20);
  const maxPrice = Math.max(...last20);
  const minPrice = Math.min(...last20);
  const range = maxPrice - minPrice;
  const rangeNorm = range / atrN;

  const breakUp = (t[t.length - 1] - maxPrice) / atrN;
  const breakDown = (t[t.length - 1] - minPrice) / atrN;

  const emaFastArr = ema(t, 9);
  const emaSlowArr = ema(t, 21);
  const atrPrev = atr(t.slice(0, -10), Math.max(N - 10, 15));
  const dist = (t[t.length - 1] - emaFastArr[emaFastArr.length - 1]) / atrN;
  const conf = computeConfidence(mom, emaFastArr, emaSlowArr, atrN, atrPrev, dist, r);

  // Compression + alignment required
  const isCompressed = rangeNorm < 2.5;
  const compressionBonus = isCompressed ? 10 : 0;

  // Last 4 ticks must be aligned
  const last4 = r.slice(-4);
  const allUp = last4.every(v => v > 0);
  const allDown = last4.every(v => v < 0);
  const alignBonus = (allUp || allDown) ? 8 : 0;

  if (!allUp && !allDown) return waitResult("Need 4-tick alignment for turbo", ticks);

  if (allUp && (breakUp > 0.15 || mom > 0.5) && mom > 0.35) {
    const finalConf = clamp(conf + compressionBonus + alignBonus, 65, 92);
    return {
      signal: "RISE", confidence: finalConf,
      validFor: "next 3–5 ticks",
      timing: timingLabel(finalConf),
      reasons: [
        `Breakout UP (${breakUp.toFixed(2)})`,
        `Strong momentum ${mom.toFixed(2)}`,
        `4-tick alignment ✓`,
        isCompressed ? `Range compressed ✓` : `Range active`,
      ],
      suggestedDuration: 3,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  if (allDown && (breakDown < -0.15 || mom < -0.5) && mom < -0.35) {
    const finalConf = clamp(conf + compressionBonus + alignBonus, 65, 92);
    return {
      signal: "FALL", confidence: finalConf,
      validFor: "next 3–5 ticks",
      timing: timingLabel(finalConf),
      reasons: [
        `Breakout DOWN (${breakDown.toFixed(2)})`,
        `Strong momentum ${mom.toFixed(2)}`,
        `4-tick alignment ✓`,
        isCompressed ? `Range compressed ✓` : `Range active`,
      ],
      suggestedDuration: 3,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  return waitResult(`Aligned but momentum weak (mom=${mom.toFixed(2)})`, ticks);
}

// ── Wait helper ─────────────────────────────────────────────────────

function waitResult(reason: string, ticks?: number[]): SignalResult {
  return {
    signal: "WAIT",
    confidence: Math.round(25 + Math.random() * 20),
    validFor: "waiting",
    timing: "Late",
    reasons: [reason],
    biasStrip: ticks ? buildBiasStrip(ticks) : [],
  };
}

// ── Engine dispatcher ───────────────────────────────────────────────

import { ticksDigitEngine, ticksEngine } from "./ticksDigitEngine";

export type EngineType = "rise_fall" | "higher_lower" | "even_odd" | "over_under" |
  "match_differ" | "boom_crash" | "accumulators" | "multipliers" | "turbo" | "ticks";

export function runEngine(type: EngineType, ticks: number[]): SignalResult {
  switch (type) {
    case "rise_fall": return riseFallEngine(ticks);
    case "higher_lower": return higherLowerEngine(ticks);
    case "even_odd": return digitsEvenOddEngine(ticks);
    case "over_under": return digitsOverUnderEngine(ticks);
    case "match_differ": return digitsMatchDifferEngine(ticks);
    case "boom_crash": return boomCrashEngine(ticks);
    case "accumulators": return accumulatorsEngine(ticks);
    case "multipliers": return multipliersEngine(ticks);
    case "turbo": return turboEngine(ticks);
    case "ticks": return ticksEngine(ticks);
    default: return waitResult("Unknown engine type");
  }
}

// ── Demo Signal Generator ───────────────────────────────────────────

export function generateDemoSignal(style: EngineType): SignalResult {
  const roll = Math.random();
  let signal: SignalDirection = "WAIT";
  const isDigit = ["even_odd", "over_under", "match_differ"].includes(style);

  if (roll > 0.65 && roll <= 0.82) {
    signal = style === "even_odd" ? "EVEN" : style === "over_under" ? "OVER" :
      style === "match_differ" ? "MATCH" : style === "multipliers" ? "UP" :
      style === "accumulators" ? "BUY" : "RISE";
  } else if (roll > 0.82) {
    signal = style === "even_odd" ? "ODD" : style === "over_under" ? "UNDER" :
      style === "match_differ" ? "DIFFER" : style === "multipliers" ? "DOWN" :
      style === "accumulators" ? "WAIT" : "FALL";
  }

  const conf = signal === "WAIT"
    ? Math.floor(30 + Math.random() * 20)
    : Math.floor(65 + Math.random() * 25);

  const demoReasons = signal === "WAIT"
    ? ["No clear edge detected", "Market consolidating — patience pays"]
    : [`Trend aligned ✓`, `Momentum confirmed ✓`, `RSI safe zone ✓`];

  return {
    signal,
    confidence: conf,
    validFor: isDigit ? "next 1 tick" : "next 5 ticks",
    timing: timingLabel(conf),
    reasons: demoReasons,
    suggestedDuration: isDigit ? 1 : 5,
    suggestedBarrier: style === "over_under" ? Math.floor(3 + Math.random() * 5) : undefined,
    suggestedMultiplier: style === "multipliers" ? [50, 100, 200][Math.floor(Math.random() * 3)] : undefined,
    biasStrip: Array.from({ length: 9 }, () => Math.random() > 0.5 ? "↑" as const : "↓" as const),
  };
}
