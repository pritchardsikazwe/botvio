export type TradeModeKey =
  | "digits"
  | "multipliers"
  | "rise_fall"
  | "higher_lower"
  | "boom_crash"
  | "ticks"
  | "accumulators"
  | "turbo";

export type StrategyGuide = {
  modeKey: TradeModeKey;
  title: string;
  subtitle: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  paceTag: string;
  marketTag: string;
  whatItIs: string;
  howItWorks: string[];
  entryRules: string[];
  exampleSignals: string[];
  riskGuards: string[];
  bestMarkets: string[];
};

export const STRATEGY_GUIDES: Record<TradeModeKey, StrategyGuide> = {
  digits: {
    modeKey: "digits",
    title: "Fast Digits Strategy — Botvio AI",
    subtitle: "Matches/Differs, Over/Under, Even/Odd",
    difficulty: "Intermediate",
    paceTag: "Fast",
    marketTag: "Synthetic",
    whatItIs:
      "Trade DIFFERS when digits are repeating. Watch last 5 ticks and enter when 3-4 digits repeat — probability increases that next digit will differ.",
    howItWorks: [
      "Watch the last 5 ticks digits for repeating patterns.",
      "If 3-4 of the same digit appear, probability of DIFFER increases.",
      "Enter DIFFERS against the repeating digit.",
      "Duration: 1 tick. Stake: 1-2% balance.",
    ],
    entryRules: [
      "Count last 5 tick digits — if max_digit count >= 3, trade DIFFERS.",
      "For Over/Under: if digits 0-4 dominate strongly → Over 5.",
      "For Even/Odd: if even digits dominate ≥ 70% → trade Odd.",
      "Martingale: off or 1 level max.",
    ],
    exampleSignals: [
      "Tick digits: 7, 2, 7, 3, 7 → 7 repeats 3x → Enter DIFFERS 7",
      "Digits 0-4 appear 80% of last 20 ticks → Over 5",
      "Even digits dominate last 15 ticks → Odd",
    ],
    riskGuards: [
      "Max 3 consecutive entries per pattern.",
      "Stop after 2 consecutive losses; wait for new pattern.",
      "Stake 1-2% of balance only. No aggressive martingale.",
    ],
    bestMarkets: ["Volatility indices", "Vol 1s indices", "Jump indices"],
  },

  multipliers: {
    modeKey: "multipliers",
    title: "Multipliers Trend Strategy — Botvio AI",
    subtitle: "Amplify gains with RSI + MA200 trend confirmation",
    difficulty: "Intermediate",
    paceTag: "All Markets",
    marketTag: "All Markets",
    whatItIs:
      "Multipliers work best in strong trends. Use RSI 14 + Moving Average 200 for directional bias with 50x-200x leverage.",
    howItWorks: [
      "BUY: Price above MA200 and RSI above 55.",
      "SELL: Price below MA200 and RSI below 45.",
      "Set SL at 3%, TP at 8%.",
      "Exit early when momentum fades or RSI crosses back.",
    ],
    entryRules: [
      "Price > MA200 + RSI > 55 → multiplier BUY.",
      "Price < MA200 + RSI < 45 → multiplier SELL.",
      "Confirm breakout with a strong candle or volatility expansion.",
      "Avoid entries in tight sideways ranges.",
    ],
    exampleSignals: [
      "Price breaks above MA200 + RSI at 62 → BUY 100x multiplier",
      "Price below MA200 + RSI at 38 + support breaks → SELL 50x",
    ],
    riskGuards: [
      "Always set SL at 3% and TP at 8%.",
      "Never average down on losing positions.",
      "Exit on reversal sign (RSI crosses back, MA recross).",
    ],
    bestMarkets: ["Synthetic indices", "Boom/Crash", "Step index"],
  },

  rise_fall: {
    modeKey: "rise_fall",
    title: "Rise/Fall Momentum — Botvio AI",
    subtitle: "EMA crossover + pullback retest strategy",
    difficulty: "Beginner",
    paceTag: "Active",
    marketTag: "All Markets",
    whatItIs:
      "Enter Rise when EMA20 crosses above EMA50 and price retests EMA20. Enter Fall on the opposite crossover.",
    howItWorks: [
      "BUY (Rise): EMA20 crosses above EMA50, price retests EMA20.",
      "SELL (Fall): EMA20 crosses below EMA50, price retests EMA20.",
      "Duration: 5-10 ticks.",
      "Win Rate: 70-80%.",
    ],
    entryRules: [
      "EMA20 > EMA50 and price touches EMA20 → Rise.",
      "EMA20 < EMA50 and price touches EMA20 → Fall.",
      "Wait for pullback confirmation, don't chase.",
    ],
    exampleSignals: [
      "EMA20 crosses above EMA50 + price pulls back to EMA20 → Rise",
      "EMA20 crosses below EMA50 + price bounces to EMA20 → Fall",
    ],
    riskGuards: [
      "Only 1 entry per setup.",
      "Skip if candles are extremely large (overheated).",
      "Stop after 2 losses in a row.",
    ],
    bestMarkets: ["Volatility 75", "Volatility 100", "Forex pairs"],
  },

  higher_lower: {
    modeKey: "higher_lower",
    title: "Higher/Lower Barrier — Botvio AI",
    subtitle: "Support/Resistance + RSI reversal strategy",
    difficulty: "Beginner",
    paceTag: "Timed",
    marketTag: "All Markets",
    whatItIs:
      "Trade bounces at support/resistance zones with RSI confirmation. Set barrier beyond the level for protection.",
    howItWorks: [
      "BUY: Price near support + RSI oversold + barrier below support.",
      "SELL: Price near resistance + RSI overbought + barrier above resistance.",
      "Choose durations that fit the swing (5-15 minutes typical).",
    ],
    entryRules: [
      "Price touches support + RSI < 30 → Higher with barrier below support.",
      "Price rejects resistance + RSI > 70 → Lower with barrier above resistance.",
      "Avoid entries on huge breakout candles.",
    ],
    exampleSignals: [
      "Strong support touch + RSI at 25 + bounce candle → Higher",
      "Resistance rejection + RSI at 78 + bearish candle → Lower",
    ],
    riskGuards: [
      "Avoid low-liquidity/erratic periods.",
      "Use conservative duration; don't overextend.",
      "Max 3 trades per zone before re-evaluating.",
    ],
    bestMarkets: ["Any market with clear levels", "Volatility indices"],
  },

  boom_crash: {
    modeKey: "boom_crash",
    title: "Boom/Crash Spike Strategy — Botvio AI",
    subtitle: "AI-powered spike drought detection + probability scoring",
    difficulty: "Advanced",
    paceTag: "Volatile",
    marketTag: "Synthetic",
    whatItIs:
      "Wait for spike drought, then enter when AI spike probability exceeds threshold. Boom 500 after 80+ candles, Crash 500 after 70+ candles without spike.",
    howItWorks: [
      "Count candles since last spike (drought detection).",
      "AI model scores spike probability based on drought length + volatility compression.",
      "Enter only when AI probability ≥ 78% AND drought threshold met.",
      "Duration: 1-3 candles per entry.",
    ],
    entryRules: [
      "Boom: After 80+ candles without spike → enter BUY.",
      "Crash: After 70+ candles without spike → enter SELL.",
      "AI spike_probability ≥ 0.78 AND volatility regime = stable.",
      "Daily loss limit not reached.",
    ],
    exampleSignals: [
      "Boom 500 → 92 candles no spike + AI prob 84% → BUY",
      "Crash 1000 → 75 candles no spike + compression detected → SELL",
    ],
    riskGuards: [
      "Small stake sizing is mandatory (1-2% max).",
      "Max 3-5 attempts per session; then stop and reset.",
      "Never chase right after a spike event.",
      "Daily stop loss: 10% of account.",
    ],
    bestMarkets: ["Boom 500", "Boom 1000", "Crash 500", "Crash 1000"],
  },

  ticks: {
    modeKey: "ticks",
    title: "Ultra Fast Tick Scalping — Botvio AI",
    subtitle: "1-5 tick micro-momentum price action",
    difficulty: "Intermediate",
    paceTag: "Fast",
    marketTag: "Synthetic",
    whatItIs:
      "Enter RISE when last 3 ticks are all bullish. Pure price action — no indicators needed. Performance varies by market and configuration.",
    howItWorks: [
      "Watch micro momentum in the tick stream.",
      "If last 3 ticks are all up → enter RISE.",
      "If last 3 ticks are all down → enter FALL.",
      "Exit quickly; don't hold through reversal.",
    ],
    entryRules: [
      "Last 3 consecutive ticks moving in same direction → enter.",
      "Avoid flat/alternating ticks (choppy market).",
      "Duration: 1-5 ticks only.",
    ],
    exampleSignals: [
      "tick1=up, tick2=up, tick3=up → Rise",
      "tick1=down, tick2=down, tick3=down → Fall",
    ],
    riskGuards: [
      "Very small stake sizing (1% max).",
      "Stop after 2 losses; cooldown before retry.",
      "Avoid trading when market chops (alternates up/down).",
    ],
    bestMarkets: ["Volatility indices", "Vol 1s indices"],
  },

  accumulators: {
    modeKey: "accumulators",
    title: "Accumulator Safe Growth — Botvio AI",
    subtitle: "Low volatility Bollinger Band accumulation",
    difficulty: "Intermediate",
    paceTag: "Steady",
    marketTag: "Synthetic",
    whatItIs:
      "Enter when price stays inside Bollinger Bands. Growth rate 1-3%. Duration 10-30 minutes. Designed for ranging markets; performance varies by conditions.",
    howItWorks: [
      "Check Bollinger Bands — price must be inside bands.",
      "Enter accumulator when volatility is low and price is ranging.",
      "Let profit accumulate over ticks.",
      "Exit if price breaks outside bands (volatility spike).",
    ],
    entryRules: [
      "Price between upper and lower Bollinger Band → enter accumulator.",
      "Growth rate: 1-3% (lower = safer).",
      "Confirm with low ATR (below average volatility).",
    ],
    exampleSignals: [
      "Price ranging inside tight Bollinger Bands → Accumulator Buy",
      "Low ATR + steady uptrend + no spike risk → Accumulator Buy",
    ],
    riskGuards: [
      "Auto-exit on volatility spike / reversal candle.",
      "Don't hold in ranges that suddenly expand.",
      "Use fixed daily loss limit.",
    ],
    bestMarkets: ["Smooth volatility indices", "Vol 1s indices"],
  },

  turbo: {
    modeKey: "turbo",
    title: "Turbo Breakout Strategy — Botvio AI",
    subtitle: "Bollinger Band breakout + volume spike",
    difficulty: "Advanced",
    paceTag: "Speed",
    marketTag: "Synthetic",
    whatItIs:
      "Enter when candle breaks Bollinger Band with volume spike. Duration 30 seconds to 2 minutes. Ultra-short breakout contracts.",
    howItWorks: [
      "Wait for tight range compression (Bollinger Bands squeezing).",
      "Trade the breakout direction when candle breaks the band.",
      "Confirm with volume/tick acceleration.",
      "Exit quickly; don't hold for second breakout attempt.",
    ],
    entryRules: [
      "Candle closes outside Bollinger Band with volume spike → enter.",
      "Breakout up → Turbo Rise. Breakdown → Turbo Fall.",
      "Confirm with tick acceleration (rapid sequence).",
    ],
    exampleSignals: [
      "Compression → breakout above upper band + volume spike → Turbo Rise",
      "Compression → breakdown below lower band + acceleration → Turbo Fall",
    ],
    riskGuards: [
      "Small stake sizing only (1-2%).",
      "1 entry per breakout; don't chase failed breakouts.",
      "Cooldown after a loss to avoid revenge trades.",
    ],
    bestMarkets: ["Volatility indices", "Any fast-moving synthetic market"],
  },
};

/** Map from TradeModesGrid title to TradeModeKey */
export const TITLE_TO_MODE_KEY: Record<string, TradeModeKey> = {
  "Digits": "digits",
  "Multipliers": "multipliers",
  "Rise / Fall": "rise_fall",
  "Higher / Lower": "higher_lower",
  "Boom / Crash": "boom_crash",
  "Ticks": "ticks",
  "Accumulators": "accumulators",
  "Turbo": "turbo",
};
