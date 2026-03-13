import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

interface VolatilityCardProps {
  label: string;
  value: string;
  level: "Low" | "Medium" | "High" | "Extreme";
  description?: string;
}

export const VolatilityCard = ({ label, value, level, description }: VolatilityCardProps) => {
  const color = level === "Low" ? "text-success" : level === "Medium" ? "text-warning" : "text-destructive";
  const bg = level === "Low" ? "bg-success/10" : level === "Medium" ? "bg-warning/10" : "bg-destructive/10";
  const pct = level === "Low" ? 25 : level === "Medium" ? 50 : level === "High" ? 75 : 95;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4 text-warning" /> {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-3">
          <div className={`text-3xl font-extrabold font-mono ${color}`}>{value}</div>
          <div className={`px-2 py-0.5 rounded text-xs font-bold ${bg} ${color}`}>{level}</div>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${level === "Low" ? "bg-success" : level === "Medium" ? "bg-warning" : "bg-destructive"}`} style={{ width: `${pct}%` }} />
        </div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
};
