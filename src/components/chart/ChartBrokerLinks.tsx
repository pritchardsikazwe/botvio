import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Clock, BarChart3, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const DERIV_LINK = "https://deriv.partners/rx?sidi=F9C8D3BF-5854-499A-8497-F5C370F804UC&utm_campaign=dynamicworks&utm_medium=affiliate&utm_source=CU23827";

const DERIV_ADVANTAGES = [
  { icon: Clock, text: "Trade 24/7 on synthetics — no market closures" },
  { icon: BarChart3, text: "Start with $1 — low barrier, high flexibility" },
  { icon: Globe, text: "Unique Derived indices unavailable elsewhere" },
];

export function ChartBrokerLinks() {
  return (
    <Card className="bg-card border-border/50 rounded-xl">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-primary" />
            Trade Synthetic Indices
          </h3>
          <Badge className="bg-destructive/20 text-destructive border-0 text-[10px]">24/7</Badge>
        </div>

        <ul className="space-y-1.5">
          {DERIV_ADVANTAGES.map((adv, i) => {
            const Icon = adv.icon;
            return (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <Icon className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                {adv.text}
              </li>
            );
          })}
        </ul>

        <a href={DERIV_LINK} target="_blank" rel="noopener noreferrer">
          <Button size="sm" className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold">
            Open Deriv Account →
          </Button>
        </a>

        <p className="text-[9px] text-muted-foreground leading-relaxed">
          ⚠️ Trading involves risk. Capital is at risk. Links contain affiliate referrals.
        </p>
      </CardContent>
    </Card>
  );
}
