import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useMarketplaceProducts, MarketplaceProduct } from "@/hooks/useMarketplace";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/trading/Header";
import { Link, useNavigate } from "react-router-dom";
import { Bot, ArrowRight, ShieldCheck, Sparkles, Activity, Crown, Rocket, Zap, Check, Link2 } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";

const ROBOT_ORDER = ["gold-robot", "synthetic-robot"];
const PRODUCT_COPY: Record<string, { eyebrow: string; description: string; features: string[]; icon: typeof Bot; accent: string; route?: string }> = {
  "gold-robot": {
    eyebrow: "GOLD AUTOMATION",
    description: "Botvio Gold Robot for XAU/USD workflows, strategy signals, MT5 automation and risk controls.",
    features: ["Gold / XAUUSD strategy", "MT5 automation workflow", "Risk controls before LIVE"],
    icon: Crown,
    accent: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    route: "/gold",
  },
  "synthetic-robot": {
    eyebrow: "SYNTHETIC AUTOMATION",
    description: "Botvio Synthetic Robot for supported Deriv synthetic-index workflows and MT5 execution.",
    features: ["Boom, Crash & Volatility workflows", "Synthetic strategy automation", "Risk controls before LIVE"],
    icon: Rocket,
    accent: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    route: "/synthetic-hub",
  },
};

const Bots = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: products, isLoading } = useMarketplaceProducts();
  const { data: entitlements } = useEntitlements();

  const robots = useMemo(
    () => (products ?? [])
      .filter((p) => ROBOT_ORDER.includes(p.slug))
      .sort((a, b) => ROBOT_ORDER.indexOf(a.slug) - ROBOT_ORDER.indexOf(b.slug)),
    [products],
  );

  const isOwned = (product: MarketplaceProduct) =>
    entitlements?.some((e) =>
      e.product_id === product.id &&
      e.status === "active" &&
      (!e.ends_at || new Date(e.ends_at).getTime() > Date.now())
    ) ?? false;

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <Bot className="mx-auto h-14 w-14 text-primary" />
          <h1 className="mt-4 text-2xl font-black">Sign in to access Botvio AI Robots</h1>
          <p className="mt-2 text-sm text-muted-foreground">Choose a robot, activate access, then connect your MT5 account.</p>
          <Button className="mt-5" onClick={() => navigate("/")}>Go to Home</Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        seoKey="bots"
        title="Botvio AI Trading Robots"
        description="Botvio Gold Robot and Synthetic Robot automation with MT5 execution, risk controls and demo-first setup."
      />
      <Header />

      <main className="container mx-auto max-w-6xl px-4 py-6 md:py-8 space-y-6">
        <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-success/5 p-6 md:p-9">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge className="mb-3 gap-1 bg-primary/10 text-primary hover:bg-primary/10">
                <Sparkles className="h-3 w-3" /> BOTVIO AUTOMATION
              </Badge>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">AI Trading Robots</h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">
                This is the current Botvio robot area. Choose a supported robot, activate its subscription in the Botvio Store,
                connect your own MT5 account and keep LIVE execution behind the safety controls.
              </p>
            </div>
            <div className="rounded-2xl border border-success/20 bg-background/70 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-success">
                <ShieldCheck className="h-4 w-4" /> Demo-first
              </div>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">Test your workflow before enabling LIVE execution.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {isLoading ? [1, 2].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl border border-border/50 bg-card/60" />
          )) : robots.map((product) => {
            const copy = PRODUCT_COPY[product.slug];
            const Icon = copy.icon;
            const owned = isOwned(product);
            return (
              <Card key={product.id} className="overflow-hidden border-border/60 bg-card/80">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className={"flex h-12 w-12 items-center justify-center rounded-2xl border " + copy.accent}>
                      <Icon className="h-6 w-6" />
                    </div>
                    {owned ? (
                      <Badge className="border border-success/30 bg-success/10 text-success"><Check className="mr-1 h-3 w-3" /> Active</Badge>
                    ) : (
                      <Badge variant="outline">ROBOT</Badge>
                    )}
                  </div>
                  <p className="mt-5 text-[10px] font-black tracking-[0.16em] text-primary">{copy.eyebrow}</p>
                  <h2 className="mt-1 text-2xl font-black">{product.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.description}</p>
                  <div className="mt-5 space-y-2">
                    {copy.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Check className="h-3.5 w-3.5 text-success" /> {feature}
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button asChild>
                      <Link to={owned ? (copy.route || "/dashboard") : "/marketplace?product=" + product.slug}>
                        {owned ? "Open Robot" : "Get Robot"} <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to="/connections"><Link2 className="mr-2 h-4 w-4" /> MT5 Connections</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        {!isLoading && robots.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Bot className="mx-auto h-10 w-10 text-muted-foreground" />
              <h2 className="mt-3 font-bold">Robots are being configured</h2>
              <p className="mt-1 text-sm text-muted-foreground">Open the Botvio Store to see the currently available products.</p>
              <Button className="mt-4" asChild><Link to="/marketplace">Open Botvio Store</Link></Button>
            </CardContent>
          </Card>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Zap, title: "1. Choose a robot", text: "Gold or Synthetic automation based on the market you want to trade." },
            { icon: Activity, title: "2. Connect MT5", text: "Use your own connected MT5 account. Demo is recommended before LIVE." },
            { icon: ShieldCheck, title: "3. Control execution", text: "Manage signal delivery, lot size, confidence and LIVE confirmation from Connections." },
          ].map(({ icon: Icon, title, text }) => (
            <Card key={title} className="border-border/50 bg-card/50">
              <CardContent className="p-5">
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="mt-3 font-bold">{title}</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold">Need signals without automation?</h3>
              <p className="mt-1 text-xs text-muted-foreground">Use the Signals Center or MT5 Direct Signals instead of a robot.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild><Link to="/signals">Signals</Link></Button>
              <Button variant="outline" asChild><Link to="/marketplace?product=mt5-direct">MT5 Direct</Link></Button>
              <Button variant="outline" asChild><Link to="/marketplace">Botvio Store</Link></Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Bots;
