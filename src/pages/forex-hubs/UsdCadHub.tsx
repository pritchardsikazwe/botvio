import { AssetTradingHub } from "@/components/asset-hub/AssetTradingHub";
import { buildForexHubConfig } from "@/components/asset-hub/configBuilders";

const CONFIG = buildForexHubConfig({
  pair: "USD/CAD",
  nickname: "Loonie",
  patterns: ["USD/CAD", "USDCAD"],
  bestSession: "NY session (13:30–20:00 UTC)",
  keyLevels: "1.3500, 1.4000 oil-correlated zones",
  newsCatalysts: "BoC, WTI crude oil, Canadian CPI",
});

const UsdCadHub = () => <AssetTradingHub config={CONFIG} />;
export default UsdCadHub;