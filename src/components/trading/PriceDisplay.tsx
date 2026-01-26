import { TrendingUp, TrendingDown } from "lucide-react";
import { MarketData } from "@/types/trading";

interface PriceDisplayProps {
  data: MarketData;
}

export const PriceDisplay = ({ data }: PriceDisplayProps) => {
  const isPositive = data.change24h >= 0;

  return (
    <div className="glass-card p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="data-label">Trading Pair</span>
          <h2 className="text-2xl font-bold gold-text">{data.pair}</h2>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
          isPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
        }`}>
          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span className="font-mono font-semibold">
            {isPositive ? '+' : ''}{data.change24h.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <span className="data-label">Current Price</span>
          <p className="price-ticker text-4xl font-bold">
            ${data.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
          <div>
            <span className="data-label">24h High</span>
            <p className="font-mono text-success">${data.high24h.toFixed(2)}</p>
          </div>
          <div>
            <span className="data-label">24h Low</span>
            <p className="font-mono text-destructive">${data.low24h.toFixed(2)}</p>
          </div>
          <div>
            <span className="data-label">Volume</span>
            <p className="font-mono text-muted-foreground">{(data.volume / 1000000).toFixed(2)}M</p>
          </div>
        </div>
      </div>
    </div>
  );
};
