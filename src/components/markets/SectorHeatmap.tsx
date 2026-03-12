import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Sector { name: string; change: number }

export const SectorHeatmap = ({ sectors, title = "Sector Performance" }: { sectors: Sector[]; title?: string }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-2">
        {sectors.map((s) => (
          <div key={s.name} className={`p-2 rounded text-xs font-bold text-center ${s.change > 0 ? "bg-success/15 text-success" : s.change < 0 ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"}`}>
            <div className="font-medium text-foreground/70 text-[10px]">{s.name}</div>
            {s.change > 0 ? "+" : ""}{s.change.toFixed(1)}%
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);
