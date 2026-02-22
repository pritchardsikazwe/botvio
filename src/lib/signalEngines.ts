/**
 * Signal Engines for Botvio — Enhanced v2
 * Improved win-rate logic across all trade modes.
 * Key fixes:
 * - MATCH uses Markov transition probability (what digit likely FOLLOWS current)
 * - DIFFER uses frequency mean-reversion (hot digits are overdue to change)
 * - All engines have relaxed thresholds + better confluence scoring
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

function rsi(ticks: number[], period = 14): number {
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
  confidence: number;            // 0-100
  validFor: string;              // e.g. "next 5 ticks"
  timing: "Good" | "Okay" | "Late";
  reasons: string[];
  suggestedDuration?: number;    // ticks or seconds
  suggestedBarrier?: number;     // for digit Over/Under
  suggestedMultiplier?: number;  // for multipliers
  biasStrip?: ("↑" | "↓" | "─")[];
}

// ── Confidence Scoring (Unified) ─────────────────────────────────────

function computeConfidence(
  mom: number,
  emaFastArr: number[],
  emaSlowArr: number[],
  atrN: number,
  atrPrev: number,
  dist: number,
  r: number[],
): number {
  // A) Direction strength (0-40)
  const sDir = 40 * clamp(Math.abs(mom) / 1.0, 0, 1);

  // B) Trend alignment (0-35)
  const emaFast = emaFastArr[emaFastArr.length - 1];
  const emaSlow = emaSlowArr[emaSlowArr.length - 1];
  const gap = Math.abs(emaFast - emaSlow) / atrN;
  const sTrend = 35 * clamp(gap / 0.8, 0, 1);

  // C) Risk penalties (start 25)
  let penalties = 0;
  if (Math.abs(dist) > 1.5) penalties += 8;
  if (gap < 0.15) penalties += 8;
  if (atrN > 2.0 * atrPrev) penalties += 8;
  if (r.length >= 2 && Math.sign(r[r.length - 1]) !== Math.sign(mom)) penalties += 3;
  const sRisk = clamp(25 - penalties, 0, 25);

  return Math.round(sDir + sTrend + sRisk);
}

function timingLabel(conf: number): "Good" | "Okay" | "Late" {
  if (conf > 75) return "Good";
  if (conf > 60) return "Okay";
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

// ── A) Rise/Fall Scalping Engine (Enhanced) ─────────────────────────

export function riseFallEngine(ticks: number[]): SignalResult {
  const N = Math.min(ticks.length, 60);
  const t = ticks.slice(-N);
  if (t.length < 22) return waitResult("Not enough data (need 22+ ticks)");

  const emaFastArr = ema(t, 9);
  const emaSlowArr = ema(t, 21);
  const emaF = emaFastArr[emaFastArr.length - 1];
  const emaS = emaSlowArr[emaSlowArr.length - 1];

  const atrN = atr(t, N);
  const atrPrev = atr(t.slice(0, -5), Math.max(N - 5, 10));
  const rsiVal = rsi(t, 14);
  const r = returns(t);

  const k = 5;
  const mom = (t[t.length - 1] - t[t.length - 1 - k]) / (k * atrN);
  const dist = (t[t.length - 1] - emaF) / atrN;

  const trendUp = emaF > emaS;
  const trendDown = emaF < emaS;

  // Relaxed whipsaw filter
  if (atrN > 2.0 * atrPrev) return waitResult("ATR spike — choppy market", ticks);
  const gap = Math.abs(emaF - emaS) / atrN;
  if (gap < 0.15) return waitResult("Choppy — EMA gap too small", ticks);

  const conf = computeConfidence(mom, emaFastArr, emaSlowArr, atrN, atrPrev, dist, r);
  const reasons: string[] = [];

  // Multi-timeframe confirmation: check 3-tick and 10-tick momentum alignment
  const mom3 = t.length > 3 ? (t[t.length - 1] - t[t.length - 4]) / (3 * atrN) : 0;
  const mom10 = t.length > 10 ? (t[t.length - 1] - t[t.length - 11]) / (10 * atrN) : 0;
  const multiAlign = Math.sign(mom3) === Math.sign(mom) && Math.sign(mom10) === Math.sign(mom);

  // RISE — relaxed thresholds + multi-tf bonus
  if (trendUp && mom > 0.2 && rsiVal >= 45 && rsiVal <= 75 && dist < 1.5) {
    reasons.push(`Trend UP (EMA9 > EMA21, gap ${gap.toFixed(2)})`);
    reasons.push(`Momentum ${mom.toFixed(2)}`);
    reasons.push(`RSI ${rsiVal.toFixed(0)}`);
    if (multiAlign) reasons.push(`Multi-timeframe aligned ✓`);
    const bonus = multiAlign ? 8 : 0;
    const dur = clamp(Math.round(5 + 2 * Math.abs(mom)), 5, 10);
    return {
      signal: "RISE", confidence: clamp(conf + bonus, 60, 95), validFor: `next ${dur} ticks`,
      timing: timingLabel(conf + bonus), reasons, suggestedDuration: dur,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  // FALL — relaxed thresholds + multi-tf bonus
  if (trendDown && mom < -0.2 && rsiVal >= 25 && rsiVal <= 55 && dist > -1.5) {
    reasons.push(`Trend DOWN (EMA9 < EMA21, gap ${gap.toFixed(2)})`);
    reasons.push(`Momentum ${mom.toFixed(2)}`);
    reasons.push(`RSI ${rsiVal.toFixed(0)}`);
    if (multiAlign) reasons.push(`Multi-timeframe aligned ✓`);
    const bonus = multiAlign ? 8 : 0;
    const dur = clamp(Math.round(5 + 2 * Math.abs(mom)), 5, 10);
    return {
      signal: "FALL", confidence: clamp(conf + bonus, 60, 95), validFor: `next ${dur} ticks`,
      timing: timingLabel(conf + bonus), reasons, suggestedDuration: dur,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  return waitResult(`No clear signal (mom=${mom.toFixed(2)}, RSI=${rsiVal.toFixed(0)})`, ticks);
}

// ── B) Digits Engines (Fixed) ───────────────────────────────────────

export function digitsEvenOddEngine(ticks: number[]): SignalResult {
  const M = Math.min(ticks.length, 50);
  const digits = extractDigits(ticks.slice(-M));
  if (digits.length < 15) return waitResult("Not enough digit data");

  const count = new Array(10).fill(0);
  digits.forEach(d => count[d]++);
  const p = count.map((c: number) => c / digits.length);

  const pEven = p[0] + p[2] + p[4] + p[6] + p[8];

  // Use recent 10 ticks for short-term bias
  const recent = digits.slice(-10);
  const recentEven = recent.filter(d => d % 2 === 0).length / recent.length;

  // Mean reversion: if recent is heavily even, next is more likely odd (and vice versa)
  // Combined with longer-term frequency
  const longEdge = pEven - 0.5;
  const shortEdge = recentEven - 0.5;

  // When both long and short agree strongly, signal that direction
  // When they diverge, use mean reversion on the short-term extreme
  let edge: number;
  let useReversion = false;

  if (Math.abs(shortEdge) > 0.2 && Math.sign(shortEdge) !== Math.sign(longEdge)) {
    // Short-term extreme opposite to long-term → mean reversion
    edge = -shortEdge;
    useReversion = true;
  } else {
    edge = longEdge * 0.4 + shortEdge * 0.6;
  }

  const conf = Math.round(50 + Math.abs(edge) * 280);

  if (edge > 0.06) {
    return {
      signal: "EVEN", confidence: clamp(conf, 60, 95), validFor: "next 1 tick",
      timing: timingLabel(conf),
      reasons: [
        `Even digits ${useReversion ? 'reversion' : 'dominant'} (long ${(pEven * 100).toFixed(0)}%, recent ${(recentEven * 100).toFixed(0)}%)`,
        `Edge: +${(edge * 100).toFixed(1)}%`
      ],
      suggestedDuration: 1,
      biasStrip: buildBiasStrip(ticks),
    };
  }
  if (edge < -0.06) {
    return {
      signal: "ODD", confidence: clamp(conf, 60, 95), validFor: "next 1 tick",
      timing: timingLabel(conf),
      reasons: [
        `Odd digits ${useReversion ? 'reversion' : 'dominant'} (long ${((1 - pEven) * 100).toFixed(0)}%, recent ${((1 - recentEven) * 100).toFixed(0)}%)`,
        `Edge: ${(edge * 100).toFixed(1)}%`
      ],
      suggestedDuration: 1,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  return waitResult(`No digit edge (Even=${(pEven * 100).toFixed(0)}%)`, ticks);
}

export function digitsOverUnderEngine(ticks: number[]): SignalResult {
  const M = Math.min(ticks.length, 50);
  const digits = extractDigits(ticks.slice(-M));
  if (digits.length < 15) return waitResult("Not enough digit data");

  const count = new Array(10).fill(0);
  digits.forEach(d => count[d]++);
  const p = count.map((c: number) => c / digits.length);

  // Try multiple barriers and find the one with strongest edge
  let bestBarrier = 4;
  let bestEdge = 0;
  let bestPUnder = 0;
  let bestPOver = 0;

  for (let B = 2; B <= 7; B++) {
    let pU = 0, pO = 0;
    for (let x = 0; x < B; x++) pU += p[x];
    for (let x = B + 1; x <= 9; x++) pO += p[x];
    const edge = Math.abs(pU - pO);
    if (edge > bestEdge) {
      bestEdge = edge;
      bestBarrier = B;
      bestPUnder = pU;
      bestPOver = pO;
    }
  }

  const conf = Math.round(50 + bestEdge * 230);

  if (bestPUnder - bestPOver > 0.08) {
    return {
      signal: "UNDER", confidence: clamp(conf, 60, 95), validFor: "next 1 tick",
      timing: timingLabel(conf),
      reasons: [`Under ${bestBarrier} dominant (${(bestPUnder * 100).toFixed(0)}% vs ${(bestPOver * 100).toFixed(0)}%)`, `Best barrier auto-selected`],
      suggestedDuration: 5, suggestedBarrier: bestBarrier,
      biasStrip: buildBiasStrip(ticks),
    };
  }
  if (bestPOver - bestPUnder > 0.08) {
    return {
      signal: "OVER", confidence: clamp(conf, 60, 95), validFor: "next 1 tick",
      timing: timingLabel(conf),
      reasons: [`Over ${bestBarrier} dominant (${(bestPOver * 100).toFixed(0)}% vs ${(bestPUnder * 100).toFixed(0)}%)`, `Best barrier auto-selected`],
      suggestedDuration: 5, suggestedBarrier: bestBarrier,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  return waitResult(`No Over/Under edge at any barrier`, ticks);
}

/**
 * FIXED Match/Differ Engine
 * 
 * KEY FIX: MATCH now uses Markov transition analysis.
 * - We look at what digit typically FOLLOWS the current last digit
 * - If a specific transition is significantly more likely than 10%, signal MATCH
 * - DIFFER uses hot-digit mean reversion (digit that's appeared too much will stop)
 */
