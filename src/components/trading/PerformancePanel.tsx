import { useAuth } from "@/contexts/AuthContext";
import { useUserPerformance } from "@/hooks/useUserPerformance";
import { TrendingUp, TrendingDown, Target, BarChart3, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export const PerformancePanel = () => {
  const { user } = useAuth();
  const { stats, loading, refetch } = useUserPerformance();

  if (!user) {
    return (
      <div className="glass-card p-6">
        <span className="data-label mb-4 block">Performance</span>
        <div className="text-center py-4 text-muted-foreground">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Sign in to track your performance</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-4 bg-secondary rounded w-1/3 mb-4" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-secondary/50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Show placeholder if no trades
  if (stats.totalTrades === 0) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="data-label">Your Performance</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={refetch}>
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
        <div className="text-center py-6 text-muted-foreground">
          <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium mb-1">No trades recorded yet</p>
          <p className="text-xs">Start trading to see your performance stats</p>
        </div>
        {/* Placeholder stats */}
        <div className="grid grid-cols-2 gap-3 mt-4 opacity-50">
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <p className="text-lg font-bold">0%</p>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <p className="text-lg font-bold">0</p>
            <p className="text-xs text-muted-foreground">Total Trades</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="data-label">Your Performance</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={refetch}>
          <RefreshCw className="w-3 h-3" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-success/10 rounded-xl">
          <p className="text-2xl font-bold text-success">{stats.winRate}%</p>
          <p className="text-xs text-muted-foreground">Win Rate</p>
        </div>
        <div className="text-center p-4 bg-primary/10 rounded-xl">
          <p className="text-2xl font-bold text-primary">{stats.totalTrades}</p>
          <p className="text-xs text-muted-foreground">Total Trades</p>
        </div>
        <div className="text-center p-4 bg-secondary rounded-xl">
          <div className="flex items-center justify-center gap-1">
            <TrendingUp className="w-4 h-4 text-success" />
            <p className="text-lg font-bold">{stats.wins}</p>
          </div>
          <p className="text-xs text-muted-foreground">Wins</p>
        </div>
        <div className="text-center p-4 bg-secondary rounded-xl">
          <div className="flex items-center justify-center gap-1">
            <TrendingDown className="w-4 h-4 text-destructive" />
            <p className="text-lg font-bold">{stats.losses}</p>
          </div>
          <p className="text-xs text-muted-foreground">Losses</p>
        </div>
        <div className="col-span-2 text-center p-4 bg-secondary rounded-xl">
          <p className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
            {stats.totalProfit >= 0 ? '+' : ''}{stats.totalProfit.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">Total P/L</p>
        </div>
      </div>
    </div>
  );
};
