import { useMarketSession } from "@/hooks/useMarketSession";
import { AlertTriangle, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface MarketClosedBannerProps {
  symbol?: string;
  showAlways?: boolean;
}

export const MarketClosedBanner = ({ symbol, showAlways = false }: MarketClosedBannerProps) => {
  const { isMarketOpen, marketType, sessionInfo, isLoading } = useMarketSession(symbol);

  // Don't show if loading or market is open
  if (isLoading) return null;
  if (isMarketOpen && !showAlways) return null;

  // For synthetic/crypto, never show closed banner
  if (marketType === "synthetic" || marketType === "crypto") return null;

  return (
    <Alert variant="destructive" className="border-warning bg-warning/10 text-warning-foreground">
      <AlertTriangle className="h-4 w-4 text-warning" />
      <AlertTitle className="text-warning font-semibold">Market Closed</AlertTitle>
      <AlertDescription className="text-muted-foreground">
        <div className="flex items-center gap-2 mt-1">
          <Clock className="h-4 w-4" />
          <span>
            {sessionInfo?.market_name || "This market"} is currently closed. 
            Switch to Synthetic Indices (available 24/7) or try again when the market reopens.
          </span>
        </div>
        {marketType === "forex" && (
          <p className="text-xs mt-2">
            Forex markets are open Sunday 22:00 UTC to Friday 22:00 UTC.
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
};
