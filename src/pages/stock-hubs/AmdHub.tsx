import { AssetTradingHub } from "@/components/asset-hub/AssetTradingHub";
import { buildStockHubConfig } from "@/components/asset-hub/configBuilders";

const CONFIG = buildStockHubConfig({
  ticker: "AMD",
  companyName: "Advanced Micro Devices, Inc.",
  tvSymbol: "NASDAQ:AMD",
  sector: "Semiconductors / AI accelerators",
  catalysts: "Earnings, MI300/MI350 ramp, hyperscaler capex",
});

const AmdHub = () => <AssetTradingHub config={CONFIG} />;
export default AmdHub;