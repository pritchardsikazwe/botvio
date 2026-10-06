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

export function useMarketplaceTestMode() {
  return useQuery({
    queryKey: ["marketplace-test-mode"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("activate-product", { body: { action: "status" } });
      if (error) throw error;
      return data?.enabled === true;
    },
    staleTime: 30_000,
  });
}

export function usePurchaseProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ product, affiliateCode }: { product: MarketplaceProduct; affiliateCode?: string }) => {
      const { data, error } = await supabase.functions.invoke("activate-product", { body: { productId: product.id, affiliateCode: affiliateCode || null } });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Could not activate product");
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success(variables.product.name + " unlocked for testing!");
      queryClient.invalidateQueries({ queryKey: ["entitlements"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace-products"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useSubmitPaymentRequest() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ product, paymentMethod, proofUrl, accountId }: {
      product: MarketplaceProduct; paymentMethod: string; proofUrl: string; affiliateCode?: string; accountId?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("payment_requests").insert({
        user_id: user.id, product_id: product.id, account_id: accountId || null,
        amount_usd: Number(product.price_usd), currency: "USD", method: paymentMethod,
        proof_upload_url: proofUrl, status: "submitted",
      }).select("id,status").single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Payment submitted. Botvio will verify it before activation.");
      queryClient.invalidateQueries({ queryKey: ["entitlements"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
