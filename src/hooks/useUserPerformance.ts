import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Trade {
  id: string;
  signal_id: string | null;
  symbol: string;
  direction: "BUY" | "SELL";
  entry_price: number;
  exit_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  lot_size: number | null;
  profit_loss: number | null;
  status: "OPEN" | "WIN" | "LOSS" | "BREAKEVEN";
  opened_at: string;
  closed_at: string | null;
}

interface PerformanceStats {
  totalTrades: number;
  winRate: number;
  totalProfit: number;
  wins: number;
  losses: number;
  breakeven: number;
  openTrades: number;
}

export const useUserPerformance = () => {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState<PerformanceStats>({
    totalTrades: 0,
    winRate: 0,
    totalProfit: 0,
    wins: 0,
    losses: 0,
    breakeven: 0,
    openTrades: 0,
  });
  const [loading, setLoading] = useState(true);

  const calculateStats = (tradeList: Trade[]): PerformanceStats => {
    const closedTrades = tradeList.filter(t => t.status !== "OPEN");
    const wins = tradeList.filter(t => t.status === "WIN").length;
    const losses = tradeList.filter(t => t.status === "LOSS").length;
    const breakeven = tradeList.filter(t => t.status === "BREAKEVEN").length;
    const openTrades = tradeList.filter(t => t.status === "OPEN").length;
    
    const totalProfit = tradeList.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
    const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;

    return {
      totalTrades: tradeList.length,
      winRate: Math.round(winRate),
      totalProfit,
      wins,
      losses,
      breakeven,
      openTrades,
    };
  };

  const fetchTrades = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_trades")
        .select("*")
        .eq("user_id", user.id)
        .order("opened_at", { ascending: false });

      if (error) throw error;

      const tradeData = data || [];
      setTrades(tradeData as Trade[]);
      setStats(calculateStats(tradeData as Trade[]));
    } catch (err) {
      console.error("Error fetching trades:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addTrade = async (trade: Omit<Trade, "id" | "opened_at" | "closed_at">) => {
    if (!user) return;

    const { error } = await supabase
      .from("user_trades")
      .insert({
        user_id: user.id,
        ...trade,
      });

    if (!error) {
      await fetchTrades();
    }
  };

  const updateTrade = async (
    tradeId: string,
    updates: Partial<Pick<Trade, "exit_price" | "profit_loss" | "status" | "closed_at">>
  ) => {
    if (!user) return;

    const { error } = await supabase
      .from("user_trades")
      .update(updates)
      .eq("id", tradeId)
      .eq("user_id", user.id);

    if (!error) {
      await fetchTrades();
    }
  };

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  return {
    trades,
    stats,
    loading,
    addTrade,
    updateTrade,
    refetch: fetchTrades,
  };
};
