import { Link, useParams } from "react-router-dom";
import { ArrowRight, BarChart3, ChevronRight, Activity, ShieldCheck, Zap, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEOHead } from "@/components/seo/SEOHead";
import { WELTRADE_INSTRUMENTS, type WeltradeInstrument } from "@/config/weltradeInstruments";

const canonicalSlug = (instrument: WeltradeInstrument) =>
  instrument.label.toLowerCase().replace(/[^a-z0-9]+/g, "");

const legacySlug = (instrument: WeltradeInstrument) =>
  instrument.label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

const findInstrument = (value?: string) => {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  return WELTRADE_INSTRUMENTS.find(
    (i) =>
      i.category === "syntx" &&
      (i.key.toLowerCase() === normalized ||
        canonicalSlug(i) === normalized ||
        legacySlug(i) === normalized)
  );
};

const familyLabel = (instrument: WeltradeInstrument) =>
  instrument.syntxFamily
    ? instrument.syntxFamily.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "SyntX";

const relatedMarkets = (instrument: WeltradeInstrument) =>
  WELTRADE_INSTRUMENTS
    .filter((i) => i.category === "syntx" && i.syntxFamily === instrument.syntxFamily && i.key !== instrument.key)
    .slice(0, 5);

const JsonLd = ({ instrument }: { instrument?: WeltradeInstrument }) => {
  const title = instrument ? instrument.label : "Weltrade SyntX Signals";
  const description = instrument
    ? `Botvio coverage for ${instrument.label} (${instrument.mt5Symbol}), including SyntX market information and access to Botvio signal tools.`
    : "Botvio Weltrade SyntX market coverage, exact instrument catalogue and access to SyntX signal tools.";
  return {
    "@context": "https://schema.org",
    "@type": instrument ? "FinancialProduct" : "CollectionPage",
    name: title,
    description,
    url: `https://botvio.live/weltrade/${instrument ? canonicalSlug(instrument) : "signals"}`,
    brand: { "@type": "Brand", name: "Botvio" },
    ...(instrument ? { category: "SyntX market", productID: instrument.mt5Symbol } : {}),
  };
};

