import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OPEN_ACCESS } from "@/config/access";

export const GLOBAL_ACCESS_KEY = "global_access_open";

/**
 * Runtime global-access switch. Admins toggle it from the Admin dashboard
 * (stored in app_settings.global_access_open). When on, every visitor gets
 * full access without a subscription; when off, normal plan/trial rules apply.
 * The build-time OPEN_ACCESS constant still forces access on when true.
 */
export function useGlobalAccess(): boolean {
  const { data } = useQuery({
    queryKey: ["global-access-setting"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", GLOBAL_ACCESS_KEY)
        .maybeSingle();
      if (error) return false;
      return !!(data?.value as { enabled?: boolean } | null)?.enabled;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
  });
  return OPEN_ACCESS || !!data;
}
