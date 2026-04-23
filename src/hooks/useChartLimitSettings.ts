import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ChartLimitSettings {
  id: string;
  free_trial_days: number;
  free_daily_uploads: number;
  basic_uploads: number;
  basic_period_days: number;
  standard_uploads: number;
  standard_period_days: number;
  vip_daily_uploads: number;
  updated_at: string;
  updated_by: string | null;
}

export const DEFAULT_CHART_LIMITS: Omit<ChartLimitSettings, "id" | "updated_at" | "updated_by"> = {
  free_trial_days: 3,
  free_daily_uploads: 1,
  basic_uploads: 50,
  basic_period_days: 7,
  standard_uploads: 100,
  standard_period_days: 30,
  vip_daily_uploads: 10,
};

export function useChartLimitSettings() {
  return useQuery({
    queryKey: ["chart-limit-settings"],
    queryFn: async (): Promise<ChartLimitSettings | null> => {
      const { data, error } = await supabase
        .from("chart_limit_settings" as any)
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown) as ChartLimitSettings | null;
    },
    staleTime: 60_000,
  });
}

export function useUpdateChartLimitSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<Omit<ChartLimitSettings, "id" | "updated_at" | "updated_by">>) => {
      const { data: existing } = await supabase
        .from("chart_limit_settings" as any)
        .select("id")
        .limit(1)
        .maybeSingle();
      if (!existing) {
        const { error } = await supabase
          .from("chart_limit_settings" as any)
          .insert({ ...DEFAULT_CHART_LIMITS, ...updates });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("chart_limit_settings" as any)
          .update(updates)
          .eq("id", (existing as any).id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chart-limit-settings"] });
      qc.invalidateQueries({ queryKey: ["chart-usage-gate"] });
    },
  });
}