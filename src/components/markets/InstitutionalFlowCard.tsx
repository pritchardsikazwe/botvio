import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Flow {
  label: string;
  value: string;
  direction: "in" | "out";
}

export const InstitutionalFlowCard = ({ flows, bias, title = "Institutional Flow" }: { flows: Flow[]; bias: string; title?: string }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" /> {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {flows.map((f, i) => (
        <div key={i} className="flex items-center justify-between text-xs p-2 rounded bg-secondary/50">
          <span className="text-foreground font-medium">{f.label}</span>
          <div className="flex items-center gap-1.5">
            {f.direction === "in" ? (
              <TrendingUp className="h-3 w-3 text-success" />
            ) : (
              <TrendingDown className="h-3 w-3 text-destructive" />
            )}
            <span className={`font-bold font-mono ${f.direction === "in" ? "text-success" : "text-destructive"}`}>{f.value}</span>
          </div>
        </div>
      ))}
      <div className="p-2 rounded bg-primary/10 text-center">
        <span className="text-xs font-bold text-primary">Net Bias: {bias}</span>
      </div>
    </CardContent>
  </Card>
);
