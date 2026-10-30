import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentMembership } from "@/hooks/useCurrentMembership";
import { membershipPlanLabel } from "@/config/planEntitlements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarClock, CheckCircle2, Crown, RefreshCw } from "lucide-react";

const FEATURES: Record<string, string[]> = {
  starter: ["Synthetic Hub", "Weltrade Hub", "Included signals", "Free courses and platform features"],
  basic: ["All trading hubs", "Included signals", "Botvio AI Robot + Gold Robot", "Premium tools and eligible courses"],
  standard: ["All trading hubs", "Included signals", "Botvio AI Robot + Gold Robot", "Premium tools and eligible courses"],
  all_access: ["All trading hubs", "Included signals", "Botvio AI Robot + Gold Robot", "Premium tools and eligible courses"],
  vip: ["Everything in Basic", "MT5 TradeCopy", "Eligible MT5 connections", "Copy controls and history"],
  pro: ["Everything in Basic", "MT5 TradeCopy", "Eligible MT5 connections", "Copy controls and history"],
  elite: ["Everything in Basic", "MT5 TradeCopy", "Eligible MT5 connections", "Copy controls and history"],
};

export function UserSubscriptionCard() {
  const { user } = useAuth();
  const { data, isLoading, isError, isFetching, refetch } = useCurrentMembership();
  if (!user) return null;
  const plan = data?.pricing_plans;
  const code = String(plan?.maps_to_tier || plan?.code || "").toLowerCase();
  const active = !!data && data.status === "active" && (!data.current_period_end || new Date(data.current_period_end).getTime() > Date.now());
  const fallbackFeatures = FEATURES[code] || [];
  const configuredFeatures = Array.isArray(plan?.features) ? plan.features.filter((x: unknown) => typeof x === "string") : [];
  const features: string[] = configuredFeatures.length ? configuredFeatures : fallbackFeatures;
  return <Card className="mb-4 overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card">
    <CardHeader className="pb-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle className="flex items-center gap-2 text-lg"><Crown className="h-5 w-5 text-primary" />My Botvio Subscription</CardTitle><p className="mt-1 text-sm text-muted-foreground">Your plan automatically controls access to included hubs, signals and tools.</p></div><Badge variant={active ? "default" : "secondary"}>{isLoading ? "Checking…" : isError ? "Unable to load" : active ? "Active" : "No active plan"}</Badge></div></CardHeader>
    <CardContent>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading your subscription…</p> : isError ? <p role="alert" className="text-sm text-destructive">Membership could not be verified. Your plan has not been changed.</p> : active && plan ? <><div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-2xl font-bold">{membershipPlanLabel(code, plan.name)}</h3><p className="mt-1 text-sm text-muted-foreground">${Number(plan.price_usd || 0).toFixed(0)} / month</p></div>{data.current_period_end && <div className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarClock className="h-4 w-4" />Expires {new Date(data.current_period_end).toLocaleDateString()}</div>}</div><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{features.map(feature => <div key={feature} className="flex items-start gap-2 rounded-lg border border-border/60 p-3 text-xs"><CheckCircle2 className="h-4 w-4 shrink-0 text-success" /><span>{feature}</span></div>)}</div></> : <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center"><div><h3 className="font-semibold">Choose a membership</h3><p className="text-sm text-muted-foreground">Choose Starter, Basic, or VIP membership.</p></div><Button asChild><Link to="/choose-plan">View plans</Link></Button></div>}
      <div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" size="sm" disabled={isFetching} onClick={() => refetch()}><RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />Refresh membership</Button>{active && <Button asChild size="sm"><Link to="/signals">Open signals</Link></Button>}</div>
    </CardContent>
  </Card>;
}