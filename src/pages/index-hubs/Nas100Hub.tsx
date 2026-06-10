import { AssetTradingHub } from "@/components/asset-hub/AssetTradingHub";
import { buildIndexHubConfig } from "@/components/asset-hub/configBuilders";

const CONFIG = buildIndexHubConfig({
  ticker: "NAS100",
  longName: "Nasdaq 100",
  tvSymbol: "OANDA:NAS100USD",
  region: "US Tech · Cash + Futures",
  bestSession: "US Cash Open (13:30 UTC) → 20:00 UTC",
  keyLevels: "Round 100 levels, PDH / PDL, prior week high/low",
  catalysts: "FOMC, CPI, NFP, mega-cap tech earnings (NVDA, AAPL, MSFT, META)",
  patterns: ["NAS100", "NDX", "Nasdaq", "USTEC"],
  accentColor: "#8b5cf6", // purple
});

const Nas100Hub = () => <AssetTradingHub config={CONFIG} />;
export default Nas100Hub;