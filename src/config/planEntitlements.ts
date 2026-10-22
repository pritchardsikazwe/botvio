/**
 * Shared map from any stored plan code to the three customer-facing tiers.
 * Prices and feature text live in the pricing_plans table (admin-editable);
 * the database function get_user_plan_tier applies the same mapping server-side.
 */
export type PlanTier = "free" | "starter" | "basic" | "vip";

const LEGACY: Record<string, PlanTier> = {
  starter: "starter", basic: "basic", standard: "basic",
  vip: "vip", pro: "vip", elite: "vip",
};

export const tierForPlanCode = (code?: string | null): PlanTier =>
  (code && LEGACY[code.toLowerCase()]) || "free";

const RANK: Record<PlanTier, number> = { free: 0, starter: 1, basic: 2, vip: 3 };

export const tierIncludes = (tier: PlanTier, required: PlanTier) => RANK[tier] >= RANK[required];

export const conversionRate = (paid: number, registered: number) =>
  registered > 0 ? `${((paid / registered) * 100).toFixed(1)}%` : "Data unavailable";
