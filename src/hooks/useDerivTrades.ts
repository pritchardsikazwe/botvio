import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DerivTrade {
  id: string;
  token_id: string;
  loginid: string;
  symbol: string;
  contract_id: number;
  contract_type: string | null;
  buy_price: number;
  sell_price: number | null;
  payout: number | null;
  profit: number | null;
  status: string;
  outcome: string | null;
  is_virtual: boolean;
  currency: string;
  started_at: string;
  ended_at: string | null;
}

export const useDerivTrades = () => {
  const { user } = useAuth();
  const [trades, setTrades] = useState<DerivTrade[]>([]);

  /** Insert a new RUNNING trade */
  const addTrade = useCallback(async (params: {
    token_id: string;
    loginid: string;
    symbol: string;
    contract_id: number;
    contract_type?: string;
    buy_price: number;
    payout?: number;
    is_virtual: boolean;
    currency: string;
  }) => {
    if (!user) return;
    const row = {
      user_id: user.id,
      token_id: params.token_id,
      loginid: params.loginid,
      symbol: params.symbol,
      contract_id: params.contract_id,
      contract_type: params.contract_type ?? null,
      buy_price: params.buy_price,
      payout: params.payout ?? null,
      is_virtual: params.is_virtual,
      currency: params.currency,
      status: "RUNNING",
    };

    const { data, error } = await supabase
      .from("deriv_trades" as any)
      .insert(row as any)
      .select()
      .single();

    if (error) {
      console.error("[TRADE] Insert error:", error.message);
      return null;
    }
    console.log(`[BUY] loginid=${params.loginid} symbol=${params.symbol} buy_price=${params.buy_price} contract_id=${params.contract_id}`);
    const trade = data as unknown as DerivTrade;
    setTrades((prev) => [...prev, trade]);
    return trade;
  }, [user?.id]);

  /** Settle a trade */
  const settleTrade = useCallback(async (contract_id: number, update: {
    sell_price: number;
    profit: number;
    payout?: number;
    status: string;
    outcome: string;
  }) => {
    if (!user) return;
    const { error } = await supabase
      .from("deriv_trades" as any)
      .update({
        sell_price: update.sell_price,
        profit: update.profit,
        payout: update.payout ?? null,
        status: "CLOSED",
        outcome: update.outcome,
        ended_at: new Date().toISOString(),
      } as any)
      .eq("user_id", user.id)
      .eq("contract_id", contract_id)
      .eq("status", "RUNNING");

    if (!error) {
      console.log(`[SETTLED] contract_id=${contract_id} profit=${update.profit} status=${update.status} outcome=${update.outcome}`);
      setTrades((prev) => prev.map((t) =>
        t.contract_id === contract_id
          ? { ...t, ...update, status: "CLOSED", ended_at: new Date().toISOString() }
          : t
      ));
    }
  }, [user?.id]);

  /** Get running profit */
  const runningProfit = trades
    .filter((t) => t.status === "RUNNING")
    .reduce((sum, t) => sum + (t.profit ?? 0), 0);

  const runningTrades = trades.filter((t) => t.status === "RUNNING");

  return {
    trades,
    runningTrades,
    runningProfit,
    addTrade,
    settleTrade,
  };
};
