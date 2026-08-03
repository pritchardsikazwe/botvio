/**
 * Normalized market-data contracts.
 *
 *   Broker / Data source → Market Data Adapter → Normalized OHLC/Ticks → Chart
 *
 * Every chart, indicator, signal engine and backtest in the app consumes the
 * SAME normalized shapes defined here. Adapters are the only place that knows
 * about broker specific payloads (Deriv WS, MT5 bridge ticks, …).
 */

export type Timeframe = "1m" | "3m" | "5m" | "15m" | "30m" | "1H" | "4H" | "1D";

export const TIMEFRAMES: { label: string; value: Timeframe; seconds: number }[] = [
  { label: "1m", value: "1m", seconds: 60 },
  { label: "3m", value: "3m", seconds: 180 },
  { label: "5m", value: "5m", seconds: 300 },
  { label: "15m", value: "15m", seconds: 900 },
  { label: "30m", value: "30m", seconds: 1800 },
  { label: "1H", value: "1H", seconds: 3600 },
  { label: "4H", value: "4H", seconds: 14400 },
  { label: "1D", value: "1D", seconds: 86400 },
];

export function timeframeSeconds(tf: Timeframe): number {
  return TIMEFRAMES.find((t) => t.value === tf)?.seconds ?? 300;
}

/** Normalized OHLC candle. `time` is a UTC epoch in SECONDS (bucket start). */
export interface NormalizedCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

/** Normalized tick. `time` is a UTC epoch in SECONDS. */
export interface NormalizedTick {
  time: number;
  price: number;
  bid?: number | null;
  ask?: number | null;
}

/**
 * Feed lifecycle:
 *  idle → connecting → live ⇄ reconnecting
 *  live → delayed      (no fresh data past the staleness threshold)
 *  any  → unavailable  (source has no data for this symbol — never faked)
 *  any  → error        (hard failure, message in diagnostics)
 */
export type FeedStatus =
  | "idle"
  | "connecting"
  | "live"
  | "reconnecting"
  | "delayed"
  | "unavailable"
  | "error";

export interface FeedDiagnostics {
  /** Adapter id, e.g. "deriv" | "weltrade-bridge" */
  source: string;
  sourceLabel: string;
  /** Broker-native symbol actually requested from the source */
  feedSymbol: string;
  timeframe: Timeframe;
  status: FeedStatus;
  wsState: string;
  apiStatus: string;
  lastTickAt: number | null;
  lastCandleAt: number | null;
  candleCount: number;
  currentPrice: number | null;
  serverTimeMs: number | null;
  clientTimeMs: number;
  lastError: string | null;
  reconnects: number;
  droppedTicks: number;
}

export interface AdapterHandlers {
  /** Full historical replacement (initial load / timeframe switch). */
  onSnapshot: (candles: NormalizedCandle[]) => void;
  /** Upsert a single candle (append new bucket or update the forming one). */
  onCandle: (candle: NormalizedCandle) => void;
  onTick: (tick: NormalizedTick) => void;
  onStatus: (
    status: FeedStatus,
    detail?: { error?: string | null; wsState?: string; apiStatus?: string; serverTimeMs?: number }
  ) => void;
}

export interface AdapterConfig {
  /** Broker-native symbol (e.g. "frxEURUSD", "GainX 400"). */
  feedSymbol: string;
  timeframe: Timeframe;
  /** Max historical candles to load. Keep bounded for performance. */
  historyLimit?: number;
}

export interface MarketDataAdapter {
  readonly id: string;
  readonly label: string;
  start(handlers: AdapterHandlers): void;
  stop(): void;
}

export type MarketDataSource = "deriv" | "weltrade-bridge";