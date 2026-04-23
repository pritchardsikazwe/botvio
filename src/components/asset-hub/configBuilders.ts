import { Target, Zap, Crosshair, TrendingUp } from "lucide-react";
import type { AssetTradingHubConfig } from "./AssetTradingHub";

/**
 * Build a Deriv-backed forex hub config (live candles + Botvio scalp engine).
 * Use this for FX pairs Deriv supports (frx*).
 */
export function buildForexHubConfig(opts: {
  pair: string;          // "EUR/USD"
  nickname?: string;     // "Fiber"
  patterns: string[];    // ["EUR/USD", "EURUSD"]
  bestSession: string;   // "London / NY overlap"
  keyLevels: string;     // "1.0500, 1.1000 round numbers"
  newsCatalysts: string; // "ECB, Fed, NFP, US/EU CPI"
}): AssetTradingHubConfig {
  const { pair, nickname, patterns, bestSession, keyLevels, newsCatalysts } = opts;
  const compact = pair.replace("/", "");
  const label = nickname ? `${pair} (${nickname})` : pair;
  return {
    seoTitle: `${pair} Trading Hub – Live Charts, Signals & Scalping Strategies${nickname ? ` (${nickname})` : ""}`,
    seoDescription: `Real-time ${pair} trading terminal with Botvio AI scalping signals (M1/M5), live S/R overlays, expert tips and proven session strategies for the ${nickname ?? pair} pair.`,
    assetLabel: pair,
    displaySymbol: pair,
    sessionSymbol: compact,
    persistSymbol: compact,
    category: "forex",
    symbolPatterns: patterns,
    tagline: `Real-time ${label} charts with built-in Botvio AI engine, auto-posted M1/M5 scalping signals, expert tips & strategies — your full ${pair} trading desk.`,
    quickStats: [
      { label: "Key Levels", value: keyLevels },
      { label: "Best Sessions", value: bestSession },
      { label: "Strategy Focus", value: "Botvio AI Scalp" },
      { label: "Risk Rule", value: "Max 2% per trade" },
    ],
    tips: [
      { title: `Trade ${pair} during peak liquidity`, body: `${pair}'s cleanest moves usually happen during ${bestSession}. Spreads are tightest and stop-hunts are easier to read.` },
      { title: "Use DXY as a directional filter", body: `When DXY breaks structure, ${pair} typically reacts. Watch for divergence vs DXY before entering.` },
      { title: `Mind ${newsCatalysts}`, body: `${pair} is most volatile around ${newsCatalysts}. Either flatten before, or wait 30m for spread/liquidity to normalize.` },
      { title: "Use 1H structure for bias", body: `Identify 1H higher highs/lower lows for directional bias before scalping M5 entries with the trend.` },
    ],
    strategies: [
      {
        title: "Session Open Breakout",
        icon: Zap,
        tf: "5m / 15m",
        color: "text-warning",
        bgColor: "bg-warning/10",
        quickSteps: [
          "Mark the prior session range high/low",
          "Wait for first 5m candle close beyond range at session open",
          "RSI confirms: >55 buys / <45 sells",
          "SL: just inside range | TP: 1.5–2× range size",
        ],
        note: "Skip if range is unusually tight (low ATR). Best on Tue/Wed/Thu.",
      },
      {
        title: "S/R Bounce",
        icon: Target,
        tf: "15m / 1H",
        color: "text-success",
        bgColor: "bg-success/10",
        quickSteps: [
          "Price taps a 1H S/R zone or daily pivot",
          "Wick rejection ≥ 50% candle range",
          "EMA 20 confirms direction → Enter on candle close",
          "SL: 10-15 pips beyond zone | TP: 1:2 RR minimum",
        ],
        note: "Trade peak sessions only. Skip near red-folder news.",
      },
      {
        title: "Liquidity Sweep",
        icon: Crosshair,
        tf: "1m / 5m",
        color: "text-destructive",
        bgColor: "bg-destructive/10",
        quickSteps: [
          "Mark prev-day high/low + Asian range",
          "Wait for stop-hunt sweep beyond level",
          "Reversal candle within 2-3 candles of sweep",
          "SL above sweep wick → Target opposite liquidity",
        ],
        note: "Sweep must be clean. Min 1:2.5 RR.",
      },
      {
        title: "MTF Trend Ride",
        icon: TrendingUp,
        tf: "4H / Daily",
        color: "text-primary",
        bgColor: "bg-primary/10",
        quickSteps: [
          "Daily EMA 50 confirms trend direction",
          "4H pullback to 20 EMA or demand/supply zone",
          "1H BOS (Break of Structure) in trend direction",
          "Trail with 20 EMA — hold 1-3 days",
        ],
        note: "Only trade in Daily trend direction. Skip Friday afternoons.",
      },
    ],
  };
}

