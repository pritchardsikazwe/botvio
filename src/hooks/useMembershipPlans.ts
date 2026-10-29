import { usePricingPlans } from "@/hooks/useBotvio";

/** Presentation and checkout use the same saved customer-visible plan rows. */
export function useMembershipPlans<T extends { code: string; name: string; price: number }>(presentation: readonly T[]) {
  const query = usePricingPlans();
  const plans = (query.data ?? []).flatMap(row => {
    const details = presentation.find(plan => plan.code === row.code);
    return details ? [{ ...details, id: row.id, name: row.name, price: row.price_usd ?? 0 }] : [];
  });
  return { ...query, plans };
}