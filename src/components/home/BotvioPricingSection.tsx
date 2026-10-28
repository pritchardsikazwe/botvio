import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, Crown, Layers3, Sparkles } from "lucide-react";

const PLANS = [
  { code: "starter", name: "Starter Access", price: 9, icon: Layers3, description: "Synthetic + Weltrade hubs, included signals, free courses and platform features.", features: ["Synthetic Hub", "Weltrade Hub", "Signals included with both hubs", "Free courses and resources"] },
  { code: "standard", name: "All-Access", price: 29, icon: Sparkles, description: "Every trading hub, included signals, AI robots and eligible premium tools.", features: ["All trading hubs", "Botvio AI + Gold Robots", "Premium Signals", "Eligible premium tools and courses"] },
  { code: "vip", name: "VIP All-Access", price: 39, icon: Crown, description: "All-Access plus MT5 TradeCopy.", features: ["Everything in All-Access", "MT5 TradeCopy", "Eligible master/follower connections", "Copy settings and history"] },
];

export function BotvioPricingSection() {
  return <section className="border-y border-border/50 bg-card/20"><div className="container mx-auto px-4 py-12 sm:py-16">
    <div className="mx-auto max-w-2xl text-center"><Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/10">BOTVIO ACCESS</Badge><h2 className="text-3xl font-black sm:text-4xl">Choose your Botvio membership</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">One subscription controls access to all features included in your plan. No separate activation for individual hubs or robots.</p></div>
    <div className="mt-8 grid gap-4 md:grid-cols-3">{PLANS.map(plan => { const Icon = plan.icon; const popular = plan.code === "standard"; return <Card key={plan.code} className={"relative border-border/60 bg-card/80 " + (popular ? "border-2 border-primary shadow-xl" : "")}><CardContent className="p-5">
      <div className="flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div><Badge variant={popular ? "default" : "outline"}>{popular ? "MOST POPULAR" : plan.code === "vip" ? "VIP" : "STARTER"}</Badge></div>
      <h3 className="mt-4 text-xl font-bold">{plan.name}</h3><p className="mt-2 min-h-12 text-sm text-muted-foreground">{plan.description}</p><div className="mt-4"><span className="text-3xl font-black">${plan.price}</span><span className="text-sm text-muted-foreground">/month</span></div><ul className="mt-4 space-y-2">{plan.features.map(feature => <li key={feature} className="flex items-start gap-2 text-xs"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{feature}</span></li>)}</ul><Button asChild className="mt-5 w-full font-bold" variant={popular ? "default" : "outline"}><Link to={"/billing?plan=" + plan.code}>View plan <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
    </CardContent></Card>; })}</div>
    <div className="mt-6 flex justify-center"><Button variant="ghost" asChild className="font-semibold"><Link to="/dashboard">View my access <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div>
  </div></section>;
}