import { Target, Zap, Crosshair, TrendingUp } from "lucide-react";
import { AssetTradingHub, type AssetTradingHubConfig } from "@/components/asset-hub/AssetTradingHub";

const CONFIG: AssetTradingHubConfig = {
  seoTitle: "Bitcoin Trading Hub – Live BTC/USD Charts, Signals & Scalping Strategies",
  seoDescription: "Real-time BTC/USD trading terminal with Botvio AI scalping signals (M1/M5), automated S/R overlays, expert tips and 24/7 crypto strategies. Track our public Bitcoin signal performance.",
  assetLabel: "Bitcoin",
  displaySymbol: "BTC/USD",
  sessionSymbol: "BTCUSD",
  persistSymbol: "BTCUSD",
  category: "crypto",
  symbolPatterns: ["BTC", "BITCOIN"],
  alwaysOpen: true,
  includeWeltradeSignals: true,
  tagline: "Real-time charts with built-in Botvio AI scalping engine, auto-posted M1/M5 signals, expert tips & community — your full Bitcoin trading desk.",
  quickStats: [
    { label: "Top Levels", value: "Current round numbers + market structure" },
    { label: "Best Sessions", value: "24/7 — US/Asia Open Spike" },
    { label: "Strategy Focus", value: "Botvio AI Scalp" },
    { label: "Risk Rule", value: "Max 1.5% per trade" },
  ],
  tips: [
    { title: "Trade the open of US session", body: "Bitcoin volatility tends to surge as US traders log in (13:30–15:30 UTC). Best window for momentum scalps." },
    { title: "Watch DXY & Nasdaq correlation", body: "BTC often inversely tracks DXY and aligns with Nasdaq risk sentiment. Cross-check before entering high-conviction trades." },
    { title: "Avoid weekend over-leverage", body: "Liquidity drops on Saturdays/Sundays. Tight stops and reduced size protect from sudden wicks on thin order books." },
    { title: "Confirm with volume", body: "Breakouts without volume often fade. Use exchange volume divergence to filter out fake breakouts on the 5m chart." },
  ],
  strategies: [
    {
      title: "Range Breakout",
      icon: Zap,
      tf: "5m / 15m",
      color: "text-warning",
      bgColor: "bg-warning/10",
      quickSteps: [
        "Identify a 1H consolidation range (3+ candles tight)",
        "Strong candle close above resistance / below support",
        "Volume spike confirms — RSI > 60 (buys) or < 40 (sells)",
        "Enter on retest of broken level — SL just inside the range",
      ],
      note: "Best during US/Asia session opens. Skip during low-volume Sundays.",
    },
    {
      title: "Round-Number Bounce",
      icon: Target,
      tf: "15m / 1H",
      color: "text-success",
      bgColor: "bg-success/10",
      quickSteps: [
        "Mark major psychological levels ($60k, $65k, $70k…)",
        "Wait for wick rejection ≥ 50% candle range",
        "Confirm with EMA 20 alignment in trade direction",
        "SL: 200-400 USD beyond level | TP: 1:2 RR minimum",
      ],
      note: "Highest probability when BTC tests level for the first time in 24h.",
    },
    {
      title: "Liquidity Sweep",
      icon: Crosshair,
      tf: "1m / 5m",
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      quickSteps: [
        "Mark prev-day high/low + Asian session range",
        "Wait for stop-hunt sweep beyond the level",
        "Reversal candle within 2-3 candles of sweep",
        "SL above sweep wick → Target opposite liquidity",
      ],
      note: "Sweep must be clean. Min 1:2.5 RR. Watch ETH for confirmation.",
    },
    {
      title: "Trend Pullback",
      icon: TrendingUp,
      tf: "1H / 4H",
      color: "text-primary",
      bgColor: "bg-primary/10",
      quickSteps: [
        "Daily EMA 50 confirms trend direction",
        "1H pullback to 20 EMA or order block",
        "15m BOS (Break of Structure) in trend direction",
        "Trail with 20 EMA — hold for 6-24h scalp",
      ],
      note: "Only trade in Daily trend direction. Reduce size during low-volatility regimes.",
    },
  ],
  // Show ETH alongside BTC for crypto cross-confirmation
  siblingScalp: { displaySymbol: "ETH/USD", assetLabel: "Ethereum" },
  publicAccess: true,
};

const BitcoinTradingHub = () => <AssetTradingHub config={CONFIG} />;

export default BitcoinTradingHub;
