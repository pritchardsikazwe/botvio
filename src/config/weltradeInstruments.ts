import type { MarketDataSource } from "@/lib/marketData/types";
import type { SyntxFamily } from "@/lib/marketData/syntxStrategy";

export type WeltradeCategory = "syntx" | "forex" | "metals" | "indices" | "crypto" | "commodities";

export interface WeltradeInstrument {
  key: string;
  label: string;
  /** Exact Weltrade MT5 ticker used for execution / Bridge EA lookups. */
  mt5Symbol: string;
  category: WeltradeCategory;
  /** Which normalized adapter provides the OHLC data. */
  source: MarketDataSource;
  /** Broker-native symbol handed to the adapter. */
  feedSymbol: string;
  /** Decimal places for price display. */
  decimals: number;
  bias: "buy" | "sell" | "both";
  syntxFamily?: SyntxFamily;
  /**
   * True when the price stream is the same underlying market from another
   * venue (Weltrade does not expose a public datafeed for majors). Shown to the
   * user so they always know exactly which feed the candles come from.
   */
  referenceFeed?: boolean;
  blurb: string;
}

export const WELTRADE_CATEGORY_LABEL: Record<WeltradeCategory, string> = {
  syntx: "SyntX",
  forex: "Forex",
  metals: "Metals",
  indices: "Indices",
  crypto: "Crypto",
  commodities: "Commodities",
};

/**
 * Weltrade instrument catalogue.
 *
 * - SyntX indices use the connected TradeCopy / MT5 API Studio market-data
 *   connection. This is the primary Botvio feed for Weltrade SyntX charts,
 *   indicators and signal analysis.
 * - The legacy Bridge EA path remains available for compatibility but is not
 *   the primary Weltrade market-data source.
 * - Majors (FX, metals, indices, crypto, commodities) use Deriv as a clearly
 *   labelled reference feed. No prices are simulated.
 */
