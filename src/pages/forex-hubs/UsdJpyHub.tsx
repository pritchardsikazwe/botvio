import { AssetTradingHub } from "@/components/asset-hub/AssetTradingHub";
import { buildForexHubConfig } from "@/components/asset-hub/configBuilders";

const CONFIG = buildForexHubConfig({
  pair: "USD/JPY",
  nickname: "Ninja",
  patterns: ["USD/JPY", "USDJPY"],
  bestSession: "Tokyo open + London (00:00–10:00 UTC)",
  keyLevels: "150.00, 152.00 BoJ intervention zones",
  newsCatalysts: "BoJ rate decisions, US 10Y yield, Fed",
});

const UsdJpyHub = () => <AssetTradingHub config={CONFIG} />;
export default UsdJpyHub;