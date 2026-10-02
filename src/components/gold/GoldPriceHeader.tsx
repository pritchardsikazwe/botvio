import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useDerivLiveTicks } from "@/hooks/useDerivLiveTicks";

interface QuoteData {
  price: number;
  change_percent_24h: number;
}

/**
 * Live XAU/USD quote from Deriv's public market feed.
 * This intentionally avoids the legacy market_quotes table, which is not
 * required for the homepage/header and previously caused invalid-column errors.
 */
export function GoldPriceHeader() {
  const { tick, connected } = useDerivLiveTicks("XAU/USD");
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);

  useEffect(() => {
    if (tick?.price && previousPrice == null) setPreviousPrice(tick.price);
  }, [tick?.price, previousPrice]);

  const price = tick?.price ?? 0;
  const change = previousPrice && previousPrice > 0
    ? ((price - previousPrice) / previousPrice) * 100
    : 0;
  const isUp = change >= 0;

  return (
    <div className="flex items-center gap-4 bg-card/80 border border-border/50 rounded-xl px-5 py-3">
      <div>
        <p className="text-xs text-muted-foreground font-mono">XAU/USD</p>
        <p className="text-2xl font-extrabold font-mono text-foreground">
          {price > 0 ? `$${price.toFixed(2)}` : "—"}
        </p>
      </div>
      {price > 0 && (
        <div className={`flex items-center gap-1 text-sm font-bold ${isUp ? "text-success" : "text-destructive"}`}>
          {isUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {connected ? `${isUp ? "+" : ""}${change.toFixed(2)}%` : "Connecting…"}
        </div>
      )}
    </div>
  );
}
