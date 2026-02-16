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
    title: "Digits Strategy — Hauza Sniper",
    subtitle: "Matches/Differs, Over/Under, Even/Odd",
    difficulty: "Intermediate",
    paceTag: "Fast",
    marketTag: "Synthetic",
    whatItIs:
      "Digits trading focuses on the last digit behavior of price ticks and exploits short repeating digit bias patterns.",
    howItWorks: [
      "Track last digits over a short window (10–20 ticks).",
      "Identify bias: which digit/group (even/odd, over/under) is dominating.",
      "Trade against over-represented patterns after they become stretched.",
    ],
    entryRules: [
      "Observe last 10–20 ticks (last-digit stream).",
      "If a digit repeats excessively, prefer Differs vs that digit.",
      "If evens dominate strongly, prefer Odd (and vice versa).",
      "Avoid entering immediately after a sudden regime change.",
    ],
    exampleSignals: [
      "Digit 7 appears 5+ times in last 15 ticks → Differs 7",
      "Even digits dominate (≥70% of last 20) → Odd",
      "0–4 dominate strongly → Over 5",
    ],
    riskGuards: [
      "Max 3 consecutive entries per pattern.",
      "Stop after 2 consecutive losses; wait for a new pattern.",
      "Use small stake sizing; avoid martingale by default.",
    ],
    bestMarkets: ["Volatility indices", "Step index"],
  },

  multipliers: {
    modeKey: "multipliers",
    title: "Multipliers Strategy — Hauza Sniper",
    subtitle: "Amplify gains with controlled risk",
    difficulty: "Intermediate",
    paceTag: "All Markets",
    marketTag: "All Markets",
    whatItIs:
      "Directional trading with leverage. Works best during confirmed momentum bursts rather than sideways chop.",
    howItWorks: [
      "Enter only when trend is confirmed (not ranging).",
      "Use simple confirmation: moving averages + momentum indicator.",
      "Exit early when momentum fades.",
    ],
    entryRules: [
      "EMA 9 crosses EMA 21 in direction of trade.",
      "RSI above 60 for Buy / below 40 for Sell.",
      "Confirm breakout with a strong candle or volatility expansion.",
      "Avoid entries in tight sideways ranges.",
    ],
    exampleSignals: [
      "EMA9 > EMA21 + RSI 62 + breakout candle → Buy multiplier",
      "EMA9 < EMA21 + RSI 35 + support breaks → Sell multiplier",
    ],
    riskGuards: [
      "Always set a stop (0.5%–2% typical depending on market).",
      "Never average down.",
      "Exit on reversal sign (RSI crosses back, MA recross, or strong opposite candle).",
    ],
    bestMarkets: ["Synthetic indices", "Major FX", "Crypto"],
  },

  rise_fall: {
    modeKey: "rise_fall",
    title: "Rise / Fall Strategy — Hauza Sniper",
    subtitle: "Predict short-term direction",
    difficulty: "Beginner",
    paceTag: "Beginner",
    marketTag: "All Markets",
    whatItIs:
      "Micro-trend continuation. Enter after a pullback in the direction of the short trend.",
    howItWorks: [
      "Wait for a short sequence of candles in one direction.",
      "Enter after a small pullback candle forms.",
      "Take quick, controlled wins.",
    ],
    entryRules: [
      "3 candles in same direction (trend push).",
      "Then 1 small pullback candle.",
      "Enter in original trend direction.",
    ],
    exampleSignals: [
      "3 green candles → small red pullback → Rise",
      "3 red candles → small green bounce → Fall",
    ],
    riskGuards: [
      "Only 1 entry per setup.",
      "Skip if candles are extremely large (overheated).",
      "Stop after 2 losses in a row.",
    ],
    bestMarkets: ["Volatility indices", "Step index", "Any smooth-trending market"],
  },

  higher_lower: {
    modeKey: "higher_lower",
    title: "Higher / Lower Strategy — Timed",
    subtitle: "Will price end higher or lower?",
    difficulty: "Beginner",
    paceTag: "Timed",
    marketTag: "All Markets",
    whatItIs:
      "Time-based close prediction using support/resistance bounces and simple trend bias.",
    howItWorks: [
      "Mark obvious support and resistance zones.",
      "Trade bounces rather than chasing breakouts.",
      "Choose durations that fit the swing (5–15 minutes typical).",
    ],
    entryRules: [
      "Price touches support → look for bounce confirmation.",
      "Price rejects resistance → look for downside confirmation.",
      "Avoid entries on huge breakout candles.",
    ],
    exampleSignals: [
      "Strong support touch + bounce candle → Higher",
      "Resistance rejection + bearish candle → Lower",
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
    title: "Boom / Crash Spike Strategy — Advanced",
    subtitle: "Catch spikes with precision timing",
    difficulty: "Advanced",
    paceTag: "Volatile",
    marketTag: "Synthetic",
    whatItIs:
      "Spike anticipation after extended calm periods. Requires discipline and small risk.",
    howItWorks: [
      "Spikes often cluster after a period of low spike frequency.",
      "You wait for 'spike drought' then attempt timed entries.",
      "You manage attempts tightly and stop after a few tries.",
    ],
    entryRules: [
      "Wait 20–40 candles with few/no spikes (drought).",
      "Momentum stretched (RSI extreme or clear exhaustion).",
      "Enter with small stake per attempt.",
    ],
    exampleSignals: [
      "Boom oversold after long no-spike stretch → Buy for spike",
      "Crash overbought after long no-spike stretch → Sell for drop",
    ],
    riskGuards: [
      "Small stake sizing is mandatory.",
      "Max 3–5 attempts; then stop and reset.",
      "Never chase right after a spike event.",
    ],
    bestMarkets: ["Boom indices", "Crash indices"],
  },

  ticks: {
    modeKey: "ticks",
    title: "Ticks Strategy — Fast Synthetic",
    subtitle: "Tick-by-tick price stream trading",
    difficulty: "Intermediate",
    paceTag: "Fast",
    marketTag: "Synthetic",
    whatItIs:
      "Ultra-short scalping based on tick momentum bursts.",
    howItWorks: [
      "Watch micro acceleration in the tick stream.",
      "Enter when momentum is obvious and immediate.",
      "Exit quickly; don't hold through reversal.",
    ],
    entryRules: [
      "Observe last 5–10 ticks directionality.",
      "Enter only when acceleration is visible (rapid sequence).",
      "Avoid flat/alternating ticks.",
    ],
    exampleSignals: [
      "4 rapid upward ticks → Rise",
      "4 rapid downward ticks → Fall",
    ],
    riskGuards: [
      "Very small stake sizing.",
      "Stop after 2 losses; cooldown before retry.",
      "Avoid trading when market 'chops' (alternates up/down).",
    ],
    bestMarkets: ["Volatility indices", "Step index"],
  },

  accumulators: {
    modeKey: "accumulators",
    title: "Accumulators Strategy — Hauza Steady",
    subtitle: "Accumulate gains with each tick",
    difficulty: "Intermediate",
    paceTag: "Steady",
    marketTag: "Synthetic",
    whatItIs:
      "Collect small gains while the market trends smoothly. Exit before volatility reversals.",
    howItWorks: [
      "Enter only when trend is steady and not choppy.",
      "Let profit accumulate over ticks.",
      "Exit on trend weakening signals.",
    ],
    entryRules: [
      "Trend confirmed (e.g., EMA9 above EMA21 for Buy).",
      "Low chop / smooth candles (no violent whipsaw).",
      "Avoid major volatility spikes.",
    ],
    exampleSignals: [
      "Steady uptrend + smooth pullbacks → Accumulator Buy",
      "Steady downtrend + weak bounces → Accumulator Sell",
    ],
    riskGuards: [
      "Auto-exit on volatility spike / reversal candle.",
      "Don't hold in ranges; exit early if trend stalls.",
      "Use fixed daily loss limit.",
    ],
    bestMarkets: ["Smooth volatility indices", "Step index"],
  },

  turbo: {
    modeKey: "turbo",
    title: "Turbo Strategy — Advanced Speed",
    subtitle: "Ultra-short contracts for fast results",
    difficulty: "Advanced",
    paceTag: "Speed",
    marketTag: "Synthetic",
    whatItIs:
      "Micro breakout trading: enter when price compresses then releases quickly.",
    howItWorks: [
      "Wait for tight range compression.",
      "Trade the breakout direction immediately.",
      "Exit quickly and avoid second entries in the same burst.",
    ],
    entryRules: [
      "Identify tight consolidation (range compression).",
      "Breakout candle closes outside range.",
      "Confirm with tick acceleration.",
    ],
    exampleSignals: [
      "Compression → breakout up + tick acceleration → Turbo Up",
      "Compression → breakdown + tick acceleration → Turbo Down",
    ],
    riskGuards: [
      "Small stake sizing only.",
      "1 entry per breakout; don't chase.",
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
