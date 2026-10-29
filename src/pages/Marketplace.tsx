import { Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { BotvioPricing } from "@/components/home/BotvioPricing";
import { UserSubscriptionCard } from "@/components/dashboard/UserSubscriptionCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Marketplace() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        seoKey="marketplace"
        title="Botvio Memberships — Starter, Basic & VIP"
        description="Choose a Botvio membership for signals, trading hubs, AI tools and eligible robots. Compare Starter, Basic and VIP monthly plans."
      />
      <Header />
      <main className="container mx-auto max-w-6xl space-y-8 px-4 py-8 md:py-12">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold">Botvio Memberships</h1>
          <p className="max-w-2xl text-muted-foreground">
            Hubs, signals, AI tools and eligible robots are included in your membership. Existing purchases remain valid.
          </p>
        </div>
        <UserSubscriptionCard />
        <BotvioPricing />
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
          <p className="max-w-2xl text-sm text-muted-foreground">
            Membership access begins after payment approval. MT5 connections and trading safety checks remain separate.
          </p>
          <Button asChild variant="outline">
            <Link to="/dashboard">My access <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
