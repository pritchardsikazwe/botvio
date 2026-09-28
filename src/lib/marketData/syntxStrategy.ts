import type { IndicatorSet } from "./indicators";
import type { EngineSignal, SignalEngineOptions } from "./signalEngine";
import type { NormalizedCandle } from "./types";

export type SyntxFamily =
  | "fx-vol"
  | "sfx-vol"
  | "painx"
  | "gainx"
  | "flipx"
  | "switchx"
  | "breakx"
  | "trendx"
  | "plusx"
  | "fibox"
  | "quadx"
  | "max-painx"
  | "max-gainx";

export type SyntxStrategyMode = "trend" | "pullback" | "range" | "spike" | "regime" | "breakout" | "progression";

export interface SyntxFamilyProfile {
  id: SyntxFamily;
  label: string;
  badges: string[];
  behaviour: string;
  strategyStyle: string;
  keyRisk: string;
  tools: string;
  modes: { value: SyntxStrategyMode; label: string }[];
  riskLevel: "high" | "very-high";
}

export const SYNTX_FAMILIES: SyntxFamilyProfile[] = [
  { id: "fx-vol", label: "FX Vol.", badges: ["Volatility", "Trend"], behaviour: "Algorithmic volatility indices with a stated annual-volatility profile; they are not ordinary forex pairs.", strategyStyle: "Volatility-aware trend following, moving-average structure, pullback or breakout confirmation.", keyRisk: "Volatility can expand quickly and is not driven by normal FX fundamentals.", tools: "EMA structure, ATR, RSI, support/resistance", modes: [{ value: "trend", label: "Volatility trend" }, { value: "pullback", label: "Confirmed pullback" }, { value: "breakout", label: "Volatility breakout" }], riskLevel: "high" },
  { id: "sfx-vol", label: "SFX Vol.", badges: ["Volatility", "Spike"], behaviour: "FX Vol.-style movement with recurring simulated spikes in either direction.", strategyStyle: "Trend structure with spike-aware confirmation; avoid entering immediately into an outsized candle.", keyRisk: "A spike can rapidly invalidate a technically sound setup.", tools: "ATR expansion, candle range, EMA structure", modes: [{ value: "spike", label: "Spike-aware" }, { value: "trend", label: "Volatility trend" }], riskLevel: "very-high" },
  { id: "painx", label: "PainX", badges: ["Directional", "Drop risk"], behaviour: "Directional upward movement with occasional sharp downward drops, as described by Weltrade.", strategyStyle: "Buy-bias trend following or controlled pullbacks only when candle structure confirms.", keyRisk: "Sudden drops can overwhelm a long position; a directional bias is not a guarantee.", tools: "EMA structure, higher lows, ATR, pullbacks", modes: [{ value: "trend", label: "Buy-bias trend" }, { value: "pullback", label: "Controlled pullback" }], riskLevel: "very-high" },
  { id: "gainx", label: "GainX", badges: ["Directional", "Jump risk"], behaviour: "Directional downward movement with occasional sharp upward jumps, as described by Weltrade.", strategyStyle: "Sell-bias trend following or controlled pullbacks only when candle structure confirms.", keyRisk: "Sudden upward jumps can overwhelm a short position; a directional bias is not a guarantee.", tools: "EMA structure, lower highs, ATR, pullbacks", modes: [{ value: "trend", label: "Sell-bias trend" }, { value: "pullback", label: "Controlled pullback" }], riskLevel: "very-high" },
  { id: "flipx", label: "FlipX", badges: ["Range", "Fixed step"], behaviour: "Step-by-step movement with a stated 50/50 chance of direction change and a fixed step size.", strategyStyle: "Range and mean-reversion analysis around observed support and resistance; do not assume persistent trends.", keyRisk: "Repeated steps can continue against a range entry.", tools: "Support/resistance, RSI extremes, range width", modes: [{ value: "range", label: "Range / mean reversion" }], riskLevel: "high" },
  { id: "switchx", label: "SwitchX", badges: ["Switch", "Regime"], behaviour: "Directional behaviour changes after a switch event.", strategyStyle: "Detect the current candle-supported regime, then wait for confirmation after a suspected switch.", keyRisk: "The regime can change abruptly and cannot be known in advance from unavailable tick state.", tools: "EMA regime, market structure, ATR events", modes: [{ value: "regime", label: "Adaptive regime" }], riskLevel: "very-high" },
  { id: "breakx", label: "BreakX", badges: ["Breakout", "Regime"], behaviour: "A jump-size comparison can determine whether directional behaviour changes.", strategyStyle: "Require an observable range break and close confirmation; compare only jumps visible in loaded candles.", keyRisk: "False breaks and missing tick-level jump context can invalidate classification.", tools: "Range breaks, ATR events, support/resistance", modes: [{ value: "breakout", label: "Confirmed breakout" }], riskLevel: "very-high" },
  { id: "trendx", label: "TrendX", badges: ["Trend", "Regime"], behaviour: "Trend-regime behaviour where confirmed structure changes can alter the mode.", strategyStyle: "Track higher-high/higher-low or lower-high/lower-low structure and require reversal confirmation.", keyRisk: "A developing reversal may resemble a temporary pullback.", tools: "Swing structure, EMA alignment, ATR", modes: [{ value: "regime", label: "Structure regime" }, { value: "trend", label: "Confirmed trend" }], riskLevel: "high" },
  { id: "plusx", label: "PlusX 1", badges: ["Progression", "Linear"], behaviour: "A linear progression whose step size increases by a constant amount.", strategyStyle: "Progression-aware observation and conservative position sizing rather than generic FX signals.", keyRisk: "Exposure rises as step size progresses.", tools: "Step-size sequence, position sizing", modes: [{ value: "progression", label: "Linear progression" }], riskLevel: "very-high" },
  { id: "fibox", label: "FiboX", badges: ["Progression", "Fibonacci"], behaviour: "A progression based on Fibonacci step sequencing.", strategyStyle: "Observe the progression sequence; ordinary Fibonacci retracement levels do not predict the algorithm.", keyRisk: "Step size can accelerate rapidly through the sequence.", tools: "Observed step sequence, position sizing", modes: [{ value: "progression", label: "Fibonacci progression" }], riskLevel: "very-high" },
  { id: "quadx", label: "QuadX", badges: ["Progression", "Accelerating"], behaviour: "A quadratic progression with increasingly large step sizes.", strategyStyle: "Progression-aware analysis with reduced sizing; no generic RSI/EMA signal is published.", keyRisk: "Accelerating steps can cause rapid, outsized losses.", tools: "Step acceleration, exposure controls", modes: [{ value: "progression", label: "Quadratic progression" }], riskLevel: "very-high" },
  { id: "max-painx", label: "MAX PainX", badges: ["Directional", "Progression", "Drop risk"], behaviour: "Upward directional progression with opposing jumps whose size and probability are described as increasing.", strategyStyle: "Progression and long-bias observation only; require real tick evidence before any event label.", keyRisk: "Extreme: increasing step and adverse-jump risk can produce rapid losses.", tools: "Tick progression, ATR events, strict sizing", modes: [{ value: "progression", label: "MAX progression" }], riskLevel: "very-high" },
  { id: "max-gainx", label: "MAX GainX", badges: ["Directional", "Progression", "Jump risk"], behaviour: "Downward directional progression with opposing jumps whose size and probability are described as increasing.", strategyStyle: "Progression and sell-bias observation only; require real tick evidence before any event label.", keyRisk: "Extreme: increasing step and adverse-jump risk can produce rapid losses.", tools: "Tick progression, ATR events, strict sizing", modes: [{ value: "progression", label: "MAX progression" }], riskLevel: "very-high" },
];

