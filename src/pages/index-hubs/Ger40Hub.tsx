import { AssetTradingHub } from "@/components/asset-hub/AssetTradingHub";
import { buildIndexHubConfig } from "@/components/asset-hub/configBuilders";

const CONFIG = buildIndexHubConfig({
  ticker: "GER40",
  longName: "DAX 40 (Germany 40)",
  tvSymbol: "OANDA:DE40EUR",
  region: "Frankfurt · Eurex",
  bestSession: "Frankfurt open (07:00 UTC) → London/NY overlap (12:00–16:00 UTC)",
  keyLevels: "Round 50/100 levels, PDH / PDL, prior week high/low",
  catalysts: "ECB, German IFO/ZEW, EU CPI, US NFP & CPI spillover",
  patterns: ["GER40", "DE40", "DAX", "DE30"],
  accentColor: "#f97316", // orange
});

const Ger40Hub = () => <AssetTradingHub config={CONFIG} />;
export default Ger40Hub;