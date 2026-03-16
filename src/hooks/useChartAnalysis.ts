import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionGate } from "./useSubscriptionGate";

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

/** Plan-based chart analysis limits */
interface ChartLimitConfig {
  maxUploads: number; // -1 = unlimited
  periodLabel: string;
  periodDays: number;
}

const CHART_LIMITS: Record<string, ChartLimitConfig> = {
  free:     { maxUploads: 5,   periodLabel: "per day",    periodDays: 1 },
  basic:    { maxUploads: 50,  periodLabel: "per 7 days", periodDays: 7 },
  standard: { maxUploads: 100, periodLabel: "per month",  periodDays: 30 },
  vip:      { maxUploads: -1,  periodLabel: "unlimited",  periodDays: 30 },
};

export const useChartUsageGate = () => {
  const { user } = useAuth();
  const gate = useSubscriptionGate();
  const planCode = gate.planCode || "free";
  const config = CHART_LIMITS[planCode] || CHART_LIMITS.free;

  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - config.periodDays);
  const periodStartISO = periodStart.toISOString();

  const { data: usageCount = 0, isLoading } = useQuery({
    queryKey: ["chart-usage-gate", user?.id, planCode],
    queryFn: async () => {
      if (!user || config.maxUploads === -1) return 0;

      const { count, error } = await supabase
        .from("chart_analyses")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", periodStartISO);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user && config.maxUploads !== -1,
    refetchInterval: 30000,
  });

  const isUnlimited = config.maxUploads === -1;
  const remaining = isUnlimited ? Infinity : Math.max(0, config.maxUploads - usageCount);
  const limitReached = !isUnlimited && usageCount >= config.maxUploads;

  return {
    planCode,
    planName: gate.planName || "Free",
    maxUploads: config.maxUploads,
    periodLabel: config.periodLabel,
    usageCount,
    remaining,
    limitReached,
    isUnlimited,
    isLoading: isLoading || gate.isLoading,
  };
};

/** Guest-only daily limit (3 per day per IP via localStorage + IP fingerprint) */
export const GUEST_DAILY_LIMIT = 3;

/** Generate a simple device/IP fingerprint key */
const getDeviceFingerprint = (): string => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx?.fillText("fp", 2, 2);
  const fp = canvas.toDataURL().slice(-20);
  const nav = `${navigator.language}-${navigator.hardwareConcurrency || 0}-${screen.width}x${screen.height}`;
  // Simple hash
  let hash = 0;
  const raw = fp + nav;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
};

const GUEST_STORAGE_KEY = "botvio_guest_uploads";

export const getGuestUploadCount = (): number => {
  try {
    const fp = getDeviceFingerprint();
    const data = JSON.parse(localStorage.getItem(GUEST_STORAGE_KEY) || "{}");
    const today = new Date().toISOString().slice(0, 10);
    if (data.reset !== today || data.fp !== fp) return 0;
    return data.count || 0;
  } catch {
    return 0;
  }
};

export const incrementGuestUploadCount = () => {
  const today = new Date().toISOString().slice(0, 10);
  const fp = getDeviceFingerprint();
  const current = getGuestUploadCount();
  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify({ count: current + 1, reset: today, fp }));
};
