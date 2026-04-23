import { AssetTradingHub } from "@/components/asset-hub/AssetTradingHub";
import { buildStockHubConfig } from "@/components/asset-hub/configBuilders";

const CONFIG = buildStockHubConfig({
  ticker: "AAPL",
  companyName: "Apple Inc.",
  tvSymbol: "NASDAQ:AAPL",
  sector: "Consumer Tech / Services",
  catalysts: "Earnings, iPhone cycle, services growth",
});

const AppleHub = () => <AssetTradingHub config={CONFIG} />;
export default AppleHub;