export function getSyntxProfile(family: SyntxFamily | null | undefined) {
  return SYNTX_FAMILIES.find((profile) => profile.id === family) ?? null;
}

function resultFor(candles: NormalizedCandle[], index: number, direction: "BUY" | "SELL", stop: number, target: number) {
  for (let i = index + 1; i < candles.length; i += 1) {
    const candle = candles[i];
    if (direction === "BUY") {
      if (candle.low <= stop) return "LOSS" as const;
      if (candle.high >= target) return "WIN" as const;
    } else {
      if (candle.high >= stop) return "LOSS" as const;
      if (candle.low <= target) return "WIN" as const;
    }
  }
  return "OPEN" as const;
}

export function computeSyntxSignals(
  candles: NormalizedCandle[],
  opts: SignalEngineOptions & { family: SyntxFamily; mode: SyntxStrategyMode },
  ind: IndicatorSet,
): EngineSignal[] {
  if (candles.length < 60) return [];
  if (["plusx", "fibox", "quadx", "max-painx", "max-gainx"].includes(opts.family)) return [];
  const signals: EngineSignal[] = [];
  const maxSignals = opts.maxSignals ?? 40;
  for (let i = 30; i < candles.length; i += 1) {
    const candle = candles[i];
    const previous = candles[i - 1];
    const ema9 = ind.ema9[i];
    const ema21 = ind.ema21[i];
    const ema50 = ind.ema50[i];
    const rsi = ind.rsi14[i];
    const atr = ind.atr14[i];
    if (ema9 == null || ema21 == null || rsi == null || atr == null || atr <= 0) continue;

    const trendUp = ema9 > ema21 && (ema50 == null || candle.close > ema50);
    const trendDown = ema9 < ema21 && (ema50 == null || candle.close < ema50);
    const rangeHigh = Math.max(...candles.slice(Math.max(0, i - 20), i).map((item) => item.high));
    const rangeLow = Math.min(...candles.slice(Math.max(0, i - 20), i).map((item) => item.low));
    const expanded = candle.high - candle.low > atr * 1.8;
    let direction: "BUY" | "SELL" | null = null;
    let reason = "";
    let confidence = 0;

    if (opts.family === "painx" && trendUp && candle.low <= ema9 && candle.close > ema9 && !expanded) {
      direction = "BUY"; confidence = 65; reason = "PainX-compatible buy bias · trend structure and controlled pullback confirmed";
    } else if (opts.family === "gainx" && trendDown && candle.high >= ema9 && candle.close < ema9 && !expanded) {
      direction = "SELL"; confidence = 65; reason = "GainX-compatible sell bias · trend structure and controlled pullback confirmed";
    } else if (opts.family === "flipx" && opts.mode === "range" && rsi <= 30 && candle.close <= rangeLow + atr * 0.5) {
      direction = "BUY"; confidence = 60; reason = "FlipX range framework · observed support and RSI extreme";
    } else if (opts.family === "flipx" && opts.mode === "range" && rsi >= 70 && candle.close >= rangeHigh - atr * 0.5) {
      direction = "SELL"; confidence = 60; reason = "FlipX range framework · observed resistance and RSI extreme";
    } else if (["switchx", "trendx"].includes(opts.family) && !expanded && (trendUp || trendDown)) {
      direction = trendUp ? "BUY" : "SELL"; confidence = 62; reason = `${opts.family === "switchx" ? "SwitchX" : "TrendX"} regime confirmed from current EMA and price structure`;
    } else if (opts.family === "breakx" && candle.close > rangeHigh && previous.close <= rangeHigh) {
      direction = "BUY"; confidence = 61; reason = "BreakX framework · observable range close above resistance";
    } else if (opts.family === "breakx" && candle.close < rangeLow && previous.close >= rangeLow) {
      direction = "SELL"; confidence = 61; reason = "BreakX framework · observable range close below support";
    } else if (["fx-vol", "sfx-vol"].includes(opts.family) && !expanded && (trendUp || trendDown)) {
      direction = trendUp ? "BUY" : "SELL"; confidence = 60; reason = `${opts.family === "sfx-vol" ? "SFX Vol spike-aware" : "FX Vol volatility-trend"} structure confirmed; no outsized candle at entry`;
    }
    if (!direction || confidence < (opts.minConfidence ?? 55)) continue;
    const entry = candle.close;
    const stopLoss = direction === "BUY" ? entry - atr * 1.5 : entry + atr * 1.5;
    const takeProfit = direction === "BUY" ? entry + atr * 2 : entry - atr * 2;
    signals.push({ id: `${opts.symbol}-${opts.timeframe}-${candle.time}-${direction}-${opts.mode}`, symbol: opts.symbol, label: opts.label, timeframe: opts.timeframe, direction, strategy: `${getSyntxProfile(opts.family)?.label ?? "SyntX"} · ${opts.mode}`, confidence, entry, stopLoss, takeProfit, time: candle.time, index: i, result: resultFor(candles, i, direction, stopLoss, takeProfit), reason });
  }
  return signals.slice(-maxSignals);
}

