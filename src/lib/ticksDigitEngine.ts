/**
 * Ticks Digit Strategy Engine — Production-grade
 * 
 * Combines multiple weak signals into one confidence score:
 * A) Digit Frequency Divergence (Chi-square / Z-score)
 * B) Streak Exhaustion (runs)
 * C) Transition Bias (Markov deviation)
 * D) Micro-volatility burst (noise regime filter)
 */

import type { SignalResult, SignalDirection } from "./signalEngines";

// ── Helpers ─────────────────────────────────────────────────────────

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function lastDigitFromPrice(price: number): number {
  const s = price.toString().replace(".", "");
  const lastChar = s.slice(-1);
  const d = Number(lastChar);
  return Number.isFinite(d) ? d : 0;
}

// ── A) Digit Frequency Divergence ───────────────────────────────────

interface FrequencyResult {
  freqScore: number;
  hotDigit: number;
  coldDigit: number;
  zMax: number;
  zMin: number;
  counts: number[];
  zScores: number[];
}

function calcFrequencyScore(digits: number[], N: number): FrequencyResult {
  const p0 = 0.1;
  const counts = Array(10).fill(0);
  const slice = digits.slice(-N);
  for (const d of slice) counts[d]++;

  let zMax = -Infinity, zMin = Infinity, hot = 0, cold = 0;
  const zScores: number[] = [];
  
  for (let d = 0; d < 10; d++) {
    const phat = counts[d] / N;
    const z = (phat - p0) / Math.sqrt((p0 * (1 - p0)) / N);
    zScores.push(z);
    if (z > zMax) { zMax = z; hot = d; }
    if (z < zMin) { zMin = z; cold = d; }
  }

  const zCap = 3.0;
  const freqScore = clamp01(Math.abs(zMax) / zCap);

  return { freqScore, hotDigit: hot, coldDigit: cold, zMax, zMin, counts, zScores };
}

// ── B) Streak Exhaustion ────────────────────────────────────────────

interface StreakResult {
  runLen: number;
  runDigit: number;
  streakScore: number;
}

function detectRun(digits: number[]): StreakResult {
  const last = digits[digits.length - 1];
  let runLen = 1;
  for (let i = digits.length - 2; i >= 0; i--) {
    if (digits[i] === last) runLen++;
    else break;
  }
  const streakScore = clamp01((runLen - 2) / 5);
  return { runLen, runDigit: last, streakScore };
}

// ── C) Transition Bias (Markov) ─────────────────────────────────────

interface MarkovResult {
  markovScore: number;
  nextLikelyDigit: number;
  transitionProb: number;
}

function calcMarkovScore(digits: number[], N: number): MarkovResult {
  const trans = Array.from({ length: 10 }, () => Array(10).fill(0));
  const slice = digits.slice(-N);
  for (let i = 1; i < slice.length; i++) {
    trans[slice[i - 1]][slice[i]]++;
  }
  const last = slice[slice.length - 1];
  const rowSum = trans[last].reduce((a: number, b: number) => a + b, 0) || 1;
  const probs = trans[last].map((c: number) => c / rowSum);

  const expected = 0.1;
  const maxP = Math.max(...probs);
  const markovScore = clamp01((maxP - expected) / 0.15);

  const nextLikelyDigit = probs.indexOf(maxP);
  return { markovScore, nextLikelyDigit, transitionProb: maxP };
}

// ── D) Micro-volatility ─────────────────────────────────────────────

function calcVolScore(prices: number[], S: number): number {
  const slice = prices.slice(-S);
  if (slice.length < 5) return 1;
  
  const deltas: number[] = [];
  for (let i = 1; i < slice.length; i++) {
    deltas.push(Math.abs(slice[i] - slice[i - 1]));
  }
  
  // Median delta
  const sorted = [...deltas].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  
  // For digit contracts, we want moderate volatility
  // Too low = no digit variation, too high = chaotic
  // Use a simple normalized score — 1.0 means "normal"
  if (median === 0) return 0.5; // no price movement at all
  
  // We normalize against a rolling baseline
  const longSlice = prices.slice(-200);
  const longDeltas: number[] = [];
  for (let i = 1; i < longSlice.length; i++) {
    longDeltas.push(Math.abs(longSlice[i] - longSlice[i - 1]));
  }
  const longSorted = [...longDeltas].sort((a, b) => a - b);
  const longMedian = longSorted[Math.floor(longSorted.length / 2)] || median;
  
  const ratio = median / (longMedian || 1);
  // Ideal ratio ~1.0, penalize extremes
  return 1 - clamp01(Math.abs(ratio - 1) / 1.5);
}

