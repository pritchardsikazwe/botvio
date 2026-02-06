import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  id: string;
  site_name: string;
  site_url: string;
  meta_title_default: string | null;
  meta_description_default: string | null;
  og_image_url: string | null;
  logo_url: string | null;
  google_verification_code: string | null;
  bing_verification_code: string | null;
  robots_index: boolean;
  robots_follow: boolean;
  canonical_base_url: string | null;
  meta_keywords: string | null;
  updated_at: string;
}

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as SiteSettings | null;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateSiteSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<SiteSettings>) => {
      // Get the singleton row id first
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .limit(1)
        .single();
      
      if (!existing) throw new Error("Site settings not found");

      const { error } = await supabase
        .from("site_settings")
        .update(updates)
        .eq("id", existing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    },
  });
}

export function usePartnerLinks() {
  return useQuery({
    queryKey: ["partner-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_links")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
