import { AssetTradingHub } from "@/components/asset-hub/AssetTradingHub";
import { buildIndexHubConfig } from "@/components/asset-hub/configBuilders";

const CONFIG = buildIndexHubConfig({
  ticker: "US30",
  longName: "Dow Jones 30",
  tvSymbol: "OANDA:US30USD",
  region: "US Cash + Futures",
  bestSession: "US Cash Open (13:30 UTC) → 20:00 UTC",
  keyLevels: "Round 100/500 levels, PDH / PDL, prior week high/low",
  catalysts: "FOMC, NFP, CPI, ISM, mega-cap earnings (AAPL, MSFT, JPM)",
  patterns: ["US30", "DJ30", "DOW", "DJI"],
  accentColor: "#3b82f6", // blue
});

const Us30Hub = () => <AssetTradingHub config={CONFIG} />;
export default Us30Hub;