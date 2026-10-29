import { useMembershipPlans } from "@/hooks/useMembershipPlans";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, Crown, Layers3, Sparkles } from "lucide-react";

const presentation = [
  { code: "starter", name: "Starter", price: 9, description: "Start with Synthetic and Weltrade markets.", icon: Layers3, features: ["Synthetic Hub + Weltrade Hub", "Signals included with both hubs", "Free courses and learning resources", "Free platform features"], badge: "STARTER" },
  { code: "basic", name: "Basic", price: 19, description: "One subscription for the full Botvio trading workspace.", icon: Sparkles, features: ["Everything in Starter", "All trading hubs: Gold, Forex, Crypto, Synthetic and Weltrade", "Botvio AI Robot + Botvio Gold Robot", "Premium Signals and eligible premium tools", "Eligible courses and market analysis"], badge: "MOST POPULAR" },
  { code: "vip", name: "VIP", price: 39, description: "Complete access, including MT5 copy trading.", icon: Crown, features: ["Everything in Basic", "MT5 TradeCopy access", "Eligible MT5 master/follower connections", "Copy-trading controls and history", "Risk settings and eligible provider connections"], badge: "VIP" },
];

export function BotvioPricing() {
  const { plans, isLoading, isError } = useMembershipPlans(presentation);
  return <section aria-labelledby="botvio-pricing-title" className="space-y-5">
    <div className="mx-auto max-w-2xl text-center"><Badge className="mb-2 bg-primary/15 text-primary border-primary/30">BOTVIO MEMBERSHIPS</Badge><h2 id="botvio-pricing-title" className="text-2xl font-extrabold md:text-3xl">One subscription. The access you need.</h2><p className="mt-2 text-sm text-muted-foreground">Choose one plan. Included hubs, signals and robots unlock automatically according to your subscription.</p></div>
    {isLoading && <p className="text-center text-sm text-muted-foreground">Loading memberships…</p>}{isError && <p className="text-center text-sm text-destructive">Membership prices are unavailable. Please try again.</p>}<div className="grid gap-4 md:grid-cols-3">{plans.map((plan) => { const Icon = plan.icon; const popular = plan.code === "basic"; return <Card key={plan.code} className={"relative flex h-full flex-col " + (popular ? "border-2 border-primary shadow-lg" : "border-primary/20")}>
      <CardHeader><div className="flex items-center justify-between gap-2"><div className="rounded-xl bg-primary/10 p-3 text-primary"><Icon className="h-6 w-6" /></div><Badge variant={popular ? "default" : "outline"}>{plan.badge}</Badge></div><CardTitle className="pt-2 text-xl">{plan.name}</CardTitle><p className="text-sm text-muted-foreground">{plan.description}</p><div className="pt-2"><span className="text-4xl font-black">${plan.price}</span><span className="text-sm text-muted-foreground"> / month</span></div></CardHeader>
      <CardContent className="flex flex-1 flex-col"><ul className="flex-1 space-y-2">{plan.features.map(feature => <li key={feature} className="flex items-start gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{feature}</span></li>)}</ul><Button asChild className="mt-6 w-full gap-2" variant={popular ? "default" : "outline"}><Link to={"/payment?plan=" + plan.code}>Choose {plan.name}<ArrowRight className="h-4 w-4" /></Link></Button></CardContent>
    </Card>; })}</div><p className="text-center text-xs text-muted-foreground">Access is granted by the assigned plan. VIP copy trading still requires a valid MT5 connection and applicable safety checks.</p>
  </section>;
}