import { AssetTradingHub } from "@/components/asset-hub/AssetTradingHub";
import { buildForexHubConfig } from "@/components/asset-hub/configBuilders";

const CONFIG = buildForexHubConfig({
  pair: "EUR/JPY",
  patterns: ["EUR/JPY", "EURJPY"],
  bestSession: "Tokyo / London overlap (07:00–11:00 UTC)",
  keyLevels: "160.00, 165.00 high-volatility zones",
  newsCatalysts: "BoJ, ECB, EU/JP CPI, risk sentiment",
});

const EurJpyHub = () => <AssetTradingHub config={CONFIG} />;
export default EurJpyHub;