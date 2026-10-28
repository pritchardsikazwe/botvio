import { Link } from "react-router-dom";
import { Crown, Star, Zap, ArrowRight, Check } from "lucide-react";
import { Header } from "@/components/trading/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrokerVipOffer } from "@/components/vip/BrokerVipOffer";

const PLANS = [
  { code: "starter", name: "Starter Access", price: 9, icon: Star, desc: "Synthetic + Weltrade hubs, included signals and free courses", features: ["Synthetic Hub + Weltrade Hub", "Included signals", "Free courses and features"] },
  { code: "basic", name: "All-Access", price: 29, icon: Zap, desc: "All hubs, signals, AI robots and eligible premium tools", features: ["Everything in Starter", "All trading hubs and included signals", "Botvio AI Robot + Gold Robot", "Premium tools and eligible courses"] },
  { code: "vip", name: "VIP All-Access", price: 39, icon: Crown, desc: "All-Access plus MT5 TradeCopy", features: ["Everything in All-Access", "MT5 TradeCopy access", "Eligible MT5 connections and copy controls"] },
];

export default function ChoosePlan() {
  return <div className="min-h-screen bg-background"><Header /><main className="container mx-auto max-w-6xl space-y-8 px-4 py-8 md:py-12">
    <div className="space-y-2 text-center"><Badge variant="outline">Account created · Next step</Badge><h1 className="text-3xl font-bold">Choose your Botvio plan</h1><p className="text-muted-foreground">One plan automatically unlocks its included features. You do not need to activate each hub or robot separately.</p></div><BrokerVipOffer />
    <div className="grid gap-4 md:grid-cols-3">{PLANS.map(p => { const Icon = p.icon; const popular = p.code === "basic"; return <Card key={p.code} className={"h-full " + (popular ? "border-2 border-primary shadow-lg" : "")}><CardContent className="flex h-full flex-col space-y-4 p-5"><div className="flex items-center justify-between"><Icon className="h-6 w-6 text-primary" /><Badge variant={popular ? "default" : "outline"}>{popular ? "MOST POPULAR" : p.code === "vip" ? "VIP" : "STARTER"}</Badge></div><div><div className="font-semibold">{p.name}</div><div className="text-3xl font-bold">${p.price}<span className="text-sm font-normal text-muted-foreground">/month</span></div></div><p className="text-sm text-muted-foreground">{p.desc}</p><ul className="flex-1 space-y-2">{p.features.map(f => <li key={f} className="flex gap-2 text-sm"><Check className="h-4 w-4 shrink-0 text-primary" /><span>{f}</span></li>)}</ul><Button asChild className="w-full" variant={popular ? "default" : "outline"}><Link to={"/billing?plan=" + p.code}>Choose plan <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></CardContent></Card>; })}</div>
    <div className="text-center"><Button asChild variant="ghost"><Link to="/broker-onboarding">Continue with free trial <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div>
  </main></div>;
}