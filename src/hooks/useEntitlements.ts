import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface Entitlement {
  id: string;
  user_id: string;
  product_id: string;
  status: string;
  started_at: string;
  ends_at: string | null;
  source_order_id: string | null;
  created_at: string;
  products?: {
    id: string;
    name: string;
    type: string;
    slug: string;
    price_usd: number;
    billing_type: string;
  } | null;
}

export function useEntitlements() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["entitlements", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entitlements")
        .select("*, products(id, name, type, slug, price_usd, billing_type)")
        .eq("user_id", user!.id)
        .eq("status", "active");

      if (error) throw error;
      return data as Entitlement[];
    },
    enabled: !!user,
    refetchOnWindowFocus: true,
    staleTime: 30_000, // 30 seconds
  });
}

export function useHasEntitlement(productId: string | undefined) {
  const { data: entitlements } = useEntitlements();
  if (!productId) return false;
  return entitlements?.some((e) => e.product_id === productId && e.status === "active" && (!e.ends_at || new Date(e.ends_at).getTime() > Date.now())) ?? false;
}

export function useHasProductType(type: string) {
  const { data: entitlements } = useEntitlements();
  return entitlements?.some(
    (e) => e.products?.type === type && e.status === "active"
  ) ?? false;
}

export function useMyProducts(type?: string) {
  const { data: entitlements, isLoading } = useEntitlements();
  const filtered = type
    ? entitlements?.filter((e) => e.products?.type === type)
    : entitlements;
  return { data: filtered, isLoading };
}
