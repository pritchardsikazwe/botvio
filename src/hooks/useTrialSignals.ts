import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { signalDayStart } from "@/lib/signalTrial";
import { toast } from "sonner";

export function useTrialSignals(enabled: boolean) {
  const { user } = useAuth();
  const client = useQueryClient();
  const day = signalDayStart().toISOString().slice(0, 10);
  const catalog = useQuery({
    queryKey: ["trial-signal-catalog", user?.id, day], enabled: enabled && !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_trial_signal_catalog");
      if (error) throw error;
      return data;
    }, refetchInterval: 60_000,
  });
  const usage = useQuery({
    queryKey: ["trial-signal-usage", user?.id, day], enabled: enabled && !!user,
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase.from("trial_signal_unlocks")
        .select("signal_id", { count: "exact", head: true }).eq("user_id", user.id).eq("unlock_day", day);
      if (error) throw error;
      return count ?? 0;
    }, refetchInterval: 60_000,
  });
  const unlock = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.rpc("unlock_trial_signal", { p_signal_id: id });
      if (error) throw error;
      const result = data as { allowed?: boolean; reason?: string };
      if (!result.allowed) throw new Error(result.reason || "Daily trial limit reached");
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["trial-signal-catalog"] });
      client.invalidateQueries({ queryKey: ["trial-signal-usage"] });
      client.invalidateQueries({ queryKey: ["manual-signals"] });
    }, onError: (error) => toast.error(error.message),
  });
  return { catalog, usage, unlock };
}