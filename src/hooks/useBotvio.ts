import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type {
  TradingAccount,
  Bot,
  BotInstance,
  Provider,
  ProviderAccount,
  CopySubscription,
  ProviderTrade,
  CopiedTrade,
  PricingPlan,
  UserPlanSubscription,
  Notification,
  ExecuteCopyResult,
} from "@/types/botvio";

// Trading Accounts
export function useTradingAccounts() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["trading_accounts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trading_accounts")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as TradingAccount[];
    },
    enabled: !!user,
  });
}

export function useAddTradingAccount() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (account: {
      broker: "deriv" | "binance";
      label: string;
      api_key: string;
      api_secret?: string;
      login_id?: string;
    }) => {
      const { data, error } = await supabase
        .from("trading_accounts")
        .insert({
          user_id: user!.id,
          broker: account.broker,
          label: account.label,
          api_key_encrypted: account.api_key,
          api_secret_encrypted: account.api_secret || null,
          login_id: account.login_id || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trading_accounts"] });
    },
  });
}

export function useDeleteTradingAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (accountId: string) => {
      const { data: account, error: loadError } = await supabase
        .from("trading_accounts")
        .select("id, broker, login_id")
        .eq("id", accountId)
        .single();

      if (loadError) throw loadError;

      if (account?.broker === "deriv" && account.login_id) {
        const { error } = await supabase.rpc("remove_deriv_account" as any, {
          p_loginid: account.login_id,
        });
        if (error) throw error;
        return;
      }

      const { error } = await supabase
        .from("trading_accounts")
        .delete()
        .eq("id", accountId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trading_accounts"] });
    },
  });
}

// Bots Catalog
export function useBots() {
  return useQuery({
    queryKey: ["bots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bots")
        .select("*")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data as Bot[];
    },
  });
}

// Bot Instances
export function useBotInstances() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["bot_instances", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bot_instances")
        .select("*, bot:bots(*), trading_account:trading_accounts(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as BotInstance[];
    },
    enabled: !!user,
  });
}

export function useCreateBotInstance() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (instance: {
      bot_id: string;
      trading_account_id: string;
      name: string;
      markets?: string[];
      config_json?: Record<string, unknown>;
      risk_per_trade_percent?: number;
      max_daily_loss_percent?: number;
      max_open_trades?: number;
      max_stake?: number;
    }) => {
      const { data, error } = await supabase
        .from("bot_instances")
        .insert([{
          user_id: user!.id,
          bot_id: instance.bot_id,
          trading_account_id: instance.trading_account_id,
          name: instance.name,
          markets: instance.markets,
          config_json: instance.config_json as any,
          risk_per_trade_percent: instance.risk_per_trade_percent,
          max_daily_loss_percent: instance.max_daily_loss_percent,
          max_open_trades: instance.max_open_trades,
          max_stake: instance.max_stake,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bot_instances"] });
    },
  });
}

export function useUpdateBotInstance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status?: string }) => {
      const { data, error } = await supabase
        .from("bot_instances")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bot_instances"] });
    },
  });
}

// Providers
export function useProviders() {
  return useQuery({
    queryKey: ["providers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("providers")
        .select("*")
        .eq("status", "approved")
        .order("total_profit", { ascending: false });
      
      if (error) throw error;
      return data as Provider[];
    },
  });
}

export function useMyProvider() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["my_provider", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("providers")
        .select("*, provider_accounts(*, trading_account:trading_accounts(*))")
        .eq("user_id", user!.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as (Provider & { provider_accounts: ProviderAccount[] }) | null;
    },
    enabled: !!user,
  });
}

export function useCreateProvider() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (provider: {
      display_name: string;
      bio?: string;
    }) => {
      const { data, error } = await supabase
        .from("providers")
        .insert({
          user_id: user!.id,
          ...provider,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my_provider"] });
    },
  });
}

export function useAddProviderAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ provider_id, trading_account_id }: {
      provider_id: string;
      trading_account_id: string;
    }) => {
      const { data, error } = await supabase
        .from("provider_accounts")
        .insert({ provider_id, trading_account_id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my_provider"] });
    },
  });
}

