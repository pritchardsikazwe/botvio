import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Signal, Sparkles, Activity } from "lucide-react";
import { WeltradeSignalsEngine } from "@/components/weltrade/WeltradeSignalsEngine";
import { SyntxSignalsSection } from "@/components/weltrade/SyntxSignalsSection";
import { SyntxStrategyHub } from "@/components/weltrade/SyntxStrategyHub";
import { SyntxBotvioStrategy } from "@/components/weltrade/SyntxHauzaStrategy";
import { SyntxApiStudioConnectionCard } from "@/components/tradecopy/SyntxApiStudioConnectionCard";

export default function WeltradeSyntheticHub() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Weltrade SyntX Hub – Live Charts, Signals & Strategies"
        description="BOTVIO Weltrade SyntX hub with live MT5 API Studio charts, signal cards and family-aware synthetic strategies."
      />
      <Header />

      <main className="container mx-auto space-y-6 px-4 py-6">
        <section className="relative overflow-hidden rounded-2xl border border-warning/20 bg-gradient-to-br from-warning/10 via-card to-card p-6 md:p-8">
          <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-warning/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-48 w-48 -translate-x-1/2 translate-y-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative z-10">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge className="border-warning/30 bg-warning/20 font-mono text-xs text-warning">WELTRADE SYNTX</Badge>
              <Badge variant="outline" className="border-success/40 text-xs text-success">24/7 Synthetic Market</Badge>
              <Badge variant="outline" className="border-primary/30 text-xs">
                <Activity className="mr-1 h-3 w-3" /> MT5 API Studio Feed
              </Badge>
              <Badge variant="outline" className="border-warning/30 text-xs text-warning">
                <Sparkles className="mr-1 h-3 w-3" /> BOTVIO AI Analysis
              </Badge>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
              Weltrade SyntX <span className="text-warning">Trading Hub</span>
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Live Weltrade synthetic charts, signal cards and family-specific strategy analysis in one workspace.
              The feed comes from your connected Weltrade MT5 account through API Studio — no bridge ticks and no
              Deriv feed replacement.
            </p>
          </div>
        </section>

        <section aria-labelledby="weltrade-feed-connection">
          <div className="mb-3">
            <h2 id="weltrade-feed-connection" className="text-lg font-black">Weltrade Market Feed Connection</h2>
            <p className="mt-1 text-xs text-muted-foreground">Connect the Weltrade MT5 account used as Botvio's SyntX market-data source. Credentials stay in the secure Supabase function and are stored encrypted.</p>
          </div>
          <SyntxApiStudioConnectionCard />
        </section>

        <Card className="border border-warning/20 bg-card/70">
          <CardContent className="grid gap-3 p-4 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-warning" />
              <div><p className="text-xs font-bold">Live chart</p><p className="text-[10px] text-muted-foreground">Weltrade SyntX MT5 quotes + history</p></div>
            </div>
            <div className="flex items-center gap-3">
              <Signal className="h-5 w-5 text-primary" />
              <div><p className="text-xs font-bold">Signal cards</p><p className="text-[10px] text-muted-foreground">BUY/SELL, entry, SL, TP and confidence</p></div>
            </div>
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-success" />
              <div><p className="text-xs font-bold">Strategy layer</p><p className="text-[10px] text-muted-foreground">Family-aware SyntX strategy modes</p></div>
            </div>
          </CardContent>
        </Card>

        <section aria-labelledby="weltrade-live-chart">
          <div className="mb-3">
            <h2 id="weltrade-live-chart" className="flex items-center gap-2 text-lg font-black">
              <BarChart3 className="h-5 w-5 text-warning" /> Live SyntX Chart & Engine
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">Select a Weltrade synthetic instrument and timeframe. Signals are calculated from the same candles displayed by the chart.</p>
          </div>
          <WeltradeSignalsEngine />
        </section>

        <section aria-labelledby="weltrade-signal-cards">
          <div className="mb-3">
            <h2 id="weltrade-signal-cards" className="flex items-center gap-2 text-lg font-black">
              <Signal className="h-5 w-5 text-primary" /> Weltrade Signal Cards
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">Published Weltrade signals with symbol, direction, entry, stop, target, timeframe and strategy.</p>
          </div>
          <SyntxSignalsSection />
        </section>

        <section aria-labelledby="weltrade-strategies">
          <div className="mb-3">
            <h2 id="weltrade-strategies" className="flex items-center gap-2 text-lg font-black">
              <Sparkles className="h-5 w-5 text-success" /> Weltrade SyntX Strategies
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">Strategy selection follows the behaviour of each SyntX family rather than treating every synthetic instrument as the same market.</p>
          </div>
          <div className="space-y-6">
            <SyntxStrategyHub />
            <SyntxBotvioStrategy />
          </div>
        </section>

        <div className="rounded-xl border border-warning/20 bg-warning/5 p-3 text-[11px] leading-relaxed text-muted-foreground">
          <strong className="text-foreground">Feed separation:</strong> Weltrade SyntX uses the connected Weltrade MT5
          account through API Studio. Existing Deriv synthetic WebSocket ticks and the Deriv Synthetic Hub remain
          unchanged.
        </div>
      </main>
    </div>
  );
}
