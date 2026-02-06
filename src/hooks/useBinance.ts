import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useExchangeAccount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["exchange_account", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exchange_accounts")
        .select("*")
        .eq("exchange", "binance")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useSaveExchangeKeys() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { label: string; api_key: string; api_secret: string }) => {
      const { data, error } = await supabase.functions.invoke("binance-save-keys", {
        body: payload,
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Save failed");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exchange_account"] });
    },
  });
}

export function useTestExchangeConnection() {
  return useMutation({
    mutationFn: async (exchange_account_id: string) => {
      const { data, error } = await supabase.functions.invoke("binance-test-connection", {
        body: { exchange_account_id },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useExchangeStrategies() {
  return useQuery({
    queryKey: ["exchange_strategies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exchange_strategies")
        .select("*")
        .eq("exchange", "binance")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useExchangeBotInstances() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["exchange_bot_instances", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exchange_bot_instances")
        .select("*, exchange_strategies(name, key, market_type)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useCreateExchangeBot() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: {
      exchange_account_id: string;
      strategy_id: string;
      symbol: string;
      risk_profile: string;
      config_json: Record<string, any>;
    }) => {
      const { data, error } = await supabase
        .from("exchange_bot_instances")
        .insert({
          user_id: user!.id,
          exchange_account_id: payload.exchange_account_id,
          strategy_id: payload.strategy_id,
          market_type: "spot",
          symbol: payload.symbol.toUpperCase(),
          risk_profile: payload.risk_profile,
          config_json: payload.config_json,
          status: "paused",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exchange_bot_instances"] });
    },
  });
}

export function useUpdateBotStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("exchange_bot_instances")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exchange_bot_instances"] });
    },
  });
}

export function useExchangeBotRuns(botInstanceId: string) {
  return useQuery({
    queryKey: ["exchange_bot_runs", botInstanceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exchange_bot_runs")
        .select("*")
        .eq("bot_instance_id", botInstanceId)
        .order("ran_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!botInstanceId,
  });
}

export function useExchangeOrders(botInstanceId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["exchange_orders", user?.id, botInstanceId],
    queryFn: async () => {
      let query = supabase
        .from("exchange_orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (botInstanceId) {
        query = query.eq("bot_instance_id", botInstanceId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}
