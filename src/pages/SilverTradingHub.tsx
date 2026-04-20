import { Target, Zap, Crosshair, TrendingUp } from "lucide-react";
import { AssetTradingHub, type AssetTradingHubConfig } from "@/components/asset-hub/AssetTradingHub";

const CONFIG: AssetTradingHubConfig = {
  seoTitle: "Silver Trading Hub – Live XAG/USD Charts, Signals & Scalping Strategies",
  seoDescription: "Real-time XAG/USD silver trading terminal with Botvio AI scalping signals (M1/M5), live S/R overlays, expert tips and proven strategies. Track our public silver signal performance.",
  assetLabel: "Silver",
  displaySymbol: "XAG/USD",
  sessionSymbol: "XAGUSD",
  persistSymbol: "XAGUSD",
  category: "commodities",
  symbolPatterns: ["XAG", "SILVER"],
  tagline: "Real-time silver charts with built-in Botvio AI engine, auto-posted M1/M5 scalping signals, expert tips & strategies — your full XAG/USD trading desk.",
  quickStats: [
    { label: "Key Levels", value: "$25 / $28 / $30 zones" },
    { label: "Best Sessions", value: "London & NY Overlap" },
    { label: "Strategy Focus", value: "Botvio AI" },
    { label: "Risk Rule", value: "Max 2% per trade" },
  ],
  tips: [
    { title: "Watch Gold/Silver ratio (GSR)", body: "When GSR drops below 80, silver tends to outperform gold. Above 90, silver typically lags. Useful filter for swing entries." },
    { title: "Industrial demand matters", body: "Unlike gold, silver has heavy industrial use. Strong PMI / China data often boosts silver more than gold." },
    { title: "Higher volatility = wider stops", body: "Silver moves 2–3× faster than gold per session. Use proportionally wider SL or smaller position size." },
    { title: "Trade the London open", body: "08:00–10:00 UTC is silver's most directional window. Best for clean breakout setups." },
  ],
  strategies: [
    {
      title: "S/R Bounce",
      icon: Target,
      tf: "15m / 1H",
      color: "text-success",
      bgColor: "bg-success/10",
      quickSteps: [
        "Price taps a Daily S/R zone (round numbers $25, $28, $30…)",
        "Wick rejection ≥ 50% of candle range",
        "EMA 20 confirms direction → Enter on candle close",
        "SL: 15-25 cents beyond zone | TP: 1:2 RR minimum",
      ],
      note: "Trade London/NY sessions only. Skip near high-impact news.",
    },
    {
      title: "Breakout Momentum",
      icon: Zap,
      tf: "1H / 4H",
      color: "text-warning",
      bgColor: "bg-warning/10",
      quickSteps: [
        "4H consolidation range (3+ tight candles)",
        "Strong candle close beyond support/resistance",
        "RSI confirms: >60 buys, <40 sells",
        "Enter on retest of broken level — don't chase",
      ],
      note: "Only take breakouts aligned with Daily trend. Skip low-ATR.",
    },
    {
      title: "Liquidity Sweep",
      icon: Crosshair,
      tf: "5m / 15m",
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      quickSteps: [
        "Mark prev day high/low + Asian session range",
        "Wait for sweep beyond level (stop hunt)",
        "Reversal candle within 2-3 candles after sweep",
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
      note: "Only trade in Daily EMA 50 direction. Reduce size over weekend.",
    },
  ],
};

const SilverTradingHub = () => <AssetTradingHub config={CONFIG} />;

export default SilverTradingHub;
