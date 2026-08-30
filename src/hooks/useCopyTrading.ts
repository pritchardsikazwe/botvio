import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * BotvioCopy — presentation/product layer around the existing copy-trading
 * engine. No trading, signal or execution logic lives here: strategies are
 * metadata that describe how a provider presents their copy offer, and
 * subscriptions continue to use the existing copy_subscriptions records.
 */

export type CopyPlatform = "deriv" | "mt5" | "binance";

export interface CopyStrategy {
  id: string;
  provider_id: string;
  user_id: string;
  name: string;
  description: string | null;
  platform: string;
  broker_label: string | null;
  trading_style: string | null;
  markets: string[];
  risk_model: string;
  max_risk_per_trade: number;
  max_daily_loss_percent: number;
  max_drawdown_percent: number;
  stop_on_drawdown: boolean;
  stop_on_daily_loss: boolean;
  respect_provider_sl: boolean;
  emergency_stop: boolean;
  visibility: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const PLATFORM_LABEL: Record<string, string> = {
  deriv: "Deriv",
  mt5: "MT5",
  binance: "Binance",
};

export const MT5_MARKETS = [
  "XAUUSD",
  "XAGUSD",
  "EURUSD",
  "GBPUSD",
  "USDJPY",
  "AUDUSD",
  "NAS100",
  "US30",
  "GER40",
  "BTCUSD",
];

export const DERIV_MARKETS = [
  "Boom 500",
  "Boom 1000",
  "Crash 500",
  "Crash 1000",
  "Volatility 75",
  "Volatility 100 (1s)",
  "Rise/Fall",
  "Digits",
  "Multipliers",
];

export const BINANCE_MARKETS = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT"];

export function marketsForPlatform(platform: CopyPlatform) {
  if (platform === "mt5") return MT5_MARKETS;
  if (platform === "binance") return BINANCE_MARKETS;
  return DERIV_MARKETS;
}

/** Risk presets used by the simplified follower setup screen. */
export const RISK_PRESETS = {
  conservative: { riskPerTrade: 0.5, dailyLoss: 3, drawdown: 8 },
  balanced: { riskPerTrade: 1, dailyLoss: 5, drawdown: 12 },
  aggressive: { riskPerTrade: 2, dailyLoss: 10, drawdown: 20 },
} as const;

export type RiskPresetKey = keyof typeof RISK_PRESETS;

/** Public marketplace strategies (RLS keeps private ones hidden). */
export function useCopyStrategies() {
  return useQuery({
    queryKey: ["copy_strategies", "public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("copy_strategies")
        .select("*, provider:providers(*)")
        .eq("visibility", "public")
        .neq("status", "archived")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as (CopyStrategy & { provider: Record<string, unknown> })[];
    },
  });
}

export function useMyCopyStrategies() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["copy_strategies", "mine", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("copy_strategies")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as CopyStrategy[];
    },
    enabled: !!user,
  });
}

export function useCreateCopyStrategy() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      provider_id: string;
      name: string;
      description?: string;
      platform: CopyPlatform;
      broker_label?: string | null;
      trading_style?: string | null;
      markets: string[];
      risk_model: string;
      max_risk_per_trade: number;
      max_daily_loss_percent: number;
      max_drawdown_percent: number;
      stop_on_drawdown: boolean;
      stop_on_daily_loss: boolean;
      respect_provider_sl: boolean;
      emergency_stop: boolean;
      visibility: "public" | "private";
    }) => {
      const { data, error } = await supabase
        .from("copy_strategies")
        .insert({ ...input, user_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as CopyStrategy;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["copy_strategies"] });
    },
  });
}

export function useUpdateCopyStrategy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Partial<CopyStrategy>) => {
      const { error } = await supabase
        .from("copy_strategies")
        .update(patch as never)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["copy_strategies"] });
    },
  });
}

/** Pause / resume / stop an existing copy subscription (status only). */
export function useSetSubscriptionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "paused" | "stopped" }) => {
      const { error } = await supabase
        .from("copy_subscriptions")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my_subscriptions"] });
    },
  });
}