export default function WeltradeSyntxPage() {
  const { symbol } = useParams<{ symbol?: string }>();
  const isSignals = !symbol;
  const instrument = findInstrument(symbol);

  if (symbol && !instrument) return null;

  const title = isSignals
    ? "Weltrade SyntX Signals & Markets"
    : `${instrument!.label} Signals & Market Guide`;
  const description = isSignals
    ? "Explore Botvio's Weltrade SyntX coverage, exact market names and access to SyntX signal tools."
    : `Explore ${instrument!.label} on Botvio. See the exact Weltrade MT5 symbol, SyntX family, market characteristics and how to access Botvio signal tools.`;

  return (
    <main className="min-h-screen bg-background">
      <SEOHead
        title={title}
        description={description}
        canonicalUrlOverride={`https://botvio.live/weltrade/${isSignals ? "signals" : canonicalSlug(instrument!)}`}
        jsonLd={JsonLd({ instrument })}
      />

      <section className="border-b border-border/50 bg-gradient-to-b from-primary/10 to-background">
        <div className="container mx-auto max-w-6xl px-4 py-7">
          <nav className="mb-4 flex items-center gap-1 text-xs text-muted-foreground">
            <Link to="/weltrade" className="hover:text-primary">Weltrade</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/weltrade/signals" className="hover:text-primary">SyntX Signals</Link>
            {!isSignals && <><ChevronRight className="h-3 w-3" /><span>{instrument!.label}</span></>}
          </nav>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-primary/30 text-primary">
              <Activity className="mr-1 h-3 w-3" /> WELTRADE SyntX
            </Badge>
            {!isSignals && <Badge variant="outline" className="font-mono">{instrument!.mt5Symbol}</Badge>}
          </div>

          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild size="sm"><Link to="/marketplace">Get Signals Access <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/signup">Create Account</Link></Button>
            {!isSignals && <Button asChild size="sm" variant="ghost"><Link to="/weltrade/signals">All SyntX Markets</Link></Button>}
          </div>
        </div>
      </section>

      {instrument ? (
        <section className="container mx-auto max-w-6xl px-4 py-6 space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Card><CardContent className="p-4"><div className="text-[10px] uppercase text-muted-foreground">Exact MT5 symbol</div><div className="mt-1 font-mono font-bold">{instrument.mt5Symbol}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-[10px] uppercase text-muted-foreground">SyntX family</div><div className="mt-1 font-bold">{familyLabel(instrument)}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-[10px] uppercase text-muted-foreground">Market source</div><div className="mt-1 font-bold">Weltrade API Studio</div></CardContent></Card>
          </div>

          <Card className="border-primary/20">
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-lg"><Zap className="h-5 w-5 text-primary" /> About {instrument.label}</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>{instrument.blurb}</p>
              <p>Botvio uses the exact configured Weltrade MT5 market symbol <strong className="text-foreground">{instrument.mt5Symbol}</strong> for this SyntX instrument. Market availability is determined by the connected market-data source.</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="secondary">SyntX</Badge>
                <Badge variant="secondary">{familyLabel(instrument)}</Badge>
                <Badge variant="secondary">MT5</Badge>
                <Badge variant="secondary">API Studio</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-lg"><BarChart3 className="h-5 w-5 text-primary" /> Access Botvio {instrument.label} Signals</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
              <p className="text-sm leading-6 text-muted-foreground">The public page contains market information only. Sign in and activate a qualifying Botvio plan to access live signal tools, charts and trading workflows.</p>
              <Button asChild><Link to="/marketplace">View Plans <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            </CardContent>
          </Card>

          {relatedMarkets(instrument).length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-bold">Related {familyLabel(instrument)} Markets</h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {relatedMarkets(instrument).map((item) => (
                  <Link key={item.key} to={`/weltrade/${canonicalSlug(item)}`} className="rounded-lg border border-border/50 p-3 transition hover:border-primary/50 hover:bg-primary/5">
                    <div className="font-bold">{item.label}</div>
                    <div className="mt-1 font-mono text-[10px] text-muted-foreground">{item.mt5Symbol}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <Card className="border-success/20">
            <CardContent className="flex gap-3 p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
              <p className="text-xs leading-5 text-muted-foreground">Botvio does not fabricate synthetic prices. Live market data and signal availability depend on the connected Weltrade API Studio feed and your account access.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><HelpCircle className="h-4 w-4 text-primary" /> {instrument.label} FAQ</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-xs leading-5 text-muted-foreground">
              <p><strong className="text-foreground">What is {instrument.label}?</strong> {instrument.blurb}</p>
              <p><strong className="text-foreground">What symbol does Botvio use?</strong> The exact MT5 symbol is <strong className="text-foreground">{instrument.mt5Symbol}</strong>.</p>
              <p><strong className="text-foreground">Can I see signals without an account?</strong> The public page provides information; live signal tools require sign-in and the appropriate Botvio access.</p>
            </CardContent>
          </Card>
        </section>
      ) : (
        <section className="container mx-auto max-w-6xl px-4 py-6 space-y-5">
          <Card className="border-primary/20">
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><BarChart3 className="h-5 w-5 text-primary" /> Exact Weltrade SyntX Markets</CardTitle></CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {WELTRADE_INSTRUMENTS.filter((i) => i.category === "syntx").map((i) => (
                <Link key={i.key} to={`/weltrade/${canonicalSlug(i)}`} className="rounded-lg border border-border/50 p-3 hover:border-primary/50 hover:bg-primary/5">
                  <div className="font-bold">{i.label}</div>
                  <div className="mt-1 font-mono text-[10px] text-muted-foreground">{i.mt5Symbol}</div>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="border-success/20">
            <CardContent className="flex gap-3 p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
              <p className="text-xs leading-5 text-muted-foreground">Botvio uses the exact Weltrade SyntX instrument catalogue. Availability is determined by the connected market-data source; no synthetic prices are fabricated.</p>
            </CardContent>
          </Card>
        </section>
      )}
    </main>
  );
}