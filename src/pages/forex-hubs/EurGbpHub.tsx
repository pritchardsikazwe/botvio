import { AssetTradingHub } from "@/components/asset-hub/AssetTradingHub";
import { buildForexHubConfig } from "@/components/asset-hub/configBuilders";

const CONFIG = buildForexHubConfig({
  pair: "EUR/GBP",
  patterns: ["EUR/GBP", "EURGBP"],
  bestSession: "London (08:00–16:00 UTC)",
  keyLevels: "0.8500, 0.8700 EU/UK parity zones",
  newsCatalysts: "ECB, BoE, EU/UK CPI & GDP",
});
CONFIG.chartProvider = "tradingview";
CONFIG.tvSymbol = "OANDA:EURGBP";

const EurGbpHub = () => <AssetTradingHub config={CONFIG} />;
export default EurGbpHub;