export function digitsMatchDifferEngine(ticks: number[]): SignalResult {
  const M = Math.min(ticks.length, 80);
  const digits = extractDigits(ticks.slice(-M));
  if (digits.length < 20) return waitResult("Not enough digit data");

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

  // Find most likely next digit given current last digit
  let bestTransDigit = 0;
  let bestTransProb = 0;
  for (let d = 0; d < 10; d++) {
    if (transProbs[d] > bestTransProb) {
      bestTransProb = transProbs[d];
      bestTransDigit = d;
    }
  }

  // ── Streak analysis ──
  let streak = 1;
  for (let i = digits.length - 2; i >= 0; i--) {
    if (digits[i] === lastDigit) streak++;
    else break;
  }

  // ── Hot digit (overrepresented → mean reversion = DIFFER it) ──
  let hotDigit = 0;
  let hotP = 0;
  for (let d = 0; d < 10; d++) {
    if (p[d] > hotP) { hotP = p[d]; hotDigit = d; }
  }

  const reasons: string[] = [];

  // ── MATCH logic: use Markov transition ──
  // If a digit frequently follows the current digit, MATCH it
  // Threshold: >18% transition probability (baseline is 10%)
  if (bestTransProb >= 0.18 && bestTransDigit !== lastDigit) {
    const edge = bestTransProb - 0.10;
    const conf = Math.round(58 + edge * 450);
    reasons.push(`After digit ${lastDigit}, digit ${bestTransDigit} appears ${(bestTransProb * 100).toFixed(0)}% of time`);
    reasons.push(`Markov edge: +${(edge * 100).toFixed(1)}% above baseline`);
    if (streak >= 2) reasons.push(`Current streak: ${lastDigit} ×${streak}`);
    return {
      signal: "MATCH", confidence: clamp(conf, 62, 95), validFor: "next 1 tick",
      timing: timingLabel(conf),
      reasons,
      suggestedDuration: 5, suggestedBarrier: bestTransDigit,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  // Also MATCH if same digit has a self-transition >13% AND streak >= 2
  if (transProbs[lastDigit] >= 0.15 && streak >= 2) {
    const edge = transProbs[lastDigit] - 0.10;
    const conf = Math.round(58 + edge * 400 + streak * 5);
    reasons.push(`Digit ${lastDigit} self-repeats ${(transProbs[lastDigit] * 100).toFixed(0)}% (streak ×${streak})`);
    reasons.push(`Markov self-transition edge: +${(edge * 100).toFixed(1)}%`);
    return {
      signal: "MATCH", confidence: clamp(conf, 60, 92), validFor: "next 1 tick",
      timing: timingLabel(conf),
      reasons,
      suggestedDuration: 5, suggestedBarrier: lastDigit,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  // ── DIFFER logic: hot digit mean reversion ──
  // If a digit is overrepresented (>13%), it's likely to NOT appear next
  if (hotP > 0.14) {
    const edge = hotP - 0.10;
    const conf = Math.round(58 + edge * 400);
    reasons.push(`Digit ${hotDigit} overrepresented at ${(hotP * 100).toFixed(0)}% (expected 10%)`);
    reasons.push(`Mean reversion: DIFFER ${hotDigit}`);
    if (streak >= 3 && hotDigit === lastDigit) {
      reasons.push(`Streak exhaustion: ${lastDigit} ×${streak}`);
    }
    return {
      signal: "DIFFER", confidence: clamp(conf, 62, 95), validFor: "next 1 tick",
      timing: timingLabel(conf),
      reasons,
      suggestedDuration: 5, suggestedBarrier: hotDigit,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  return waitResult(`No dominant digit pattern (max ${(hotP * 100).toFixed(0)}%)`, ticks);
}

// ── C) Higher/Lower Engine (Enhanced) ───────────────────────────────

export function higherLowerEngine(ticks: number[]): SignalResult {
  const N = Math.min(ticks.length, 60);
  const t = ticks.slice(-N);
  if (t.length < 30) return waitResult("Need 30+ ticks for Higher/Lower");

  const emaFastArr = ema(t, 9);
  const emaSlowArr = ema(t, 21);
  const emaF = emaFastArr[emaFastArr.length - 1];
  const emaS = emaSlowArr[emaSlowArr.length - 1];
  const atrN = atr(t, N);
  const atrPrev = atr(t.slice(0, -5), Math.max(N - 5, 10));
  const r = returns(t);
  const k = 5;
  const mom = (t[t.length - 1] - t[t.length - 1 - k]) / (k * atrN);
  const dist = (t[t.length - 1] - emaF) / atrN;
  const rsiVal = rsi(t, 14);

  const last30 = t.slice(-30);
  const support = Math.min(...last30);
  const resist = Math.max(...last30);
  const price = t[t.length - 1];
  const range = resist - support || atrN;

  // Position in range (0 = at support, 1 = at resistance)
  const posInRange = (price - support) / range;

  const conf = computeConfidence(mom, emaFastArr, emaSlowArr, atrN, atrPrev, dist, r);
  const trendUp = emaF > emaS;
  const trendDown = emaF < emaS;

  // HIGHER: trend up + not too extended + momentum confirms
  if (trendUp && mom > 0.15 && posInRange > 0.5 && rsiVal < 75) {
    return {
      signal: "HIGHER", confidence: clamp(conf + 5, 60, 95), validFor: "30s–1m",
      timing: timingLabel(conf),
      reasons: [
        `Trend UP (EMA9>EMA21)`,
        `Momentum ${mom.toFixed(2)}`,
        `Position ${(posInRange * 100).toFixed(0)}% in range`,
        `RSI ${rsiVal.toFixed(0)}`,
      ],
      suggestedDuration: 60,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  // LOWER: trend down + near top of range reversal
  if (trendDown && mom < -0.15 && posInRange < 0.5 && rsiVal > 25) {
    return {
      signal: "LOWER", confidence: clamp(conf + 5, 60, 95), validFor: "30s–1m",
      timing: timingLabel(conf),
      reasons: [
        `Trend DOWN (EMA9<EMA21)`,
        `Momentum ${mom.toFixed(2)}`,
        `Position ${(posInRange * 100).toFixed(0)}% in range`,
        `RSI ${rsiVal.toFixed(0)}`,
      ],
      suggestedDuration: 60,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  // Support/resistance bounce signals
  if (posInRange < 0.15 && rsiVal < 35 && mom > -0.3) {
    return {
      signal: "HIGHER", confidence: clamp(55 + (35 - rsiVal), 58, 85), validFor: "bounce play",
      timing: "Okay",
      reasons: [`Near support (${support.toFixed(4)})`, `RSI oversold ${rsiVal.toFixed(0)}`, `Bounce expected`],
      suggestedDuration: 60,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  if (posInRange > 0.85 && rsiVal > 65 && mom < 0.3) {
    return {
      signal: "LOWER", confidence: clamp(55 + (rsiVal - 65), 58, 85), validFor: "rejection play",
      timing: "Okay",
      reasons: [`Near resistance (${resist.toFixed(4)})`, `RSI overbought ${rsiVal.toFixed(0)}`, `Rejection expected`],
      suggestedDuration: 60,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  return waitResult("No breakout or bounce detected", ticks);
}

// ── D) Boom/Crash Spike Engine (Enhanced) ───────────────────────────

export function boomCrashEngine(ticks: number[], avgSpikePeriod = 300): SignalResult {
  const N = Math.min(ticks.length, 200);
  const t = ticks.slice(-N);
  if (t.length < 30) return waitResult("Not enough ticks for spike analysis");

  const atrN = atr(t, N);
  const r = returns(t);
  const spikeFactor = 3.5; // slightly more sensitive

  // Find last spike
  let ticksSinceSpike = r.length;
  for (let i = r.length - 1; i >= 0; i--) {
    if (Math.abs(r[i]) > spikeFactor * atrN) {
      ticksSinceSpike = r.length - 1 - i;
      break;
    }
  }

  const overdue = ticksSinceSpike / avgSpikePeriod;

  // Check for building pressure (decreasing ATR in recent ticks = compression before spike)
  const recentAtr = atr(t.slice(-20), 20);
  const olderAtr = atr(t.slice(-60, -20), 40);
  const compression = olderAtr > 0 ? recentAtr / olderAtr : 1;
  const compressionBonus = compression < 0.7 ? 12 : compression < 0.85 ? 6 : 0;

  const conf = Math.round(40 + clamp(overdue, 0, 2) * 25 + compressionBonus);

  if (overdue < 0.5) {
    return {
      signal: "WAIT", confidence: clamp(conf, 30, 55), validFor: "monitoring",
      timing: "Late",
      reasons: [
        `Too early — ${ticksSinceSpike} ticks since spike`,
        `Overdue: ${overdue.toFixed(2)} (need >0.5)`,
      ],
      biasStrip: buildBiasStrip(ticks),
    };
  }

  if (overdue >= 0.5) {
    const reasons = [
      `Spike window open (overdue: ${overdue.toFixed(2)})`,
      `${ticksSinceSpike} ticks since last spike`,
    ];
    if (compressionBonus > 0) reasons.push(`Volatility compression detected ✓`);
    return {
      signal: "BUY", confidence: clamp(conf, 60, 92), validFor: "spike window",
      timing: timingLabel(conf),
      reasons,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  return waitResult(`Monitoring spike cycle`, ticks);
}

// ── E) Accumulators Engine (Enhanced) ───────────────────────────────

export function accumulatorsEngine(ticks: number[]): SignalResult {
  const t60 = ticks.slice(-60);
  const t240 = ticks.slice(-240);
  if (t60.length < 25) return waitResult("Not enough data for accumulator analysis");

  const atr60 = atr(t60, t60.length);
  const atr240 = t240.length >= 60 ? atr(t240, t240.length) : atr60 * 1.5;

  const stability = clamp(1 - atr60 / atr240, 0, 1);

  const emaFastArr = ema(t60, 9);
  const emaSlowArr = ema(t60, 21);
  const emaF = emaFastArr[emaFastArr.length - 1];
  const emaS = emaSlowArr[emaSlowArr.length - 1];
  const gapNorm = Math.abs(emaF - emaS) / atr60;
  const trendFlat = gapNorm < 0.3;

  // Smooth trend check: count how many of last 20 returns are same sign
  const r = returns(t60.slice(-20));
  const posCount = r.filter(v => v > 0).length;
  const negCount = r.filter(v => v < 0).length;
  const trendSmooth = Math.max(posCount, negCount) / r.length;

  const conf = Math.round(stability * 70 + (trendFlat ? 10 : 0) + trendSmooth * 20);

  if (stability > 0.55 && (trendFlat || trendSmooth > 0.6)) {
    return {
      signal: "BUY", confidence: clamp(conf, 62, 95), validFor: "current range",
      timing: timingLabel(conf),
      reasons: [
        `Stability ${(stability * 100).toFixed(0)}%`,
        `Trend smoothness: ${(trendSmooth * 100).toFixed(0)}%`,
        trendFlat ? `Flat trend — safe` : `Mild trend — acceptable`,
      ],
      biasStrip: buildBiasStrip(ticks),
    };
  }

  if (stability > 0.40) {
    return {
      signal: "WAIT", confidence: clamp(conf, 40, 59), validFor: "monitoring",
      timing: "Late",
      reasons: [`Borderline stability ${(stability * 100).toFixed(0)}%`, `Smoothness ${(trendSmooth * 100).toFixed(0)}%`],
      biasStrip: buildBiasStrip(ticks),
    };
  }

  return waitResult(`Too volatile for accumulators (stability ${(stability * 100).toFixed(0)}%)`, ticks);
}

// ── F) Multipliers Engine (Enhanced) ────────────────────────────────

export function multipliersEngine(ticks: number[]): SignalResult {
  const N = Math.min(ticks.length, 60);
  const t = ticks.slice(-N);
  if (t.length < 22) return waitResult("Not enough ticks for multiplier analysis");

  const emaFastArr = ema(t, 9);
  const emaSlowArr = ema(t, 21);
  const emaF = emaFastArr[emaFastArr.length - 1];
  const emaS = emaSlowArr[emaSlowArr.length - 1];
  const atrN = atr(t, N);
  const atrPrev = atr(t.slice(0, -5), Math.max(N - 5, 10));
  const r = returns(t);
  const k = 5;
  const mom = (t[t.length - 1] - t[t.length - 1 - k]) / (k * atrN);
  const dist = (t[t.length - 1] - emaF) / atrN;
  const rsiVal = rsi(t, 14);

  const conf = computeConfidence(mom, emaFastArr, emaSlowArr, atrN, atrPrev, dist, r);

  // Multiplier suggestion based on volatility
  let mult = 100;
  if (atrN > 0.5) mult = 50;
  else if (atrN < 0.2) mult = 200;

  // Trend strength bonus from RSI
  const rsiBonus = (rsiVal > 55 && mom > 0) ? 5 : (rsiVal < 45 && mom < 0) ? 5 : 0;

  // UP — relaxed + RSI confluence
  if (emaF > emaS && mom > 0.18 && dist >= -0.3 && dist <= 1.2) {
    return {
      signal: "UP", confidence: clamp(conf + rsiBonus, 60, 95), validFor: "trend continuation",
      timing: timingLabel(conf + rsiBonus),
      reasons: [
        `Trend UP (EMA9>EMA21)`,
        `Momentum: ${mom.toFixed(2)}`,
        `RSI: ${rsiVal.toFixed(0)}`,
        `Pullback zone (dist=${dist.toFixed(2)})`,
      ],
      suggestedMultiplier: mult,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  // DOWN
  if (emaF < emaS && mom < -0.18 && dist <= 0.3 && dist >= -1.2) {
    return {
      signal: "DOWN", confidence: clamp(conf + rsiBonus, 60, 95), validFor: "trend continuation",
      timing: timingLabel(conf + rsiBonus),
      reasons: [
        `Trend DOWN (EMA9<EMA21)`,
        `Momentum: ${mom.toFixed(2)}`,
        `RSI: ${rsiVal.toFixed(0)}`,
        `Pullback zone (dist=${dist.toFixed(2)})`,
      ],
      suggestedMultiplier: mult,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  return waitResult(`No multiplier entry (mom=${mom.toFixed(2)}, dist=${dist.toFixed(2)})`, ticks);
}

// ── G) Turbo Engine (Enhanced) ──────────────────────────────────────

export function turboEngine(ticks: number[]): SignalResult {
  const N = Math.min(ticks.length, 60);
  const t = ticks.slice(-N);
  if (t.length < 22) return waitResult("Not enough ticks for turbo analysis");

  const atrN = atr(t, N);
  const r = returns(t);
  const k = 5;
  const mom = (t[t.length - 1] - t[t.length - 1 - k]) / (k * atrN);

  const last15 = t.slice(-15);
  const maxPrice = Math.max(...last15);
  const minPrice = Math.min(...last15);
  const range = maxPrice - minPrice;
  const rangeNorm = range / atrN;

  const breakUp = (t[t.length - 1] - maxPrice) / atrN;
  const breakDown = (t[t.length - 1] - minPrice) / atrN;

  const emaFastArr = ema(t, 9);
  const emaSlowArr = ema(t, 21);
  const atrPrev = atr(t.slice(0, -5), Math.max(N - 5, 10));
  const dist = (t[t.length - 1] - emaFastArr[emaFastArr.length - 1]) / atrN;
  const conf = computeConfidence(mom, emaFastArr, emaSlowArr, atrN, atrPrev, dist, r);

  // Compression detection: tight range = setup for breakout
  const isCompressed = rangeNorm < 3.0;
  const compressionBonus = isCompressed ? 8 : 0;

  // Check last 3 ticks alignment for confirmation
  const last3 = r.slice(-3);
  const aligned3 = last3.every(v => v > 0) || last3.every(v => v < 0);
  const alignBonus = aligned3 ? 6 : 0;

  if ((breakUp > 0.2 || (mom > 0.4 && aligned3)) && mom > 0.3) {
    return {
      signal: "RISE", confidence: clamp(conf + compressionBonus + alignBonus, 60, 95),
      validFor: "next 3–5 ticks",
      timing: timingLabel(conf + compressionBonus + alignBonus),
      reasons: [
        `Breakout UP (${breakUp.toFixed(2)})`,
        `Momentum ${mom.toFixed(2)}`,
        isCompressed ? `Range compressed ✓` : `Range expanding`,
        aligned3 ? `3-tick alignment ✓` : ``,
      ].filter(Boolean),
      suggestedDuration: 3,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  if ((breakDown < -0.2 || (mom < -0.4 && aligned3)) && mom < -0.3) {
    return {
      signal: "FALL", confidence: clamp(conf + compressionBonus + alignBonus, 60, 95),
      validFor: "next 3–5 ticks",
      timing: timingLabel(conf + compressionBonus + alignBonus),
      reasons: [
        `Breakout DOWN (${breakDown.toFixed(2)})`,
        `Momentum ${mom.toFixed(2)}`,
        isCompressed ? `Range compressed ✓` : `Range expanding`,
        aligned3 ? `3-tick alignment ✓` : ``,
      ].filter(Boolean),
      suggestedDuration: 3,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  return waitResult(`No breakout (up=${breakUp.toFixed(2)}, down=${breakDown.toFixed(2)})`, ticks);
}

// ── Wait helper ─────────────────────────────────────────────────────

function waitResult(reason: string, ticks?: number[]): SignalResult {
  return {
    signal: "WAIT",
    confidence: Math.round(30 + Math.random() * 25),
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

  if (roll > 0.6 && roll <= 0.8) {
    signal = style === "even_odd" ? "EVEN" : style === "over_under" ? "OVER" :
      style === "match_differ" ? "MATCH" : style === "multipliers" ? "UP" :
      style === "accumulators" ? "BUY" : "RISE";
  } else if (roll > 0.8) {
    signal = style === "even_odd" ? "ODD" : style === "over_under" ? "UNDER" :
      style === "match_differ" ? "DIFFER" : style === "multipliers" ? "DOWN" :
      style === "accumulators" ? "WAIT" : "FALL";
  }

  const conf = signal === "WAIT"
    ? Math.floor(35 + Math.random() * 24)
    : Math.floor(60 + Math.random() * 32);

  const demoReasons = signal === "WAIT"
    ? ["No clear edge detected", "Market consolidating"]
    : [`Trend aligned`, `Momentum strong`, `RSI in safe zone`];

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
