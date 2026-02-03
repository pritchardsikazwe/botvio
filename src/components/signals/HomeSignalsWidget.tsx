import { useLatestSignals } from "@/hooks/useManualSignals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Signal, ArrowRight, TrendingUp, TrendingDown, Clock, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

// Helper to check if signal is expired (5 min after creation)
function isSignalExpired(signal: { created_at: string; expires_at?: string | null }): boolean {
  const now = new Date();
  if (signal.expires_at) {
    return new Date(signal.expires_at) < now;
  }
  const createdAt = new Date(signal.created_at);
  const fiveMinutesLater = new Date(createdAt.getTime() + 5 * 60 * 1000);
  return fiveMinutesLater < now;
}

// Get time remaining for active signal
function getTimeRemaining(signal: { created_at: string; expires_at?: string | null }): string {
  const now = new Date();
  let expiresAt: Date;
  
  if (signal.expires_at) {
    expiresAt = new Date(signal.expires_at);
  } else {
    const createdAt = new Date(signal.created_at);
    expiresAt = new Date(createdAt.getTime() + 5 * 60 * 1000);
  }
  
  const diffMs = expiresAt.getTime() - now.getTime();
  if (diffMs <= 0) return "Expired";
  
  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

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

  // Only show signals that are actually active (not expired)
  const activeSignals = (signals || []).filter(s => !isSignalExpired(s));

  // If no active signals, show a message instead of placeholder demos
  if (activeSignals.length === 0) {
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
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-1">No Active Signals</h3>
            <p className="text-sm text-muted-foreground">
              Signals expire 5 minutes after posting. Check back soon for new opportunities.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
        {activeSignals.map((signal) => (
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
                <div className="flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3 text-warning" />
                  <span className="text-warning font-medium">
                    Expires: {getTimeRemaining(signal)}
                  </span>
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
