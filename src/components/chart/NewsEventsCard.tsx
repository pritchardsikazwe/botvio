import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Newspaper, Clock, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";

interface NewsEventsCardProps {
  metrics: any;
}

function Countdown({ targetTime }: { targetTime: string }) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    const update = () => {
      const diff = new Date(targetTime).getTime() - Date.now();
      if (diff <= 0) { setRemaining("Now!"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(`${h}h ${String(m).padStart(2, "0")}m`);
    };
    update();
    const iv = setInterval(update, 60000);
    return () => clearInterval(iv);
  }, [targetTime]);
  return <span className="font-mono text-xs font-bold text-primary">{remaining}</span>;
}

const IMPACT_COLORS: Record<string, string> = {
  High: "bg-destructive/20 text-destructive border-destructive/30",
  Medium: "bg-warning/20 text-warning border-warning/30",
  Low: "bg-muted/30 text-muted-foreground border-border",
};

export function NewsEventsCard({ metrics }: NewsEventsCardProps) {
  const hasLiveEvent = metrics?.next_high_impact_event;
  const isNearNews = hasLiveEvent && metrics?.next_high_impact_time;
  const timeDiff = isNearNews ? new Date(metrics.next_high_impact_time).getTime() - Date.now() : null;
  const isClose = timeDiff != null && timeDiff < 3600000; // within 1 hour

  return (
    <Card className="bg-card border-border/50 rounded-xl">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-destructive" /> News & Events
          </h3>
          {isClose && (
            <Badge className="bg-destructive/20 text-destructive border border-destructive/30 text-[10px] animate-pulse">
              <AlertTriangle className="h-3 w-3 mr-1" /> High-impact approaching
            </Badge>
          )}
        </div>

        {hasLiveEvent ? (
          <div className="bg-destructive/10 border border-destructive/25 rounded-lg px-3 py-3">
            <div className="flex items-center justify-between mb-1">
              <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30 font-bold">
                {metrics.next_high_impact_level || "HIGH IMPACT"}
              </Badge>
              {metrics.next_high_impact_time && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <Countdown targetTime={metrics.next_high_impact_time} />
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-foreground mt-1">
              {metrics.next_high_impact_currency} — {metrics.next_high_impact_event}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              ⚠️ Avoid opening new positions 15 min before this event.
            </p>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground bg-muted/20 rounded-lg px-3 py-3 text-center">
            ✅ No high-impact news scheduled. Safe to trade on technicals.
          </div>
        )}


      </CardContent>
    </Card>
  );
}
