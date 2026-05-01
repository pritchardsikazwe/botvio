/**
 * Deriv Synthetic Indices catalog used by the Synthetic Hub.
 *
 * `derivSymbol` is the live Deriv WebSocket code (used for charts + signals).
 * `mt5Symbol` is the symbol the MT5 Bridge EA will trade on broker terminals
 * (Deriv MT5, Weltrade, etc. — most use these exact tickers).
 *
 * Some "Crash 150 / 300 / 600 / 900" variants are NOT exposed on the public
 * Deriv WS feed (`derivSupported: false`) — they remain MT5-only. The hub
 * still lists them and lets users route trades to MT5, but the live chart &
 * signal preview falls back to the closest streamable proxy (Crash 500).
 */

export type SyntheticCategory = "boom" | "crash" | "volatility" | "step";

export interface SyntheticInstrument {
  /** Unique key used in URLs and routing */
  key: string;
  /** Human label e.g. "Boom 500 Index" */
  label: string;
  category: SyntheticCategory;
  /** Deriv WebSocket symbol for live ticks/candles. Null = no live feed. */
  derivSymbol: string | null;
  /** Symbol used to route the trade to the user's MT5 Bridge EA */
  mt5Symbol: string;
  /** Deriv contract types this instrument supports for the hub's quick-trade buttons */
  bias: "buy" | "sell" | "both";
  /** Short tagline for the card */
  blurb: string;
  /** Closest Deriv-streamable proxy when derivSymbol is null */
  chartProxy?: string;
}

export const SYNTHETICS: SyntheticInstrument[] = [
  // ── Boom ────────────────────────────────────────────────────────
  {
    key: "boom-500",
    label: "Boom 500 Index",
    category: "boom",
    derivSymbol: "BOOM500",
    mt5Symbol: "Boom 500 Index",
    bias: "buy",
    blurb: "Upward spike opportunities — best for buy-focused strategies.",
  },

  // ── Crash ───────────────────────────────────────────────────────
  {
    key: "crash-150",
    label: "Crash 150 Index",
    category: "crash",
    derivSymbol: "CRASH150",
    mt5Symbol: "Crash 150 Index",
    bias: "sell",
    blurb: "Aggressive crash variant — fast downward spikes (1s ticks).",
  },
  {
    key: "crash-300",
    label: "Crash 300 Index",
    category: "crash",
    derivSymbol: "CRASH300N",
    mt5Symbol: "Crash 300 Index",
    bias: "sell",
    blurb: "Mid-range crash — frequent downward spikes.",
  },
  {
    key: "crash-500",
    label: "Crash 500 Index",
    category: "crash",
    derivSymbol: "CRASH500",
    mt5Symbol: "Crash 500 Index",
    bias: "sell",
    blurb: "Classic crash — drop opportunities every ~500 ticks.",
  },
  {
    key: "crash-600",
    label: "Crash 600 Index",
    category: "crash",
    derivSymbol: "CRASH600",
    mt5Symbol: "Crash 600 Index",
    bias: "sell",
    blurb: "Slower crash variant — cleaner sells.",
  },
  {
    key: "crash-900",
    label: "Crash 900 Index",
    category: "crash",
    derivSymbol: "CRASH900",
    mt5Symbol: "Crash 900 Index",
    bias: "sell",
    blurb: "Slow-burn crash — large move setups.",
  },

  // ── Volatility ──────────────────────────────────────────────────
  {
    key: "v-10",
    label: "Volatility 10 Index",
    category: "volatility",
    derivSymbol: "R_10",
    mt5Symbol: "Volatility 10 Index",
    bias: "both",
    blurb: "Low-noise — perfect for clean trend & structure trades.",
  },
  {
    key: "v-25",
    label: "Volatility 25 Index",
    category: "volatility",
    derivSymbol: "R_25",
    mt5Symbol: "Volatility 25 Index",
    bias: "both",
    blurb: "Balanced volatility for intraday & technical setups.",
  },
  {
    key: "v-75",
    label: "Volatility 75 Index",
    category: "volatility",
    derivSymbol: "R_75",
    mt5Symbol: "Volatility 75 Index",
    bias: "both",
    blurb: "Most-traded volatility index — strong S/R reactions.",
  },
  {
    key: "v-75-1s",
    label: "Volatility 75 (1s) Index",
    category: "volatility",
    derivSymbol: "1HZ75V",
    mt5Symbol: "Volatility 75 (1s) Index",
    bias: "both",
    blurb: "1-second ticks — best for scalping & rapid setups.",
  },

  // ── Step ────────────────────────────────────────────────────────
  {
    key: "step",
    label: "Step Index",
    category: "step",
    derivSymbol: "stpRNG",
    mt5Symbol: "Step Index",
    bias: "both",
    blurb: "Predictable, low-noise movement — ideal for clean execution.",
  },
];

export function findSynthetic(key: string): SyntheticInstrument | undefined {
  return SYNTHETICS.find((s) => s.key === key);
}