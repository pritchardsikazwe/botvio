import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useHasEntitlement } from "@/hooks/useEntitlements";
import { useGlobalAccess } from "@/hooks/useGlobalAccess";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, ArrowRight } from "lucide-react";

export function ProductGate({ slug, title, description, children }: { slug: string; title: string; description: string; children: ReactNode }) {
  const allowed = useHasEntitlement(slug);
  const globalAccess = useGlobalAccess();
  if (allowed || globalAccess) return <>{children}</>;

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="max-w-lg w-full border-primary/20 shadow-xl">
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Lock className="h-7 w-7" /></div>
          <Badge variant="outline" className="mb-3">BOTVIO MEMBERSHIP</Badge>
          <h1 className="text-2xl font-black">{title.replace(/subscription required/i, "is included in membership")}</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">One membership unlocks the trading hubs, signals and AI tools — no separate product purchases.</p>
          <ul className="mt-4 space-y-1 text-left text-sm text-muted-foreground">
            <li><span className="font-semibold text-foreground">Starter $9</span> — Synthetic & Weltrade hubs, signals</li>
            <li><span className="font-semibold text-foreground">Basic $19</span> — all trading hubs, signals and AI tools</li>
            <li><span className="font-semibold text-foreground">VIP $39</span> — everything, including premium robots</li>
          </ul>
          <Button asChild className="mt-6 w-full font-bold"><Link to="/choose-plan">CHOOSE A MEMBERSHIP <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          <Button asChild variant="ghost" className="mt-2 w-full"><Link to="/auth?next=/choose-plan">Already a member? Sign in</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
