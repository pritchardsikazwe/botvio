import { AssetTradingHub } from "@/components/asset-hub/AssetTradingHub";
import { buildStockHubConfig } from "@/components/asset-hub/configBuilders";

const CONFIG = buildStockHubConfig({
  ticker: "MSFT",
  companyName: "Microsoft Corp.",
  tvSymbol: "NASDAQ:MSFT",
  sector: "Cloud / AI / Enterprise SaaS",
  catalysts: "Earnings, Azure growth, OpenAI partnership",
});

const MicrosoftHub = () => <AssetTradingHub config={CONFIG} />;
export default MicrosoftHub;