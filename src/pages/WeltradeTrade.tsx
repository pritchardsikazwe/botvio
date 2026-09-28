import { useState } from "react";
import { Helmet } from "react-helmet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

type WeltradeInstrument = {
  symbol: string;            // exact MT5 Market Watch symbol, e.g. "PainX 10"
  family: "PainX" | "GainX" | "TrendX" | "Specialty";
  description: string;
  volatility: "Medium" | "High" | "Extreme";
  bestFor: string;
};

const WELTRADE_INSTRUMENTS: WeltradeInstrument[] = [
  { symbol: "PainX 10",   family: "PainX",     description: "Low-tier volatility spikes",   volatility: "Medium",  bestFor: "Beginners, small accounts" },
  { symbol: "PainX 50",   family: "PainX",     description: "Mid-tier spike index",          volatility: "High",    bestFor: "Scalping, quick entries" },
  { symbol: "PainX 100",  family: "PainX",     description: "Aggressive spike bursts",       volatility: "Extreme", bestFor: "Experienced scalpers" },
  { symbol: "PainX 200",  family: "PainX",     description: "Ultra-volatile spikes",         volatility: "Extreme", bestFor: "High-risk traders" },
  { symbol: "GainX 10",   family: "GainX",     description: "Gentle trending momentum",      volatility: "Medium",  bestFor: "Swing trading" },
  { symbol: "GainX 50",   family: "GainX",     description: "Steady trend moves",            volatility: "Medium",  bestFor: "Trend following" },
  { symbol: "GainX 100",  family: "GainX",     description: "Strong directional moves",      volatility: "High",    bestFor: "Momentum trading" },
  { symbol: "TrendX 10",  family: "TrendX",    description: "Light trend bias index",        volatility: "Medium",  bestFor: "Breakout setups" },
  { symbol: "TrendX 50",  family: "TrendX",    description: "Medium trend bias",             volatility: "High",    bestFor: "Continuation trades" },
  { symbol: "FlipX",      family: "Specialty", description: "Sudden direction reversals",    volatility: "Extreme", bestFor: "Reversal traders" },
  { symbol: "SwitchX",    family: "Specialty", description: "Alternating trend phases",      volatility: "High",    bestFor: "Range & breakout" },
  { symbol: "BreakX",     family: "Specialty", description: "Consolidation breakouts",       volatility: "High",    bestFor: "Breakout strategies" },
];

const FAMILY_COLOR: Record<WeltradeInstrument["family"], string> = {
  PainX: "border-red-500/40 from-red-500/10",
  GainX: "border-emerald-500/40 from-emerald-500/10",
  TrendX: "border-blue-500/40 from-blue-500/10",
  Specialty: "border-amber-500/40 from-amber-500/10",
};

function WeltradeCard({ inst }: { inst: WeltradeInstrument }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState<"BUY" | "SELL" | null>(null);

  const send = async (direction: "BUY" | "SELL") => {
    if (!user) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }
    setBusy(direction);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error("No active session");
      const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/queue-hub-trade`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          symbol: inst.symbol,
          direction,
          source: `weltrade-${inst.family.toLowerCase()}`,
        }),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(json?.error ?? "MT5 queue failed");
      toast({
        title: `MT5 ${direction} queued`,
        description: `${inst.symbol} • Volume ${json.volume} • Terminal ${json.terminal_uid?.slice(0, 8)}…`,
      });
    } catch (e: any) {
      toast({
        title: "MT5 queue failed",
        description: e?.message ?? "Add your Weltrade Bridge EA terminal under Connections.",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className={`relative overflow-hidden bg-gradient-to-br ${FAMILY_COLOR[inst.family]} via-transparent to-transparent border-2 ${FAMILY_COLOR[inst.family].split(" ")[0]} p-4 space-y-3`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-foreground">{inst.symbol}</h3>
          <Badge variant="outline" className="mt-1 text-[10px] uppercase tracking-wider">
            {inst.family}
          </Badge>
        </div>
        <Zap className="h-4 w-4 text-amber-400" />
      </div>
      <p className="text-xs text-muted-foreground leading-snug">{inst.description}</p>
      <div className="text-[11px] space-y-0.5">
        <div><span className="text-muted-foreground">Volatility:</span> <span className="font-semibold text-foreground">{inst.volatility}</span></div>
        <div><span className="text-muted-foreground">Best for:</span> <span className="text-foreground/80">{inst.bestFor}</span></div>
      </div>
      <div className="grid grid-cols-2 gap-2 pt-1">
        <Button
          size="sm"
          variant="outline"
          className="border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-300"
          disabled={busy !== null}
          onClick={() => send("BUY")}
        >
          {busy === "BUY" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TrendingUp className="h-3.5 w-3.5" />}
          BUY
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-red-500/40 hover:bg-red-500/10 text-red-300"
          disabled={busy !== null}
          onClick={() => send("SELL")}
        >
          {busy === "SELL" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TrendingDown className="h-3.5 w-3.5" />}
          SELL
        </Button>
      </div>
    </Card>
  );
}

const WeltradeTrade = () => {
  const families: WeltradeInstrument["family"][] = ["PainX", "GainX", "TrendX", "Specialty"];

  return (
    <>
      <Helmet>
        <title>Weltrade Synthetics – Send PainX, GainX, TrendX to MT5 | Botvio</title>
        <meta
          name="description"
          content="Trade Weltrade proprietary synthetics (PainX 10/50/100/200, GainX, TrendX, FlipX, SwitchX, BreakX) directly to your MT5 VPS via the Botvio Bridge EA."
        />
        <link rel="canonical" href="https://botvio.lovable.app/weltrade-trade" />
      </Helmet>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Weltrade Synthetics → MT5</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Send instant BUY/SELL orders for Weltrade's proprietary synthetic indices straight to your VPS MT5
            terminal via the Botvio Bridge EA. Symbol names match Weltrade's Market Watch verbatim
            (e.g. <code className="px-1 py-0.5 rounded bg-muted text-xs">PainX 10</code>).
          </p>
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200">
            <strong>Requires:</strong> a Weltrade MT5 terminal running the Botvio Bridge EA, registered under
            Connections → MT5 Bridge with auto-execute enabled. Lot size auto-clamps to each symbol's broker minimum.
          </div>
        </header>

        {families.map((fam) => {
          const items = WELTRADE_INSTRUMENTS.filter((i) => i.family === fam);
          if (!items.length) return null;
          return (
            <section key={fam} className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">{fam} Indices</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {items.map((inst) => (
                  <WeltradeCard key={inst.symbol} inst={inst} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
};

export default WeltradeTrade;