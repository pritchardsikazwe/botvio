import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Bot, ChartNoAxesCombined, Crown, Lock, Zap } from "lucide-react";

const PRODUCT_ORDER = ["mt5-direct", "gold-robot", "synthetic-robot", "synthetic-hub", "weltrade-hub"];

const FALLBACK = [
  { name: "MT5 Direct Signals", slug: "mt5-direct", type: "execution", description: "Send Botvio signals directly to your connected MT5.", price_usd: 29, billing_type: "recurring", billing_interval: "month", icon: Crown },
  { name: "Botvio Gold Robot", slug: "gold-robot", type: "bot", description: "MT5 automation for Botvio Gold strategies.", price_usd: 39, billing_type: "recurring", billing_interval: "month", icon: Bot },
  { name: "Botvio Synthetic Robot", slug: "synthetic-robot", type: "bot", description: "MT5 automation for Deriv synthetic strategies.", price_usd: 39, billing_type: "recurring", billing_interval: "month", icon: Bot },
  { name: "Synthetic Hub", slug: "synthetic-hub", type: "hub", description: "Deriv synthetic indices, live signals and analysis.", price_usd: 19, billing_type: "recurring", billing_interval: "month", icon: Zap },
  { name: "Weltrade Hub", slug: "weltrade-hub", type: "hub", description: "Weltrade SyntX markets, signals and MT5 workflows.", price_usd: 19, billing_type: "recurring", billing_interval: "month", icon: ChartNoAxesCombined },
];

export function BotvioPricingSection() {
  const { data } = useQuery({
    queryKey: ["home-botvio-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id,name,slug,type,short_description,price_usd,billing_type,billing_interval,is_featured,is_active").in("slug", PRODUCT_ORDER);
      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });

  const products = data?.length ? PRODUCT_ORDER.map((slug) => data.find((p) => p.slug === slug)).filter(Boolean).map((p: any) => ({ ...p, icon: p.type === "bot" ? Bot : p.slug.includes("synthetic") ? Zap : p.slug.includes("mt5") ? Crown : ChartNoAxesCombined })) : FALLBACK;

  return (
    <section className="border-y border-border/50 bg-card/20">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/10">BOTVIO ACCESS</Badge>
          <h2 className="text-3xl font-black sm:text-4xl">Choose what you want to unlock</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Hubs, robots and MT5 execution are separate products. Subscribe only to what you need.</p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {products.map((p: any) => {
            const Icon = p.icon;
            const parsedPrice = Number(p.price_usd);
            const price = Number.isFinite(parsedPrice) ? parsedPrice : null;
            const configured = price !== null && price > 0;
            return (
              <Card key={p.id || p.slug} className="border-border/60 bg-card/80 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div><Badge variant="outline">{p.type === "bot" ? "Robot" : p.type === "execution" ? "Execution" : "Hub"}</Badge></div>
                  <h3 className="mt-4 font-bold">{p.name}</h3>
                  <p className="mt-2 min-h-10 text-xs leading-5 text-muted-foreground">{p.short_description || p.description || "Botvio premium access."}</p>
                  <div className="mt-4 flex items-end justify-between gap-2"><div>{configured ? <><span className="text-2xl font-black">${price}</span><span className="text-xs text-muted-foreground">/{p.billing_interval || "month"}</span></> : <span className="text-sm font-semibold text-muted-foreground">Pricing in setup</span>}</div><Lock className="h-4 w-4 text-muted-foreground" /></div>
                  <Button asChild className="mt-5 w-full font-bold" variant={configured ? "default" : "outline"}><Link to={p.slug === "mt5-direct" ? "/marketplace?product=mt5-direct" : "/marketplace"}>{configured ? "View plans" : "View access"}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <div className="mt-6 flex justify-center"><Button variant="ghost" asChild className="font-semibold"><Link to="/marketplace">View all Botvio products <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div>
      </div>
    </section>
  );
}