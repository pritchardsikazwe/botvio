import type { Timeframe } from "./types";

export type SymbolStrategyId =
  | "GOLD_STRUCTURE"
  | "BTC_MOMENTUM"
  | "NAS100_BREAKOUT"
  | "GBP_PULLBACK"
  | "FX_TREND_PULLBACK"
  | "CRYPTO_MOMENTUM"
  | "GENERIC_TREND";

export interface SymbolStrategyProfile {
  id: SymbolStrategyId;
  label: string;
  timeframes: Timeframe[];
  minConfidence: number;
  atrStop: number;
  atrTarget: number;
  maxExtensionAtr: number;
  description: string;
}

const PROFILES: Record<SymbolStrategyId, SymbolStrategyProfile> = {
  GOLD_STRUCTURE: {
    id: "GOLD_STRUCTURE",
    label: "Gold Structure + Liquidity",
    timeframes: ["5m", "15m", "30m", "1H"],
    minConfidence: 76,
    atrStop: 1.35,
    atrTarget: 2.45,
    maxExtensionAtr: 1.25,
    description: "Structure, pullback, liquidity sweep and momentum confirmation.",
  },
  BTC_MOMENTUM: {
    id: "BTC_MOMENTUM",
    label: "Bitcoin Momentum Breakout",
    timeframes: ["5m", "15m", "30m", "1H"],
    minConfidence: 77,
    atrStop: 1.55,
    atrTarget: 2.8,
    maxExtensionAtr: 1.5,
    description: "Volatility expansion and momentum continuation with breakout confirmation.",
  },
  NAS100_BREAKOUT: {
    id: "NAS100_BREAKOUT",
    label: "NAS100 Breakout + Retest",
    timeframes: ["5m", "15m", "30m", "1H"],
    minConfidence: 77,
    atrStop: 1.4,
    atrTarget: 2.6,
    maxExtensionAtr: 1.35,
    description: "Range break followed by confirmation/retest rather than chasing the first candle.",
  },
  GBP_PULLBACK: {
    id: "GBP_PULLBACK",
    label: "GBP Momentum Pullback",
    timeframes: ["5m", "15m", "30m", "1H"],
    minConfidence: 75,
    atrStop: 1.2,
    atrTarget: 2.15,
    maxExtensionAtr: 1.15,
    description: "Trend alignment plus controlled pullback and candle confirmation.",
  },
  FX_TREND_PULLBACK: {
    id: "FX_TREND_PULLBACK",
    label: "FX Trend + Pullback",
    timeframes: ["5m", "15m", "30m", "1H"],
    minConfidence: 74,
    atrStop: 1.25,
    atrTarget: 2.2,
    maxExtensionAtr: 1.2,
    description: "EMA structure, momentum and pullback confirmation.",
  },
  CRYPTO_MOMENTUM: {
    id: "CRYPTO_MOMENTUM",
    label: "Crypto Momentum",
    timeframes: ["5m", "15m", "30m", "1H"],
    minConfidence: 76,
    atrStop: 1.5,
    atrTarget: 2.7,
    maxExtensionAtr: 1.45,
    description: "Momentum continuation with volatility expansion and anti-chase filter.",
  },
  GENERIC_TREND: {
    id: "GENERIC_TREND",
    label: "Adaptive Trend + Pullback",
    timeframes: ["5m", "15m", "30m", "1H"],
    minConfidence: 72,
    atrStop: 1.3,
    atrTarget: 2.25,
    maxExtensionAtr: 1.25,
    description: "Conservative trend-following fallback.",
  },
};

export function getSymbolStrategy(symbol: string): SymbolStrategyProfile {
  const s = symbol.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (s === "XAUUSD" || s === "GOLD") return PROFILES.GOLD_STRUCTURE;
  if (s === "BTCUSD" || s === "BTCUSDT") return PROFILES.BTC_MOMENTUM;
  if (s === "NAS100" || s === "NASDAQ" || s === "NDX") return PROFILES.NAS100_BREAKOUT;
  if (s === "GBPUSD") return PROFILES.GBP_PULLBACK;
  if (s === "ETHUSD" || s === "ETHUSDT" || s === "SOLUSD" || s === "SOLUSDT") return PROFILES.CRYPTO_MOMENTUM;
  if (/^[A-Z]{6}$/.test(s)) return PROFILES.FX_TREND_PULLBACK;
  return PROFILES.GENERIC_TREND;
}
