import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ChartAnalysis {
  id: string;
  user_id: string;
  image_url: string;
  symbol: string | null;
  timeframe: string | null;
  analysis_result: any;
  ai_response: string | null;
  is_premium_analysis: boolean;
  created_at: string;
}

export const useChartAnalyses = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["chart-analyses", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("chart_analyses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as ChartAnalysis[];
    },
    enabled: !!user,
  });
};

export const useDailyChartUsage = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["chart-daily-usage", user?.id],
    queryFn: async () => {
      if (!user) return { count: 0, canUpload: false };

      const today = new Date().toISOString().split("T")[0];
      const { count, error } = await supabase
        .from("chart_analyses")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", `${today}T00:00:00Z`);

      if (error) throw error;
      return { count: count || 0, canUpload: (count || 0) < 1 };
    },
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};
