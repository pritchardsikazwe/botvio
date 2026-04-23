import { AssetTradingHub } from "@/components/asset-hub/AssetTradingHub";
import { buildStockHubConfig } from "@/components/asset-hub/configBuilders";

const CONFIG = buildStockHubConfig({
  ticker: "NVDA",
  companyName: "Nvidia Corp.",
  tvSymbol: "NASDAQ:NVDA",
  sector: "Semiconductors / AI",
  catalysts: "Earnings, AI capex cycles, Fed policy",
});

const NvidiaHub = () => <AssetTradingHub config={CONFIG} />;
export default NvidiaHub;