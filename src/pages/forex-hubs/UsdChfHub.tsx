import { AssetTradingHub } from "@/components/asset-hub/AssetTradingHub";
import { buildForexHubConfig } from "@/components/asset-hub/configBuilders";

const CONFIG = buildForexHubConfig({
  pair: "USD/CHF",
  nickname: "Swissie",
  patterns: ["USD/CHF", "USDCHF"],
  bestSession: "London / NY overlap (12:00–16:00 UTC)",
  keyLevels: "0.9000 SNB intervention zone, 0.8500",
  newsCatalysts: "SNB, Swiss CPI, Fed, risk-off flows",
});

const UsdChfHub = () => <AssetTradingHub config={CONFIG} />;
export default UsdChfHub;