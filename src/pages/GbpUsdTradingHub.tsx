import { Target, Zap, Crosshair, TrendingUp } from "lucide-react";
import { AssetTradingHub, type AssetTradingHubConfig } from "@/components/asset-hub/AssetTradingHub";

const CONFIG: AssetTradingHubConfig = {
  seoTitle: "GBP/USD Trading Hub – Live Cable Charts, Signals & Scalping Strategies",
  seoDescription: "Real-time GBP/USD (Cable) trading terminal with Botvio AI scalping signals (M1/M5), live S/R overlays, expert tips and proven London-session strategies. Public signal track record.",
  assetLabel: "GBP/USD",
  displaySymbol: "GBP/USD",
  sessionSymbol: "GBPUSD",
  persistSymbol: "GBPUSD",
  category: "forex",
  symbolPatterns: ["GBP", "CABLE"],
  tagline: "Real-time Cable charts with built-in Botvio AI engine, auto-posted M1/M5 scalping signals, expert tips & strategies — your full GBP/USD trading desk.",
  quickStats: [
    { label: "Key Levels", value: "Current round numbers + recent S/R" },
    { label: "Best Sessions", value: "London (08:00–12:00 UTC)" },
    { label: "Strategy Focus", value: "Botvio AI Scalp" },
    { label: "Risk Rule", value: "Max 2% per trade" },
  ],
  tips: [
    { title: "Trade the London open", body: "GBP/USD's most directional move usually fires between 08:00–10:00 UTC as London desks open. Avoid pre-news entries." },
    { title: "Watch DXY for confirmation", body: "If DXY breaks down while Cable breaks up, the trade has stronger conviction. Divergence with DXY = filter out the setup." },
    { title: "Mind UK news (BoE, CPI, GDP)", body: "Cable spikes hard on BoE rate decisions and UK inflation prints. Either flatten before, or wait 30m for spread to normalize." },
    { title: "Use 1H structure for bias", body: "Identify 1H higher highs/lower lows for directional bias before scalping M5 entries with the trend." },
  ],
  strategies: [
    {
      title: "London Open Breakout",
      icon: Zap,
      tf: "5m / 15m",
      color: "text-warning",
      bgColor: "bg-warning/10",
      quickSteps: [
        "Mark Asian session range high/low (00:00–07:00 UTC)",
        "Wait for first 5m candle close beyond range after 08:00 UTC",
        "RSI confirms: >55 buys / <45 sells",
        "SL: just inside Asian range | TP: 1.5–2× range size",
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
      note: "Trade London/NY sessions only. Skip near red-folder news.",
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
      note: "Sweep must be clean. Min 1:2.5 RR. Watch DXY correlation.",
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
  publicAccess: true,
};

const GbpUsdTradingHub = () => <AssetTradingHub config={CONFIG} />;

export default GbpUsdTradingHub;
