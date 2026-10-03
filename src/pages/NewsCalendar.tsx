import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NewsEventCards } from "@/components/news/NewsEventCard";
import {
  AlertTriangle, ArrowRight, BarChart3, CalendarDays, CheckCircle2, Clock3,
  Flame, Globe2, RefreshCw, Shield, Sparkles, Timer, Zap
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Impact = "High" | "Medium" | "Low";
type EventPhase = "UPCOMING" | "APPROACHING" | "NEWS MODE" | "POST-NEWS" | "PASSED";
type Market = "XAUUSD" | "EURUSD" | "GBPUSD" | "USDJPY" | "NAS100" | "US500" | "SYNTHETICS";

type NewsEvent = {
  id: string;
  time: string;
  country?: string;
  currency: string;
  event: string;
  impact: Impact;
  actual?: number | string | null;
  estimate?: number | string | null;
  prev?: number | string | null;
  unit?: string | null;
  phase?: EventPhase;
  affectedMarkets?: Market[];
  strategyState?: "NORMAL" | "CAUTION" | "PAUSE & REFRESH" | "REASSESS";
};

const MARKET_MAP: Record<string, Market[]> = {
  USD: ["XAUUSD", "EURUSD", "USDJPY", "NAS100", "US500"],
  EUR: ["EURUSD"],
  GBP: ["GBPUSD"],
  JPY: ["USDJPY"],
  AUD: ["SYNTHETICS"],
  NZD: ["SYNTHETICS"],
  CAD: ["XAUUSD"],
  CNY: ["XAUUSD", "SYNTHETICS"],
};

const IMPACT_CLASS: Record<Impact, string> = {
  High: "border-destructive/40 bg-destructive/10 text-destructive",
  Medium: "border-warning/40 bg-warning/10 text-warning",
  Low: "border-border bg-muted/30 text-muted-foreground",
};

const PHASE_CLASS: Record<EventPhase, string> = {
  UPCOMING: "border-border text-muted-foreground",
  APPROACHING: "border-warning/40 bg-warning/10 text-warning",
  "NEWS MODE": "border-destructive/40 bg-destructive/10 text-destructive",
  "POST-NEWS": "border-primary/40 bg-primary/10 text-primary",
  PASSED: "border-border text-muted-foreground",
};

function getPhase(time: string): EventPhase {
  const mins = (new Date(time).getTime() - Date.now()) / 60000;
  if (mins <= -30) return "PASSED";
  if (mins < 0) return "POST-NEWS";
  if (mins <= 5) return "NEWS MODE";
  if (mins <= 60) return "APPROACHING";
  return "UPCOMING";
}

function strategyFor(phase: EventPhase, impact: Impact) {
  if (phase === "NEWS MODE") return "PAUSE & REFRESH" as const;
  if (phase === "POST-NEWS") return "REASSESS" as const;
  if (impact === "High" && phase === "APPROACHING") return "CAUTION" as const;
  return "NORMAL" as const;
}

function formatCountdown(time: string) {
  const diff = new Date(time).getTime() - Date.now();
  if (diff <= 0 && diff > -30 * 60000) return "LIVE";
  if (diff <= 0) return "Released";
  const total = Math.floor(diff / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m ${String(s).padStart(2, "0")}s`;
}

function normalize(raw: any[]): NewsEvent[] {
  return raw
    .filter((e) => e?.time)
    .map((e, i) => {
      const phase = getPhase(e.time);
      const impact: Impact = ["High", "Medium", "Low"].includes(e.impact) ? e.impact : "Medium";
      const currency = e.currency || "—";
      return {
        id: e.id || `${e.time}-${currency}-${e.event}-${i}`,
        time: e.time,
        country: e.country,
        currency,
        event: e.event || "Economic event",
        impact,
        actual: e.actual,
        estimate: e.estimate,
        prev: e.prev,
        unit: e.unit,
        phase,
        affectedMarkets: MARKET_MAP[currency] || ["SYNTHETICS"],
        strategyState: strategyFor(phase, impact),
      };
    })
    .filter((e) => e.phase !== "PASSED")
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
}

const NewsCalendar = () => {
  const [events, setEvents] = useState<NewsEvent[]>([]);
  const [impact, setImpact] = useState<"All" | Impact>("All");
  const [market, setMarket] = useState<"All" | Market>("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workerAt, setWorkerAt] = useState<Date | null>(null);
  const [now, setNow] = useState(Date.now());

  const refresh = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke("news-intelligence-worker", { body: { mode: "refresh" } });
      if (!error && data?.events) {
        setEvents(normalize(data.events));
        setWorkerAt(new Date());
      } else {
        const fallback = await supabase.functions.invoke("economic-calendar");
        if (!fallback.error) setEvents(normalize(fallback.data?.events ?? []));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(() => {
      setNow(Date.now());
      refresh();
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const enriched = useMemo(
    () => events.map((e) => ({ ...e, phase: getPhase(e.time), strategyState: strategyFor(getPhase(e.time), e.impact) })),
    [events, now]
  );

  const filtered = enriched.filter((e) =>
    (impact === "All" || e.impact === impact) &&
    (market === "All" || e.affectedMarkets?.includes(market))
  );

  const nextEvent = filtered.find((e) => new Date(e.time).getTime() >= Date.now() - 30 * 60000) ?? filtered[0];
  const highImpact = filtered.filter((e) => e.impact === "High").length;
  const newsMode = filtered.find((e) => e.phase === "NEWS MODE");
  const affected = [...new Set((nextEvent?.affectedMarkets ?? []))];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        seoKey="newsCalendar"
        title="Botvio News Intelligence — Live Economic Calendar & Market Risk"
        description="Live economic events, countdowns, market impact and Botvio strategy refresh status."
      />
      <Header />

      <main className="container mx-auto max-w-6xl px-4 py-6 space-y-6">
        <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-5 md:p-7 animate-fade-in">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest">
                <Sparkles className="h-4 w-4" /> Botvio Intelligence
              </div>
              <h1 className="mt-2 text-3xl md:text-4xl font-black">News Intelligence</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Know what is coming, see what it affects, and let Botvio refresh the trading context around important releases.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <span className="mr-1.5 h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> LIVE
              </Badge>
              <Button variant="outline" size="sm" onClick={() => refresh(true)} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              ["Events ahead", String(filtered.length), CalendarDays],
              ["High impact", String(highImpact), Flame],
              ["News mode", newsMode ? "ACTIVE" : "Standby", Zap],
              ["Worker", workerAt ? "Updated" : "Waiting", RefreshCw],
            ].map(([label, value, Icon]: any) => (
              <div key={label} className="rounded-xl border border-border/50 bg-background/50 p-3">
                <Icon className="h-4 w-4 text-primary mb-2" />
                <div className="text-lg font-black">{value}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-destructive/20 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Flame className="h-4 w-4 text-destructive" /> Next Market Event</CardTitle>
            </CardHeader>
            <CardContent>
              {nextEvent ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xl font-black">{nextEvent.event}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {nextEvent.currency} · {new Date(nextEvent.time).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                      </div>
                    </div>
                    <Badge variant="outline" className={IMPACT_CLASS[nextEvent.impact]}>{nextEvent.impact}</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-secondary/50 p-3">
                    <div><div className="text-[10px] uppercase text-muted-foreground">Countdown</div><div className="font-mono text-2xl font-black">{formatCountdown(nextEvent.time)}</div></div>
                    <Timer className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(nextEvent.affectedMarkets ?? []).map((m) => <Badge key={m} variant="outline" className="text-[10px]">{m}</Badge>)}
                  </div>
                  <div className="flex items-center justify-between border-t border-border/50 pt-3 text-xs">
                    <span className="text-muted-foreground">Botvio context</span>
                    <Badge variant="outline" className={PHASE_CLASS[nextEvent.phase || "UPCOMING"]}>{nextEvent.strategyState}</Badge>
                  </div>
                </div>
              ) : <div className="py-8 text-center text-sm text-muted-foreground">No events match your filters.</div>}
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Botvio Market State</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {affected.length ? affected.map((m) => (
                <div key={m} className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2">
                  <span className="font-semibold text-sm">{m}</span>
                  <span className="text-xs text-muted-foreground">{nextEvent?.strategyState === "PAUSE & REFRESH" ? "News risk — refresh" : nextEvent?.strategyState === "REASSESS" ? "Post-news reassessment" : "Normal monitoring"}</span>
                </div>
              )) : <div className="text-sm text-muted-foreground">Select an event to see affected markets.</div>}
              <div className="rounded-lg border border-border/50 p-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 text-foreground font-semibold"><Shield className="h-4 w-4 text-primary" /> Strategy worker policy</div>
                <p className="mt-1">Upcoming → caution → news mode → post-news reassessment. The worker refreshes context; it does not force a BUY or SELL decision.</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground mr-1">Impact</span>
          {(["All", "High", "Medium", "Low"] as const).map((x) => (
            <Button key={x} size="sm" variant={impact === x ? "default" : "outline"} onClick={() => setImpact(x)}>{x}</Button>
          ))}
          <span className="ml-2 text-xs font-bold text-muted-foreground">Market</span>
          {(["All", "XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "NAS100", "US500"] as const).map((x) => (
            <Button key={x} size="sm" variant={market === x ? "default" : "outline"} onClick={() => setMarket(x)}>{x}</Button>
          ))}
        </section>

        <section>
          <Card className="border-border/50 overflow-hidden">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-sm flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" /> Live Event Timeline
                <Badge variant="outline" className="ml-auto text-[9px]">{loading ? "Loading…" : `${filtered.length} events`}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/30">
                {filtered.slice(0, 40).map((e) => (
                  <div key={e.id} className="p-4 hover:bg-muted/20 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <div className="w-28 shrink-0">
                        <div className="font-mono text-sm font-bold">{new Date(e.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                        <div className="text-[10px] text-muted-foreground">{new Date(e.time).toLocaleDateString([], { month: "short", day: "numeric" })}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold truncate">{e.event}</span>
                          <Badge variant="outline" className="text-[9px]">{e.currency}</Badge>
                          <Badge variant="outline" className={`text-[9px] ${IMPACT_CLASS[e.impact]}`}>{e.impact}</Badge>
                          <Badge variant="outline" className={`text-[9px] ${PHASE_CLASS[e.phase || "UPCOMING"]}`}>{e.phase}</Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {(e.affectedMarkets ?? []).map((m) => <span key={m} className="rounded bg-secondary px-2 py-0.5 text-[9px]">{m}</span>)}
                        </div>
                      </div>
                      <div className="text-right min-w-28">
                        <div className="font-mono text-xs font-bold">{formatCountdown(e.time)}</div>
                        <div className="text-[9px] text-muted-foreground">{e.strategyState}</div>
                      </div>
                    </div>
                    {(e.actual != null || e.estimate != null || e.prev != null) && (
                      <div className="mt-3 ml-0 md:ml-28 flex flex-wrap gap-4 text-[10px] text-muted-foreground">
                        <span>Actual: <strong className="text-foreground">{e.actual ?? "—"}</strong></span>
                        <span>Forecast: <strong className="text-foreground">{e.estimate ?? "—"}</strong></span>
                        <span>Previous: <strong className="text-foreground">{e.prev ?? "—"}</strong></span>
                      </div>
                    )}
                  </div>
                ))}
                {!loading && !filtered.length && <div className="p-10 text-center text-sm text-muted-foreground">No matching events.</div>}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Before release", icon: Clock3, text: "Monitor the countdown and reduce exposure when a high-impact event is approaching." },
            { title: "During news", icon: Zap, text: "Botvio enters News Mode and refreshes market context instead of blindly carrying stale strategy state." },
            { title: "After release", icon: CheckCircle2, text: "Actual vs forecast becomes available and affected strategies move into post-news reassessment." },
          ].map((x) => (
            <Card key={x.title} className="border-border/50">
              <CardContent className="p-4">
                <x.icon className="h-5 w-5 text-primary mb-3" />
                <div className="font-bold text-sm">{x.title}</div>
                <p className="mt-1 text-xs text-muted-foreground">{x.text}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section><NewsEventCards /></section>

        <section className="rounded-xl border border-warning/20 bg-warning/5 p-4 text-xs text-muted-foreground">
          <div className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 text-warning shrink-0" /><p><strong className="text-foreground">News risk:</strong> economic releases can cause rapid price changes, spreads and slippage. Botvio's worker refreshes context and strategy state; it does not guarantee a market direction or outcome.</p></div>
        </section>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{workerAt ? `Worker refresh: ${workerAt.toLocaleTimeString()}` : "Worker refresh pending"}</span>
          <span className="flex items-center gap-1"><Globe2 className="h-3 w-3" /> Economic calendar · UTC/local display</span>
        </div>
      </main>
    </div>
  );
};

export default NewsCalendar;
