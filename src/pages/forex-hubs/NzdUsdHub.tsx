import { AssetTradingHub } from "@/components/asset-hub/AssetTradingHub";
import { buildForexHubConfig } from "@/components/asset-hub/configBuilders";

const CONFIG = buildForexHubConfig({
  pair: "NZD/USD",
  nickname: "Kiwi",
  patterns: ["NZD/USD", "NZDUSD"],
  bestSession: "Sydney/Tokyo (22:00–06:00 UTC)",
  keyLevels: "0.5800, 0.6200 commodity-tied zones",
  newsCatalysts: "RBNZ, China PMI, dairy auctions",
});

const NzdUsdHub = () => <AssetTradingHub config={CONFIG} />;
export default NzdUsdHub;