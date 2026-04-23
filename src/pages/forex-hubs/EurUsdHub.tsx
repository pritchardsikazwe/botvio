import { AssetTradingHub } from "@/components/asset-hub/AssetTradingHub";
import { buildForexHubConfig } from "@/components/asset-hub/configBuilders";

const CONFIG = buildForexHubConfig({
  pair: "EUR/USD",
  nickname: "Fiber",
  patterns: ["EUR/USD", "EURUSD"],
  bestSession: "London / NY overlap (12:00–16:00 UTC)",
  keyLevels: "1.0500, 1.1000, 1.1500 round numbers",
  newsCatalysts: "ECB, Fed, NFP, US/EU CPI",
});

const EurUsdHub = () => <AssetTradingHub config={CONFIG} />;
export default EurUsdHub;