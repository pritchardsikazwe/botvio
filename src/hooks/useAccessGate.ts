import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionGate } from "@/hooks/useSubscriptionGate";
import { supabase } from "@/integrations/supabase/client";
import { OPEN_ACCESS, isLegacyAccessAccount } from "@/config/access";
import { useNativeStoreAccess } from "@/hooks/useNativeStoreAccess";

export interface AccessGate {
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isPaid: boolean;
  isTrial: boolean;
  trialDaysLeft: number;
  trialExpired: boolean;
  hasAccess: boolean;
  planCode: string | null;
}

const TRIAL_DURATION_DAYS = 1;

export function useAccessGate(): AccessGate {
  const { user, isAdmin, isSuperAdmin, loading: authLoading } = useAuth();
  const sub = useSubscriptionGate();
  const nativeStore = useNativeStoreAccess();

  const { data: trialInfo, isLoading: trialLoading } = useQuery({
    queryKey: ["access-gate-trial", user?.id, user?.created_at],
    queryFn: async () => {
      // Auth's immutable created_at is the fallback source of truth. Do not
      // start a fresh trial at the current time if a profile row is missing.
      const [{ data: profile }, { data: settings }] = await Promise.all([
        supabase.from("profiles").select("created_at").eq("user_id", user!.id).maybeSingle(),
        supabase.from("chart_limit_settings").select("free_trial_days").limit(1).maybeSingle(),
      ]);
      const configuredDays = settings?.free_trial_days;
      const trialDays = typeof configuredDays === "number" ? Math.min(1, Math.max(0, configuredDays)) : TRIAL_DURATION_DAYS;
      const signup = profile?.created_at ? new Date(profile.created_at) : new Date(user!.created_at);
      const trialEnd = new Date(signup.getTime() + trialDays * 24 * 60 * 60 * 1000);
      const msLeft = trialEnd.getTime() - Date.now();
      const daysLeft = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
      return { trialDays, daysLeft, expired: msLeft <= 0 };
    },
    enabled: !!user,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
  });

  const adminBypass = isAdmin || isSuperAdmin;
  const grandfathered = !!user && isLegacyAccessAccount(user.created_at);
  const isPaid = sub.isPaid || !!nativeStore.data?.isPaid || grandfathered;
  const isTrial = !isPaid && !!trialInfo && !trialInfo.expired;
  const trialDaysLeft = trialInfo?.daysLeft ?? 0;
  const trialExpired = !!trialInfo?.expired;
  const nativePlanCode = nativeStore.data?.planCode ?? null;

  return {
    isLoading: OPEN_ACCESS ? false : authLoading || sub.isLoading || nativeStore.isLoading || (!!user && trialLoading),
    isAuthenticated: !!user,
    isAdmin: adminBypass,
    isPaid,
    isTrial,
    trialDaysLeft,
    trialExpired,
    hasAccess: OPEN_ACCESS || adminBypass || grandfathered || isPaid || isTrial,
    planCode: grandfathered && !sub.isPaid ? "legacy" : (nativePlanCode ?? sub.planCode),
  };
}
