import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MarketplaceProduct {
  id: string;
  name: string;
  type: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  cover_image_url: string | null;
  price_usd: number;
  billing_type: string;
  billing_interval: string | null;
  affiliate_percent: number;
  is_active: boolean;
  is_featured: boolean;
}

export function useMarketplaceProducts(type?: string) {
  return useQuery({
    queryKey: ["marketplace-products", type],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (type && type !== "all") {
        query = query.eq("type", type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MarketplaceProduct[];
    },
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
}

export function usePurchaseProduct() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      product,
      paymentMethod,
      proofUrl,
      affiliateCode,
      accountId,
    }: {
      product: MarketplaceProduct;
      paymentMethod: string;
      proofUrl?: string;
      affiliateCode?: string;
      accountId?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // TEMPORARY TEST MODE: every active Botvio product is granted immediately.
      // This bypasses payment/proof review only while the platform is being tested.
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          product_id: product.id,
          product_type: product.type,
          amount_usd: 0,
          referral_code: affiliateCode || null,
          status: "paid",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const { error: entError } = await supabase
        .from("entitlements")
        .upsert({
          user_id: user.id,
          product_id: product.id,
          status: "active",
          source_order_id: order.id,
          ends_at: null,
        }, { onConflict: "user_id,product_id" });

      if (entError) throw entError;

      return order;
    },
    onSuccess: (_, variables) => {
      toast.success(`${variables.product.name} unlocked for testing!`);
      queryClient.invalidateQueries({ queryKey: ["entitlements"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace-products"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
