import { AssetTradingHub } from "@/components/asset-hub/AssetTradingHub";
import { buildStockHubConfig } from "@/components/asset-hub/configBuilders";

const CONFIG = buildStockHubConfig({
  ticker: "AMZN",
  companyName: "Amazon.com Inc.",
  tvSymbol: "NASDAQ:AMZN",
  sector: "E-commerce / AWS Cloud / Ads",
  catalysts: "Earnings, AWS growth, retail margins",
});

const AmazonHub = () => <AssetTradingHub config={CONFIG} />;
export default AmazonHub;