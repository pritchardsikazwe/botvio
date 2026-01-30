import { useLatestSignals } from "@/hooks/useManualSignals";
import { ManualSignalCard } from "./ManualSignalCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Signal, ArrowRight, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

export const HomeSignalsWidget = () => {
  const { data: signals, isLoading } = useLatestSignals(3);

  if (isLoading) {
    return (
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Signal className="h-5 w-5 text-primary" />
            Latest Trading Signals
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="glass-card animate-pulse">
              <CardContent className="p-4">
                <div className="h-32 bg-muted/30 rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show placeholder signals if no real signals exist
  const displaySignals = signals && signals.length > 0 ? signals : [
    {
      id: "demo-1",
      symbol: "XAUUSD",
      direction: "BUY",
      entry_price: 2345.50,
      stop_loss: 2340.00,
      take_profit: 2360.00,
      timeframe: "M15",
      category: "forex",
      broker: ["deriv", "exness"],
      confidence: 85,
      status: "ACTIVE",
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      reason: "Strong support zone rejection with bullish engulfing",
      is_manual: true,
      posted_by: null,
    },
    {
      id: "demo-2",
      symbol: "EURUSD",
      direction: "SELL",
      entry_price: 1.0845,
      stop_loss: 1.0870,
      take_profit: 1.0800,
      timeframe: "H1",
      category: "forex",
      broker: ["deriv", "exness"],
      confidence: 78,
      status: "ACTIVE",
      created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      reason: "Resistance rejection at key level",
      is_manual: true,
      posted_by: null,
    },
    {
      id: "demo-3",
      symbol: "V75",
      direction: "BUY",
      entry_price: 125890.50,
      stop_loss: 125500.00,
      take_profit: 126500.00,
      timeframe: "M5",
      category: "synthetics",
      broker: ["deriv"],
      confidence: 72,
      status: "ACTIVE",
      created_at: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
      reason: "Volatility breakout with momentum",
      is_manual: true,
      posted_by: null,
    },
  ];

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Signal className="h-5 w-5 text-primary" />
          Latest Trading Signals
        </h2>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/signals">
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displaySignals.map((signal) => (
          <Card key={signal.id} className="glass-card hover:border-primary/50 transition-all">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{signal.symbol}</CardTitle>
                  <Badge 
                    variant={signal.direction === "BUY" ? "default" : "destructive"}
                    className={signal.direction === "BUY" ? "bg-success text-success-foreground" : ""}
                  >
                    {signal.direction === "BUY" ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {signal.direction}
                  </Badge>
                </div>
                <Badge variant="outline">{signal.timeframe}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Entry</p>
                  <p className="font-mono font-medium">{signal.entry_price}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">TP</p>
                  <p className="font-mono text-success">{signal.take_profit || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">SL</p>
                  <p className="font-mono text-destructive">{signal.stop_loss || "-"}</p>
                </div>
              </div>
              
              {signal.reason && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {signal.reason}
                </p>
              )}
              
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(signal.created_at), { addSuffix: true })}
                </div>
                {signal.confidence && (
                  <Badge variant="outline" className="text-xs">
                    {signal.confidence}% confidence
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};