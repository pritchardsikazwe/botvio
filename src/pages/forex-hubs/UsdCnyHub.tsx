import { AssetTradingHub } from "@/components/asset-hub/AssetTradingHub";
import { buildForexHubConfig } from "@/components/asset-hub/configBuilders";

const CONFIG = buildForexHubConfig({
  pair: "USD/CNY",
  nickname: "Yuan",
  patterns: ["USD/CNY", "USDCNY", "USD/CNH", "USDCNH"],
  bestSession: "Asia session (00:00–08:00 UTC)",
  keyLevels: "7.0000, 7.3000 PBoC fix zones",
  newsCatalysts: "PBoC fix, China PMI, US/CN trade headlines",
});
CONFIG.chartProvider = "tradingview";
CONFIG.tvSymbol = "FX_IDC:USDCNH";

const UsdCnyHub = () => <AssetTradingHub config={CONFIG} />;
export default UsdCnyHub;