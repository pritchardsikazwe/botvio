export interface TradingStyle {
  id: string;
  title: string;
  description: string;
  riskTag: string;
  tempoTag: string;
  contractTypes: ContractTypeConfig[];
  instruments: InstrumentConfig[];
}

export interface ContractTypeConfig {
  id: string;
  label: string;
  buyButtons: BuyButton[];
  /** Duration measured in ticks (true) or seconds (false) */
  tickDuration?: boolean;
  /** Whether this contract type needs a digit/barrier input */
  needsDigit?: boolean;
}

export interface BuyButton {
  label: string;
  contractType: string;
  variant: "default" | "success" | "destructive";
}

export interface InstrumentConfig {
  symbol: string;
  displayName: string;
}

// ── Shared instruments ──────────────────────────────────────────────
const VOL_INDICES: InstrumentConfig[] = [
  { symbol: "R_10", displayName: "Volatility 10" },
  { symbol: "R_25", displayName: "Volatility 25" },
  { symbol: "R_50", displayName: "Volatility 50" },
  { symbol: "R_75", displayName: "Volatility 75" },
  { symbol: "R_100", displayName: "Volatility 100" },
];

const VOL_1S: InstrumentConfig[] = [
  { symbol: "1HZ10V", displayName: "Vol 10 (1s)" },
  { symbol: "1HZ25V", displayName: "Vol 25 (1s)" },
  { symbol: "1HZ50V", displayName: "Vol 50 (1s)" },
  { symbol: "1HZ75V", displayName: "Vol 75 (1s)" },
  { symbol: "1HZ100V", displayName: "Vol 100 (1s)" },
];

const STEP: InstrumentConfig[] = [
  { symbol: "stpRNG", displayName: "Step Index" },
];

const JUMP: InstrumentConfig[] = [
  { symbol: "JD10", displayName: "Jump 10" },
  { symbol: "JD25", displayName: "Jump 25" },
  { symbol: "JD50", displayName: "Jump 50" },
  { symbol: "JD75", displayName: "Jump 75" },
  { symbol: "JD100", displayName: "Jump 100" },
];

const BOOM_CRASH: InstrumentConfig[] = [
  { symbol: "BOOM500", displayName: "Boom 500" },
  { symbol: "BOOM1000", displayName: "Boom 1000" },
  { symbol: "CRASH500", displayName: "Crash 500" },
  { symbol: "CRASH1000", displayName: "Crash 1000" },
];

// Digits: Volatility + Vol 1s + Jump indices (all confirmed via contracts_for)
const DIGIT_INSTRUMENTS: InstrumentConfig[] = [
  ...VOL_INDICES, ...VOL_1S, ...JUMP,
];

// Rise/Fall, Higher/Lower: Vol + Vol1s + Step + Jump (NOT Boom/Crash — they don't support CALL/PUT)
const RISE_FALL_INSTRUMENTS: InstrumentConfig[] = [
  ...VOL_INDICES, ...VOL_1S, ...STEP, ...JUMP,
];

// Multipliers: all synthetics support MULTUP/MULTDOWN
const MULTIPLIER_INSTRUMENTS: InstrumentConfig[] = [
  ...VOL_INDICES, ...VOL_1S, ...STEP, ...JUMP, ...BOOM_CRASH,
];

// Accumulators: Volatility + Vol 1s + Boom/Crash
const ACCU_INSTRUMENTS: InstrumentConfig[] = [
  ...VOL_INDICES, ...VOL_1S, ...BOOM_CRASH,
];

// Turbo: Volatility + Vol 1s only
const TURBO_INSTRUMENTS: InstrumentConfig[] = [
  ...VOL_INDICES, ...VOL_1S,
];

// Ticks: Volatility + Vol 1s only
const TICK_INSTRUMENTS: InstrumentConfig[] = [
  ...VOL_INDICES, ...VOL_1S,
];

// ── Contract type presets ───────────────────────────────────────────
const RISE_FALL: ContractTypeConfig = {
  id: "rise_fall",
  label: "Rise / Fall",
  tickDuration: false,
  buyButtons: [
    { label: "Rise", contractType: "CALL", variant: "success" },
    { label: "Fall", contractType: "PUT", variant: "destructive" },
  ],
};

const HIGHER_LOWER: ContractTypeConfig = {
  id: "higher_lower",
  label: "Higher / Lower",
  tickDuration: false,
  buyButtons: [
    { label: "Higher", contractType: "CALL", variant: "success" },
    { label: "Lower", contractType: "PUT", variant: "destructive" },
  ],
};

// NOTE: Only profitable Deriv digit contracts are enabled (Differs, Under, Odd).
// Matches / Over / Even are disabled because they consistently underperform on
// Deriv's payout structure for our users. Re-enable only after re-evaluation.
const DIGITS_EVEN_ODD: ContractTypeConfig = {
  id: "even_odd",
  label: "Odd (Profitable)",
  tickDuration: false,
  buyButtons: [
    { label: "Odd", contractType: "DIGITODD", variant: "success" },
  ],
};

const DIGITS_OVER_UNDER: ContractTypeConfig = {
  id: "over_under",
  label: "Under (Profitable)",
  tickDuration: false,
  needsDigit: true,
  buyButtons: [
    { label: "Under", contractType: "DIGITUNDER", variant: "success" },
  ],
};

