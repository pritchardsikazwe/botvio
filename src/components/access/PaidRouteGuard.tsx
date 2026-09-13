import { ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAccessGate } from "@/hooks/useAccessGate";
import { isPublicPreviewActive } from "@/config/access";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Crown, Sparkles, ArrowRight, Brain, Copy, LineChart, Bot, Users } from "lucide-react";
import { Header } from "@/components/trading/Header";

interface Props {
  children: ReactNode;
}

/**
 * Blocks premium trading routes while keeping public market/SEO content
 * crawlable and accessible to signed-out visitors.
 *
 * Public market pages are informational/lead-generation surfaces. Actual
 * premium signals, bot controls, trading and automated execution remain
 * protected by this guard.
 */
const PUBLIC_SEO_PATHS = new Set([
  "/gold", "/bitcoin", "/btc", "/silver", "/xag", "/gbp-usd",
  "/eur-usd", "/usd-jpy", "/aud-usd", "/usd-cad", "/usd-chf", "/eur-gbp",
  "/eur-jpy", "/nzd-usd", "/usd-cny", "/stocks/nvda", "/stocks/tsla",
  "/stocks/amd", "/stocks/mu", "/stocks/aapl", "/stocks/msft", "/stocks/avgo",
  "/stocks/amzn", "/stocks/meta", "/stocks/googl", "/us30", "/dow", "/dj30",
  "/nas100", "/nasdaq100", "/ustec", "/ger40", "/dax", "/de40", "/weltrade",
  "/synthetic-hub", "/synthetic", "/synthetics",
]);

function isPublicSeoPath(pathname: string) {
  const normalized = pathname.replace(/^\/[a-z]{2}(?:-[A-Z]{2})?(?=\/|$)/, "") || "/";
  return PUBLIC_SEO_PATHS.has(normalized) || /^\/chart\/[^/]+$/.test(normalized);
}

function PublicConversionPanel() {
  return (
    <section className="container mx-auto px-4 pb-8">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background">
        <CardContent className="p-5 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <p className="text-xs font-semibold tracking-wider text-primary uppercase">Continue with Botvio</p>
              <h2 className="text-xl md:text-2xl font-bold mt-1">From market research to action</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Use the public market tools first. Create a free account when you want deeper signals, AI analysis, copy trading and automated strategies.
              </p>
            </div>
            <Button asChild variant="gold" size="lg" className="shrink-0">
              <Link to="/?authRequired=1&next=/dashboard">Create free account <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-5">
            <Link to="/chart/XAUUSD" className="rounded-lg border border-border p-3 hover:border-primary/50 transition-colors">
              <LineChart className="h-4 w-4 text-primary mb-1" /><span className="text-xs font-medium">AI Charts</span>
            </Link>
            <Link to="/signals" className="rounded-lg border border-border p-3 hover:border-primary/50 transition-colors">
              <Sparkles className="h-4 w-4 text-primary mb-1" /><span className="text-xs font-medium">Signals</span>
            </Link>
            <Link to="/copy-trading" className="rounded-lg border border-border p-3 hover:border-primary/50 transition-colors">
              <Copy className="h-4 w-4 text-primary mb-1" /><span className="text-xs font-medium">Copy Trading</span>
            </Link>
            <Link to="/bots" className="rounded-lg border border-border p-3 hover:border-primary/50 transition-colors">
              <Bot className="h-4 w-4 text-primary mb-1" /><span className="text-xs font-medium">AI Bots</span>
            </Link>
            <Link to="/brokers" className="rounded-lg border border-border p-3 hover:border-primary/50 transition-colors">
              <Users className="h-4 w-4 text-primary mb-1" /><span className="text-xs font-medium">Brokers</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 mt-4 text-[11px] text-muted-foreground">
            <Brain className="h-3.5 w-3.5 text-primary" />
            Compare your options before depositing. Trading involves risk and availability varies by country.
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export function PaidRouteGuard({ children }: Props) {
  const location = useLocation();
  const gate = useAccessGate();

  if (isPublicPreviewActive()) return <>{children}</>;

  if (isPublicSeoPath(location.pathname)) {
    return (
      <>
        {children}
        <PublicConversionPanel />
      </>
    );
  }

  if (gate.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground text-sm">Checking access…</div>
      </div>
    );
  }

  if (!gate.isAuthenticated) {
    return <Navigate to={`/?authRequired=1&next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (gate.hasAccess) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10">
        <Card className="max-w-xl mx-auto border-primary/30 bg-gradient-to-br from-primary/10 to-yellow-500/5">
          <CardContent className="py-10 text-center space-y-5">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold">Members-only area</h1>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {gate.trialExpired
                  ? "Your free trial has ended. Upgrade to a paid plan to unlock all trading hubs, live signals and bots — or ask an admin to activate your account."
                  : "This area is reserved for active paid members. Choose a plan to get instant access, or contact an admin to activate your account."}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                <Link to="/billing"><Crown className="mr-2 h-4 w-4" /> View Plans</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/contact"><Sparkles className="mr-2 h-4 w-4" /> Contact Admin</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground pt-2">Admins can activate your account instantly from the admin dashboard.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
