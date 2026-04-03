import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface SubscriptionGate {
  planCode: string | null;
  planName: string | null;
  isPaid: boolean;
  isBasicOrAbove: boolean;
  isStandardOrAbove: boolean;
  isVIP: boolean;
  canCopyTrade: boolean;
  canUsePremiumBots: boolean;
  canBeProvider: boolean;
  canAccessPremiumSignals: boolean;
  canAccessSportsBetting: boolean;
  canAccessAllCourses: boolean;
  maxAccounts: number;
  maxBotInstances: number;
  isLoading: boolean;
}

const PLAN_TIER: Record<string, number> = {
  free: 0,
  basic: 1,
  standard: 2,
  vip: 3,
};

export function useSubscriptionGate(): SubscriptionGate {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["subscription-gate", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_plan_subscriptions")
        .select("*, pricing_plans(*)")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const plan = data?.pricing_plans as any;
  const code = plan?.code || "free";
  const tier = PLAN_TIER[code] ?? 0;

  return {
    planCode: code,
    planName: plan?.name || "Free",
    isPaid: tier > 0,
    isBasicOrAbove: tier >= 1,
    isStandardOrAbove: tier >= 2,
    isVIP: tier >= 3,
    canCopyTrade: plan?.allow_copy_trading ?? false,
    canUsePremiumBots: plan?.allow_premium_bots ?? false,
    canBeProvider: plan?.allow_provider_listing ?? false,
    canAccessPremiumSignals: plan?.allow_premium_signals ?? false,
    canAccessSportsBetting: plan?.allow_sports_betting ?? false,
    canAccessAllCourses: plan?.allow_all_courses ?? false,
    maxAccounts: plan?.max_accounts ?? 1,
    maxBotInstances: plan?.max_bot_instances ?? 0,
    isLoading,
  };
}