export function detectSyntxState(candles: NormalizedCandle[], family: SyntxFamily, ind: IndicatorSet) {
  if (candles.length < 30) return { label: "Data unavailable", detail: "More live candles are required before Botvio can classify this state." };
  const i = candles.length - 1;
  const atr = ind.atr14[i];
  const ema9 = ind.ema9[i];
  const ema21 = ind.ema21[i];
  if (atr == null || ema9 == null || ema21 == null) return { label: "Data unavailable", detail: "The required real-data indicators are still warming up." };
  const range = candles[i].high - candles[i].low;
  if (["sfx-vol", "painx", "gainx", "max-painx", "max-gainx"].includes(family) && range > atr * 1.8) {
    return { label: "Large candle observed", detail: "An ATR-based event is visible in loaded candles. This does not identify the broker algorithm's hidden state." };
  }
  if (["switchx", "trendx", "breakx"].includes(family)) {
    const regime = ema9 > ema21 ? "Up regime observed" : ema9 < ema21 ? "Down regime observed" : "Neutral regime";
    return { label: regime, detail: "Derived only from loaded candle structure; a future switch cannot be predicted." };
  }
  if (["plusx", "fibox", "quadx", "max-painx", "max-gainx"].includes(family)) {
    return { label: "Progression data unavailable", detail: "Tick-by-tick sequence confirmation is required; Botvio will not infer it from incomplete data." };
  }
  return { label: ema9 > ema21 ? "Uptrend observed" : "Downtrend observed", detail: "Derived from the real EMA structure in the loaded candles." };
}