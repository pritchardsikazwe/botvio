import { useAuth } from "@/contexts/AuthContext";
import { useGlobalAccess } from "@/hooks/useGlobalAccess";
import { useCurrentMembership } from "@/hooks/useCurrentMembership";

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
  canAccessSignalsCenter: boolean;
  canUploadAiCharts: boolean;
  canAccessTradingHubs: boolean;
  canAccessLegacyBots: boolean;
  maxAccounts: number;
  maxBotInstances: number;
  isLoading: boolean;
  isError: boolean;
}

const PLAN_TIER: Record<string, number> = {
  free: 0, trial: 0,
  starter: 1, entry: 1,
  basic: 2, standard: 2, all_access: 2, "all-access": 2,
  vip: 3, pro: 3, elite: 3, premium: 3,
};

export function useSubscriptionGate(): SubscriptionGate {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const globalAccess = useGlobalAccess();

  const { data, isLoading, isError } = useCurrentMembership();

  const plan = data?.pricing_plans as any;
  const code = plan?.maps_to_tier || plan?.code || "free";
  const tier = PLAN_TIER[code] ?? 0;
  const privileged = !!user && (isAdmin || isSuperAdmin);

  // Only explicit admin roles may bypass plan entitlements. Account age never
  // grants premium access automatically.
  if (globalAccess || privileged) {
    return {
      planCode: code,
      planName: plan?.name || "Free",
      isPaid: true, isBasicOrAbove: true, isStandardOrAbove: true, isVIP: true,
      canCopyTrade: true, canUsePremiumBots: true, canBeProvider: true,
      canAccessPremiumSignals: true, canAccessSportsBetting: true, canAccessAllCourses: true,
      canAccessSignalsCenter: true, canUploadAiCharts: true, canAccessTradingHubs: true, canAccessLegacyBots: true,
      maxAccounts: 99, maxBotInstances: 99, isLoading: false, isError: false,
    };
  }

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
    canAccessSignalsCenter: plan?.allow_signals_center ?? true,
    canUploadAiCharts: plan?.allow_ai_chart_upload ?? plan?.allow_premium_signals ?? false,
    canAccessTradingHubs: plan?.allow_trading_hubs ?? true,
    canAccessLegacyBots: plan?.allow_legacy_bots ?? false,
    maxAccounts: plan?.max_accounts ?? 1,
    maxBotInstances: plan?.max_bot_instances ?? 0,
    isLoading,
    isError,
  };
}
