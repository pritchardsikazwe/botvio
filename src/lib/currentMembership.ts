import { tierForPlanCode, tierIncludes } from "@/config/planEntitlements";

export interface MembershipPlan {
  code: string;
  name: string;
  maps_to_tier?: string | null;
  price_usd: number;
  features: unknown;
  allow_copy_trading: boolean;
  allow_premium_bots: boolean;
  allow_provider_listing: boolean;
  allow_premium_signals: boolean;
  allow_sports_betting: boolean;
  allow_all_courses: boolean;
  max_accounts: number;
  max_bot_instances: number;
}
export interface MembershipRow {
  id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  pricing_plans: MembershipPlan | null;
}

export function selectCurrentMembership<T extends MembershipRow>(rows: T[], now = Date.now()): T | null {
  const active = rows.filter(row => row.status === "active" && row.pricing_plans &&
    (!row.current_period_end || Date.parse(row.current_period_end) > now));
  return active.sort((a, b) => {
    const aTier = tierForPlanCode(a.pricing_plans?.maps_to_tier || a.pricing_plans?.code);
    const bTier = tierForPlanCode(b.pricing_plans?.maps_to_tier || b.pricing_plans?.code);
    if (aTier !== bTier) return tierIncludes(aTier, bTier) ? -1 : 1;
    return Date.parse(b.current_period_start || "1970-01-01") - Date.parse(a.current_period_start || "1970-01-01");
  })[0] ?? null;
}

export function membershipDestinations(code?: string | null) {
  const tier = tierForPlanCode(code);
  if (tier === "free") return [];
  const items = [
    { id: "membership-signals", name: "Trading Signals", href: "/signals", slug: "signals", kind: "signals" },
    { id: "membership-synthetic", name: "Synthetic Hub", href: "/synthetic-hub", slug: "synthetic-hub", kind: "hub" },
    { id: "membership-weltrade", name: "Weltrade Hub", href: "/weltrade", slug: "weltrade-hub", kind: "hub" },
  ];
  if (tierIncludes(tier, "basic")) items.push(
    { id: "membership-hubs", name: "All Trading Hubs", href: "/markets", slug: "all-hubs", kind: "hub" },
    { id: "membership-charts", name: "AI Chart Analysis", href: "/signals?tab=chart-analysis", slug: "ai-charts", kind: "tool" },
    { id: "membership-robots", name: "Botvio Robots", href: "/bots", slug: "botvio-robot", kind: "robot" },
  );
  if (tier === "vip") items.push({ id: "membership-copy", name: "MT5 TradeCopy", href: "/connections", slug: "mt5-direct", kind: "connection" });
  return items;
}