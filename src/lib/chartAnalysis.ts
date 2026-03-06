/**
 * Auto-detection of Support/Resistance, Breakouts, Wicks, Rejections, and Trendlines
 * from raw candle data — no external indicators needed.
 */

interface Candle {
  candle_time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface PriceLevel {
  price: number;
  type: "support" | "resistance";
  touches: number;
  strength: "strong" | "moderate" | "weak";
}

export interface WickRejection {
  time: number; // unix seconds
  price: number;
  type: "wick_rejection_high" | "wick_rejection_low";
  wickSize: number;
}

export interface Breakout {
  time: number;
  price: number;
  direction: "up" | "down";
}

export interface TrendlinePoint {
  time: number;
  value: number;
}

export interface TrendlineData {
  points: TrendlinePoint[];
  type: "ascending" | "descending";
}

// ── Pivot-based S/R detection ──────────────────────────────────────────
function isPivotHigh(candles: Candle[], i: number, lookback: number): boolean {
  if (i < lookback || i >= candles.length - lookback) return false;
  const h = candles[i].high;
  for (let j = i - lookback; j <= i + lookback; j++) {
    if (j !== i && candles[j].high >= h) return false;
  }
  return true;
}

function isPivotLow(candles: Candle[], i: number, lookback: number): boolean {
  if (i < lookback || i >= candles.length - lookback) return false;
  const l = candles[i].low;
  for (let j = i - lookback; j <= i + lookback; j++) {
    if (j !== i && candles[j].low <= l) return false;
  }
  return true;
}

export function detectSupportResistance(candles: Candle[], lookback = 5, tolerance = 0.001): PriceLevel[] {
  if (candles.length < lookback * 2 + 1) return [];

  const pivotHighs: number[] = [];
  const pivotLows: number[] = [];

  for (let i = lookback; i < candles.length - lookback; i++) {
    if (isPivotHigh(candles, i, lookback)) pivotHighs.push(candles[i].high);
    if (isPivotLow(candles, i, lookback)) pivotLows.push(candles[i].low);
  }

  // Cluster nearby pivots
  const clusterLevels = (pivots: number[], type: "support" | "resistance"): PriceLevel[] => {
    if (pivots.length === 0) return [];
    const sorted = [...pivots].sort((a, b) => a - b);
    const clusters: { sum: number; count: number }[] = [];

    sorted.forEach((p) => {
      const existing = clusters.find(
        (c) => Math.abs(c.sum / c.count - p) / p < tolerance
      );
      if (existing) {
        existing.sum += p;
        existing.count++;
      } else {
        clusters.push({ sum: p, count: 1 });
      }
    });

    return clusters
      .map((c) => ({
        price: c.sum / c.count,
        type,
        touches: c.count,
        strength: (c.count >= 4 ? "strong" : c.count >= 2 ? "moderate" : "weak") as PriceLevel["strength"],
      }))
      .sort((a, b) => b.touches - a.touches)
      .slice(0, 5); // top 5 levels per type
  };

  return [
    ...clusterLevels(pivotLows, "support"),
    ...clusterLevels(pivotHighs, "resistance"),
  ];
}

// ── Wick rejection detection ───────────────────────────────────────────
export function detectWickRejections(candles: Candle[], minWickRatio = 2.0): WickRejection[] {
  const rejections: WickRejection[] = [];

  candles.forEach((c) => {
    const body = Math.abs(c.close - c.open) || 0.0001;
    const upperWick = c.high - Math.max(c.open, c.close);
    const lowerWick = Math.min(c.open, c.close) - c.low;
    const time = Math.floor(new Date(c.candle_time).getTime() / 1000);

    if (upperWick / body >= minWickRatio && upperWick > lowerWick) {
      rejections.push({ time, price: c.high, type: "wick_rejection_high", wickSize: upperWick });
    }
    if (lowerWick / body >= minWickRatio && lowerWick > upperWick) {
      rejections.push({ time, price: c.low, type: "wick_rejection_low", wickSize: lowerWick });
    }
  });

  // Keep top 20 strongest
  return rejections.sort((a, b) => b.wickSize - a.wickSize).slice(0, 20);
}

// ── Breakout detection ─────────────────────────────────────────────────
export function detectBreakouts(candles: Candle[], levels: PriceLevel[], threshold = 0.001): Breakout[] {
  const breakouts: Breakout[] = [];
  if (candles.length < 3) return breakouts;

  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];
    const time = Math.floor(new Date(curr.candle_time).getTime() / 1000);

