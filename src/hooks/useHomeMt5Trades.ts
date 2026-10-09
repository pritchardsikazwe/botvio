import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { tradecopy } from "@/hooks/useTradeCopy";
import { closedTradeResult, tradeFeedForSymbol, type TradeFeed } from "@/lib/liveTrading";

interface Order {
  ticket: string; symbol: string; side: string; profit: number | null;
  openTime: string | null; closeTime: string | null;
}
interface ExecutionStatus {
  connected: boolean; checkedAt?: string; openOrders: Order[]; recentHistory: Order[];
}
export interface HomeMt5Trade {
  id: string; market: string; symbol: string; direction: string; status: string;
  pnl: number | null; openedAt: string; source: TradeFeed; environment: string;
}

/** Account-authorized broker snapshots, never signal or sent-order approximations. */
export function useHomeMt5Trades(tab: TradeFeed) {
  const { user, isAdmin, isSuperAdmin, rolesLoading } = useAuth();
  return useQuery({
    queryKey: ["home-mt5-trades", user?.id, isAdmin, isSuperAdmin, tab],
    enabled: !!user && !rolesLoading,
    queryFn: async () => {
      if (!user) return { trades: [], unavailable: 0, simulated: false, accounts: 0 };
      let query = supabase.from("trading_accounts")
        .select("id,broker,server,account_role,environment")
        .not("tradecopy_user_id", "is", null)
        .in("account_role", tab === "copy" ? ["slave"] : ["master"]);
      if (!isAdmin && !isSuperAdmin) query = query.eq("user_id", user.id);
      const { data, error } = await query;
      if (error) throw new Error("Unable to load your MT5 accounts. Please try again.");
      const accounts = (data ?? []).filter((account) => {
        const broker = `${account.broker ?? ""} ${account.server ?? ""}`.toLowerCase();
        return tab === "copy" || (tab === "deriv" ? broker.includes("deriv") : broker.includes("weltrade"));
      });
      const snapshots = await Promise.allSettled(accounts.map(async (account) => {
        const snapshot = await tradecopy<ExecutionStatus>("execution_status", { account_id: account.id });
        const trades: HomeMt5Trade[] = [];
        if (snapshot.mode !== "live" || !snapshot.connected) return { trades, simulated: snapshot.mode === "mock", unavailable: !snapshot.connected };
        const add = (order: Order, running: boolean) => {
          const source = tab === "copy" ? "copy" : tradeFeedForSymbol(order.symbol, account.broker ?? "");
          if (source !== tab) return;
          trades.push({
            id: `mt5:${account.id}:${order.ticket}`, market: order.symbol, symbol: order.symbol,
            direction: order.side, status: running ? "Running" : closedTradeResult(order.profit),
            pnl: order.profit, openedAt: order.closeTime ?? order.openTime ?? "",
            source, environment: account.environment ?? "Unknown",
          });
        };
        snapshot.openOrders.forEach((order) => add(order, true));
        const openTickets = new Set(snapshot.openOrders.map((order) => order.ticket));
        snapshot.recentHistory.filter((order) => !!order.closeTime && !openTickets.has(order.ticket)).forEach((order) => add(order, false));
        return { trades, simulated: false, unavailable: false };
      }));
      return snapshots.reduce((result, snapshot) => {
        if (snapshot.status === "rejected") result.unavailable += 1;
        else {
          result.trades.push(...snapshot.value.trades);
          result.simulated ||= snapshot.value.simulated;
          if (snapshot.value.unavailable) result.unavailable += 1;
        }
        return result;
      }, { trades: [] as HomeMt5Trade[], unavailable: 0, simulated: false, accounts: accounts.length });
    },
    refetchInterval: 30_000,
    staleTime: 20_000,
    retry: 1,
  });
}