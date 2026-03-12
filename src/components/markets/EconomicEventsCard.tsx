import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface EconomicEvent {
  time: string;
  currency: string;
  event: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
}

export const EconomicEventsCard = ({ events, title = "Economic Events" }: { events: EconomicEvent[]; title?: string }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-warning" /> {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {events.map((e, i) => (
        <div key={i} className="flex items-center justify-between text-xs p-2 rounded bg-secondary/50">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-mono">{e.currency}</Badge>
            <span className="text-foreground font-medium">{e.event}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-mono">{e.time}</span>
            <Badge className={`text-[10px] ${e.impact === "HIGH" ? "bg-destructive/20 text-destructive border-destructive/30" : e.impact === "MEDIUM" ? "bg-warning/20 text-warning border-warning/30" : "bg-muted text-muted-foreground border-border"}`}>
              {e.impact}
            </Badge>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);
