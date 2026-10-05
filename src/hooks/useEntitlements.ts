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

const VISITOR_TRIAL_KEY = "botvio_visitor_trial_started_at";
const VISITOR_TRIAL_MS = 24 * 60 * 60 * 1000;

function hasVisitorPreview(): boolean {
  try {
    const raw = window.localStorage.getItem(VISITOR_TRIAL_KEY);
    if (!raw) {
      window.localStorage.setItem(VISITOR_TRIAL_KEY, new Date().toISOString());
      return true;
    }
    const startedAt = new Date(raw).getTime();
    return Number.isFinite(startedAt) && Date.now() - startedAt < VISITOR_TRIAL_MS;
  } catch {
    return false;
  }
}

export function useEntitlements() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["entitlements", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("entitlements")
        .select("*, products(id, name, type, slug, price_usd, billing_type)")
        .eq("user_id", user.id)
        .eq("status", "active");

      if (error) throw error;
      return data as Entitlement[];
    },
    enabled: !!user,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
}

export function useHasEntitlement(productId: string | undefined) {
  const { user, isAdmin, isSuperAdmin, isSignalManager } = useAuth();
  const { data: entitlements } = useEntitlements();

  if (!productId) return false;

  // Staff/admin roles can inspect all premium products without purchasing each one.
  if (user && (isAdmin || isSuperAdmin || isSignalManager)) return true;

  // Unauthenticated visitors get a 24-hour read-only preview.
  if (!user && hasVisitorPreview()) return true;

  return entitlements?.some(
    (e) =>
      e.product_id === productId &&
      e.status === "active" &&
      (!e.ends_at || new Date(e.ends_at).getTime() > Date.now()),
  ) ?? false;
}

export function useHasProductType(type: string) {
  const { user, isAdmin, isSuperAdmin, isSignalManager } = useAuth();
  const { data: entitlements } = useEntitlements();

  if (user && (isAdmin || isSuperAdmin || isSignalManager)) return true;
  if (!user && hasVisitorPreview()) return true;

  return entitlements?.some(
    (e) => e.products?.type === type && e.status === "active",
  ) ?? false;
}

export function useMyProducts(type?: string) {
  const { data: entitlements, isLoading } = useEntitlements();
  const filtered = type
    ? entitlements?.filter((e) => e.products?.type === type)
    : entitlements;
  return { data: filtered, isLoading };
}
