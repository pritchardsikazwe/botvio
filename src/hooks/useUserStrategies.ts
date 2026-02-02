import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface StrategySelection {
  id: string;
  user_id: string;
  strategy_code: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Default strategies available in the system
export const DEFAULT_STRATEGIES = [
  {
    code: "botvio",
    name: "Botvio Sniper",
    description: "EMA crossover with RSI confirmation",
  },
  {
    code: "sr",
    name: "S/R Breakout",
    description: "Support & Resistance level breaks",
  },
  {
    code: "momentum",
    name: "Momentum Surge",
    description: "High momentum continuation trades",
  },
  {
    code: "boom_crash",
    name: "Boom/Crash Sniper",
    description: "Spike detection for Boom/Crash markets",
  },
  {
    code: "volatility_trend",
    name: "Volatility Trend",
    description: "EMA crossover for synthetic indices",
  },
];

// Fetch user's strategy selections
export const useUserStrategies = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-strategy-selections", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("user_strategy_selections")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return (data || []) as StrategySelection[];
    },
    enabled: !!user,
  });
};

// Get merged strategies with user selections
export const useStrategiesWithSelections = () => {
  const { user } = useAuth();
  const { data: selections, isLoading } = useUserStrategies();

  const strategies = DEFAULT_STRATEGIES.map((strategy) => {
    const selection = selections?.find((s) => s.strategy_code === strategy.code);
    return {
      ...strategy,
      enabled: selection?.enabled ?? (strategy.code === "botvio"), // Botvio enabled by default
      selectionId: selection?.id,
    };
  });

  return { strategies, isLoading, isAuthenticated: !!user };
};

// Toggle strategy selection
export const useToggleStrategy = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ strategyCode, enabled }: { strategyCode: string; enabled: boolean }) => {
      if (!user) throw new Error("Not authenticated");

      // Upsert the selection
      const { data, error } = await supabase
        .from("user_strategy_selections")
        .upsert(
          {
            user_id: user.id,
            strategy_code: strategyCode,
            enabled,
          },
          { onConflict: "user_id,strategy_code" }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user-strategy-selections"] });
      toast.success(`Strategy ${variables.enabled ? "enabled" : "disabled"}`);
    },
    onError: (error) => {
      console.error("Error toggling strategy:", error);
      toast.error("Failed to update strategy");
    },
  });
};

// Get enabled strategies for bot worker
export const useEnabledStrategies = () => {
  const { strategies } = useStrategiesWithSelections();
  return strategies.filter((s) => s.enabled).map((s) => s.code);
};
