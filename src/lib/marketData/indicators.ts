import type { NormalizedCandle } from "./types";

/**
 * Indicators computed from the SAME normalized candle dataset the chart renders.
 * Every function returns a series aligned index-for-index with `candles`
 * (nulls during warm-up) so markers/lines can never drift off the candles.
 */

export function emaSeries(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (values.length < period || period <= 0) return out;
  const k = 2 / (period + 1);
  let sum = 0;
  for (let i = 0; i < period; i++) sum += values[i];
  let prev = sum / period;
  out[period - 1] = prev;
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

export function smaSeries(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (period <= 0) return out;
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

export function rsiSeries(values: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (values.length <= period) return out;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gain += diff;
    else loss -= diff;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    const g = diff > 0 ? diff : 0;
    const l = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

export interface MacdPoint {
  macd: number | null;
  signal: number | null;
  histogram: number | null;
}

export function macdSeries(values: number[], fast = 12, slow = 26, signal = 9): MacdPoint[] {
  const fastEma = emaSeries(values, fast);
  const slowEma = emaSeries(values, slow);
  const macdLine: number[] = [];
  const macdIdx: number[] = [];
  const raw: (number | null)[] = values.map((_, i) => {
    const f = fastEma[i];
    const s = slowEma[i];
    if (f == null || s == null) return null;
    const v = f - s;
    macdLine.push(v);
    macdIdx.push(i);
    return v;
  });
  const sig = emaSeries(macdLine, signal);
  const out: MacdPoint[] = values.map(() => ({ macd: null, signal: null, histogram: null }));
  macdIdx.forEach((idx, j) => {
    const m = raw[idx];
    const s = sig[j];
    out[idx] = {
      macd: m ?? null,
      signal: s ?? null,
      histogram: m != null && s != null ? m - s : null,
    };
  });
  return out;
}

export function atrSeries(candles: NormalizedCandle[], period = 14): (number | null)[] {
  const out: (number | null)[] = new Array(candles.length).fill(null);
  if (candles.length <= period) return out;
  const trs: number[] = [0];
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    const prev = candles[i - 1];
    trs.push(Math.max(c.high - c.low, Math.abs(c.high - prev.close), Math.abs(c.low - prev.close)));
  }
  let sum = 0;
  for (let i = 1; i <= period; i++) sum += trs[i];
  let prevAtr = sum / period;
  out[period] = prevAtr;
  for (let i = period + 1; i < candles.length; i++) {
    prevAtr = (prevAtr * (period - 1) + trs[i]) / period;
    out[i] = prevAtr;
  }
  return out;
}

export interface IndicatorSet {
  closes: number[];
  ema9: (number | null)[];
  ema21: (number | null)[];
  ema50: (number | null)[];
  sma200: (number | null)[];
  rsi14: (number | null)[];
  macd: MacdPoint[];
  atr14: (number | null)[];
}

/** One pass over the chart dataset — shared by chart, signals and backtests. */
export function computeIndicators(candles: NormalizedCandle[]): IndicatorSet {
  const closes = candles.map((c) => c.close);
  return {
    closes,
    ema9: emaSeries(closes, 9),
    ema21: emaSeries(closes, 21),
    ema50: emaSeries(closes, 50),
    sma200: smaSeries(closes, 200),
    rsi14: rsiSeries(closes, 14),
    macd: macdSeries(closes),
    atr14: atrSeries(candles, 14),
  };
}