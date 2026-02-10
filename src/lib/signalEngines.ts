/**
 * Signal Engines for Botvio
 * Implements exact formulas for Rise/Fall, Digits, Higher/Lower,
 * Boom/Crash, Accumulators, Multipliers, and Turbo.
 * Plus unified confidence scoring (0-100).
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
  const sDir = 40 * clamp(Math.abs(mom) / 1.2, 0, 1);

  // B) Trend alignment (0-35)
  const emaFast = emaFastArr[emaFastArr.length - 1];
  const emaSlow = emaSlowArr[emaSlowArr.length - 1];
  const gap = Math.abs(emaFast - emaSlow) / atrN;
  const sTrend = 35 * clamp(gap / 1.0, 0, 1);

  // C) Risk penalties (start 25)
  let penalties = 0;
  if (Math.abs(dist) > 1.2) penalties += 10;
  if (gap < 0.25) penalties += 10;
  if (atrN > 1.6 * atrPrev) penalties += 10;
  if (r.length >= 2 && Math.sign(r[r.length - 1]) !== Math.sign(mom)) penalties += 5;
  const sRisk = clamp(25 - penalties, 0, 25);

  return Math.round(sDir + sTrend + sRisk);
}

function timingLabel(conf: number): "Good" | "Okay" | "Late" {
  if (conf > 80) return "Good";
  if (conf > 70) return "Okay";
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

// ── A) Rise/Fall Scalping Engine ────────────────────────────────────

export function riseFallEngine(ticks: number[]): SignalResult {
  const N = Math.min(ticks.length, 60);
  const t = ticks.slice(-N);
  if (t.length < 22) return waitResult("Not enough data (need 22+ ticks)");

  const emaFastArr = ema(t, 9);
  const emaSlowArr = ema(t, 21);
  const emaF = emaFastArr[emaFastArr.length - 1];
  const emaS = emaSlowArr[emaSlowArr.length - 1];
  const emaFPrev = emaFastArr[emaFastArr.length - 2];

  const atrN = atr(t, N);
  const atrPrev = atr(t.slice(0, -5), Math.max(N - 5, 10));
  const rsiVal = rsi(t, 14);
  const r = returns(t);

  const k = 5;
  const mom = (t[t.length - 1] - t[t.length - 1 - k]) / (k * atrN);
  const slope = (emaF - emaFPrev) / atrN;
  const dist = (t[t.length - 1] - emaF) / atrN;

  const trendUp = emaF > emaS;
  const trendDown = emaF < emaS;

  // Whipsaw block
  if (atrN > 1.6 * atrPrev) return waitResult("ATR spike — choppy market", ticks);
  const gap = Math.abs(emaF - emaS) / atrN;
  if (gap < 0.25) return waitResult("Choppy — EMA gap too small", ticks);

  const conf = computeConfidence(mom, emaFastArr, emaSlowArr, atrN, atrPrev, dist, r);
  const reasons: string[] = [];

  // RISE
  if (trendUp && mom > 0.35 && rsiVal >= 48 && rsiVal <= 70 && dist < 1.2) {
    reasons.push(`Trend aligned (EMA9 > EMA21)`);
    reasons.push(`Momentum strong (${mom.toFixed(2)})`);
    reasons.push(`RSI safe (${rsiVal.toFixed(0)})`);
    const dur = clamp(Math.round(5 + 2 * Math.abs(mom)), 5, 10);
    return {
      signal: "RISE", confidence: Math.max(conf, 60), validFor: `next ${dur} ticks`,
      timing: timingLabel(conf), reasons, suggestedDuration: dur,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  // FALL
  if (trendDown && mom < -0.35 && rsiVal >= 30 && rsiVal <= 52 && dist > -1.2) {
    reasons.push(`Trend aligned (EMA9 < EMA21)`);
    reasons.push(`Momentum strong (${mom.toFixed(2)})`);
    reasons.push(`RSI safe (${rsiVal.toFixed(0)})`);
    const dur = clamp(Math.round(5 + 2 * Math.abs(mom)), 5, 10);
    return {
      signal: "FALL", confidence: Math.max(conf, 60), validFor: `next ${dur} ticks`,
      timing: timingLabel(conf), reasons, suggestedDuration: dur,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  return waitResult(`No clear signal (mom=${mom.toFixed(2)}, RSI=${rsiVal.toFixed(0)})`, ticks);
}

// ── B) Digits Engine ────────────────────────────────────────────────

function extractDigits(ticks: number[]): number[] {
  return ticks.map(t => {
    const s = t.toString();
    return parseInt(s[s.length - 1]) || 0;
  });
}

export function digitsEvenOddEngine(ticks: number[]): SignalResult {
  const M = Math.min(ticks.length, 50);
  const digits = extractDigits(ticks.slice(-M));
  if (digits.length < 20) return waitResult("Not enough digit data");

  const count = new Array(10).fill(0);
  digits.forEach(d => count[d]++);
  const p = count.map(c => c / digits.length);

  const pEven = p[0] + p[2] + p[4] + p[6] + p[8];
  const edge = pEven - 0.5;

  const conf = Math.round(50 + Math.abs(edge) * 300);

  if (edge > 0.08) {
    return {
      signal: "EVEN", confidence: clamp(conf, 60, 95), validFor: "next 1 tick",
      timing: timingLabel(conf),
      reasons: [`Even digits dominant (${(pEven * 100).toFixed(0)}%)`, `Edge: +${(edge * 100).toFixed(1)}%`],
      suggestedDuration: 1,
      biasStrip: buildBiasStrip(ticks),
    };
  }
  if (edge < -0.08) {
    return {
      signal: "ODD", confidence: clamp(conf, 60, 95), validFor: "next 1 tick",
      timing: timingLabel(conf),
      reasons: [`Odd digits dominant (${((1 - pEven) * 100).toFixed(0)}%)`, `Edge: ${(edge * 100).toFixed(1)}%`],
      suggestedDuration: 1,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  return waitResult(`No digit edge (Even=${(pEven * 100).toFixed(0)}%)`, ticks);
}

export function digitsOverUnderEngine(ticks: number[]): SignalResult {
  const M = Math.min(ticks.length, 50);
  const digits = extractDigits(ticks.slice(-M));
  if (digits.length < 20) return waitResult("Not enough digit data");

  const count = new Array(10).fill(0);
  digits.forEach(d => count[d]++);
  const p = count.map(c => c / digits.length);

  const meanDigit = p.reduce((s, pr, i) => s + i * pr, 0);
  const B = clamp(Math.round(meanDigit), 1, 8);

  let pUnder = 0, pOver = 0;
  for (let x = 0; x < B; x++) pUnder += p[x];
  for (let x = B + 1; x <= 9; x++) pOver += p[x];

  const edge = Math.abs(pUnder - pOver);
  const conf = Math.round(50 + edge * 250);

  if (pUnder - pOver > 0.10) {
    return {
      signal: "UNDER", confidence: clamp(conf, 60, 95), validFor: "next 1 tick",
      timing: timingLabel(conf),
      reasons: [`Under ${B} dominant (${(pUnder * 100).toFixed(0)}% vs ${(pOver * 100).toFixed(0)}%)`],
      suggestedDuration: 5, suggestedBarrier: B,
      biasStrip: buildBiasStrip(ticks),
    };
  }
  if (pOver - pUnder > 0.10) {
    return {
      signal: "OVER", confidence: clamp(conf, 60, 95), validFor: "next 1 tick",
      timing: timingLabel(conf),
      reasons: [`Over ${B} dominant (${(pOver * 100).toFixed(0)}% vs ${(pUnder * 100).toFixed(0)}%)`],
      suggestedDuration: 5, suggestedBarrier: B,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  return waitResult(`No Over/Under edge at barrier ${B}`, ticks);
}

export function digitsMatchDifferEngine(ticks: number[]): SignalResult {
  const M = Math.min(ticks.length, 50);
  const digits = extractDigits(ticks.slice(-M));
  if (digits.length < 20) return waitResult("Not enough digit data");

  const count = new Array(10).fill(0);
  digits.forEach(d => count[d]++);
  const p = count.map(c => c / digits.length);

  let maxP = 0, argMax = 0;
  p.forEach((pr, i) => { if (pr > maxP) { maxP = pr; argMax = i; } });

  if (maxP > 0.16) {
    const conf = Math.round(50 + (maxP - 0.10) * 400);
    return {
      signal: "MATCH", confidence: clamp(conf, 60, 95), validFor: "next 1 tick",
      timing: timingLabel(conf),
      reasons: [`Digit ${argMax} appears ${(maxP * 100).toFixed(0)}% of time (norm 10%)`],
      suggestedDuration: 5, suggestedBarrier: argMax,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  return waitResult(`No dominant digit (max ${(maxP * 100).toFixed(0)}%)`, ticks);
}

// ── C) Higher/Lower Engine ──────────────────────────────────────────

export function higherLowerEngine(ticks: number[]): SignalResult {
  const N = Math.min(ticks.length, 60);
  const t = ticks.slice(-N);
  if (t.length < 40) return waitResult("Need 40+ ticks for Higher/Lower");

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

  const last40 = t.slice(-40);
  const support = Math.min(...last40);
  const resist = Math.max(...last40);
  const price = t[t.length - 1];

  const conf = computeConfidence(mom, emaFastArr, emaSlowArr, atrN, atrPrev, dist, r);
  const trendUp = emaF > emaS;
  const trendDown = emaF < emaS;

  if (trendUp && price > resist - 0.2 * atrN && dist < 1.3) {
    return {
      signal: "HIGHER", confidence: Math.max(conf, 60), validFor: "30s–1m",
      timing: timingLabel(conf),
      reasons: [`Breaking resistance ${resist.toFixed(4)}`, `Trend up (EMA9>EMA21)`, `Distance safe (${dist.toFixed(2)})`],
      suggestedDuration: atrN < 0.5 ? 60 : 30,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  if (trendDown && price < support + 0.2 * atrN && dist > -1.3) {
    return {
      signal: "LOWER", confidence: Math.max(conf, 60), validFor: "30s–1m",
      timing: timingLabel(conf),
      reasons: [`Breaking support ${support.toFixed(4)}`, `Trend down (EMA9<EMA21)`, `Distance safe (${dist.toFixed(2)})`],
      suggestedDuration: atrN < 0.5 ? 60 : 30,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  return waitResult("No breakout detected", ticks);
}

// ── D) Boom/Crash Spike Engine ──────────────────────────────────────

export function boomCrashEngine(ticks: number[], avgSpikePeriod = 300): SignalResult {
  const N = Math.min(ticks.length, 200);
  const t = ticks.slice(-N);
  if (t.length < 30) return waitResult("Not enough ticks for spike analysis");

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
  const conf = Math.round(40 + clamp(overdue, 0, 2) * 25);

  if (overdue < 0.6) {
    return {
      signal: "WAIT", confidence: clamp(conf, 30, 55), validFor: "monitoring",
      timing: "Late",
      reasons: [`Too early — only ${ticksSinceSpike} ticks since last spike`, `Overdue score: ${overdue.toFixed(2)} (need >0.6)`],
      biasStrip: buildBiasStrip(ticks),
    };
  }

  if (overdue >= 0.6 && overdue <= 1.4) {
    return {
      signal: "BUY", confidence: clamp(conf, 60, 85), validFor: "spike window",
      timing: timingLabel(conf),
      reasons: [`Spike window open (overdue: ${overdue.toFixed(2)})`, `${ticksSinceSpike} ticks since last spike`, `Avg period: ${avgSpikePeriod}`],
      biasStrip: buildBiasStrip(ticks),
    };
  }

  return {
    signal: "WAIT", confidence: clamp(conf, 35, 55), validFor: "monitoring",
    timing: "Late",
    reasons: [`High risk — overdue ${overdue.toFixed(2)} (chaotic zone)`, `${ticksSinceSpike} ticks since last spike`],
    biasStrip: buildBiasStrip(ticks),
  };
}

// ── E) Accumulators Engine ──────────────────────────────────────────

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
  const trendFlat = Math.abs(emaF - emaS) / atr60 < 0.25;

  const conf = Math.round(stability * 80 + (trendFlat ? 15 : 0));

  if (stability > 0.65 && trendFlat) {
    return {
      signal: "BUY", confidence: clamp(conf, 65, 95), validFor: "current range",
      timing: timingLabel(conf),
      reasons: [`Stability high (${(stability * 100).toFixed(0)}%)`, `Flat trend — safe for accumulation`, `ATR ratio: ${(atr60 / atr240).toFixed(3)}`],
      biasStrip: buildBiasStrip(ticks),
    };
  }

  if (stability > 0.45) {
    return {
      signal: "WAIT", confidence: clamp(conf, 40, 59), validFor: "monitoring",
      timing: "Late",
      reasons: [`Risky — stability ${(stability * 100).toFixed(0)}%`, trendFlat ? "Trend is flat" : "Trend not flat enough"],
      biasStrip: buildBiasStrip(ticks),
    };
  }

  return waitResult(`Too volatile for accumulators (stability ${(stability * 100).toFixed(0)}%)`, ticks);
}

// ── F) Multipliers Engine ───────────────────────────────────────────

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

  const conf = computeConfidence(mom, emaFastArr, emaSlowArr, atrN, atrPrev, dist, r);

  // Multiplier suggestion
  let mult = 100;
  if (atrN > 0.5) mult = 50;
  else if (atrN < 0.2) mult = 200;

  // UP
  if (emaF > emaS && mom > 0.25 && dist >= 0 && dist <= 0.9) {
    return {
      signal: "UP", confidence: Math.max(conf, 60), validFor: "trend continuation",
      timing: timingLabel(conf),
      reasons: [`Trend up (EMA9>EMA21)`, `Pullback entry zone (dist=${dist.toFixed(2)})`, `Momentum: ${mom.toFixed(2)}`],
      suggestedMultiplier: mult,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  // DOWN
  if (emaF < emaS && mom < -0.25 && dist <= 0 && dist >= -0.9) {
    return {
      signal: "DOWN", confidence: Math.max(conf, 60), validFor: "trend continuation",
      timing: timingLabel(conf),
      reasons: [`Trend down (EMA9<EMA21)`, `Pullback entry zone (dist=${dist.toFixed(2)})`, `Momentum: ${mom.toFixed(2)}`],
      suggestedMultiplier: mult,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  return waitResult(`No multiplier entry (mom=${mom.toFixed(2)}, dist=${dist.toFixed(2)})`, ticks);
}

// ── G) Turbo Engine ─────────────────────────────────────────────────

export function turboEngine(ticks: number[]): SignalResult {
  const N = Math.min(ticks.length, 60);
  const t = ticks.slice(-N);
  if (t.length < 22) return waitResult("Not enough ticks for turbo analysis");

  const atrN = atr(t, N);
  const r = returns(t);
  const k = 5;
  const mom = (t[t.length - 1] - t[t.length - 1 - k]) / (k * atrN);

  const last20 = t.slice(-20);
  const maxPrice = Math.max(...last20);
  const minPrice = Math.min(...last20);

  const breakUp = (t[t.length - 1] - maxPrice) / atrN;
  const breakDown = (t[t.length - 1] - minPrice) / atrN;

  const emaFastArr = ema(t, 9);
  const emaSlowArr = ema(t, 21);
  const atrPrev = atr(t.slice(0, -5), Math.max(N - 5, 10));
  const dist = (t[t.length - 1] - emaFastArr[emaFastArr.length - 1]) / atrN;
  const conf = computeConfidence(mom, emaFastArr, emaSlowArr, atrN, atrPrev, dist, r);

  if (breakUp > 0.4 && mom > 0.6) {
    return {
      signal: "RISE", confidence: Math.max(conf, 60), validFor: "next 3–5 ticks",
      timing: timingLabel(conf),
      reasons: [`Breakout UP (score=${breakUp.toFixed(2)})`, `Strong momentum (${mom.toFixed(2)})`, `Ultra-short window`],
      suggestedDuration: 3,
      biasStrip: buildBiasStrip(ticks),
    };
  }

  if (breakDown < -0.4 && mom < -0.6) {
    return {
      signal: "FALL", confidence: Math.max(conf, 60), validFor: "next 3–5 ticks",
      timing: timingLabel(conf),
      reasons: [`Breakout DOWN (score=${breakDown.toFixed(2)})`, `Strong momentum (${mom.toFixed(2)})`, `Ultra-short window`],
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

export type EngineType = "rise_fall" | "higher_lower" | "even_odd" | "over_under" |
  "match_differ" | "boom_crash" | "accumulators" | "multipliers" | "turbo";

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
