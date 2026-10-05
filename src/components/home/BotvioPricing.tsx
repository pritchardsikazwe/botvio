import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BarChart3, Bot, Sparkles, Zap } from "lucide-react";

const plans = [
  { name: "Synthetic Hub", price: 19, group: "Hubs", description: "Live synthetic-index analysis, signals and trading tools.", icon: Zap },
  { name: "Weltrade Hub", price: 19, group: "Hubs", description: "Weltrade market tools, live analysis and trading insights.", icon: BarChart3 },
  { name: "MT5 Direct Signals", price: 29, group: "Robots & MT5", description: "Send Botvio signals directly to your connected MT5 account.", icon: BarChart3 },
  { name: "Botvio Gold Robot", price: 39, group: "Robots & MT5", description: "Automated gold-focused trading with Botvio's robot workflow.", icon: Bot },
  { name: "Botvio Synthetic Robot", price: 39, group: "Robots & MT5", description: "Automated synthetic-index trading with Botvio.", icon: Bot },
  { name: "Botvio AI Robot", price: 39, group: "Robots & MT5", description: "AI-powered automated trading across supported markets.", icon: Sparkles },
];

export function BotvioPricing() {
  return (
    <section aria-labelledby="botvio-pricing-title" className="space-y-5">
      <div className="text-center max-w-2xl mx-auto">
        <Badge className="mb-2 bg-primary/15 text-primary border-primary/30">Botvio Premium</Badge>
        <h2 id="botvio-pricing-title" className="text-2xl md:text-3xl font-extrabold">Botvio Plans & Pricing</h2>
        <p className="mt-2 text-sm md:text-base text-muted-foreground">
          Choose the hub, direct-signal service or trading robot that fits your workflow.
          Existing account and billing systems remain unchanged.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const Icon = plan.icon;
          return (
            <Card key={plan.name} className="h-full border-primary/15 hover:border-primary/45 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                  <Badge variant="outline" className="text-[10px]">{plan.group}</Badge>
                </div>
                <CardTitle className="text-lg mt-2">{plan.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-3">
                  <span className="text-3xl font-extrabold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground min-h-[42px]">{plan.description}</p>
                <Button asChild className="w-full mt-5 gap-2">
                  <Link to="/billing">Get Started <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Pricing is displayed from the current Botvio product catalogue. Checkout continues through the existing
        billing flow so production users and the current backend are not changed.
      </p>
    </section>
  );
}
