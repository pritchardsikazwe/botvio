import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Bot, ShieldCheck, Activity, Sparkles } from "lucide-react";

/** Homepage feature promotion. Checkout stays in Botvio's existing billing flow. */
export function BotvioRobotPromo() {
  return (
    <section aria-labelledby="botvio-robot-title" className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-slate-950 via-emerald-950/80 to-background shadow-xl">
      <div className="grid items-center gap-5 p-5 sm:p-7 md:grid-cols-2 md:gap-8 md:p-10">
        <div className="order-2 md:order-1">
          <Badge className="mb-3 border-amber-400/30 bg-amber-400/10 text-amber-300">
            <Sparkles className="mr-1 h-3 w-3" /> BOTVIO AUTOMATION
          </Badge>
          <h2 id="botvio-robot-title" className="text-2xl font-black leading-tight text-white sm:text-3xl md:text-4xl">
            Meet the Botvio AI Robot
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-200 sm:text-base">
            Bring your trading workflow together with Botvio’s robot tools, market analysis and supported MT5 integrations. Review the plan and setup requirements before subscribing.
          </p>
          <div className="mt-5 grid gap-2 text-xs text-slate-200 sm:grid-cols-3 sm:text-sm">
            <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-emerald-300" /> Market tools</div>
            <div className="flex items-center gap-2"><Bot className="h-4 w-4 text-amber-300" /> Robot options</div>
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" /> Risk controls</div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" className="gap-2 bg-amber-400 font-extrabold text-slate-950 hover:bg-amber-300">
              <Link to="/billing">Rent Botvio Robot <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/5 font-bold text-white hover:bg-white/10 hover:text-white">
              <Link to="/auto-trade">Explore Robot</Link>
            </Button>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-300">
            Trading involves risk; results are not guaranteed. Use demo testing and appropriate risk limits. Robot access may require account connection and approval.
          </p>
        </div>
        <div className="order-1 flex items-center justify-center md:order-2">
          <img
            src="/botvio-robot.svg"
            alt="Botvio AI Robot illustration with market chart displays"
            className="h-auto w-full max-w-md drop-shadow-2xl"
            loading="eager"
            fetchPriority="high"
          />
        </div>
      </div>
    </section>
  );
}
