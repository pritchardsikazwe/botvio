import { Link } from "react-router-dom";
import { ArrowRight, Clock3, Crosshair, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SIGNAL_MODES = [
  { tf: "1M", name: "SCALPING", expiry: "5 min", detail: "Fast entries for short-term setups.", icon: Crosshair },
  { tf: "15M", name: "INTRADAY", expiry: "1 hour", detail: "Session-based setups with broader confirmation.", icon: Timer },
  { tf: "1H", name: "SWING", expiry: "4 hours", detail: "Larger moves with higher-timeframe structure.", icon: Clock3 },
  { tf: "1D", name: "POSITION", expiry: "3 days", detail: "Daily setups designed for extended moves.", icon: Clock3 },
];

export function SignalModesGuide({ compact = false }: { compact?: boolean }) {
  return (
    <section className={compact ? "mb-6" : "my-8"}>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">SIGNAL ENGINE</Badge>
          <h2 className="mt-1 text-xl font-black sm:text-2xl">Choose your signal timeframe</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
            Every strategy is evaluated across four trading horizons. The expiry tells you how long the published setup is designed to remain valid.
          </p>
        </div>
        {!compact && <Link to="/signals" className="text-xs font-bold text-primary">View live signals <ArrowRight className="ml-1 inline h-3 w-3" /></Link>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SIGNAL_MODES.map(({ tf, name, expiry, detail, icon: Icon }) => (
          <Link key={tf} to={`/signals?timeframe=${tf === "1M" ? "M1" : tf === "15M" ? "M15" : tf === "1H" ? "H1" : "D1"}`} className="group rounded-2xl border border-border/60 bg-card/70 p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
              <Badge variant="outline" className="text-[9px] font-black">{tf}</Badge>
            </div>
            <div className="mt-3 text-sm font-black tracking-wide">{name}</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-primary"><Timer className="h-3 w-3" />{expiry} expiry</div>
            <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{detail}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
