import { AssetTradingHub } from "@/components/asset-hub/AssetTradingHub";
import { buildStockHubConfig } from "@/components/asset-hub/configBuilders";

const CONFIG = buildStockHubConfig({
  ticker: "TSLA",
  companyName: "Tesla Inc.",
  tvSymbol: "NASDAQ:TSLA",
  sector: "EV / Clean Energy / AI Robotics",
  catalysts: "Earnings, delivery numbers, Elon news",
});

const TeslaHub = () => <AssetTradingHub config={CONFIG} />;
export default TeslaHub;