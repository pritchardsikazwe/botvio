import { Link } from "react-router-dom";
import { Crown, Star, Zap, Gift, ArrowRight } from "lucide-react";
import { Header } from "@/components/trading/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrokerVipOffer } from "@/components/vip/BrokerVipOffer";

const PLANS = [
  { name: "Starter", price: "$9/mo", icon: Star, desc: "Signals and chart analysis" },
  { name: "Basic", price: "$19/mo", icon: Zap, desc: "More analyses and copy trading" },
  { name: "VIP", price: "$39/mo", icon: Crown, desc: "Unlimited access to all tools" },
];

export default function ChoosePlan() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-4xl space-y-8 px-4 py-8 md:py-12">
        <div className="space-y-2 text-center">
          <Badge variant="outline">Account created · Next step</Badge>
          <h1 className="text-3xl font-bold">Choose your plan</h1>
          <p className="text-muted-foreground">Pick a paid plan, unlock VIP free through a partner broker account, or continue on the free trial.</p>
        </div>
        <BrokerVipOffer />
        <div className="grid gap-4 sm:grid-cols-3">
          {PLANS.map((p) => { const Icon = p.icon; return (
            <Card key={p.name}><CardContent className="space-y-3 p-5">
              <Icon className="h-6 w-6 text-primary" />
              <div><div className="font-semibold">{p.name}</div><div className="text-2xl font-bold">{p.price}</div></div>
              <p className="text-sm text-muted-foreground">{p.desc}</p>
              <Button asChild className="w-full" variant="outline"><Link to="/marketplace">Subscribe</Link></Button>
            </CardContent></Card>
          ); })}
        </div>
        <div className="text-center">
          <Button asChild variant="ghost"><Link to="/broker-onboarding"><Gift className="mr-2 h-4 w-4" />Continue with free trial <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </div>
      </main>
    </div>
  );
}
