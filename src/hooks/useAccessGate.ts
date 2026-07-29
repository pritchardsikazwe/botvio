import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionGate } from "@/hooks/useSubscriptionGate";
import { supabase } from "@/integrations/supabase/client";

/**
 * Central access gate for premium/paid areas of Botvio (hubs, signals, bots).
 *
 * Rules:
 * - Admins / super_admins / signal_managers → always allowed.
 * - Users on a paid plan (basic / standard / vip) → allowed.
 * - Free / starter users → allowed only during the free-trial window
 *   (chart_limit_settings.free_trial_days, default 7 days from signup).
 * - Everyone else → blocked (must be activated by admin via a paid plan).
 */
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

export function useAccessGate(): AccessGate {
  const { user, isAdmin, isSuperAdmin, isSignalManager, loading: authLoading } = useAuth();
  const sub = useSubscriptionGate();

  const { data: trialInfo, isLoading: trialLoading } = useQuery({
    queryKey: ["access-gate-trial", user?.id],
    queryFn: async () => {
      const [{ data: profile }, { data: settings }] = await Promise.all([
        supabase.from("profiles").select("created_at").eq("user_id", user!.id).maybeSingle(),
        supabase.from("chart_limit_settings").select("free_trial_days").limit(1).maybeSingle(),
      ]);
      const trialDays = settings?.free_trial_days ?? 7;
      const signup = profile?.created_at ? new Date(profile.created_at) : new Date();
      const trialEnd = new Date(signup.getTime() + trialDays * 24 * 60 * 60 * 1000);
      const msLeft = trialEnd.getTime() - Date.now();
      const daysLeft = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
      return { trialDays, daysLeft, expired: msLeft <= 0 };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const adminBypass = isAdmin || isSuperAdmin || isSignalManager;
  const isPaid = sub.isPaid;
  const isTrial = !isPaid && !!trialInfo && !trialInfo.expired;
  const trialDaysLeft = trialInfo?.daysLeft ?? 0;
  const trialExpired = !!trialInfo?.expired;

  return {
    isLoading: authLoading || sub.isLoading || (!!user && trialLoading),
    isAuthenticated: !!user,
    isAdmin: adminBypass,
    isPaid,
    isTrial,
    trialDaysLeft,
    trialExpired,
    hasAccess: adminBypass || isPaid || isTrial,
    planCode: sub.planCode,
  };
}