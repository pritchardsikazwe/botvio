/** Shared plan-code mapping for Botvio customer-facing subscription tiers. */
export type PlanTier = "free" | "starter" | "basic" | "vip";

const LEGACY: Record<string, PlanTier> = {
  free: "free", trial: "free", starter: "starter", entry: "starter",
  basic: "basic", standard: "basic", all_access: "basic", "all-access": "basic",
  vip: "vip", pro: "vip", elite: "vip", premium: "vip",
};

const RANK: Record<PlanTier, number> = { free: 0, starter: 1, basic: 2, vip: 3 };
export const tierForPlanCode = (code?: string | null): PlanTier => (code && LEGACY[code.toLowerCase().trim()]) || "free";
export const tierIncludes = (tier: PlanTier, required: PlanTier) => RANK[tier] >= RANK[required];

export const PLAN_CATALOG = [
  { code: "starter", name: "Starter", price: 9, summary: "Synthetic + Weltrade hubs, included signals and free learning resources" },
  { code: "basic", name: "Basic", price: 19, summary: "All hubs, included signals, AI robots, premium tools and eligible courses" },
  { code: "vip", name: "VIP", price: 39, summary: "Everything in Basic plus MT5 TradeCopy" },
] as const;

export const membershipPlanLabel = (code?: string | null, name?: string | null) => {
  const tier = tierForPlanCode(code);
  return PLAN_CATALOG.find(plan => plan.code === tier)?.name ?? name ?? "Free Trial";
};

export const conversionRate = (paid: number, registered: number) => registered > 0 ? ((paid / registered) * 100).toFixed(1) + "%" : "Data unavailable";