export const WELTRADE_INSTRUMENTS: WeltradeInstrument[] = [
  // ── SyntX (Weltrade MT5 API Studio) ───────────────────────────────────
  { key: "gainx-400", label: "GainX 400", mt5Symbol: "GainX 400", category: "syntx", syntxFamily: "gainx", source: "weltrade-api-studio", feedSymbol: "GainX 400", decimals: 3, bias: "sell", blurb: "Directional decline with adverse upward-jump risk." },
  { key: "gainx-600", label: "GainX 600", mt5Symbol: "GainX 600", category: "syntx", syntxFamily: "gainx", source: "weltrade-api-studio", feedSymbol: "GainX 600", decimals: 3, bias: "sell", blurb: "GainX directional framework; jump risk remains." },
  { key: "gainx-800", label: "GainX 800", mt5Symbol: "GainX 800", category: "syntx", syntxFamily: "gainx", source: "weltrade-api-studio", feedSymbol: "GainX 800", decimals: 3, bias: "sell", blurb: "GainX directional framework; jump risk remains." },
  { key: "gainx-999", label: "GainX 999", mt5Symbol: "GainX 999", category: "syntx", syntxFamily: "gainx", source: "weltrade-api-studio", feedSymbol: "GainX 999", decimals: 3, bias: "sell", blurb: "GainX directional framework; jump risk remains." },
  { key: "gainx-1200", label: "GainX 1200", mt5Symbol: "GainX 1200", category: "syntx", syntxFamily: "gainx", source: "weltrade-api-studio", feedSymbol: "GainX 1200", decimals: 3, bias: "sell", blurb: "GainX directional framework; jump risk remains." },
  { key: "painx-400", label: "PainX 400", mt5Symbol: "PainX 400", category: "syntx", syntxFamily: "painx", source: "weltrade-api-studio", feedSymbol: "PainX 400", decimals: 3, bias: "buy", blurb: "Directional rise with adverse downward-drop risk." },
  { key: "painx-600", label: "PainX 600", mt5Symbol: "PainX 600", category: "syntx", syntxFamily: "painx", source: "weltrade-api-studio", feedSymbol: "PainX 600", decimals: 3, bias: "buy", blurb: "PainX directional framework; drop risk remains." },
  { key: "painx-800", label: "PainX 800", mt5Symbol: "PainX 800", category: "syntx", syntxFamily: "painx", source: "weltrade-api-studio", feedSymbol: "PainX 800", decimals: 3, bias: "buy", blurb: "PainX directional framework; drop risk remains." },
  { key: "painx-999", label: "PainX 999", mt5Symbol: "PainX 999", category: "syntx", syntxFamily: "painx", source: "weltrade-api-studio", feedSymbol: "PainX 999", decimals: 3, bias: "buy", blurb: "PainX directional framework; drop risk remains." },
  { key: "painx-1200", label: "PainX 1200", mt5Symbol: "PainX 1200", category: "syntx", syntxFamily: "painx", source: "weltrade-api-studio", feedSymbol: "PainX 1200", decimals: 3, bias: "buy", blurb: "PainX directional framework; drop risk remains." },
  { key: "flipx-1", label: "FlipX 1", mt5Symbol: "FlipX 1", category: "syntx", syntxFamily: "flipx", source: "weltrade-api-studio", feedSymbol: "FlipX 1", decimals: 3, bias: "both", blurb: "Fixed-step directional changes; range framework." },
  { key: "flipx-2", label: "FlipX 2", mt5Symbol: "FlipX 2", category: "syntx", syntxFamily: "flipx", source: "weltrade-api-studio", feedSymbol: "FlipX 2", decimals: 3, bias: "both", blurb: "Fixed-step directional changes; range framework." },
  { key: "flipx-3", label: "FlipX 3", mt5Symbol: "FlipX 3", category: "syntx", syntxFamily: "flipx", source: "weltrade-api-studio", feedSymbol: "FlipX 3", decimals: 3, bias: "both", blurb: "Fixed-step directional changes; range framework." },
  { key: "flipx-4", label: "FlipX 4", mt5Symbol: "FlipX 4", category: "syntx", syntxFamily: "flipx", source: "weltrade-api-studio", feedSymbol: "FlipX 4", decimals: 3, bias: "both", blurb: "Fixed-step directional changes; range framework." },
  { key: "flipx-5", label: "FlipX 5", mt5Symbol: "FlipX 5", category: "syntx", syntxFamily: "flipx", source: "weltrade-api-studio", feedSymbol: "FlipX 5", decimals: 3, bias: "both", blurb: "Fixed-step directional changes; range framework." },
  { key: "switchx-600", label: "SwitchX 600", mt5Symbol: "SwitchX 600", category: "syntx", syntxFamily: "switchx", source: "weltrade-api-studio", feedSymbol: "SwitchX 600", decimals: 3, bias: "both", blurb: "Regime-switching behaviour; confirm the current mode." },
  { key: "switchx-1200", label: "SwitchX 1200", mt5Symbol: "SwitchX 1200", category: "syntx", syntxFamily: "switchx", source: "weltrade-api-studio", feedSymbol: "SwitchX 1200", decimals: 3, bias: "both", blurb: "Regime-switching behaviour; confirm the current mode." },
  { key: "switchx-1800", label: "SwitchX 1800", mt5Symbol: "SwitchX 1800", category: "syntx", syntxFamily: "switchx", source: "weltrade-api-studio", feedSymbol: "SwitchX 1800", decimals: 3, bias: "both", blurb: "Regime-switching behaviour; confirm the current mode." },
  { key: "breakx-600", label: "BreakX 600", mt5Symbol: "BreakX 600", category: "syntx", syntxFamily: "breakx", source: "weltrade-api-studio", feedSymbol: "BreakX 600", decimals: 3, bias: "both", blurb: "Jump-size breakout and regime behaviour." },
  { key: "breakx-1200", label: "BreakX 1200", mt5Symbol: "BreakX 1200", category: "syntx", syntxFamily: "breakx", source: "weltrade-api-studio", feedSymbol: "BreakX 1200", decimals: 3, bias: "both", blurb: "Jump-size breakout and regime behaviour." },
  { key: "breakx-1800", label: "BreakX 1800", mt5Symbol: "BreakX 1800", category: "syntx", syntxFamily: "breakx", source: "weltrade-api-studio", feedSymbol: "BreakX 1800", decimals: 3, bias: "both", blurb: "Jump-size breakout and regime behaviour." },
  { key: "trendx-600", label: "TrendX 600", mt5Symbol: "TrendX 600", category: "syntx", syntxFamily: "trendx", source: "weltrade-api-studio", feedSymbol: "TrendX 600", decimals: 3, bias: "both", blurb: "Trend regimes confirmed through market structure." },
  { key: "trendx-1200", label: "TrendX 1200", mt5Symbol: "TrendX 1200", category: "syntx", syntxFamily: "trendx", source: "weltrade-api-studio", feedSymbol: "TrendX 1200", decimals: 3, bias: "both", blurb: "Trend regimes confirmed through market structure." },
  { key: "trendx-1800", label: "TrendX 1800", mt5Symbol: "TrendX 1800", category: "syntx", syntxFamily: "trendx", source: "weltrade-api-studio", feedSymbol: "TrendX 1800", decimals: 3, bias: "both", blurb: "Trend regimes confirmed through market structure." },
  { key: "fx-vol-20", label: "FX Vol 20", mt5Symbol: "FX Vol 20", category: "syntx", syntxFamily: "fx-vol", source: "weltrade-api-studio", feedSymbol: "FX Vol 20", decimals: 3, bias: "both", blurb: "Algorithmic volatility; not an ordinary forex pair." },
  { key: "fx-vol-40", label: "FX Vol 40", mt5Symbol: "FX Vol 40", category: "syntx", syntxFamily: "fx-vol", source: "weltrade-api-studio", feedSymbol: "FX Vol 40", decimals: 3, bias: "both", blurb: "Algorithmic volatility; not an ordinary forex pair." },
  { key: "fx-vol-60", label: "FX Vol 60", mt5Symbol: "FX Vol 60", category: "syntx", syntxFamily: "fx-vol", source: "weltrade-api-studio", feedSymbol: "FX Vol 60", decimals: 3, bias: "both", blurb: "Algorithmic volatility; not an ordinary forex pair." },
  { key: "fx-vol-80", label: "FX Vol 80", mt5Symbol: "FX Vol 80", category: "syntx", syntxFamily: "fx-vol", source: "weltrade-api-studio", feedSymbol: "FX Vol 80", decimals: 3, bias: "both", blurb: "Algorithmic volatility; not an ordinary forex pair." },
  { key: "fx-vol-99", label: "FX Vol 99", mt5Symbol: "FX Vol 99", category: "syntx", syntxFamily: "fx-vol", source: "weltrade-api-studio", feedSymbol: "FX Vol 99", decimals: 3, bias: "both", blurb: "Algorithmic volatility; not an ordinary forex pair." },
  { key: "sfx-vol-20", label: "SFX Vol 20", mt5Symbol: "SFX Vol 20", category: "syntx", syntxFamily: "sfx-vol", source: "weltrade-api-studio", feedSymbol: "SFX Vol 20", decimals: 3, bias: "both", blurb: "Volatility with recurring synthetic spike events." },
  { key: "sfx-vol-40", label: "SFX Vol 40", mt5Symbol: "SFX Vol 40", category: "syntx", syntxFamily: "sfx-vol", source: "weltrade-api-studio", feedSymbol: "SFX Vol 40", decimals: 3, bias: "both", blurb: "Volatility with recurring synthetic spike events." },
  { key: "sfx-vol-60", label: "SFX Vol 60", mt5Symbol: "SFX Vol 60", category: "syntx", syntxFamily: "sfx-vol", source: "weltrade-api-studio", feedSymbol: "SFX Vol 60", decimals: 3, bias: "both", blurb: "Volatility with recurring synthetic spike events." },
  { key: "sfx-vol-80", label: "SFX Vol 80", mt5Symbol: "SFX Vol 80", category: "syntx", syntxFamily: "sfx-vol", source: "weltrade-api-studio", feedSymbol: "SFX Vol 80", decimals: 3, bias: "both", blurb: "Volatility with recurring synthetic spike events." },
  { key: "sfx-vol-99", label: "SFX Vol 99", mt5Symbol: "SFX Vol 99", category: "syntx", syntxFamily: "sfx-vol", source: "weltrade-api-studio", feedSymbol: "SFX Vol 99", decimals: 3, bias: "both", blurb: "Volatility with recurring synthetic spike events." },
  { key: "plusx-1", label: "PlusX 1", mt5Symbol: "PlusX 1", category: "syntx", syntxFamily: "plusx", source: "weltrade-api-studio", feedSymbol: "PlusX 1", decimals: 3, bias: "both", blurb: "Linear step-size progression." },
  { key: "fibox", label: "FiboX", mt5Symbol: "FiboX", category: "syntx", syntxFamily: "fibox", source: "weltrade-api-studio", feedSymbol: "FiboX", decimals: 3, bias: "both", blurb: "Fibonacci-sequence progression; not retracement prediction." },
  { key: "quadx", label: "QuadX", mt5Symbol: "QuadX", category: "syntx", syntxFamily: "quadx", source: "weltrade-api-studio", feedSymbol: "QuadX", decimals: 3, bias: "both", blurb: "Quadratic progression with accelerating step size." },
  { key: "max-painx", label: "MAX PainX", mt5Symbol: "MAX PainX", category: "syntx", syntxFamily: "max-painx", source: "weltrade-api-studio", feedSymbol: "MAX PainX", decimals: 3, bias: "buy", blurb: "Directional progression with escalating adverse-drop risk." },
  { key: "max-gainx", label: "MAX GainX", mt5Symbol: "MAX GainX", category: "syntx", syntxFamily: "max-gainx", source: "weltrade-api-studio", feedSymbol: "MAX GainX", decimals: 3, bias: "sell", blurb: "Directional progression with escalating adverse-jump risk." },
  // ── Forex majors ───────────────────────────────────────────────────────
  { key: "eurusd", label: "EUR/USD", mt5Symbol: "EURUSD", category: "forex", source: "deriv", feedSymbol: "frxEURUSD", decimals: 5, bias: "both", referenceFeed: true, blurb: "Most liquid major — tight spreads." },
  { key: "gbpusd", label: "GBP/USD", mt5Symbol: "GBPUSD", category: "forex", source: "deriv", feedSymbol: "frxGBPUSD", decimals: 5, bias: "both", referenceFeed: true, blurb: "London-session volatility." },
  { key: "usdjpy", label: "USD/JPY", mt5Symbol: "USDJPY", category: "forex", source: "deriv", feedSymbol: "frxUSDJPY", decimals: 3, bias: "both", referenceFeed: true, blurb: "Yield-driven trends." },
  { key: "audusd", label: "AUD/USD", mt5Symbol: "AUDUSD", category: "forex", source: "deriv", feedSymbol: "frxAUDUSD", decimals: 5, bias: "both", referenceFeed: true, blurb: "Commodity-linked major." },
  { key: "usdcad", label: "USD/CAD", mt5Symbol: "USDCAD", category: "forex", source: "deriv", feedSymbol: "frxUSDCAD", decimals: 5, bias: "both", referenceFeed: true, blurb: "Oil-correlated major." },
  { key: "usdchf", label: "USD/CHF", mt5Symbol: "USDCHF", category: "forex", source: "deriv", feedSymbol: "frxUSDCHF", decimals: 5, bias: "both", referenceFeed: true, blurb: "Safe-haven flows." },
  { key: "gbpjpy", label: "GBP/JPY", mt5Symbol: "GBPJPY", category: "forex", source: "deriv", feedSymbol: "frxGBPJPY", decimals: 3, bias: "both", referenceFeed: true, blurb: "High-range cross." },
  { key: "eurjpy", label: "EUR/JPY", mt5Symbol: "EURJPY", category: "forex", source: "deriv", feedSymbol: "frxEURJPY", decimals: 3, bias: "both", referenceFeed: true, blurb: "Trend-friendly cross." },

  // ── Metals ─────────────────────────────────────────────────────────────
  { key: "xauusd", label: "Gold (XAU/USD)", mt5Symbol: "XAUUSD", category: "metals", source: "deriv", feedSymbol: "frxXAUUSD", decimals: 2, bias: "both", referenceFeed: true, blurb: "Flagship metal — strong trends." },
  { key: "xagusd", label: "Silver (XAG/USD)", mt5Symbol: "XAGUSD", category: "metals", source: "deriv", feedSymbol: "frxXAGUSD", decimals: 3, bias: "both", referenceFeed: true, blurb: "Higher beta than gold." },

  // ── Indices ────────────────────────────────────────────────────────────
  { key: "us30", label: "US30 (Dow)", mt5Symbol: "US30", category: "indices", source: "deriv", feedSymbol: "OTC_DJI", decimals: 2, bias: "both", referenceFeed: true, blurb: "Blue-chip US index." },
  { key: "nas100", label: "NAS100", mt5Symbol: "NAS100", category: "indices", source: "deriv", feedSymbol: "OTC_NDX", decimals: 2, bias: "both", referenceFeed: true, blurb: "Tech-heavy momentum index." },
  { key: "ger40", label: "GER40 (DAX)", mt5Symbol: "GER40", category: "indices", source: "deriv", feedSymbol: "OTC_GDAXI", decimals: 2, bias: "both", referenceFeed: true, blurb: "European session index." },
  { key: "spx500", label: "SPX500", mt5Symbol: "SPX500", category: "indices", source: "deriv", feedSymbol: "OTC_SPC", decimals: 2, bias: "both", referenceFeed: true, blurb: "Broad US benchmark." },
  { key: "uk100", label: "UK100 (FTSE)", mt5Symbol: "UK100", category: "indices", source: "deriv", feedSymbol: "OTC_FTSE", decimals: 2, bias: "both", referenceFeed: true, blurb: "UK large-cap index." },
  { key: "jp225", label: "JP225 (Nikkei)", mt5Symbol: "JP225", category: "indices", source: "deriv", feedSymbol: "OTC_N225", decimals: 2, bias: "both", referenceFeed: true, blurb: "Asian session index." },

  // ── Crypto ─────────────────────────────────────────────────────────────
  { key: "btcusd", label: "BTC/USD", mt5Symbol: "BTCUSD", category: "crypto", source: "deriv", feedSymbol: "cryBTCUSD", decimals: 2, bias: "both", referenceFeed: true, blurb: "24/7 crypto majors." },
  { key: "ethusd", label: "ETH/USD", mt5Symbol: "ETHUSD", category: "crypto", source: "deriv", feedSymbol: "cryETHUSD", decimals: 2, bias: "both", referenceFeed: true, blurb: "High-beta crypto." },

  // ── Commodities ────────────────────────────────────────────────────────
  { key: "xauusd-comm", label: "Gold Spot", mt5Symbol: "XAUUSD", category: "commodities", source: "deriv", feedSymbol: "frxXAUUSD", decimals: 2, bias: "both", referenceFeed: true, blurb: "Spot gold as a commodity play." },
  { key: "xagusd-comm", label: "Silver Spot", mt5Symbol: "XAGUSD", category: "commodities", source: "deriv", feedSymbol: "frxXAGUSD", decimals: 3, bias: "both", referenceFeed: true, blurb: "Spot silver as a commodity play." },
];

export function findWeltradeInstrument(key: string | null | undefined): WeltradeInstrument | undefined {
  if (!key) return undefined;
  return WELTRADE_INSTRUMENTS.find((i) => i.key === key);
}

export const WELTRADE_CATEGORIES: WeltradeCategory[] = [
  "syntx",
  "forex",
  "metals",
  "indices",
  "crypto",
  "commodities",
];