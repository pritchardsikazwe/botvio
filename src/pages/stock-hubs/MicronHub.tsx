import { AssetTradingHub } from "@/components/asset-hub/AssetTradingHub";
import { buildStockHubConfig } from "@/components/asset-hub/configBuilders";

const CONFIG = buildStockHubConfig({
  ticker: "MU",
  companyName: "Micron Technology Inc.",
  tvSymbol: "NASDAQ:MU",
  sector: "Memory chips (DRAM / NAND / HBM)",
  catalysts: "Earnings, HBM pricing, AI server demand",
});

const MicronHub = () => <AssetTradingHub config={CONFIG} />;
export default MicronHub;