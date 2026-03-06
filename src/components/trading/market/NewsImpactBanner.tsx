import { Newspaper, AlertTriangle, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface NewsEvent {
  event: string;
  currency: string;
  level: string;
  time: string;
}

function Countdown({ targetTime }: { targetTime: string }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(targetTime).getTime() - Date.now();
      if (diff <= 0) { setRemaining("Now"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(`${h}h ${String(m).padStart(2, "0")}m`);
    };
    update();
    const iv = setInterval(update, 60000);
    return () => clearInterval(iv);
  }, [targetTime]);

  return <span className="font-mono text-xs font-bold">{remaining}</span>;
}

interface NewsImpactBannerProps {
  newsEvents: NewsEvent[];
}

export function NewsImpactBanner({ newsEvents }: NewsImpactBannerProps) {
  if (!newsEvents.length) return null;

  const upcoming = newsEvents
    .filter((e) => new Date(e.time).getTime() > Date.now())
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
    .slice(0, 4);

  if (!upcoming.length) return null;

  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <span className="text-sm font-bold text-destructive">
          High-Impact News Today
        </span>
        <Newspaper className="h-4 w-4 text-destructive/60" />
      </div>
      <div className="flex flex-wrap gap-2">
        {upcoming.map((ev, i) => (
          <div
            key={i}
            className="flex items-center gap-2 bg-background/80 rounded-lg border border-destructive/20 px-3 py-1.5"
          >
            <Badge
              variant="outline"
              className="text-[10px] py-0 border-destructive/40 text-destructive font-bold"
            >
              {ev.currency}
            </Badge>
            <span className="text-xs text-foreground font-medium truncate max-w-[160px]">
              {ev.event}
            </span>
            <div className="flex items-center gap-1 text-destructive">
              <Clock className="h-3 w-3" />
              <Countdown targetTime={ev.time} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
