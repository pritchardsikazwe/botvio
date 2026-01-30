import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Activity,
  RefreshCw,
  Wifi,
  WifiOff,
  ArrowUp,
  ArrowDown,
  BarChart3,
  Zap
} from "lucide-react";
import { useMarketData, MarketIndicators } from "@/hooks/useMarketData";
import { cn } from "@/lib/utils";

const MARKET_CATEGORIES = {
  volatility: {
    label: "Volatility",
    symbols: ["R_10", "R_25", "R_50", "R_75", "R_100"],
  },
  boomCrash: {
    label: "Boom/Crash",
    symbols: ["BOOM300", "BOOM500", "BOOM1000", "CRASH300", "CRASH500", "CRASH1000"],
  },
  forex: {
    label: "Forex",
    symbols: ["frxEURUSD", "frxGBPUSD", "frxUSDJPY", "frxAUDUSD"],
  },
  metals: {
    label: "Metals",
    symbols: ["frxXAUUSD"],
  },
};

function TrendIcon({ trend }: { trend: "bullish" | "bearish" | "sideways" }) {
  if (trend === "bullish") return <TrendingUp className="h-4 w-4 text-emerald-500" />;
  if (trend === "bearish") return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function RSIGauge({ value }: { value: number }) {
  const getColor = () => {
    if (value < 30) return "bg-emerald-500";
    if (value > 70) return "bg-red-500";
    if (value < 40) return "bg-emerald-400";
    if (value > 60) return "bg-amber-400";
    return "bg-muted-foreground";
  };

  const getLabel = () => {
    if (value < 30) return "Oversold";
    if (value > 70) return "Overbought";
    return "Neutral";
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">RSI</span>
        <span className={cn(
          "font-mono font-medium",
          value < 30 && "text-emerald-500",
          value > 70 && "text-red-500"
        )}>
          {value.toFixed(1)}
        </span>
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn("h-full transition-all duration-300", getColor())}
          style={{ width: `${value}%` }}
        />
        {/* Overbought/Oversold markers */}
        <div className="absolute top-0 left-[30%] w-px h-full bg-emerald-500/50" />
        <div className="absolute top-0 left-[70%] w-px h-full bg-red-500/50" />
      </div>
      <p className="text-[10px] text-muted-foreground text-center">{getLabel()}</p>
    </div>
  );
}

function EMAIndicator({ ema20, ema50, price }: { ema20: number; ema50: number; price: number }) {
  const priceVsEma20 = ((price - ema20) / ema20) * 100;
  const emaSpread = ((ema20 - ema50) / ema50) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">EMA 20</span>
        <span className="font-mono">{ema20.toFixed(5)}</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">EMA 50</span>
        <span className="font-mono">{ema50.toFixed(5)}</span>
      </div>
      <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
        <span className="text-muted-foreground">Spread</span>
        <span className={cn(
          "font-mono font-medium",
          emaSpread > 0 ? "text-emerald-500" : emaSpread < 0 ? "text-red-500" : ""
        )}>
          {emaSpread > 0 ? "+" : ""}{emaSpread.toFixed(3)}%
        </span>
      </div>
    </div>
  );
}

function SymbolCard({ data }: { data: MarketIndicators }) {
  const isUp = data.priceChange >= 0;
  const displaySymbol = data.symbol.replace("frx", "").replace("cry", "");

  return (
    <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendIcon trend={data.trend} />
            <span className="font-semibold">{displaySymbol}</span>
          </div>
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs",
              data.trend === "bullish" && "border-emerald-500/50 text-emerald-500",
              data.trend === "bearish" && "border-red-500/50 text-red-500"
            )}
          >
            {data.trend}
          </Badge>
        </div>

        {/* Price */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono">
              {data.currentPrice.toFixed(data.symbol.includes("frx") ? 5 : 2)}
            </span>
            <span className={cn(
              "flex items-center text-sm font-medium",
              isUp ? "text-emerald-500" : "text-red-500"
            )}>
              {isUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {Math.abs(data.priceChangePercent).toFixed(4)}%
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>H: {data.high24h.toFixed(data.symbol.includes("frx") ? 5 : 2)}</span>
            <span>L: {data.low24h.toFixed(data.symbol.includes("frx") ? 5 : 2)}</span>
          </div>
        </div>

        {/* RSI Gauge */}
        <RSIGauge value={data.rsi14} />

        {/* EMA */}
        <EMAIndicator ema20={data.ema20} ema50={data.ema50} price={data.currentPrice} />

        {/* Volatility */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-border/50">
          <span className="text-muted-foreground flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Volatility
          </span>
          <span className="font-mono">{data.volatility.toFixed(4)}%</span>
        </div>

        {/* Tick Count */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Ticks analyzed</span>
          <span className="font-mono">{data.tickCount}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingCard({ symbol }: { symbol: string }) {
  const displaySymbol = symbol.replace("frx", "").replace("cry", "");
  
  return (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="p-4 space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground animate-pulse" />
            <span className="font-semibold">{displaySymbol}</span>
          </div>
          <Badge variant="outline" className="text-xs">Loading...</Badge>
        </div>
        <div className="h-8 bg-muted/50 rounded" />
        <div className="h-6 bg-muted/30 rounded" />
        <div className="h-12 bg-muted/20 rounded" />
      </CardContent>
    </Card>
  );
}

export function MarketDataPanel() {
  const [category, setCategory] = useState<keyof typeof MARKET_CATEGORIES>("volatility");
  
  const currentSymbols = MARKET_CATEGORIES[category].symbols;
  const { data, connected, error, refresh } = useMarketData(currentSymbols);

  return (
    <Card className="bg-background/95 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Live Market Data
          </CardTitle>
          <div className="flex items-center gap-2">
            {connected ? (
              <Badge variant="outline" className="gap-1 text-emerald-500 border-emerald-500/50">
                <Wifi className="h-3 w-3" />
                Live
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-muted-foreground">
                <WifiOff className="h-3 w-3" />
                Offline
              </Badge>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={refresh}
              className="h-8 w-8"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {error && (
          <p className="text-xs text-destructive mt-1">{error}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs value={category} onValueChange={(v) => setCategory(v as keyof typeof MARKET_CATEGORIES)}>
          <TabsList className="grid grid-cols-4 w-full">
            {Object.entries(MARKET_CATEGORIES).map(([key, { label }]) => (
              <TabsTrigger key={key} value={key} className="text-xs">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(MARKET_CATEGORIES).map(([key, { symbols }]) => (
            <TabsContent key={key} value={key} className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {symbols.map((symbol) => {
                  const symbolData = data[symbol];
                  return symbolData ? (
                    <SymbolCard key={symbol} data={symbolData} />
                  ) : (
                    <LoadingCard key={symbol} symbol={symbol} />
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground pt-4 border-t border-border/50">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-emerald-500 rounded" />
            <span>RSI &lt; 30 (Oversold)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded" />
            <span>RSI &gt; 70 (Overbought)</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            <span>Bullish</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingDown className="h-3 w-3 text-red-500" />
            <span>Bearish</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