// ── Main Engine ─────────────────────────────────────────────────────

export interface TicksDigitFeatures {
  freq: {
    hotDigit: number;
    coldDigit: number;
    zMax: number;
    zMin: number;
    counts: number[];
  };
  run: {
    runLen: number;
    runDigit: number;
    streakScore: number;
  };
  markov: {
    nextLikelyDigit: number;
    markovScore: number;
    transitionProb: number;
  };
  vol: {
    volScore: number;
  };
  pSuccess: number;
  baseline: number;
  edge: number;
  contract: string;
  barrier: number;
}

export function ticksDigitEngine(prices: number[]): SignalResult & { digitFeatures?: TicksDigitFeatures } {
  if (prices.length < 60) {
    return {
      signal: "WAIT",
      confidence: 20,
      validFor: "collecting data",
      timing: "Late",
      reasons: [`Need 60+ ticks, have ${prices.length}`],
      biasStrip: [],
    };
  }

  const digits = prices.map(lastDigitFromPrice);
  const N = Math.min(200, digits.length);
  const S = Math.min(40, prices.length);

  // Compute all signal components
  const freq = calcFrequencyScore(digits, N);
  const run = detectRun(digits);
  const mk = calcMarkovScore(digits, Math.min(120, digits.length));
  const volScore = calcVolScore(prices, S);

  // Weighted confidence
  const confidenceRaw =
    0.45 * freq.freqScore +
    0.35 * run.streakScore +
    0.15 * mk.markovScore +
    0.05 * volScore;

  const confidence = Math.round(100 * clamp01(confidenceRaw));

  // Contract choice logic — improved v2
  let contract = "DIFFERS";
  let barrier = freq.hotDigit;
  let strategy = "Digit Mean Reversion";
  const reasonParts: string[] = [];

  // Get last digit for Markov context
  const lastDigit = digits[digits.length - 1];

  // ── MATCH via Markov transition (primary MATCH signal) ──
  // If a specific digit frequently follows the current last digit, MATCH it
  if (mk.transitionProb >= 0.40 && mk.nextLikelyDigit !== lastDigit) {
    contract = "MATCH";
    barrier = mk.nextLikelyDigit;
    strategy = "Markov Transition Match";
    reasonParts.push(`After digit ${lastDigit}, digit ${mk.nextLikelyDigit} appears ${(mk.transitionProb * 100).toFixed(0)}%`);
    reasonParts.push(`Markov edge: +${((mk.transitionProb - 0.10) * 100).toFixed(1)}% above baseline`);
  }
  // ── Streak exhaustion → DIFFERS ──
  else if (run.runLen >= 3) {
    contract = "DIFFERS";
    barrier = run.runDigit;
    strategy = "Streak Exhaustion";
    reasonParts.push(`Run ${run.runDigit} ×${run.runLen}`);
    reasonParts.push(`Streak score: ${(run.streakScore * 100).toFixed(0)}%`);
  }
  // ── Hot digit mean reversion → DIFFERS ──
  else if (freq.freqScore > 0.25) {
    contract = "DIFFERS";
    barrier = freq.hotDigit;
    strategy = "Digit Mean Reversion";
    reasonParts.push(`Hot digit: ${freq.hotDigit} (z=${freq.zMax.toFixed(2)})`);
    reasonParts.push(`Frequency divergence: ${(freq.freqScore * 100).toFixed(0)}%`);
  }
  // ── Self-repeat Markov → MATCH ──
  else if (mk.transitionProb >= 0.27 && run.runLen >= 2) {
    contract = "MATCH";
    barrier = lastDigit;
    strategy = "Self-Repeat (Markov)";
    reasonParts.push(`Digit ${lastDigit} self-repeats ${(mk.transitionProb * 100).toFixed(0)}% (streak ×${run.runLen})`);
  }
  // ── Default: DIFFERS hot digit ──
  else {
    reasonParts.push(`Hot digit: ${freq.hotDigit} (z=${freq.zMax.toFixed(2)})`);
  }

  // Add volatility note
  if (volScore < 0.5) {
    reasonParts.push(`⚠ Unusual volatility regime`);
  }

  // Determine action — lower threshold for more signals
  const action: SignalDirection = confidence >= 70 ? "DIFFER" : "WAIT";

  // Probability estimate
  const baseline = contract === "DIFFERS" ? 0.9 : 0.1;
  const edge = contract === "DIFFERS"
    ? (Math.max(0, confidence - 70) / 30) * 0.06
    : (Math.max(0, confidence - 85) / 15) * 0.04;
  const pSuccess = clamp01(baseline + edge);

  // Map contract to signal direction
  let signalDir: SignalDirection = "WAIT";
  if (confidence >= 70) {
    if (contract === "DIFFERS") signalDir = "DIFFER";
    else if (contract === "MATCH") signalDir = "MATCH";
  }

  const digitFeatures: TicksDigitFeatures = {
    freq: { hotDigit: freq.hotDigit, coldDigit: freq.coldDigit, zMax: freq.zMax, zMin: freq.zMin, counts: freq.counts },
    run: { runLen: run.runLen, runDigit: run.runDigit, streakScore: run.streakScore },
    markov: { nextLikelyDigit: mk.nextLikelyDigit, markovScore: mk.markovScore, transitionProb: mk.transitionProb },
    vol: { volScore },
    pSuccess,
    baseline,
    edge,
    contract,
    barrier,
  };

  return {
    signal: signalDir,
    confidence,
    validFor: "next 1 tick",
    timing: confidence > 80 ? "Good" : confidence > 70 ? "Okay" : "Late",
    reasons: [
      `Strategy: ${strategy}`,
      ...reasonParts,
      `P(success): ${(pSuccess * 100).toFixed(1)}% (baseline ${(baseline * 100).toFixed(0)}%)`,
    ],
    suggestedDuration: 5,
    suggestedBarrier: barrier,
    biasStrip: buildDigitBiasStrip(digits),
    digitFeatures,
  };
}