/**
 * Build a TradingView-backed stock hub config (TradingView Advanced Chart).
 * Use this for US equities or any symbols Deriv doesn't list.
 */
export function buildStockHubConfig(opts: {
  ticker: string;        // "NVDA"
  companyName: string;   // "Nvidia Corp."
  tvSymbol: string;      // "NASDAQ:NVDA"
  sector: string;        // "Semiconductors / AI"
  catalysts: string;     // "Earnings, AI capex cycles, Fed policy"
}): AssetTradingHubConfig {
  const { ticker, companyName, tvSymbol, sector, catalysts } = opts;
  return {
    seoTitle: `${ticker} (${companyName}) Trading Hub – Live Stock Charts & Strategies`,
    seoDescription: `Real-time ${ticker} (${companyName}) trading terminal with live TradingView charts, expert intraday strategies and risk-managed swing setups for ${sector}.`,
    assetLabel: ticker,
    displaySymbol: ticker,
    sessionSymbol: ticker,
    persistSymbol: ticker,
    category: "stocks",
    symbolPatterns: [ticker, companyName.split(" ")[0]],
    tagline: `Live ${companyName} (${ticker}) charts with intraday and swing playbooks — focused on ${sector}.`,
    chartProvider: "tradingview",
    tvSymbol,
    quickStats: [
      { label: "Sector", value: sector },
      { label: "Best Sessions", value: "US Cash Open (13:30 UTC) → 20:00 UTC" },
      { label: "Catalysts", value: catalysts },
      { label: "Risk Rule", value: "Max 2% per trade" },
    ],
    tips: [
      { title: "Avoid the first 5 minutes", body: `${ticker} typically prints its widest spreads and largest fakeouts in the opening 5 minutes. Wait for the first 5m candle to close before entering.` },
      { title: "Watch SPY / QQQ correlation", body: `${ticker} usually follows the broader index direction. If SPY/QQQ break opposite your bias, tighten or stand aside.` },
      { title: `Plan around ${catalysts}`, body: `Catalysts move ${ticker} sharply. Either trade the post-event reaction or stay flat until volatility settles.` },
      { title: "Use VWAP for intraday bias", body: `Above VWAP = bullish bias for the day; below = bearish. Use it as a dynamic S/R for pullback entries.` },
    ],
    strategies: [
      {
        title: "Opening Range Breakout",
        icon: Zap,
        tf: "5m / 15m",
        color: "text-warning",
        bgColor: "bg-warning/10",
        quickSteps: [
          "Mark the first 15-minute high/low after US open",
          "Wait for 5m candle close beyond the range",
          "Volume on breakout candle > 1.5× average",
          "SL: opposite side of opening range | TP: 1.5–2× range size",
        ],
        note: `Skip if ${ticker} is gapping >3% or on earnings day.`,
      },
      {
        title: "VWAP Bounce",
        icon: Target,
        tf: "5m / 15m",
        color: "text-success",
        bgColor: "bg-success/10",
        quickSteps: [
          "Identify daily trend (above or below VWAP)",
          "Wait for pullback into VWAP",
          "Rejection candle + RSI divergence → Enter",
          "SL: 1 ATR beyond VWAP | TP: prior session high/low",
        ],
        note: "Best in the first 2 hours of the US session.",
      },
      {
        title: "Earnings Drift",
        icon: TrendingUp,
        tf: "1H / 4H",
        color: "text-primary",
        bgColor: "bg-primary/10",
        quickSteps: [
          "Wait for the day-after-earnings close",
          "Trade the direction of the post-earnings gap",
          "Confirm with 1H higher-highs / lower-lows",
          "Trail with 1H EMA 20 — hold 2-5 days",
        ],
        note: "Skip if guidance was mixed or sector is rotating.",
      },
      {
        title: "Swing Pullback",
        icon: Crosshair,
        tf: "Daily",
        color: "text-destructive",
        bgColor: "bg-destructive/10",
        quickSteps: [
          "Daily EMA 50 confirms trend direction",
          "Pullback to 20 EMA or prior breakout level",
          "Bullish/bearish engulfing on Daily → Enter",
          "SL: 1.5 ATR beyond entry | TP: 1:2 RR minimum",
        ],
        note: "Hold 1–3 weeks. Cut on weekly trend break.",
      },
    ],
  };
}