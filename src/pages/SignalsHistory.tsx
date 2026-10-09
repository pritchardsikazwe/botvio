import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { BarChart3, CalendarDays, TrendingUp, TrendingDown, Trophy, Target, Activity } from "lucide-react";

import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { calculateSignalHistoryStats } from "@/lib/signalHistoryStats";

interface SignalHistoryRow {
  id: string;
  pair: string;
  signal_type: string;
  entry_price: number;
  stop_loss: number | null;
  take_profit: number | null;
  result: string;
  profit_pips: number | null;
  strategy_name: string | null;
  source: string;
  screenshot_url: string | null;
  date_posted: string;
  date_closed: string | null;
}

const SignalsHistory = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["signals-history-public-page"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signals_history")
        .select(
          "id, pair, signal_type, entry_price, stop_loss, take_profit, result, profit_pips, strategy_name, source, screenshot_url, date_posted, date_closed"
        )
        .order("date_posted", { ascending: false })
        .limit(300);
      if (error) throw error;
      return (data || []) as SignalHistoryRow[];
    },
    refetchInterval: 60000,
  });

  const stats = useMemo(() => calculateSignalHistoryStats(data || []), [data]);

  const itemListJsonLd = useMemo(() => {
    const rows = (data || []).slice(0, 50);
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Botvio Signals History",
      description:
        "Public archive of Botvio signal records. Outcome settlement is subject to verification.",
      numberOfItems: rows.length,
      itemListElement: rows.map((r, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "CreativeWork",
          name: `${r.pair} ${r.signal_type} – ${r.result}`,
          datePublished: r.date_posted,
          dateModified: r.date_closed || r.date_posted,
          about: r.pair,
          ...(r.screenshot_url ? { image: r.screenshot_url } : {}),
        },
      })),
    };
  }, [data]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        seoKey="signalsHistory"
        title="Signals History & Track Record"
        description="Botvio signal history for the latest 300 records fetched, with recorded outcomes and pips. Settlement verification is ongoing."
        jsonLd={itemListJsonLd}
      />
      <Header />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <header className="space-y-3 max-w-3xl">
          <Badge className="text-xs" variant="outline">
            <Activity className="h-3 w-3 mr-1" /> Fresh Track Record
          </Badge>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            Botvio Signals — Recent History
          </h1>
          <p className="text-muted-foreground">
            Recent Botvio forex, gold (XAU/USD), synthetic indices and crypto signal records.
            Results are shown as recorded; settlement verification is ongoing. Statistics cover the latest 300 records fetched.
          </p>
        </header>

        {/* Stats grid */}
        <section aria-label="Signal history summary" className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <BarChart3 className="h-3.5 w-3.5" /> Total signals
              </div>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <Target className="h-3.5 w-3.5" /> Settled
              </div>
              <p className="text-2xl font-bold mt-1">{stats.settled}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-success text-xs">
                <Trophy className="h-3.5 w-3.5" /> Wins
              </div>
              <p className="text-2xl font-bold mt-1 text-success">{stats.wins}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-destructive text-xs">
                <TrendingDown className="h-3.5 w-3.5" /> Losses
              </div>
              <p className="text-2xl font-bold mt-1 text-destructive">{stats.losses}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-primary text-xs">
                <TrendingUp className="h-3.5 w-3.5" /> Win rate
              </div>
              <p className="text-2xl font-bold mt-1 text-primary">{stats.winRate === null ? "—" : `${stats.winRate.toFixed(2)}%`}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Net pips (WIN/LOSS rows): {stats.netPips.toFixed(1)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-muted-foreground text-xs">Expired</div>
              <p className="text-2xl font-bold mt-1">{stats.expired}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-muted-foreground text-xs">Unresolved / unknown</div>
              <p className="text-2xl font-bold mt-1">{stats.unresolved}</p>
            </CardContent>
          </Card>
        </section>

        {/* Signal results gallery */}
        <section aria-label="Signal screenshots" className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">Recent Signal Results</h2>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading signal history…</p>
          ) : (data?.length ?? 0) === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                No signals have been archived yet. New signals will appear here as soon as they close.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {data!
                .filter((s) => s.screenshot_url)
                .slice(0, 32)
                .map((s) => (
                  <Card
                    key={`shot-${s.id}`}
                    className="glass-card overflow-hidden group hover:border-primary/40 transition-colors"
                  >
                    <a href={s.screenshot_url!} target="_blank" rel="noopener noreferrer">
                      <img
                        src={s.screenshot_url!}
                        alt={`${s.pair} ${s.signal_type} signal result – ${s.result}`}
                        className="w-full h-36 sm:h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </a>
                    <CardContent className="p-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <CalendarDays className="h-3 w-3" />
                          <span className="text-[10px]">
                            {format(new Date(s.date_posted), "dd MMM yyyy")}
                          </span>
                        </div>
                        <Badge
                          className={`text-[9px] px-1.5 py-0 h-4 ${
                            s.result?.toUpperCase() === "WIN"
                              ? "bg-success/20 text-success border-success/30"
                              : s.result?.toUpperCase() === "LOSS"
                              ? "bg-destructive/20 text-destructive border-destructive/30"
                              : "bg-warning/20 text-warning border-warning/30"
                          }`}
                        >
                          {s.result}
                        </Badge>
                      </div>
                      <p className="text-xs font-semibold text-foreground mt-1">{s.pair}</p>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </section>

        {/* Detailed table */}
        <section aria-label="Detailed signal log" className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">Detailed Signal Log</h2>
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Most recent {Math.min(data?.length ?? 0, 100)} signals
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs md:text-sm">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Date</th>
                    <th className="text-left px-3 py-2 font-medium">Pair</th>
                    <th className="text-left px-3 py-2 font-medium">Side</th>
                    <th className="text-right px-3 py-2 font-medium">Entry</th>
                    <th className="text-right px-3 py-2 font-medium hidden sm:table-cell">SL</th>
                    <th className="text-right px-3 py-2 font-medium hidden sm:table-cell">TP</th>
                    <th className="text-right px-3 py-2 font-medium">Pips</th>
                    <th className="text-left px-3 py-2 font-medium">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {(data || []).slice(0, 100).map((s) => {
                    const r = s.result?.toUpperCase();
                    return (
                      <tr key={s.id} className="border-t border-border/40">
                        <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                          {format(new Date(s.date_posted), "dd MMM yyyy HH:mm")}
                        </td>
                        <td className="px-3 py-2 font-semibold text-foreground">{s.pair}</td>
                        <td className="px-3 py-2">
                          <Badge
                            variant={s.signal_type?.toUpperCase() === "BUY" ? "default" : "destructive"}
                            className="text-[10px]"
                          >
                            {s.signal_type}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{Number(s.entry_price).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right tabular-nums hidden sm:table-cell text-muted-foreground">
                          {s.stop_loss != null ? Number(s.stop_loss).toFixed(2) : "—"}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums hidden sm:table-cell text-muted-foreground">
                          {s.take_profit != null ? Number(s.take_profit).toFixed(2) : "—"}
                        </td>
                        <td
                          className={`px-3 py-2 text-right tabular-nums font-semibold ${
                            (s.profit_pips ?? 0) > 0
                              ? "text-success"
                              : (s.profit_pips ?? 0) < 0
                              ? "text-destructive"
                              : "text-muted-foreground"
                          }`}
                        >
                          {s.profit_pips != null ? Number(s.profit_pips).toFixed(1) : "—"}
                        </td>
                        <td className="px-3 py-2">
                          <Badge
                            className={`text-[10px] ${
                              r === "WIN"
                                ? "bg-success/20 text-success border-success/30"
                                : r === "LOSS"
                                ? "bg-destructive/20 text-destructive border-destructive/30"
                                : "bg-warning/20 text-warning border-warning/30"
                            }`}
                          >
                            {s.result}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </section>

        {/* Trust / FAQ block for SEO */}
        <section aria-label="About our track record" className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-5 space-y-2">
              <h3 className="font-semibold text-foreground">About these results</h3>
              <p className="text-sm text-muted-foreground">
                This page displays recorded signal outcomes. The settlement evaluator, source price feed and
                historical records have not yet been independently verified. Net pips includes only rows
                marked WIN or LOSS with finite numeric pip values; this does not prove those outcomes
                were settled correctly. Expired and unresolved records are displayed separately.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 space-y-2">
              <h3 className="font-semibold text-foreground">Want live signals?</h3>
              <p className="text-sm text-muted-foreground">
                Get current setups on the live Signals page or follow Gold (XAU/USD) scalping live in the
                Gold Hub.
              </p>
              <div className="flex gap-2 pt-2">
                <Link to="/signals">
                  <Button size="sm">Live Signals</Button>
                </Link>
                <Link to="/gold">
                  <Button size="sm" variant="outline">
                    Gold Hub
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default SignalsHistory;
