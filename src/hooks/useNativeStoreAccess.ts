import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  getNativeStoreCustomerInfo,
  getNativeStore,
  hasNativeEntitlement,
  PREMIUM_ENTITLEMENT,
  VIP_ENTITLEMENT,
} from "@/lib/nativeStoreBilling";

export function useNativeStoreAccess() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["native-store-access", user?.id],
    queryFn: async () => {
      const store = getNativeStore();
      if (!store || !user) return { isPaid: false, planCode: null as string | null };

      const info = await getNativeStoreCustomerInfo(user.id);
      const vip = hasNativeEntitlement(info, VIP_ENTITLEMENT);
      const premium = hasNativeEntitlement(info, PREMIUM_ENTITLEMENT);

      return {
        isPaid: vip || premium,
        planCode: vip ? "vip" : premium ? "basic" : null,
      };
    },
    enabled: !!user && !!getNativeStore(),
    staleTime: 60_000,
    retry: false,
  });
}
