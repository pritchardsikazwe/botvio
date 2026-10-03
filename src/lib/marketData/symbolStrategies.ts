import type { Timeframe } from "./types";

export type SymbolStrategyId =
  | "GOLD_STRUCTURE"
  | "BTC_MOMENTUM"
  | "NAS100_BREAKOUT"
  | "GBP_PULLBACK"
  | "FX_TREND_PULLBACK"
  | "CRYPTO_MOMENTUM"
  | "US_INDEX_BREAKOUT"
  | "EU_INDEX_BREAKOUT"
  | "OIL_MOMENTUM"
  | "SILVER_STRUCTURE"
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
    timeframes: ["1m", "5m", "15m", "30m", "1H", "4H", "1D"],
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

  US_INDEX_BREAKOUT: {
    id: "US_INDEX_BREAKOUT", label: "US Index Breakout + Retest",
    timeframes: ["1m","5m","15m","30m","1H","4H","1D"], minConfidence: 76,
    atrStop: 1.4, atrTarget: 2.7, maxExtensionAtr: 1.35,
    description: "Index session breakout, retest and momentum confirmation.",
  },
  EU_INDEX_BREAKOUT: {
    id: "EU_INDEX_BREAKOUT", label: "European Index Breakout + Retest",
    timeframes: ["1m","5m","15m","30m","1H","4H","1D"], minConfidence: 75,
    atrStop: 1.35, atrTarget: 2.5, maxExtensionAtr: 1.3,
    description: "European index structure and session breakout confirmation.",
  },
  OIL_MOMENTUM: {
    id: "OIL_MOMENTUM", label: "Crude Oil Momentum + Pullback",
    timeframes: ["1m","5m","15m","30m","1H","4H","1D"], minConfidence: 76,
    atrStop: 1.45, atrTarget: 2.7, maxExtensionAtr: 1.4,
    description: "Energy momentum, breakout and controlled pullback.",
  },
  SILVER_STRUCTURE: {
    id: "SILVER_STRUCTURE", label: "Silver Structure + Momentum",
    timeframes: ["1m","5m","15m","30m","1H","4H","1D"], minConfidence: 75,
    atrStop: 1.35, atrTarget: 2.5, maxExtensionAtr: 1.3,
    description: "Silver structure, liquidity reaction and momentum confirmation.",
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
  if (s === "XAGUSD" || s === "SILVER") return PROFILES.SILVER_STRUCTURE;
  if (["US30","DJ30","DJI","DOWJONES","US500","SPX500","SP500","SPX"].includes(s)) return PROFILES.US_INDEX_BREAKOUT;
  if (["GER40","DAX40","DE40","UK100","FTSE100","EU50","STOXX50","FRA40","CAC40"].includes(s)) return PROFILES.EU_INDEX_BREAKOUT;
  if (["USOIL","WTI","XTIUSD","UKOIL","BRENT","XBRUSD"].includes(s)) return PROFILES.OIL_MOMENTUM;
  if (s === "BTCUSD" || s === "BTCUSDT") return PROFILES.BTC_MOMENTUM;
  if (s === "NAS100" || s === "NASDAQ" || s === "NDX") return PROFILES.NAS100_BREAKOUT;
  if (s === "GBPUSD") return PROFILES.GBP_PULLBACK;
  if (s === "ETHUSD" || s === "ETHUSDT" || s === "SOLUSD" || s === "SOLUSDT") return PROFILES.CRYPTO_MOMENTUM;
  if (/^[A-Z]{6}$/.test(s)) return PROFILES.FX_TREND_PULLBACK;
  return PROFILES.GENERIC_TREND;
}
