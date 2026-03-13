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

const DIGITS_EVEN_ODD: ContractTypeConfig = {
  id: "even_odd",
  label: "Even / Odd",
  tickDuration: false,
  buyButtons: [
    { label: "Even", contractType: "DIGITEVEN", variant: "success" },
    { label: "Odd", contractType: "DIGITODD", variant: "destructive" },
  ],
};

const DIGITS_OVER_UNDER: ContractTypeConfig = {
  id: "over_under",
  label: "Over / Under",
  tickDuration: false,
  needsDigit: true,
  buyButtons: [
    { label: "Over", contractType: "DIGITOVER", variant: "success" },
    { label: "Under", contractType: "DIGITUNDER", variant: "destructive" },
  ],
};

const DIGITS_MATCH_DIFFER: ContractTypeConfig = {
  id: "match_differ",
  label: "Matches / Differs",
  tickDuration: false,
  needsDigit: true,
  buyButtons: [
    { label: "Matches", contractType: "DIGITMATCH", variant: "success" },
    { label: "Differs", contractType: "DIGITDIFF", variant: "destructive" },
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
    id: "synthetic-indices",
    title: "Synthetic Indices",
    description: "24/7 markets made for algorithms. Smooth behavior, no news shocks.",
    riskTag: "Beginner Friendly",
    tempoTag: "Steady",
    contractTypes: [RISE_FALL, HIGHER_LOWER],
    instruments: RISE_FALL_INSTRUMENTS,
  },
  {
    id: "digit-contracts",
    title: "Digit Contracts",
    description: "Hauza Sniper — Fast micro-trades based on last-digit movement.",
    riskTag: "Advanced",
    tempoTag: "Fast",
    contractTypes: [DIGITS_MATCH_DIFFER, DIGITS_OVER_UNDER, DIGITS_EVEN_ODD],
    instruments: DIGIT_INSTRUMENTS,
  },
  {
    id: "rise-fall-scalping",
    title: "Rise/Fall Scalping",
    description: "Hauza Sniper — Predict short-term direction using momentum + timing logic.",
    riskTag: "Medium Risk",
    tempoTag: "Active",
    contractTypes: [RISE_FALL],
    instruments: RISE_FALL_INSTRUMENTS,
  },
  {
    id: "boom-crash",
    title: "Boom/Crash Spike Logic",
    description: "Catch spikes using multipliers + accumulator contracts on Boom/Crash indices.",
    riskTag: "High Volatility",
    tempoTag: "Precision",
    contractTypes: [MULTIPLIERS, ACCUMULATORS],
    instruments: BOOM_CRASH,
  },
  {
    id: "multipliers",
    title: "Multipliers",
    description: "Hauza Sniper — Amplify gains with controlled risk using multiplier contracts.",
    riskTag: "Medium Risk",
    tempoTag: "Flexible",
    contractTypes: [MULTIPLIERS],
    instruments: MULTIPLIER_INSTRUMENTS,
  },
  {
    id: "accumulators",
    title: "Accumulators",
    description: "Hauza Sniper — Accumulate gains with each tick in your favour.",
    riskTag: "Beginner Friendly",
    tempoTag: "Steady",
    contractTypes: [ACCUMULATORS],
    instruments: ACCU_INSTRUMENTS,
  },
  {
    id: "turbo",
    title: "Turbo",
    description: "Ultra-short breakout contracts for fast results.",
    riskTag: "Advanced",
    tempoTag: "Speed",
    contractTypes: [TURBO],
    instruments: TURBO_INSTRUMENTS,
  },
  {
    id: "ticks",
    title: "Ticks",
    description: "Hauza Sniper — Tick-by-tick momentum scalping on synthetic indices.",
    riskTag: "Intermediate",
    tempoTag: "Fast",
    contractTypes: [TICKS_RISE_FALL],
    instruments: TICK_INSTRUMENTS,
  },
];

export function getStyleById(id: string): TradingStyle | undefined {
  return TRADING_STYLES.find(s => s.id === id);
}
