import { AssetTradingHub } from "@/components/asset-hub/AssetTradingHub";
import { buildStockHubConfig } from "@/components/asset-hub/configBuilders";

const CONFIG = buildStockHubConfig({
  ticker: "META",
  companyName: "Meta Platforms Inc.",
  tvSymbol: "NASDAQ:META",
  sector: "Social / Ads / AI / Reality Labs",
  catalysts: "Earnings, ad pricing, AI capex, Reels growth",
});

const MetaHub = () => <AssetTradingHub config={CONFIG} />;
export default MetaHub;