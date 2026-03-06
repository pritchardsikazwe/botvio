import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";

interface ChartHeaderProps {
  symbol: string;
  price: number | null;
  changePercent: number | null;
  signal: string | null;
  confidence: number | null;
  trend: string | null;
}

const SIGNAL_COLORS: Record<string, string> = {
  buy: "bg-success/20 text-success border-success/40",
  sell: "bg-destructive/20 text-destructive border-destructive/40",
  hold: "bg-warning/20 text-warning border-warning/40",
  avoid: "bg-muted text-muted-foreground border-border",
};

function formatPrice(price: number | null, symbol: string): string {
  if (price == null) return "—";
  if (symbol.includes("JPY")) return price.toFixed(3);
  if (symbol.includes("BTC")) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (symbol.includes("XAU") || symbol.includes("XAG")) return price.toFixed(2);
  return price.toFixed(5);
}

export function ChartHeader({ symbol, price, changePercent, signal, confidence, trend }: ChartHeaderProps) {
  const trendIcon = trend === "bullish"
    ? <TrendingUp className="h-5 w-5 text-success" />
    : trend === "bearish"
      ? <TrendingDown className="h-5 w-5 text-destructive" />
      : <Minus className="h-5 w-5 text-muted-foreground" />;

  return (
    <div className="bg-card border border-border/50 rounded-xl px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">{symbol}</h1>
          <div className="flex items-center gap-2 mt-1">
            {trendIcon}
            <span className={`text-sm font-bold capitalize ${
              trend === "bullish" ? "text-success" : trend === "bearish" ? "text-destructive" : "text-muted-foreground"
            }`}>
              {trend || "—"}
            </span>
          </div>
        </div>
        <div className="border-l border-border/50 pl-4">
          <span className="text-3xl font-extrabold tabular-nums text-foreground font-mono">
            {formatPrice(price, symbol)}
          </span>
          {changePercent != null && (
            <span className={`ml-3 text-sm font-bold ${changePercent >= 0 ? "text-success" : "text-destructive"}`}>
              {changePercent >= 0 ? "+" : ""}{changePercent.toFixed(2)}%
            </span>
          )}
        </div>
      </div>

      {signal && (
        <div className="flex items-center gap-3">
          <Badge className={`text-sm uppercase font-extrabold px-4 py-1 ${SIGNAL_COLORS[signal] || ""}`}>
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            {signal}
          </Badge>
          {confidence != null && (
            <div className="text-right">
              <div className="text-xs text-muted-foreground font-medium">Confidence</div>
              <div className="text-lg font-extrabold text-foreground">{Math.round(confidence)}%</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
