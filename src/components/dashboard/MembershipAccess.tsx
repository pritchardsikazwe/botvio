import { Link } from "react-router-dom";
import { ArrowUpRight, Bot, ChartNoAxesCombined, CheckCircle2, Layers3, Signal, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentMembership } from "@/hooks/useCurrentMembership";
import { membershipDestinations } from "@/lib/currentMembership";

export function MembershipAccess() {
  const membership = useCurrentMembership();
  const plan = membership.data?.pricing_plans;
  const items = membershipDestinations(plan?.maps_to_tier || plan?.code);
  if (!items.length) return null;
  return <section aria-label="Included membership access" className="mb-6">
    <h2 className="mb-3 text-base font-semibold">Included in your membership</h2>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{items.map(item => {
      const Icon = item.kind === "hub" ? Layers3 : item.kind === "robot" ? Bot : item.kind === "connection" ? Wallet : item.kind === "tool" ? ChartNoAxesCombined : Signal;
      return <Button key={item.id} variant="outline" asChild className="h-auto min-h-24 justify-start gap-3 whitespace-normal bg-card p-4 text-left"><Link to={item.href}>
        <Icon className="h-5 w-5 shrink-0 text-primary" /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{item.name}</span><span className="mt-2 flex items-center gap-1 text-xs font-normal text-success"><CheckCircle2 className="h-3 w-3" />Included</span></span><ArrowUpRight className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />
      </Link></Button>;
    })}</div>
  </section>;
}