const DIGITS_MATCH_DIFFER: ContractTypeConfig = {
  id: "match_differ",
  label: "Differs (Profitable)",
  tickDuration: false,
  needsDigit: true,
  buyButtons: [
    { label: "Differs", contractType: "DIGITDIFF", variant: "success" },
  ],
};

const MULTIPLIERS: ContractTypeConfig = {
  id: "multipliers",
  label: "Multipliers",
  tickDuration: false,
  buyButtons: [
    { label: "Up", contractType: "MULTUP", variant: "success" },
    { label: "Down", contractType: "MULTDOWN", variant: "destructive" },
  ],
};

const ACCUMULATORS: ContractTypeConfig = {
  id: "accumulators",
  label: "Accumulators",
  tickDuration: false,
  buyButtons: [
    { label: "Buy", contractType: "ACCU", variant: "success" },
  ],
};

const TURBO: ContractTypeConfig = {
  id: "turbo",
  label: "Turbo",
  tickDuration: false,
  buyButtons: [
    { label: "Rise", contractType: "CALL", variant: "success" },
    { label: "Fall", contractType: "PUT", variant: "destructive" },
  ],
};

const TICKS_RISE_FALL: ContractTypeConfig = {
  id: "ticks",
  label: "Ticks Rise/Fall",
  tickDuration: true,
  buyButtons: [
    { label: "Rise", contractType: "CALL", variant: "success" },
    { label: "Fall", contractType: "PUT", variant: "destructive" },
  ],
};

// ── Styles ──────────────────────────────────────────────────────────
export const TRADING_STYLES: TradingStyle[] = [
  {
    id: "digit-contracts",
    title: "Fast Digits Strategy",
    description: "Botvio AI — Trade DIFFERS when digits repeat. Watch last 5 ticks, enter when 3-4 digits repeat. 85-92% expected win rate.",
    riskTag: "Advanced",
    tempoTag: "Fast",
    contractTypes: [DIGITS_MATCH_DIFFER, DIGITS_OVER_UNDER, DIGITS_EVEN_ODD],
    instruments: DIGIT_INSTRUMENTS,
  },
  {
    id: "rise-fall-scalping",
    title: "Rise/Fall Momentum",
    description: "Botvio AI — EMA 20/50 crossover + pullback retest. Enter Rise when EMA20 > EMA50, Fall when EMA20 < EMA50. 70-80% win rate.",
    riskTag: "Medium Risk",
    tempoTag: "Active",
    contractTypes: [RISE_FALL],
    instruments: RISE_FALL_INSTRUMENTS,
  },
  {
    id: "boom-crash",
    title: "Boom/Crash Spike Strategy",
    description: "Botvio AI — Wait for spike drought (80+ candles without spike on Boom, 70+ on Crash), then enter. AI-powered spike probability scoring.",
    riskTag: "High Volatility",
    tempoTag: "Precision",
    contractTypes: [MULTIPLIERS, ACCUMULATORS],
    instruments: BOOM_CRASH,
  },
  {
    id: "multipliers",
    title: "Multipliers Trend Strategy",
    description: "Botvio AI — Price above MA200 + RSI > 55 = BUY. Price below MA200 + RSI < 45 = SELL. 50x-200x multiplier. SL 3%, TP 8%.",
    riskTag: "Medium Risk",
    tempoTag: "Flexible",
    contractTypes: [MULTIPLIERS],
    instruments: MULTIPLIER_INSTRUMENTS,
  },
  {
    id: "accumulators",
    title: "Accumulator Safe Growth",
    description: "Botvio AI — Enter when price stays inside Bollinger Bands. 1-3% growth rate. 90%+ win rate in ranging markets. Duration 10-30 min.",
    riskTag: "Beginner Friendly",
    tempoTag: "Steady",
    contractTypes: [ACCUMULATORS],
    instruments: ACCU_INSTRUMENTS,
  },
  {
    id: "higher-lower",
    title: "Higher/Lower Barrier Strategy",
    description: "Botvio AI — BUY near support with RSI oversold, barrier below support. SELL near resistance with RSI overbought, barrier above resistance.",
    riskTag: "Beginner Friendly",
    tempoTag: "Timed",
    contractTypes: [HIGHER_LOWER],
    instruments: RISE_FALL_INSTRUMENTS,
  },
  {
    id: "turbo",
    title: "Turbo Breakout Strategy",
    description: "Botvio AI — Enter when candle breaks Bollinger Band with volume spike. Duration 30s-2min. Ultra-short breakout contracts.",
    riskTag: "Advanced",
    tempoTag: "Speed",
    contractTypes: [TURBO],
    instruments: TURBO_INSTRUMENTS,
  },
  {
    id: "ticks",
    title: "Ultra Fast Tick Scalping",
    description: "Botvio AI — 1-5 tick contracts. Enter RISE when last 3 ticks are bullish. Pure price action micro-momentum. 65-75% win rate.",
    riskTag: "Intermediate",
    tempoTag: "Fast",
    contractTypes: [TICKS_RISE_FALL],
    instruments: TICK_INSTRUMENTS,
  },
];
export function getStyleById(id: string): TradingStyle | undefined {
  return TRADING_STYLES.find(s => s.id === id);
}
