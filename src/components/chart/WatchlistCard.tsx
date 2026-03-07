import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

const WATCHLIST = [
  { symbol: "XAU/USD", name: "Gold", price: 2645.30, change: 0.42 },
  { symbol: "EUR/USD", name: "Euro", price: 1.08425, change: -0.15 },
  { symbol: "GBP/USD", name: "Pound", price: 1.26230, change: 0.08 },
  { symbol: "USD/JPY", name: "Yen", price: 149.850, change: 0.22 },
  { symbol: "BTC/USD", name: "Bitcoin", price: 97420.00, change: 1.85 },
  { symbol: "ETH/USD", name: "Ethereum", price: 3285.40, change: -0.92 },
  { symbol: "US30", name: "Dow Jones", price: 43850.00, change: 0.35 },
  { symbol: "NAS100", name: "NASDAQ", price: 19420.00, change: 0.65 },
  { symbol: "BOOM1000", name: "Boom 1000", price: 9850.00, change: 2.10 },
  { symbol: "CRASH1000", name: "Crash 1000", price: 9420.00, change: -1.45 },
];

interface WatchlistCardProps {
  activeSymbol?: string;
}

export function WatchlistCard({ activeSymbol }: WatchlistCardProps) {
  const navigate = useNavigate();

  const goTo = (sym: string) => {
    navigate(`/chart/${sym.replace("/", "")}`);
  };

  return (
    <Card className="bg-card border-border/50 rounded-xl">
      <CardContent className="p-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
          <Eye className="h-4 w-4 text-primary" /> Watchlist
        </h3>
        <div className="space-y-0.5 max-h-[320px] overflow-y-auto">
          {WATCHLIST.map((item) => {
            const isActive = item.symbol === activeSymbol;
            const isUp = item.change >= 0;
            return (
              <div
                key={item.symbol}
                onClick={() => goTo(item.symbol)}
                className={`flex items-center justify-between px-2 py-2 rounded-lg cursor-pointer transition-all hover:bg-muted/40 ${
                  isActive ? "bg-primary/10 border border-primary/30" : ""
                }`}
              >
                <div>
                  <span className={`text-xs font-bold ${isActive ? "text-primary" : "text-foreground"}`}>{item.symbol}</span>
                  <span className="text-[10px] text-muted-foreground ml-1.5">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-foreground">{item.price.toFixed(item.price > 100 ? 2 : 5)}</span>
                  <span className={`text-[10px] font-bold flex items-center ${isUp ? "text-success" : "text-destructive"}`}>
                    {isUp ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                    {isUp ? "+" : ""}{item.change.toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
