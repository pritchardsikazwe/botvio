import { AssetTradingHub } from "@/components/asset-hub/AssetTradingHub";
import { buildStockHubConfig } from "@/components/asset-hub/configBuilders";

const CONFIG = buildStockHubConfig({
  ticker: "GOOGL",
  companyName: "Alphabet Inc.",
  tvSymbol: "NASDAQ:GOOGL",
  sector: "Search / YouTube / Cloud / AI",
  catalysts: "Earnings, Search ad strength, Gemini AI traction",
});

const AlphabetHub = () => <AssetTradingHub config={CONFIG} />;
export default AlphabetHub;