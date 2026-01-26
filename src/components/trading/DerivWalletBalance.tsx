import { useDeriv } from "@/contexts/DerivContext";
import { Wallet, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const DerivWalletBalance = () => {
  const { authorized, balance, lastTick, loading } = useDeriv();

  if (!authorized || !balance) {
    return null;
  }

  return (
    <div className="glass-card p-4 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-success" />
          </div>
          <div>
            <h3 className="font-semibold">Deriv Wallet</h3>
            <p className="text-xs text-muted-foreground">{balance.loginid}</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
          Connected
        </Badge>
      </div>

      <div className="space-y-3">
        {/* Main Balance */}
        <div className="p-4 bg-gradient-to-r from-success/10 to-primary/10 rounded-xl border border-success/20">
          <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">
              {balance.currency === "USD" ? "$" : ""}{balance.balance.toFixed(2)}
            </span>
            <span className="text-lg text-muted-foreground">{balance.currency}</span>
          </div>
          {balance.fullname && (
            <p className="text-xs text-muted-foreground mt-2">{balance.fullname}</p>
          )}
        </div>

        {/* Live Price Ticker */}
        {lastTick && (
          <div className="p-3 bg-secondary/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''} text-primary`} />
                <span className="text-xs text-muted-foreground">{lastTick.symbol}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold">{lastTick.quote.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-secondary/30 rounded-lg text-center">
            <TrendingUp className="w-4 h-4 text-success mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Ready to Trade</p>
          </div>
          <div className="p-3 bg-secondary/30 rounded-lg text-center">
            <TrendingDown className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Live Market</p>
          </div>
        </div>
      </div>
    </div>
  );
};
