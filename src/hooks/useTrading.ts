import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface TradeIntent {
  id: string;
  user_id: string;
  strategy_id: string | null;
  connection_id: string | null;
  intent: any;
  idempotency_key: string;
  status: string;
  error: string | null;
  broker_ref: string | null;
  created_at: string;
}

export interface Execution {
  id: string;
  user_id: string;
  trade_intent_id: string | null;
  broker_ref: string | null;
  fill_price: number | null;
  stake_or_lot: number;
  pnl: number | null;
  status: string | null;
  raw: any;
  created_at: string;
}

export const useTradeIntents = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["trade-intents", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("trade_intents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as TradeIntent[];
    },
    enabled: !!user,
  });
};

export const useExecutions = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["executions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("executions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Execution[];
    },
    enabled: !!user,
  });
};

export const useActiveSymbols = () => {
  return useQuery({
    queryKey: ["deriv-active-symbols"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("deriv-active-symbols", {
        body: {}
      });
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useContractsForSymbol = (symbol: string | null) => {
  return useQuery({
    queryKey: ["deriv-contracts", symbol],
    queryFn: async () => {
      if (!symbol) return null;
      const { data, error } = await supabase.functions.invoke("deriv-contracts-for-symbol", {
        body: { symbol }
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    enabled: !!symbol,
    staleTime: 60 * 1000, // 1 minute
  });
};

export const useExecuteTrade = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: {
      connection_id: string;
      strategy_id?: string;
      contract_family: 'MULTIPLIERS' | 'DIGITS' | 'RISEFALL';
      payload: any;
    }) => {
      const idempotency_key = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const { data, error } = await supabase.functions.invoke("deriv-trade-execute", {
        body: {
          ...params,
          idempotency_key
        }
      });
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trade-intents"] });
      queryClient.invalidateQueries({ queryKey: ["executions"] });
      toast.success("Trade executed successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Trade execution failed");
    }
  });
};

// Real-time subscription for trade updates
export const useTradeUpdates = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel(`trade-updates-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trade_intents',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["trade-intents"] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'executions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["executions"] });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
};