// Copy Subscriptions
export function useMyCopySubscriptions() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["my_subscriptions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("copy_subscriptions")
        .select("*, provider:providers(*), subscriber_trading_account:trading_accounts(*)")
        .eq("subscriber_user_id", user!.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as CopySubscription[];
    },
    enabled: !!user,
  });
}

export function useSubscribeToProvider() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (subscription: {
      provider_id: string;
      trading_account_id: string;
      copy_mode?: "fixed" | "multiplier" | "proportional";
      fixed_stake?: number;
      multiplier?: number;
      max_drawdown_percent: number;
      equity_floor_usd?: number | null;
      daily_loss_limit_usd?: number | null;
      baseline_equity_usd?: number | null;
    }) => {
      const { data, error } = await supabase
        .from("copy_subscriptions")
        .insert({
          subscriber_user_id: user!.id,
          subscriber_trading_account_id: subscription.trading_account_id,
          provider_id: subscription.provider_id,
          copy_mode: subscription.copy_mode || "fixed",
          fixed_stake: subscription.fixed_stake || 1,
          multiplier: subscription.multiplier || 1,
          max_drawdown_percent: subscription.max_drawdown_percent,
          equity_floor_usd: subscription.equity_floor_usd ?? null,
          daily_loss_limit_usd: subscription.daily_loss_limit_usd ?? null,
          baseline_equity_usd: subscription.baseline_equity_usd ?? null,
          status: "paused",
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my_subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["providers"] });
    },
  });
}

export function useUnsubscribeFromProvider() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { error } = await supabase
        .from("copy_subscriptions")
        .update({ status: "stopped" })
        .eq("id", subscriptionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my_subscriptions"] });
    },
  });
}

// Provider Trades (for provider dashboard)
export function useMyProviderTrades() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["my_provider_trades", user?.id],
    queryFn: async () => {
      // First get provider
      const { data: provider } = await supabase
        .from("providers")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();
      
      if (!provider) return [];
      
      const { data, error } = await supabase
        .from("provider_trades")
        .select("*")
        .eq("provider_id", provider.id)
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as ProviderTrade[];
    },
    enabled: !!user,
  });
}

// Execute and Copy trade
export function useExecuteAndCopy() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (trade: {
      provider_id: string;
      symbol: string;
      direction: "BUY" | "SELL";
      contract_type?: string;
      stake: number;
      duration?: number;
      duration_unit?: string;
      barrier?: number;
    }): Promise<ExecuteCopyResult> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/provider-execute-copy`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(trade),
        }
      );
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to execute trade");
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my_provider_trades"] });
      queryClient.invalidateQueries({ queryKey: ["my_provider"] });
    },
  });
}

// Copied trades for subscriber
export function useMyCopiedTrades() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["my_copied_trades", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("copied_trades")
        .select("*, provider_trade:provider_trades(*)")
        .eq("subscriber_user_id", user!.id)
        .order("opened_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as CopiedTrade[];
    },
    enabled: !!user,
  });
}

// Pricing Plans
export function usePricingPlans() {
  return useQuery({
    queryKey: ["pricing_plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pricing_plans")
        .select("*")
        .eq("is_active", true)
        .order("price_usd");
      
      if (error) throw error;
      return data as PricingPlan[];
    },
  });
}

export function useMySubscription() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["my_plan_subscription", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_plan_subscriptions")
        .select("*, pricing_plan:pricing_plans(*)")
        .eq("user_id", user!.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as UserPlanSubscription | null;
    },
    enabled: !!user,
  });
}

// Notifications
export function useNotifications() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

// Provider subscriber count (for provider dashboard)
export function useMySubscriberCount() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["my_subscriber_count", user?.id],
    queryFn: async () => {
      const { data: provider } = await supabase
        .from("providers")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();
      
      if (!provider) return 0;
      
      const { count, error } = await supabase
        .from("copy_subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("provider_id", provider.id)
        .eq("status", "active");
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });
}
