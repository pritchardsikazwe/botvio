import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { DerivContractUpdate } from "@/types/deriv";

export interface RunningTrade {
  id: string;
  contract_id: number;
  loginid: string;
  is_virtual: boolean;
  symbol: string;
  contract_type: string;
  buy_price: number;
  current_profit: number;
  payout: number | null;
  status: "RUNNING" | "CLOSED";
  started_at: string;
  ended_at: string | null;
  sell_price: number | null;
  final_profit: number | null;
  final_status: string | null;
}

export const useRunningTrades = () => {
  const { user } = useAuth();
  const [trades, setTrades] = useState<RunningTrade[]>([]);
  const tradesRef = useRef<RunningTrade[]>([]);

  // Keep ref in sync
  useEffect(() => {
    tradesRef.current = trades;
  }, [trades]);

  // Load running trades from DB on mount
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("running_trades")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "RUNNING");
      if (data) {
        // Merge with in-memory trades so a reload never drops a trade that was
        // just placed, and so open trades survive SPA navigation.
        setTrades((prev) => {
          const rows = data.map(mapRow);
          const byContract = new Map<number, RunningTrade>();
          prev.forEach((t) => byContract.set(t.contract_id, t));
          rows.forEach((r) => {
            const existing = byContract.get(r.contract_id);
            byContract.set(r.contract_id, existing ? { ...r, current_profit: existing.current_profit } : r);
          });
          return Array.from(byContract.values());
        });
      }
    };
    load();

    const onFocus = () => load();
    const id = window.setInterval(load, 30000);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [user?.id]);

  const mapRow = (row: any): RunningTrade => ({
    id: row.id,
    contract_id: Number(row.contract_id),
    loginid: row.loginid,
    is_virtual: row.is_virtual,
    symbol: row.symbol,
    contract_type: row.contract_type,
    buy_price: Number(row.buy_price),
    current_profit: Number(row.current_profit),
    payout: row.payout != null ? Number(row.payout) : null,
    status: row.status,
    started_at: row.started_at,
    ended_at: row.ended_at,
    sell_price: row.sell_price != null ? Number(row.sell_price) : null,
    final_profit: row.final_profit != null ? Number(row.final_profit) : null,
    final_status: row.final_status,
  });

  // Add a new running trade after buy
  const addTrade = useCallback(async (params: {
    contract_id: number;
    loginid: string;
    is_virtual: boolean;
    symbol: string;
    contract_type: string;
    buy_price: number;
    payout: number;
  }) => {
    if (!user) return;

    console.log(`[BUY] ${params.loginid} ${params.symbol} buy_price=${params.buy_price} contract_id=${params.contract_id}`);

    const newTrade: RunningTrade = {
      id: crypto.randomUUID(),
      contract_id: params.contract_id,
      loginid: params.loginid,
      is_virtual: params.is_virtual,
      symbol: params.symbol,
      contract_type: params.contract_type,
      buy_price: params.buy_price,
      current_profit: 0,
      payout: params.payout,
      status: "RUNNING",
      started_at: new Date().toISOString(),
      ended_at: null,
      sell_price: null,
      final_profit: null,
      final_status: null,
    };

    setTrades(prev => [...prev, newTrade]);

    // Persist to DB
    await supabase.from("running_trades").upsert({
      id: newTrade.id,
      user_id: user.id,
      contract_id: params.contract_id,
      loginid: params.loginid,
      is_virtual: params.is_virtual,
      symbol: params.symbol,
      contract_type: params.contract_type,
      buy_price: params.buy_price,
      current_profit: 0,
      payout: params.payout,
      status: "RUNNING",
    } as any);
  }, [user]);

  // Update running trade profit from contract stream
  const handleContractUpdate = useCallback((update: DerivContractUpdate) => {
    const contractId = update.contract_id;
    const isSettled = update.is_sold || update.is_expired || ["won", "lost", "sold"].includes(update.status);

    if (isSettled) {
      console.log(`[SETTLED] contract_id=${contractId} profit=${update.profit} sell_price=${update.sell_price} status=${update.status}`);

      setTrades(prev => prev.map(t =>
        t.contract_id === contractId
          ? {
              ...t,
              status: "CLOSED" as const,
              current_profit: update.profit,
              sell_price: update.sell_price ?? null,
              final_profit: update.profit,
              final_status: update.status,
              ended_at: new Date().toISOString(),
            }
          : t
      ));

      // Persist settlement
      if (user) {
        supabase.from("running_trades")
          .update({
            status: "CLOSED",
            current_profit: update.profit,
            sell_price: update.sell_price,
            final_profit: update.profit,
            final_status: update.status,
            ended_at: new Date().toISOString(),
          } as any)
          .eq("contract_id", contractId)
          .then(() => {});
      }
    } else {
      // Update current profit for running trade
      setTrades(prev => prev.map(t =>
        t.contract_id === contractId
          ? { ...t, current_profit: update.profit }
          : t
      ));
    }
  }, [user]);

  // Equity = sum of current_profit for all RUNNING trades
  const runningProfit = trades
    .filter(t => t.status === "RUNNING")
    .reduce((sum, t) => sum + t.current_profit, 0);

  const runningTrades = trades.filter(t => t.status === "RUNNING");

  return {
    trades,
    runningTrades,
    runningProfit,
    addTrade,
    handleContractUpdate,
  };
};
