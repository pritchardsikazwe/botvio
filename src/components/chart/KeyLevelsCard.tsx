import { Card, CardContent } from "@/components/ui/card";
import { Shield, TrendingUp, TrendingDown, Target } from "lucide-react";

interface KeyLevelsCardProps {
  metrics: any;
  price: number | null;
}

function fmt(v: any): string {
  if (v == null) return "—";
  return Number(v).toFixed(2);
}

export function KeyLevelsCard({ metrics, price }: KeyLevelsCardProps) {
  const levels = [
    { label: "Resistance 2", value: metrics?.resistance_2, color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" },
    { label: "Resistance 1", value: metrics?.resistance_1, color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" },
    { label: "Day High", value: metrics?.day_high, color: "text-warning", bg: "bg-warning/10 border-warning/20" },
    { label: "Pivot", value: price, color: "text-primary", bg: "bg-primary/10 border-primary/20" },
    { label: "Day Low", value: metrics?.day_low, color: "text-success", bg: "bg-success/10 border-success/20" },
    { label: "Support 1", value: metrics?.support_1, color: "text-success", bg: "bg-success/10 border-success/20" },
    { label: "Support 2", value: metrics?.support_2, color: "text-success", bg: "bg-success/10 border-success/20" },
  ];

  return (
    <Card className="bg-card border-border/50 rounded-xl">
      <CardContent className="p-4 space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" /> Key Levels
        </h3>
        <div className="space-y-1.5">
          {levels.map((lvl, i) => (
            <div
              key={i}
              className={`flex items-center justify-between px-3 py-2 rounded-lg border ${lvl.bg} transition-all`}
            >
              <span className={`text-xs font-bold ${lvl.color}`}>{lvl.label}</span>
              <span className="text-xs font-mono font-extrabold text-foreground">{fmt(lvl.value)}</span>
            </div>
          ))}
        </div>
        {metrics?.current_4h_block && (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30 border border-border/30">
            <span className="text-xs text-muted-foreground font-bold">4H Block</span>
            <span className="text-xs font-bold text-primary">{metrics.current_4h_block}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
