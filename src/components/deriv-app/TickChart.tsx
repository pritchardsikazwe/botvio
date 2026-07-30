import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface TickChartProps {
  ticks: number[];
  height?: number;
  /** Live prediction overlay */
  prediction?: { direction: "RISE" | "FALL" | "NEUTRAL"; confidence: number; label?: string } | null;
  onDismissPrediction?: () => void;
}

/** Real-time Deriv tick line chart (SVG, no deps) */
export const TickChart = ({ ticks, height = 220, prediction, onDismissPrediction }: TickChartProps) => {
  const W = 600;
  const H = height;
  const data = ticks.slice(-120);

  const { path, area, lastX, lastY, min, max } = useMemo(() => {
    if (data.length < 2) return { path: "", area: "", lastX: 0, lastY: H / 2, min: 0, max: 0 };
    const lo = Math.min(...data);
    const hi = Math.max(...data);
    const span = hi - lo || 1;
    const pad = 18;
    const pts = data.map((v, i) => {
      const x = (i / (data.length - 1)) * (W - 70);
      const y = pad + (1 - (v - lo) / span) * (H - pad * 2);
      return [x, y] as const;
    });
    const d = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
    const last = pts[pts.length - 1];
    return {
      path: d,
      area: `${d} L${last[0].toFixed(2)},${H} L0,${H} Z`,
      lastX: last[0],
      lastY: last[1],
      min: lo,
      max: hi,
    };
  }, [data, H]);

  const rising = data.length > 1 && data[data.length - 1] >= data[0];
  const stroke = rising ? "hsl(var(--success))" : "hsl(var(--destructive))";
  const last = data[data.length - 1];

  return (
    <div className="relative rounded-xl border border-border/60 bg-card/60 overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" role="img" aria-label="Live tick chart">
        <defs>
          <linearGradient id="tickFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="hsl(var(--border))" strokeOpacity="0.4" strokeWidth="1" />
        ))}
        {path && <path d={area} fill="url(#tickFill)" />}
        {path && <path d={path} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
        {path && (
          <>
            <line x1={lastX} x2={W} y1={lastY} y2={lastY} stroke={stroke} strokeDasharray="4 4" strokeWidth="1" />
            <circle cx={lastX} cy={lastY} r="5" fill="hsl(var(--background))" stroke={stroke} strokeWidth="3" />
          </>
        )}
      </svg>

      {last != null && (
        <div
          className="absolute right-2 px-2 py-1 rounded-md text-xs font-bold tabular-nums bg-background border"
          style={{ top: `${Math.max(4, Math.min(H - 28, (lastY / H) * H - 12))}px`, borderColor: stroke, color: stroke }}
        >
          {last}
        </div>
      )}

      {prediction && prediction.direction !== "NEUTRAL" && (
        <div
          className={cn(
            "absolute top-3 right-3 w-40 rounded-xl border-2 bg-background/95 backdrop-blur px-3 py-2 shadow-lg",
            prediction.direction === "RISE" ? "border-success/70" : "border-destructive/70",
          )}
        >
          {onDismissPrediction && (
            <button
              onClick={onDismissPrediction}
              aria-label="Dismiss signal"
              className="absolute top-1 right-1.5 text-muted-foreground text-xs"
            >
              ×
            </button>
          )}
          <p className="text-[9px] font-bold tracking-widest text-muted-foreground">
            ⚡ {prediction.label ?? "NEXT TICKS"}
          </p>
          <p className={cn("text-lg font-black leading-tight", prediction.direction === "RISE" ? "text-success" : "text-destructive")}>
            {prediction.direction === "RISE" ? "▲ UP" : "▼ DOWN"}
          </p>
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
              <div
                className={cn("h-full", prediction.direction === "RISE" ? "bg-success" : "bg-destructive")}
                style={{ width: `${prediction.confidence}%` }}
              />
            </div>
            <span className="text-[10px] font-bold tabular-nums">{prediction.confidence}%</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-3 py-1.5 border-t border-border/50 text-[10px] text-muted-foreground tabular-nums">
        <span>Low {min || "—"}</span>
        <span>{data.length} ticks</span>
        <span>High {max || "—"}</span>
      </div>
    </div>
  );
};
