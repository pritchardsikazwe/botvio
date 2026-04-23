import { AssetTradingHub } from "@/components/asset-hub/AssetTradingHub";
import { buildForexHubConfig } from "@/components/asset-hub/configBuilders";

const CONFIG = buildForexHubConfig({
  pair: "AUD/USD",
  nickname: "Aussie",
  patterns: ["AUD/USD", "AUDUSD"],
  bestSession: "Sydney/Tokyo (22:00–06:00 UTC)",
  keyLevels: "0.6500, 0.6700 commodity-tied zones",
  newsCatalysts: "RBA, China PMI, iron ore & copper",
});

const AudUsdHub = () => <AssetTradingHub config={CONFIG} />;
export default AudUsdHub;