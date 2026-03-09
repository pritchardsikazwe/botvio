import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TrendingUp, TrendingDown, Minus, Sparkles, ChevronDown, Star, Share2, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const EXNESS_LINK = "https://one.exness-track.com/a/ts1kvs1k";

const CHART_PAIRS = [
  { category: "Metals", pairs: [
    { symbol: "XAU/USD", label: "Gold" },
    { symbol: "XAG/USD", label: "Silver" },
  ]},
  { category: "Forex", pairs: [
    { symbol: "EUR/USD", label: "Euro / Dollar" },
    { symbol: "GBP/USD", label: "Pound / Dollar" },
    { symbol: "USD/JPY", label: "Dollar / Yen" },
    { symbol: "AUD/USD", label: "Aussie / Dollar" },
  ]},
  { category: "Crypto", pairs: [
    { symbol: "BTC/USD", label: "Bitcoin" },
    { symbol: "ETH/USD", label: "Ethereum" },
    { symbol: "SOL/USD", label: "Solana" },
    { symbol: "BNB/USD", label: "BNB" },
    { symbol: "XRP/USD", label: "Ripple" },
    { symbol: "DOGE/USD", label: "Dogecoin" },
  ]},
  { category: "Indices", pairs: [
    { symbol: "US30", label: "Dow Jones" },
    { symbol: "NAS100", label: "NASDAQ 100" },
  ]},
  { category: "Synthetic", pairs: [
    { symbol: "BOOM1000", label: "Boom 1000" },
    { symbol: "CRASH1000", label: "Crash 1000" },
  ]},
];

function getMarketType(symbol: string): string {
  if (symbol.includes("XAU") || symbol.includes("XAG")) return "Metals";
  if (symbol.includes("BTC") || symbol.includes("ETH") || symbol.includes("SOL") || symbol.includes("BNB") || symbol.includes("XRP") || symbol.includes("DOGE")) return "Crypto";
  if (symbol.includes("US30") || symbol.includes("NAS")) return "Indices";
  if (symbol.includes("BOOM") || symbol.includes("CRASH")) return "Synthetic";
  return "Forex";
}

function getSession(): { name: string; status: string } {
  const h = new Date().getUTCHours();
  if (h >= 22 || h < 6) return { name: "Sydney / Tokyo", status: "Open" };
  if (h >= 7 && h < 16) return { name: "London", status: "Open" };
  if (h >= 13 && h < 22) return { name: "New York", status: "Open" };
  return { name: "Off-hours", status: "Closed" };
}

function formatPrice(price: number | null, symbol: string): string {
  if (price == null) return "—";
  if (symbol.includes("JPY")) return price.toFixed(3);
  if (symbol.includes("BTC")) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (symbol.includes("XAU") || symbol.includes("XAG")) return price.toFixed(2);
  return price.toFixed(5);
}

interface SymbolHeaderCardProps {
  symbol: string;
  price: number | null;
  changePercent: number | null;
  signal: string | null;
  confidence: number | null;
  trend: string | null;
  spread?: number | null;
}

const SIGNAL_COLORS: Record<string, string> = {
  buy: "bg-success/20 text-success border-success/40",
  sell: "bg-destructive/20 text-destructive border-destructive/40",
  hold: "bg-warning/20 text-warning border-warning/40",
  avoid: "bg-muted text-muted-foreground border-border",
};

export function SymbolHeaderCard({ symbol, price, changePercent, signal, confidence, trend, spread }: SymbolHeaderCardProps) {
  const navigate = useNavigate();
  const session = getSession();
  const marketType = getMarketType(symbol);
  const isMarketOpen = session.status === "Open";

  const trendIcon = trend === "bullish"
    ? <TrendingUp className="h-4 w-4 text-success" />
    : trend === "bearish"
      ? <TrendingDown className="h-4 w-4 text-destructive" />
      : <Minus className="h-4 w-4 text-muted-foreground" />;

  const goToSymbol = (s: string) => {
    const slug = s.replace("/", "");
    navigate(`/chart/${slug}`);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Chart link copied!");
  };

  return (
    <div className="bg-card border border-border/50 rounded-xl p-4 md:p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Symbol info */}
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">{symbol}</h1>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 max-h-80 overflow-y-auto">
                  {CHART_PAIRS.map(({ category, pairs }, i) => (
                    <div key={category}>
                      {i > 0 && <DropdownMenuSeparator />}
                      <DropdownMenuLabel className="text-xs text-muted-foreground uppercase">{category}</DropdownMenuLabel>
                      {pairs.map((p) => (
                        <DropdownMenuItem
                          key={p.symbol}
                          onClick={() => goToSymbol(p.symbol)}
                          className={`cursor-pointer ${p.symbol === symbol ? "bg-primary/10 font-bold" : ""}`}
                        >
                          <span className="font-medium">{p.symbol}</span>
                          <span className="ml-auto text-xs text-muted-foreground">{p.label}</span>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="outline" className="text-[10px] py-0">{marketType}</Badge>
              <Badge variant="outline" className={`text-[10px] py-0 ${isMarketOpen ? "text-success border-success/40" : "text-destructive border-destructive/40"}`}>
                {isMarketOpen ? "● Open" : "● Closed"}
              </Badge>
              <Badge variant="outline" className="text-[10px] py-0 text-primary border-primary/30">
                {session.name}
              </Badge>
              {spread != null && (
                <Badge variant="outline" className="text-[10px] py-0">Spread: {spread.toFixed(1)}</Badge>
              )}
            </div>
          </div>

          <div className="border-l border-border/50 pl-4">
            <span className="text-2xl md:text-3xl font-extrabold tabular-nums text-foreground font-mono">
              {formatPrice(price, symbol)}
            </span>
            {changePercent != null && (
              <div className="flex items-center gap-2 mt-1">
                {trendIcon}
                <span className={`text-sm font-bold ${changePercent >= 0 ? "text-success" : "text-destructive"}`}>
                  {changePercent >= 0 ? "+" : ""}{changePercent.toFixed(2)}%
                </span>
                <span className={`text-xs font-bold capitalize ${
                  trend === "bullish" ? "text-success" : trend === "bearish" ? "text-destructive" : "text-muted-foreground"
                }`}>{trend || "—"}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Signal + Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {signal && (
            <Badge className={`text-sm uppercase font-extrabold px-4 py-1.5 ${SIGNAL_COLORS[signal] || ""}`}>
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              {signal}
            </Badge>
          )}
          {confidence != null && (
            <div className="text-right">
              <div className="text-[10px] text-muted-foreground font-medium">Confidence</div>
              <div className="text-lg font-extrabold text-foreground">{Math.round(confidence)}%</div>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.info("Added to watchlist!")}>
              <Star className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            <a href={EXNESS_LINK} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="bg-[hsl(145_70%_45%)] hover:bg-[hsl(145_70%_40%)] text-white font-bold">
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                Trade on Exness
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
