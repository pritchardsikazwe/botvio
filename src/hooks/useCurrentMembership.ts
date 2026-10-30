import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { selectCurrentMembership, type MembershipRow } from "@/lib/currentMembership";

export function useCurrentMembership() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["current-membership", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from("user_plan_subscriptions")
        .select("id,status,current_period_start,current_period_end,pricing_plans(*)")
        .eq("user_id", user.id).eq("status", "active")
        .or(`current_period_end.is.null,current_period_end.gt.${new Date().toISOString()}`)
        .order("current_period_start", { ascending: false });
      if (error) throw error;
      return selectCurrentMembership((data ?? []) as MembershipRow[]);
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}