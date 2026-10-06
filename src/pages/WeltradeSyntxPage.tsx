import { Link, useParams } from "react-router-dom";
import { ArrowRight, BarChart3, ChevronRight, Activity, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WELTRADE_INSTRUMENTS } from "@/config/weltradeInstruments";
import { WeltradeSignalsEngine } from "@/components/weltrade/WeltradeSignalsEngine";

const slugify = (label: string) => label.toLowerCase().replace(/max\\s+/g, "max-").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function WeltradeSyntxPage() {
  const { symbol } = useParams<{ symbol?: string }>();
  const isSignals = !symbol;
  const normalized = (symbol || "").toLowerCase().replace(/\\//g, "-");
  const instrument = symbol ? WELTRADE_INSTRUMENTS.find((i) => i.category === "syntx" && (i.key === normalized || slugify(i.label) === normalized)) : undefined;
  if (symbol && !instrument) return null;
  const title = isSignals ? "Weltrade SyntX Signals" : instrument!.label + " Signals & Live Market Data";
  const description = isSignals ? "Weltrade SyntX signals, market analysis and live instrument coverage from Botvio." : "Track " + instrument!.label + " on Botvio with live market data, chart analysis and SyntX signal tools.";
  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-border/50 bg-gradient-to-b from-primary/10 to-background"><div className="container mx-auto max-w-6xl px-4 py-8">
        <nav className="mb-4 flex items-center gap-1 text-xs text-muted-foreground"><Link to="/weltrade" className="hover:text-primary">Weltrade</Link><ChevronRight className="h-3 w-3" /><Link to="/weltrade/signals" className="hover:text-primary">SyntX Signals</Link>{!isSignals && <><ChevronRight className="h-3 w-3" /><span>{instrument!.label}</span></>}</nav>
        <Badge variant="outline" className="mb-3 border-primary/30 text-primary"><Activity className="mr-1 h-3 w-3" /> WELTRADE SyntX</Badge>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
        <div className="mt-5 flex flex-wrap gap-2"><Button asChild size="sm"><Link to="/weltrade">Open Weltrade Hub <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>{!isSignals && <Button asChild size="sm" variant="outline"><Link to="/weltrade/signals">All SyntX Signals</Link></Button>}</div>
      </div></section>
      {instrument ? <section className="container mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <Card><CardContent className="p-4"><div className="text-[10px] uppercase text-muted-foreground">Exact MT5 symbol</div><div className="mt-1 font-mono font-bold">{instrument.mt5Symbol}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-[10px] uppercase text-muted-foreground">SyntX family</div><div className="mt-1 font-bold">{instrument.syntxFamily || "SyntX"}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-[10px] uppercase text-muted-foreground">Market source</div><div className="mt-1 font-bold">Weltrade API Studio</div></CardContent></Card>
        </div><WeltradeSignalsEngine /></section>
      : <section className="container mx-auto max-w-6xl px-4 py-6">
        <Card className="mb-5 border-primary/20"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><BarChart3 className="h-5 w-5 text-primary" /> Exact Weltrade SyntX Markets</CardTitle></CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{WELTRADE_INSTRUMENTS.filter((i) => i.category === "syntx").map((i) => <Link key={i.key} to={"/weltrade/" + slugify(i.label)} className="rounded-lg border border-border/50 p-3 hover:border-primary/50 hover:bg-primary/5"><div className="font-bold">{i.label}</div><div className="mt-1 font-mono text-[10px] text-muted-foreground">{i.mt5Symbol}</div></Link>)}</CardContent>
        </Card><Card className="border-success/20"><CardContent className="flex gap-3 p-4"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" /><p className="text-xs leading-5 text-muted-foreground">Botvio uses the exact Weltrade SyntX instrument names configured in its market catalogue. Availability is determined by the connected market-data source; no synthetic prices are fabricated.</p></CardContent></Card>
      </section>}
    </main>
  );
}