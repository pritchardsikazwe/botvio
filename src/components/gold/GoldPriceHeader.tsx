import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Radio } from "lucide-react";
import { useDerivLiveTicks } from "@/hooks/useDerivLiveTicks";

/**
 * Live XAU/USD quote from Deriv's public market feed.
 * No database quote table is required for this header.
 */
export function GoldPriceHeader() {
  const { tick, connected } = useDerivLiveTicks("XAU/USD");
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);

  useEffect(() => {
    if (tick?.price && tick.price !== previousPrice) setPreviousPrice(tick.price);
  }, [tick?.price, previousPrice]);

  const price = tick?.price ?? 0;
  const tickDirection = previousPrice != null && price >= previousPrice ? "up" : "down";

  return (
    <div className="flex items-center gap-4 bg-card/80 border border-border/50 rounded-xl px-5 py-3">
      <div>
        <p className="text-xs text-muted-foreground font-mono">XAU/USD</p>
        <p className="text-2xl font-extrabold font-mono text-foreground">
          {price > 0 ? `$${price.toFixed(2)}` : "—"}
        </p>
      </div>
      {price > 0 && (
        <div className={`flex items-center gap-1 text-sm font-bold ${tickDirection === "up" ? "text-success" : "text-destructive"}`}>
          {tickDirection === "up" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          <Radio className="h-3 w-3" />
          {connected ? "LIVE" : "RECONNECTING"}
        </div>
      )}
    </div>
  );
}
