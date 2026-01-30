import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ProviderPerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  netPnL: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  averageTradeResult: number;
  bestTrade: number;
  worstTrade: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  dailyReturns: { date: string; pnl: number; cumulativePnL: number }[];
  weeklyStats: { week: string; trades: number; pnl: number; winRate: number }[];
}

// Calculate Sharpe Ratio from daily returns
function calculateSharpeRatio(dailyReturns: number[]): number {
  if (dailyReturns.length < 2) return 0;
  
  const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const squaredDiffs = dailyReturns.map(r => Math.pow(r - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) return 0;
  
  // Annualized Sharpe (assuming ~252 trading days)
  const annualizedReturn = mean * 252;
  const annualizedStdDev = stdDev * Math.sqrt(252);
  const riskFreeRate = 0.02; // 2% risk-free rate
  
  return (annualizedReturn - riskFreeRate) / annualizedStdDev;
}

// Calculate Max Drawdown from equity curve
function calculateMaxDrawdown(cumulativePnL: number[]): { maxDrawdown: number; maxDrawdownPercent: number } {
  if (cumulativePnL.length === 0) return { maxDrawdown: 0, maxDrawdownPercent: 0 };
  
  let peak = cumulativePnL[0];
  let maxDrawdown = 0;
  let maxDrawdownPercent = 0;
  
  for (const value of cumulativePnL) {
    if (value > peak) {
      peak = value;
    }
    
    const drawdown = peak - value;
    const drawdownPercent = peak > 0 ? (drawdown / peak) * 100 : 0;
    
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownPercent = drawdownPercent;
    }
  }
  
  return { maxDrawdown, maxDrawdownPercent };
}

// Calculate consecutive wins/losses
function calculateStreaks(trades: { profit_loss: number | null }[]): { wins: number; losses: number } {
  let maxWins = 0;
  let maxLosses = 0;
  let currentWins = 0;
  let currentLosses = 0;
  
  for (const trade of trades) {
    const pnl = trade.profit_loss || 0;
    
    if (pnl > 0) {
      currentWins++;
      currentLosses = 0;
      maxWins = Math.max(maxWins, currentWins);
    } else if (pnl < 0) {
      currentLosses++;
      currentWins = 0;
      maxLosses = Math.max(maxLosses, currentLosses);
    }
  }
  
  return { wins: maxWins, losses: maxLosses };
}

export function useProviderPerformance(providerId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["provider_performance", providerId || user?.id],
    queryFn: async (): Promise<ProviderPerformanceMetrics> => {
      // Get provider ID if not provided
      let pid = providerId;
      if (!pid && user) {
        const { data: provider } = await supabase
          .from("providers")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        pid = provider?.id;
      }
      
      if (!pid) {
        throw new Error("Provider not found");
      }
      
      // Fetch all trades for this provider
      const { data: trades, error } = await supabase
        .from("provider_trades")
        .select("*")
        .eq("provider_id", pid)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      
      const allTrades = trades || [];
      
      // Basic stats
      const closedTrades = allTrades.filter(t => t.status === "closed" && t.profit_loss !== null);
      const winningTrades = closedTrades.filter(t => (t.profit_loss || 0) > 0);
      const losingTrades = closedTrades.filter(t => (t.profit_loss || 0) < 0);
      
      const totalProfit = winningTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
      const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0));
      const netPnL = totalProfit - totalLoss;
      
      const winRate = closedTrades.length > 0 
        ? (winningTrades.length / closedTrades.length) * 100 
        : 0;
      
      const averageWin = winningTrades.length > 0 
        ? totalProfit / winningTrades.length 
        : 0;
      
      const averageLoss = losingTrades.length > 0 
        ? totalLoss / losingTrades.length 
        : 0;
      
      const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
      
      const averageTradeResult = closedTrades.length > 0 
        ? netPnL / closedTrades.length 
        : 0;
      
      // Best and worst trades
      const pnls = closedTrades.map(t => t.profit_loss || 0);
      const bestTrade = pnls.length > 0 ? Math.max(...pnls) : 0;
      const worstTrade = pnls.length > 0 ? Math.min(...pnls) : 0;
      
      // Consecutive streaks
      const streaks = calculateStreaks(closedTrades);
      
      // Daily returns for Sharpe and drawdown
      const dailyPnLMap = new Map<string, number>();
      for (const trade of closedTrades) {
        const date = trade.closed_at?.split("T")[0] || trade.created_at.split("T")[0];
        dailyPnLMap.set(date, (dailyPnLMap.get(date) || 0) + (trade.profit_loss || 0));
      }
      
      const sortedDates = Array.from(dailyPnLMap.keys()).sort();
      let cumulative = 0;
      const dailyReturns = sortedDates.map(date => {
        const pnl = dailyPnLMap.get(date) || 0;
        cumulative += pnl;
        return { date, pnl, cumulativePnL: cumulative };
      });
      
      // Calculate drawdown from cumulative P&L
      const cumulativePnLs = dailyReturns.map(d => d.cumulativePnL);
      const { maxDrawdown, maxDrawdownPercent } = calculateMaxDrawdown(cumulativePnLs);
      
      // Calculate Sharpe ratio
      const dailyReturnValues = dailyReturns.map(d => d.pnl);
      const sharpeRatio = calculateSharpeRatio(dailyReturnValues);
      
      // Weekly stats
      const weeklyMap = new Map<string, { trades: number; pnl: number; wins: number }>();
      for (const trade of closedTrades) {
        const date = new Date(trade.closed_at || trade.created_at);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split("T")[0];
        
        const current = weeklyMap.get(weekKey) || { trades: 0, pnl: 0, wins: 0 };
        current.trades++;
        current.pnl += trade.profit_loss || 0;
        if ((trade.profit_loss || 0) > 0) current.wins++;
        weeklyMap.set(weekKey, current);
      }
      
      const weeklyStats = Array.from(weeklyMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-8) // Last 8 weeks
        .map(([week, stats]) => ({
          week,
          trades: stats.trades,
          pnl: stats.pnl,
          winRate: stats.trades > 0 ? (stats.wins / stats.trades) * 100 : 0,
        }));
      
      return {
        totalTrades: allTrades.length,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        winRate,
        totalProfit,
        totalLoss,
        netPnL,
        averageWin,
        averageLoss,
        profitFactor,
        maxDrawdown,
        maxDrawdownPercent,
        sharpeRatio,
        averageTradeResult,
        bestTrade,
        worstTrade,
        consecutiveWins: streaks.wins,
        consecutiveLosses: streaks.losses,
        dailyReturns: dailyReturns.slice(-30), // Last 30 days
        weeklyStats,
      };
    },
    enabled: !!providerId || !!user,
  });
}

// Hook to get leaderboard of providers by performance
export function useProviderLeaderboard() {
  return useQuery({
    queryKey: ["provider_leaderboard"],
    queryFn: async () => {
      const { data: providers, error } = await supabase
        .from("providers")
        .select("*")
        .eq("status", "approved")
        .order("total_profit", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return providers || [];
    },
  });
}
