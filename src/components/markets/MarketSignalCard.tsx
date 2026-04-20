import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, Lock, BarChart3, ExternalLink, Clock, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDerivLiveSignal } from "@/hooks/useDerivLiveSignal";
import { mapToDerivSymbol } from "@/hooks/useDerivLiveTicks";
import { usePersistLiveSignal } from "@/hooks/usePersistGoldLiveSignal";

// Symbols that auto-post live BUY/SELL signals to the DB (Home + /signals).
// Each entry maps a normalized symbol → category for display & filtering.
const AUTO_POST_SYMBOLS: Record<string, string> = {
  XAUUSD: "gold",
  XAGUSD: "commodities",
  BTCUSD: "crypto",
  GBPUSD: "forex",
};

function normalizeSymbol(sym: string): string {
  return (sym || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

interface MarketSignalCardProps {
  instrument: string;
  symbol: string;
  price: string;
  change: string;
  changePercent: string;
  signal: "BUY" | "SELL" | "HOLD" | "WAIT";
  entry: string;
  stopLoss: string;
  takeProfit: string;
  strategy: string;
  session: string;
  confidence: number;
  isPremium?: boolean;
  brokerName?: string;
  brokerUrl?: string;
  chartSymbol?: string;
  metrics?: { label: string; value: string }[];
  bias?: "Bullish" | "Bearish" | "Neutral";
  /** ISO timestamp when the signal was generated/posted */
  postedAt?: string;
  /** When false, disables live Deriv-driven override (default: auto-on for Deriv-supported symbols) */
  live?: boolean;
}

// Format a number using the static price string as a precision hint
function formatLikePrice(value: number, hint: string): string {
  const cleaned = (hint || "").replace(/,/g, "");
  const decimals = cleaned.includes(".") ? cleaned.split(".")[1].length : 2;
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export const MarketSignalCard = ({
  instrument, symbol, price, change, changePercent,
  signal, entry, stopLoss, takeProfit, strategy,
  session, confidence, isPremium, brokerName, brokerUrl,
  chartSymbol, metrics, bias, postedAt, live,
}: MarketSignalCardProps) => {
  const { user } = useAuth();
  const locked = isPremium && !user;

  // Auto-enable live mode when symbol is Deriv-supported, unless caller forces it off
  const derivSupported = !!mapToDerivSymbol(symbol);
  const liveEnabled = live !== false && derivSupported;
  const liveSig = useDerivLiveSignal(liveEnabled ? symbol : null, 300);

  // Auto-post high-confidence live signals to DB for whitelisted symbols
  const normSym = normalizeSymbol(symbol);
  const autoPostCategory = AUTO_POST_SYMBOLS[normSym];
  usePersistLiveSignal(liveSig, !!autoPostCategory && liveEnabled, normSym, autoPostCategory);

  // Effective values — live overrides static when available
  const useLive = liveEnabled && liveSig.lastPrice != null;
  const effSignal = useLive ? liveSig.signal : signal;
  const effConfidence = useLive ? liveSig.confidence : confidence;
  const effStrategy = useLive ? liveSig.strategy : strategy;
  const effPrice = useLive && liveSig.lastPrice != null
    ? formatLikePrice(liveSig.lastPrice, price)
    : price;
  const effBias: "Bullish" | "Bearish" | "Neutral" = useLive
    ? (effSignal === "BUY" ? "Bullish" : effSignal === "SELL" ? "Bearish" : "Neutral")
    : (bias ?? "Neutral");

  const postedLabel = (useLive ? new Date() : (postedAt ? new Date(postedAt) : new Date())).toLocaleString([], {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  // Map known instruments to their dedicated trading hubs
  const HUB_ROUTES: Record<string, string> = {
    XAUUSD: "/gold",
    XAGUSD: "/silver",
    BTCUSD: "/bitcoin",
    GBPUSD: "/gbpusd",
  };
  const hubRoute = HUB_ROUTES[normSym];
  const chartHref = hubRoute ?? `/chart/${chartSymbol || symbol}`;

  const signalColor = effSignal === "BUY" ? "text-success" : effSignal === "SELL" ? "text-destructive" : "text-muted-foreground";
  const signalBg = effSignal === "BUY" ? "bg-success/10 border-success/30" : effSignal === "SELL" ? "bg-destructive/10 border-destructive/30" : "bg-muted/30 border-border";
  const biasColor = effBias === "Bullish" ? "text-success" : effBias === "Bearish" ? "text-destructive" : "text-muted-foreground";
  const isPositive = !changePercent.startsWith("-");

  return (
    <Card className={`relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${effSignal !== "HOLD" && effSignal !== "WAIT" ? "ring-1 ring-primary/20 shadow-lg shadow-primary/5" : ""}`}>
      {effSignal !== "HOLD" && effSignal !== "WAIT" && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-warning to-primary animate-pulse" />
      )}

      <CardHeader className="pb-2 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-foreground">{instrument}</h3>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground font-mono">{symbol}</span>
              {useLive && (
                <Badge variant="outline" className="text-[9px] px-1 py-0 border-success/40 text-success font-mono gap-0.5">
                  <Activity className="h-2 w-2 animate-pulse" />
                  LIVE
                </Badge>
              )}
            </div>
          </div>
          <Badge className={`${signalBg} ${signalColor} font-extrabold text-sm px-3 py-1 border`}>
            {effSignal === "BUY" && <TrendingUp className="h-3 w-3 mr-1" />}
            {effSignal === "SELL" && <TrendingDown className="h-3 w-3 mr-1" />}
            {(effSignal === "HOLD" || effSignal === "WAIT") && <Minus className="h-3 w-3 mr-1" />}
            {effSignal}
          </Badge>
        </div>

        <div className="flex items-end gap-2">
          <span className="text-2xl font-extrabold text-foreground font-mono">{effPrice}</span>
          <span className={`text-sm font-bold ${isPositive ? "text-success" : "text-destructive"}`}>
            {change} ({changePercent})
          </span>
        </div>

        {(effBias || bias) && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Bias:</span>
            <span className={`text-xs font-bold ${biasColor}`}>{effBias}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Signal Levels */}
        <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-secondary/50">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Entry</p>
            <p className="text-sm font-bold text-foreground font-mono">
              {locked ? <Lock className="h-3 w-3 mx-auto text-muted-foreground" /> : entry}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-destructive uppercase tracking-wider">Stop Loss</p>
            <p className="text-sm font-bold text-destructive font-mono">
              {locked ? <Lock className="h-3 w-3 mx-auto text-muted-foreground" /> : stopLoss}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-success uppercase tracking-wider">Take Profit</p>
            <p className="text-sm font-bold text-success font-mono">
              {locked ? <Lock className="h-3 w-3 mx-auto text-muted-foreground" /> : takeProfit}
            </p>
          </div>
        </div>

        {/* Strategy & Session */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Strategy:</span>
            <span className="font-semibold text-foreground truncate max-w-[140px]">{effStrategy}</span>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono">{session}</Badge>
        </div>

        {/* Posted / Updated time */}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="h-2.5 w-2.5" />
          <span>{useLive ? "Updated" : "Posted"} {postedLabel}</span>
        </div>

        {/* Confidence */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Confidence</span>
            <span className="font-bold text-foreground">{effConfidence}%</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${effConfidence >= 70 ? "bg-success" : effConfidence >= 50 ? "bg-warning" : "bg-destructive"}`}
              style={{ width: `${effConfidence}%` }}
            />
          </div>
        </div>

        {/* Mini Metrics */}
        {metrics && metrics.length > 0 && (
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground border-t border-border pt-2">
            {metrics.map((m) => (
              <span key={m.label} className="font-mono">
                <span className="text-foreground/60">{m.label}:</span> {m.value}
              </span>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" className="flex-1 text-xs" asChild>
            <Link to={`/chart/${chartSymbol || symbol}`}>
              <BarChart3 className="h-3 w-3 mr-1" /> Chart
            </Link>
          </Button>
          {brokerUrl ? (
            <Button size="sm" className="flex-1 text-xs" asChild>
              <a href={brokerUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 mr-1" /> {brokerName || "Trade"}
              </a>
            </Button>
          ) : (
            <Button size="sm" className="flex-1 text-xs" asChild>
              <Link to="/signals">
                <TrendingUp className="h-3 w-3 mr-1" /> Signals
              </Link>
            </Button>
          )}
        </div>

        {locked && (
          <Button size="sm" variant="gold" className="w-full text-xs" asChild>
            <Link to="/billing">
              <Lock className="h-3 w-3 mr-1" /> Subscribe for Premium Signals
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
