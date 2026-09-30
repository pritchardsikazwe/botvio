import { Badge } from "@/components/ui/badge";
import { useTradeCopyStatus } from "@/hooks/useTradeCopy";

export function EnvBadge({ env }: { env: "DEMO" | "LIVE" }) {
  return env === "LIVE"
    ? <Badge variant="destructive">LIVE</Badge>
    : <Badge variant="secondary">DEMO</Badge>;
}

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const s = status ?? "unknown";
  const variant = s === "active" || s === "connected" ? "default" : s === "error" ? "destructive" : "outline";
  return <Badge variant={variant} className="capitalize">{s}</Badge>;
}

/** Shows when the backend is running the mock adapter (no real TradeCopy calls). */
export function AdapterModeNotice() {
  const { data } = useTradeCopyStatus();
  if (!data) return null;
  if (data.adapterMode === "mock") {
    return <p className="rounded-lg border border-border/50 bg-muted/30 p-2 text-xs text-muted-foreground">Test mode: TradeCopy isn't connected yet, so actions are simulated and no real orders are sent.</p>;
  }
  return data.liveEnabled ? null : <p className="rounded-lg border border-border/50 bg-muted/30 p-2 text-xs text-muted-foreground">Live copy trading is switched off for the platform. Demo accounts work normally.</p>;
}
