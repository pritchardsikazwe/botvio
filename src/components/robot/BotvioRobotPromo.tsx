import { Bot, CheckCircle2, Cpu, Gauge, Link2, Radio, ShieldCheck, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STEPS = [
  { icon: Radio, title: "AI market scan", text: "Botvio evaluates supported markets on the server." },
  { icon: Cpu, title: "Signal generated", text: "The robot creates a BUY or SELL setup with risk levels." },
  { icon: Link2, title: "MT5 delivery", text: "Eligible signals are queued to your connected MT5 Bridge." },
  { icon: ShieldCheck, title: "Risk controls", text: "You choose the lot size, confidence threshold and auto-execute setting." },
];

export function BotvioRobotPromo({ compact = false }: { compact?: boolean }) {
  return (
    <section className={compact ? "rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-success/5 p-5" : "border-y border-primary/15 bg-gradient-to-br from-primary/5 via-background to-success/5"}>
      <div className={compact ? "" : "container mx-auto px-4 py-12 sm:py-16"}>
        <div className={compact ? "" : "grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-center"}>
          <div>
            <Badge className="mb-3 gap-2 bg-primary/10 text-primary hover:bg-primary/10">
              <Bot className="h-3.5 w-3.5" /> BOTVIO AI ROBOT
            </Badge>
            <h2 className="text-2xl font-black sm:text-3xl">AI-generated signals sent to MT5</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              Botvio Robot scans supported markets, generates structured trade setups and can route eligible signals to your connected MT5 terminal through the Botvio Bridge EA.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
              {["Server-side scanning", "BUY / SELL signals", "SL / TP", "MT5 Bridge", "Risk controls"].map(x => (
                <span key={x} className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/70 px-2.5 py-1.5">
                  <CheckCircle2 className="h-3 w-3 text-success" />{x}
                </span>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild><Link to="/botvio-robot"><Bot className="mr-2 h-4 w-4" />Open Botvio Robot</Link></Button>
              <Button asChild variant="outline"><Link to="/connections"><Link2 className="mr-2 h-4 w-4" />Connect MT5</Link></Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {STEPS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-border/60 bg-card/75 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
                  <h3 className="text-sm font-bold">{title}</h3>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
