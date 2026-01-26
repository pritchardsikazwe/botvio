import { useAuth } from "@/contexts/AuthContext";
import { useUserPerformance } from "@/hooks/useUserPerformance";
import { TrendingUp, TrendingDown, Target, BarChart3 } from "lucide-react";

export const PerformancePanel = () => {
  const { user } = useAuth();
  const { stats, loading } = useUserPerformance();

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

  return (
    <div className="glass-card p-6">
      <span className="data-label mb-4 block">Your Performance</span>
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
