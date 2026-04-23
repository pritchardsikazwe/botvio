import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionGate } from "./useSubscriptionGate";
import { useChartLimitSettings, DEFAULT_CHART_LIMITS } from "./useChartLimitSettings";

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

/**
 * Returns the UTC calendar date (YYYY-MM-DD) for a given timestamp.
 * Free trials are measured in calendar days using the user's signup date in UTC.
 */
const utcDateOnly = (iso: string | Date): Date => {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

const addDaysUTC = (d: Date, days: number): Date => {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + days));
};

const periodLabelFor = (planCode: string, settings: typeof DEFAULT_CHART_LIMITS): string => {
  switch (planCode) {
    case "free":
    case "starter":
      return `per day (${settings.free_trial_days}-day trial)`;
    case "basic":
      return `per ${settings.basic_period_days} days`;
    case "standard":
      return settings.standard_period_days === 30 ? "per month" : `per ${settings.standard_period_days} days`;
    case "vip":
      return "per day";
    default:
      return "";
  }
};

export const useChartUsageGate = () => {
  const { user } = useAuth();
  const gate = useSubscriptionGate();
  const { data: settingsRow } = useChartLimitSettings();
  const settings = {
    free_trial_days: settingsRow?.free_trial_days ?? DEFAULT_CHART_LIMITS.free_trial_days,
    free_daily_uploads: settingsRow?.free_daily_uploads ?? DEFAULT_CHART_LIMITS.free_daily_uploads,
    basic_uploads: settingsRow?.basic_uploads ?? DEFAULT_CHART_LIMITS.basic_uploads,
    basic_period_days: settingsRow?.basic_period_days ?? DEFAULT_CHART_LIMITS.basic_period_days,
    standard_uploads: settingsRow?.standard_uploads ?? DEFAULT_CHART_LIMITS.standard_uploads,
    standard_period_days: settingsRow?.standard_period_days ?? DEFAULT_CHART_LIMITS.standard_period_days,
    vip_daily_uploads: settingsRow?.vip_daily_uploads ?? DEFAULT_CHART_LIMITS.vip_daily_uploads,
  };

  const planCode = gate.planCode || "free";

  // Resolve max + period from admin settings
  let maxUploads = settings.free_daily_uploads;
  let periodDays = 1;
  switch (planCode) {
    case "basic":
      maxUploads = settings.basic_uploads;
      periodDays = settings.basic_period_days;
      break;
    case "standard":
      maxUploads = settings.standard_uploads;
      periodDays = settings.standard_period_days;
      break;
    case "vip":
      maxUploads = settings.vip_daily_uploads;
      periodDays = 1;
      break;
    default:
      maxUploads = settings.free_daily_uploads;
      periodDays = 1;
  }

  // Timezone-safe trial expiry: signup date (UTC) + N calendar days
  // Trial is "active" while today < signup + N (i.e. it ends at the start of day N)
  const { trialExpired, trialEndDate } = (() => {
    if (planCode !== "free" && planCode !== "starter") {
      return { trialExpired: false, trialEndDate: null as Date | null };
    }
    if (!user?.created_at) {
      return { trialExpired: false, trialEndDate: null as Date | null };
    }
    const signupDay = utcDateOnly(user.created_at);
    const endDay = addDaysUTC(signupDay, settings.free_trial_days);
    const todayDay = utcDateOnly(new Date());
    return { trialExpired: todayDay.getTime() >= endDay.getTime(), trialEndDate: endDay };
  })();

  // Today's usage (UTC day) for free + VIP, or rolling period for paid plans
  const { data: usageCount = 0, isLoading } = useQuery({
    queryKey: ["chart-usage-gate", user?.id, planCode, periodDays],
    queryFn: async () => {
      if (!user) return 0;
      const periodStart = new Date();
      if (planCode === "free" || planCode === "starter" || planCode === "vip") {
        // Today = start of UTC day
        const today = utcDateOnly(new Date());
        periodStart.setTime(today.getTime());
      } else {
        periodStart.setDate(periodStart.getDate() - periodDays);
      }
      const { count, error } = await supabase
        .from("chart_analyses")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", periodStart.toISOString());
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const remaining = trialExpired ? 0 : Math.max(0, maxUploads - usageCount);
  const limitReached = trialExpired || usageCount >= maxUploads;
  const periodLabel = periodLabelFor(planCode, settings);

  return {
    planCode,
    planName: gate.planName || "Free",
    maxUploads,
    periodLabel,
    usageCount,
    remaining,
    limitReached,
    isUnlimited: false,
    trialExpired,
    trialEndDate,
    trialDays: settings.free_trial_days,
    isLoading: isLoading || gate.isLoading,
  };
};

/** Guest-only daily limit (1 per day per device — sign up for 2 more) */
export const GUEST_DAILY_LIMIT = 1;

/** Generate a simple device/IP fingerprint key */
const getDeviceFingerprint = (): string => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx?.fillText("fp", 2, 2);
  const fp = canvas.toDataURL().slice(-20);
  const nav = `${navigator.language}-${navigator.hardwareConcurrency || 0}-${screen.width}x${screen.height}`;
  let hash = 0;
  const raw = fp + nav;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
};

const GUEST_STORAGE_KEY = "botvio_guest_uploads";
const DEVICE_LOCK_KEY = "botvio_device_email";

/** Lock this device to a specific email once logged in */
export const lockDeviceToEmail = (email: string) => {
  const fp = getDeviceFingerprint();
  const existing = localStorage.getItem(DEVICE_LOCK_KEY);
  if (existing) {
    try {
      const data = JSON.parse(existing);
      if (data.fp === fp && data.email !== email) {
        // Different email on same device — flag it
        console.warn("Device already locked to", data.email);
      }
    } catch {}
  }
  localStorage.setItem(DEVICE_LOCK_KEY, JSON.stringify({ fp, email }));
};

/** Check if current device is locked to a different email */
export const isDeviceLockedToOtherEmail = (email: string): boolean => {
  try {
    const fp = getDeviceFingerprint();
    const data = JSON.parse(localStorage.getItem(DEVICE_LOCK_KEY) || "{}");
    if (data.fp === fp && data.email && data.email !== email) return true;
    return false;
  } catch {
    return false;
  }
};

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
