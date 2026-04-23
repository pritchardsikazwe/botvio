import { AssetTradingHub } from "@/components/asset-hub/AssetTradingHub";
import { buildStockHubConfig } from "@/components/asset-hub/configBuilders";

const CONFIG = buildStockHubConfig({
  ticker: "AVGO",
  companyName: "Broadcom Inc.",
  tvSymbol: "NASDAQ:AVGO",
  sector: "Semiconductors / AI networking / VMware",
  catalysts: "Earnings, AI custom-silicon wins, VMware ramp",
});

const BroadcomHub = () => <AssetTradingHub config={CONFIG} />;
export default BroadcomHub;