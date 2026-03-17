import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SignalBroker {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  affiliate_url: string;
  execution_mode: string;
  routing_priority: number;
  supported_market_types: string[];
  best_for: string | null;
  description: string | null;
  is_active: boolean;
}

export const useSignalBrokers = () => {
  return useQuery({
    queryKey: ["signal-brokers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signal_brokers")
        .select("*")
        .eq("is_active", true)
        .order("routing_priority", { ascending: false });
      if (error) throw error;
      return data as SignalBroker[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useBrokerRoutes = (signalId: string | undefined) => {
  return useQuery({
    queryKey: ["broker-routes", signalId],
    queryFn: async () => {
      if (!signalId) return [];
      const { data, error } = await supabase
        .from("signal_broker_routes")
        .select("*, signal_brokers(*)")
        .eq("signal_id", signalId)
        .order("route_score", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!signalId,
  });
};

export const useTrackBrokerClick = () => {
  return useMutation({
    mutationFn: async ({
      brokerId,
      signalId,
      countryCode,
    }: {
      brokerId: string;
      signalId?: string;
      countryCode?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("broker_click_events").insert({
        broker_id: brokerId,
        signal_id: signalId || null,
        user_id: userData?.user?.id || null,
        country_code: countryCode || null,
        device_type: /Mobi/i.test(navigator.userAgent) ? "mobile" : "desktop",
      });
      if (error) console.error("Click tracking error:", error);
    },
  });
};

// Simple routing: rank brokers based on signal asset type
export function rankBrokersForSignal(
  brokers: SignalBroker[],
  signalCategory?: string,
  signalSymbol?: string
): SignalBroker[] {
  const isSynthetic =
    signalCategory === "synthetic" ||
    /boom|crash|v\d+|step|jump|range/i.test(signalSymbol || "");
  const isOTC = /otc/i.test(signalSymbol || "");
  const isCrypto = signalCategory === "crypto" || /btc|eth|sol|doge/i.test(signalSymbol || "");

  return [...brokers].sort((a, b) => {
    let aBoost = 0;
    let bBoost = 0;

    if (isSynthetic) {
      if (a.slug === "deriv") aBoost += 30;
      if (b.slug === "deriv") bBoost += 30;
    }
    if (isOTC) {
      if (a.slug === "pocket-option") aBoost += 25;
      if (b.slug === "pocket-option") bBoost += 25;
      if (a.slug === "quotex") aBoost += 20;
      if (b.slug === "quotex") bBoost += 20;
    }
    if (isCrypto) {
      if (a.slug === "deriv") aBoost += 10;
      if (b.slug === "deriv") bBoost += 10;
    }

    return (b.routing_priority + bBoost) - (a.routing_priority + aBoost);
  });
}
