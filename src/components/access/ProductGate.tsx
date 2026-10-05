import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useHasEntitlement } from "@/hooks/useEntitlements";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, ArrowRight } from "lucide-react";

export function ProductGate({ slug, title, description, children }: { slug: string; title: string; description: string; children: ReactNode }) {
  const allowed = useHasEntitlement(slug);
  if (allowed) return <>{children}</>;

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="max-w-lg w-full border-primary/20 shadow-xl">
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Lock className="h-7 w-7" /></div>
          <Badge variant="outline" className="mb-3">SUBSCRIPTION REQUIRED</Badge>
          <h1 className="text-2xl font-black">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
          <Button asChild className="mt-6 w-full font-bold"><Link to={"/marketplace?product=" + encodeURIComponent(slug)}>VIEW PLANS <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          <Button asChild variant="ghost" className="mt-2 w-full"><Link to="/marketplace">VIEW ALL BOTVIO PRODUCTS</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