    for (const lvl of levels) {
      // Breakout above resistance
      if (lvl.type === "resistance") {
        if (prev.close <= lvl.price * (1 + threshold) && curr.close > lvl.price * (1 + threshold)) {
          breakouts.push({ time, price: lvl.price, direction: "up" });
        }
      }
      // Breakout below support
      if (lvl.type === "support") {
        if (prev.close >= lvl.price * (1 - threshold) && curr.close < lvl.price * (1 - threshold)) {
          breakouts.push({ time, price: lvl.price, direction: "down" });
        }
      }
    }
  }

  return breakouts.slice(-15); // recent breakouts
}

// ── Trendline detection (connect pivot lows for ascending, pivot highs for descending) ──
export function detectTrendlines(candles: Candle[], lookback = 5): TrendlineData[] {
  if (candles.length < lookback * 2 + 3) return [];

  const trendlines: TrendlineData[] = [];

  // Collect pivots with time
  const pivotLows: TrendlinePoint[] = [];
  const pivotHighs: TrendlinePoint[] = [];

  for (let i = lookback; i < candles.length - lookback; i++) {
    const time = Math.floor(new Date(candles[i].candle_time).getTime() / 1000);
    if (isPivotLow(candles, i, lookback)) {
      pivotLows.push({ time, value: candles[i].low });
    }
    if (isPivotHigh(candles, i, lookback)) {
      pivotHighs.push({ time, value: candles[i].high });
    }
  }

  // Ascending trendline: connect last 2-3 higher lows
  if (pivotLows.length >= 2) {
    const recent = pivotLows.slice(-4);
    // Find ascending sequence
    const ascending: TrendlinePoint[] = [recent[0]];
    for (let i = 1; i < recent.length; i++) {
      if (recent[i].value >= ascending[ascending.length - 1].value) {
        ascending.push(recent[i]);
      }
    }
    if (ascending.length >= 2) {
      // Extend line to last candle
      const lastTime = Math.floor(new Date(candles[candles.length - 1].candle_time).getTime() / 1000);
      const slope = (ascending[ascending.length - 1].value - ascending[0].value) /
        (ascending[ascending.length - 1].time - ascending[0].time);
      const extendedValue = ascending[ascending.length - 1].value + slope * (lastTime - ascending[ascending.length - 1].time);

      trendlines.push({
        type: "ascending",
        points: [...ascending, { time: lastTime, value: extendedValue }],
      });
    }
  }

  // Descending trendline: connect last 2-3 lower highs
  if (pivotHighs.length >= 2) {
    const recent = pivotHighs.slice(-4);
    const descending: TrendlinePoint[] = [recent[0]];
    for (let i = 1; i < recent.length; i++) {
      if (recent[i].value <= descending[descending.length - 1].value) {
        descending.push(recent[i]);
      }
    }
    if (descending.length >= 2) {
      const lastTime = Math.floor(new Date(candles[candles.length - 1].candle_time).getTime() / 1000);
      const slope = (descending[descending.length - 1].value - descending[0].value) /
        (descending[descending.length - 1].time - descending[0].time);
      const extendedValue = descending[descending.length - 1].value + slope * (lastTime - descending[descending.length - 1].time);

      trendlines.push({
        type: "descending",
        points: [...descending, { time: lastTime, value: extendedValue }],
      });
    }
  }

  return trendlines;
}

// ── Helper: get unix time from candle ──────────────────────────────────
export function candleTime(c: Candle): number {
  return Math.floor(new Date(c.candle_time).getTime() / 1000);
}
