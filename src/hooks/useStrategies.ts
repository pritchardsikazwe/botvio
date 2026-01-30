import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

// All public strategies
export const useStrategies = (filters?: { market?: string; pricingType?: string }) => {
  return useQuery({
    queryKey: ["strategies", filters],
    queryFn: async () => {
      let query = supabase
        .from("strategies")
        .select("*")
        .eq("is_public", true)
        .order("downloads", { ascending: false });

      if (filters?.market) {
        query = query.eq("market", filters.market);
      }
      if (filters?.pricingType) {
        query = query.eq("pricing_type", filters.pricingType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
};

// Single strategy by slug
export const useStrategy = (slug: string) => {
  return useQuery({
    queryKey: ["strategy", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("strategies")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });
};

// My strategies
export const useMyStrategies = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-strategies", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("strategies")
        .select("*")
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

// Create strategy
export const useCreateStrategy = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      title: string;
      description?: string;
      market: string;
      symbols?: string[];
      config_json?: Record<string, unknown>;
      pricing_type: "free" | "paid";
      price_usd?: number;
      is_public?: boolean;
      cover_image_url?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const slug = params.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") + 
        "-" + 
        Date.now().toString(36);

      const { data, error } = await supabase
        .from("strategies")
        .insert({
          owner_user_id: user.id,
          slug,
          title: params.title,
          description: params.description,
          market: params.market,
          symbols: params.symbols,
          config_json: params.config_json as Json | undefined,
          pricing_type: params.pricing_type,
          price_usd: params.price_usd,
          is_public: params.is_public,
          cover_image_url: params.cover_image_url,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-strategies"] });
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      toast.success("Strategy created!");
    },
  });
};


// Update strategy
export const useUpdateStrategy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      title?: string;
      description?: string;
      symbols?: string[];
      config_json?: Record<string, unknown>;
      pricing_type?: "free" | "paid";
      price_usd?: number;
      is_public?: boolean;
      cover_image_url?: string;
    }) => {
      const { id, config_json, ...rest } = params;
      const updateData: Record<string, Json | undefined> = {};
      
      Object.entries(rest).forEach(([key, value]) => {
        if (value !== undefined) {
          updateData[key] = value as Json;
        }
      });
      
      if (config_json !== undefined) {
        updateData.config_json = config_json as Json;
      }
      
      const { data, error } = await supabase
        .from("strategies")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["my-strategies"] });
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      queryClient.invalidateQueries({ queryKey: ["strategy", data.slug] });
      toast.success("Strategy updated!");
    },
  });
};
// My purchased strategies
export const useMyPurchasedStrategies = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["purchased-strategies", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("strategy_purchases")
        .select("*, strategy:strategies(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

// Check if user has purchased strategy
export const useHasPurchasedStrategy = (strategyId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["has-purchased", strategyId, user?.id],
    queryFn: async () => {
      if (!user || !strategyId) return false;
      const { data, error } = await supabase
        .from("strategy_purchases")
        .select("id")
        .eq("user_id", user.id)
        .eq("strategy_id", strategyId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!strategyId,
  });
};

// Increment download count (simplified)
export const useIncrementDownload = () => {
  return useMutation({
    mutationFn: async (strategyId: string) => {
      // Just fetch current and increment
      const { data: current } = await supabase
        .from("strategies")
        .select("downloads")
        .eq("id", strategyId)
        .single();
      
      if (current) {
        await supabase
          .from("strategies")
          .update({ downloads: (current.downloads || 0) + 1 })
          .eq("id", strategyId);
      }
    },
  });
};