// Build a visual strip showing recent digit distribution
function buildDigitBiasStrip(digits: number[]): ("↑" | "↓" | "─")[] {
  const recent = digits.slice(-10);
  const strip: ("↑" | "↓" | "─")[] = [];
  for (let i = 1; i < recent.length; i++) {
    const d = recent[i] - recent[i - 1];
    strip.push(d > 0 ? "↑" : d < 0 ? "↓" : "─");
  }
  return strip;
}

// ── Ticks Engine (for the "ticks" trade mode) ───────────────────────
// Uses momentum-based scalping for tick contracts

export function ticksEngine(prices: number[]): SignalResult {
  if (prices.length < 20) {
    return {
      signal: "WAIT",
      confidence: 25,
      validFor: "collecting data",
      timing: "Late",
      reasons: ["Not enough tick data"],
      biasStrip: [],
    };
  }

  const t = prices.slice(-60);
  const k = 5;
  
  // Simple tick momentum
  const r: number[] = [];
  for (let i = 1; i < t.length; i++) r.push(t[i] - t[i - 1]);
  
  const atr = r.reduce((s, v) => s + Math.abs(v), 0) / r.length || 0.0001;
  const mom = (t[t.length - 1] - t[Math.max(0, t.length - 1 - k)]) / (k * atr);
  
  // 5-tick acceleration
  const last5 = r.slice(-5);
  const accel = last5.reduce((s, v) => s + v, 0) / (5 * atr);
  
  const sameDir = last5.filter(v => Math.sign(v) === Math.sign(accel)).length;
  const dirScore = sameDir / 5;
  
  const conf = Math.round(40 + dirScore * 35 + Math.min(Math.abs(accel), 1) * 25);
  
  if (accel > 0.3 && dirScore >= 0.6 && mom > 0.2) {
    return {
      signal: "RISE",
      confidence: Math.min(conf, 95),
      validFor: "next 3-5 ticks",
      timing: conf > 80 ? "Good" : conf > 70 ? "Okay" : "Late",
      reasons: [
        `Tick momentum UP (${accel.toFixed(2)})`,
        `${sameDir}/5 ticks aligned`,
        `Acceleration strong`,
      ],
      suggestedDuration: 5,
      biasStrip: buildDigitBiasStrip(prices.map(lastDigitFromPrice)),
    };
  }
  
  if (accel < -0.3 && dirScore >= 0.6 && mom < -0.2) {
    return {
      signal: "FALL",
      confidence: Math.min(conf, 95),
      validFor: "next 3-5 ticks",
      timing: conf > 80 ? "Good" : conf > 70 ? "Okay" : "Late",
      reasons: [
        `Tick momentum DOWN (${accel.toFixed(2)})`,
        `${sameDir}/5 ticks aligned`,
        `Acceleration strong`,
      ],
      suggestedDuration: 5,
      biasStrip: buildDigitBiasStrip(prices.map(lastDigitFromPrice)),
    };
  }
  
  return {
    signal: "WAIT",
    confidence: Math.round(30 + Math.random() * 20),
    validFor: "waiting",
    timing: "Late",
    reasons: [`No tick momentum (accel=${accel.toFixed(2)}, dir=${dirScore.toFixed(2)})`],
    biasStrip: buildDigitBiasStrip(prices.map(lastDigitFromPrice)),
  };
}
