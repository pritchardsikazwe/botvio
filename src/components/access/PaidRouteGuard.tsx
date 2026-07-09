import { ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAccessGate } from "@/hooks/useAccessGate";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Crown, Sparkles } from "lucide-react";
import { Header } from "@/components/trading/Header";

interface Props {
  children: ReactNode;
}

/**
 * Blocks premium routes (trading hubs, signals, bots) unless the visitor:
 *  - is an admin/signal-manager, OR
 *  - has an active paid subscription, OR
 *  - is still within their free-trial window.
 *
 * Non-authenticated users are sent to `/` with a return path so they can
 * sign in and come back. Authenticated but unpaid + trial-expired users see
 * a full-page lock screen that routes them to /billing.
 */
export function PaidRouteGuard({ children }: Props) {
  const location = useLocation();
  const gate = useAccessGate();

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
            <p className="text-xs text-muted-foreground pt-2">
              Admins can activate your account instantly from the admin dashboard.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}