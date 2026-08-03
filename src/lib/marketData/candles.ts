import type { NormalizedCandle, NormalizedTick } from "./types";

/** Bucket start (epoch seconds) for a timestamp on a given timeframe. */
export function bucketStart(epochSeconds: number, tfSeconds: number): number {
  return epochSeconds - (epochSeconds % tfSeconds);
}

/**
 * Insert or update a candle in an ascending-by-time array.
 * - duplicate bucket → merged (protects against duplicate pushes)
 * - out-of-order bucket → inserted at the right index (never corrupts order)
 */
export function upsertCandle(list: NormalizedCandle[], candle: NormalizedCandle): NormalizedCandle[] {
  if (!Number.isFinite(candle.time) || !Number.isFinite(candle.close)) return list;
  if (!list.length) return [candle];

  const last = list[list.length - 1];
  if (candle.time === last.time) {
    const next = list.slice(0, -1);
    next.push(mergeCandle(last, candle));
    return next;
  }
  if (candle.time > last.time) return [...list, candle];

  // Out-of-order: binary search the insertion point.
  let lo = 0;
  let hi = list.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (list[mid].time === candle.time) {
      const next = list.slice();
      next[mid] = mergeCandle(list[mid], candle);
      return next;
    }
    if (list[mid].time < candle.time) lo = mid + 1;
    else hi = mid - 1;
  }
  const next = list.slice();
  next.splice(lo, 0, candle);
  return next;
}

function mergeCandle(prev: NormalizedCandle, next: NormalizedCandle): NormalizedCandle {
  return {
    time: prev.time,
    open: prev.open,
    high: Math.max(prev.high, next.high),
    low: Math.min(prev.low, next.low),
    close: next.close,
    volume: (prev.volume ?? 0) + (next.volume ?? 0) || undefined,
  };
}

/** Apply a tick to the forming candle, opening a new bucket when needed. */
export function applyTick(
  list: NormalizedCandle[],
  tick: NormalizedTick,
  tfSeconds: number
): NormalizedCandle[] {
  if (!Number.isFinite(tick.price)) return list;
  const time = bucketStart(tick.time, tfSeconds);
  const last = list[list.length - 1];

  if (!last || time > last.time) {
    return [
      ...list,
      { time, open: last?.close ?? tick.price, high: tick.price, low: tick.price, close: tick.price },
    ];
  }
  if (time < last.time) return list; // stale/out-of-order tick — ignore

  const updated: NormalizedCandle = {
    ...last,
    high: Math.max(last.high, tick.price),
    low: Math.min(last.low, tick.price),
    close: tick.price,
  };
  const next = list.slice(0, -1);
  next.push(updated);
  return next;
}

/** Aggregate raw ticks into normalized candles for a timeframe. */
export function aggregateTicks(
  ticks: { time: number; price: number }[],
  tfSeconds: number
): NormalizedCandle[] {
  const buckets = new Map<number, NormalizedCandle>();
  const ordered = ticks
    .filter((t) => Number.isFinite(t.time) && Number.isFinite(t.price))
    .sort((a, b) => a.time - b.time);

  for (const t of ordered) {
    const time = bucketStart(t.time, tfSeconds);
    const existing = buckets.get(time);
    if (!existing) {
      buckets.set(time, { time, open: t.price, high: t.price, low: t.price, close: t.price });
    } else {
      existing.high = Math.max(existing.high, t.price);
      existing.low = Math.min(existing.low, t.price);
      existing.close = t.price;
    }
  }
  return Array.from(buckets.values()).sort((a, b) => a.time - b.time);
}

/** Trim the dataset to a bounded window (memory/perf guard). */
export function trimCandles(list: NormalizedCandle[], max: number): NormalizedCandle[] {
  return list.length > max ? list.slice(list.length - max) : list;
}