import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Activity, TrendingUp, Layers, ShieldAlert, Copy, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { PageBanner } from "@/components/layout/PageBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  useMyCopySubscriptions,
  useMyCopiedTrades,
  useUnsubscribeFromProvider,
} from "@/hooks/useBotvio";
import { useSetSubscriptionStatus, PLATFORM_LABEL } from "@/hooks/useCopyTrading";

const money = (v: number) => `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(2)}`;
const isToday = (iso?: string | null) =>
  !!iso && new Date(iso).toDateString() === new Date().toDateString();

/** Follower dashboard: active strategies, live copy status, P/L and controls. */
const MyCopyTrading = () => {
  const { user } = useAuth();
  const { data: subscriptions, isLoading } = useMyCopySubscriptions();
  const { data: copiedTrades } = useMyCopiedTrades();
  const setStatus = useSetSubscriptionStatus();
  const unsubscribe = useUnsubscribeFromProvider();

  const active = (subscriptions ?? []).filter((s) => s.status !== "stopped");

  const stats = useMemo(() => {
    const trades = copiedTrades ?? [];
    const total = trades.reduce((sum, t) => sum + Number(t.profit_loss ?? 0), 0);
    const today = trades
      .filter((t) => isToday(t.closed_at ?? t.opened_at))
      .reduce((sum, t) => sum + Number(t.profit_loss ?? 0), 0);

    let peak = 0;
    let equity = 0;
    let dd = 0;
    [...trades]
      .sort((a, b) => new Date(a.opened_at).getTime() - new Date(b.opened_at).getTime())
      .forEach((t) => {
        equity += Number(t.profit_loss ?? 0);
        if (equity > peak) peak = equity;
        dd = Math.max(dd, peak - equity);
      });

    return { total, today, count: trades.length, drawdown: dd };
  }, [copiedTrades]);

  const openTrades = (copiedTrades ?? []).filter((t) => t.status === "open");

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="mb-3 text-xl font-bold">Sign in to view your copy trading</h1>
          <Button asChild>
            <Link to="/copy-trading">Browse providers</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="My Copy Trading – Active Strategies & Copy Status"
        description="Track your active copy strategies, today's profit and loss, copied trades and current drawdown, and pause or stop copying at any time."
      />
      <Header />

      <main className="container mx-auto space-y-5 px-4 py-6">
        <PageBanner
          title="My Copy"
          accent="Trading"
          description="Every copied trade executes in your own connected account, under your own risk limits."
          crumbs={[
            { label: "Home", to: "/" },
            { label: "Copy Trading", to: "/copy-trading" },
            { label: "My Copy Trading" },
          ]}
          stats={[
            { icon: Layers, value: String(active.length), label: "Active strategies" },
            { icon: TrendingUp, value: money(stats.today), label: "Today's P/L" },
            { icon: Activity, value: String(stats.count), label: "Copied trades" },
          ]}
          action={
            <Button asChild>
              <Link to="/copy-trading">
                Find providers <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          }
        />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[
            { label: "Active strategies", value: String(active.length) },
            { label: "Today's P/L", value: money(stats.today), tone: stats.today >= 0 },
            { label: "Total P/L", value: money(stats.total), tone: stats.total >= 0 },
            { label: "Copied trades", value: String(stats.count) },
            { label: "Current drawdown", value: `$${stats.drawdown.toFixed(2)}` },
          ].map((c) => (
            <Card key={c.label} className="glass-card">
              <CardContent className="p-3 text-center">
                <p
                  className={cn(
                    "text-lg font-bold",
                    c.tone === undefined ? "" : c.tone ? "text-success" : "text-destructive",
                  )}
                >
                  {c.value}
                </p>
                <p className="text-[10px] text-muted-foreground">{c.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">My strategies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <p className="text-xs text-muted-foreground">Loading…</p>
            ) : active.length === 0 ? (
              <div className="space-y-2 py-6 text-center">
                <Copy className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">You're not copying anyone yet.</p>
                <Button size="sm" asChild>
                  <Link to="/copy-trading">Browse providers</Link>
                </Button>
              </div>
            ) : (
              active.map((sub) => {
                const platform = sub.subscriber_trading_account?.broker ?? "deriv";
                const pending = sub.approval_status === "pending";
                return (
                  <div
                    key={sub.id}
                    className="flex flex-col gap-3 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {sub.provider?.display_name ?? "Provider"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {PLATFORM_LABEL[platform] ?? platform} ·{" "}
                        {sub.subscriber_trading_account?.label ?? "Your account"} · risk cap{" "}
                        {Number(sub.max_drawdown_percent ?? 0).toFixed(0)}% drawdown
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "gap-1 text-[10px]",
                          pending
                            ? "border-warning/30 bg-warning/10 text-warning"
                            : sub.status === "active"
                              ? "border-success/30 bg-success/10 text-success"
                              : "text-muted-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            pending
                              ? "bg-warning"
                              : sub.status === "active"
                                ? "bg-success"
                                : "bg-muted-foreground",
                          )}
                        />
                        {pending ? "Awaiting approval" : sub.status === "active" ? "Copying" : "Paused"}
                      </Badge>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/copy-trading/provider/${sub.provider_id}`}>View</Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={setStatus.isPending || pending}
                        onClick={() =>
                          setStatus.mutate(
                            {
                              id: sub.id,
                              status: sub.status === "active" ? "paused" : "active",
                            },
                            {
                              onSuccess: () =>
                                toast.success(
                                  sub.status === "active" ? "Copying paused" : "Copying resumed",
                                ),
                              onError: (e: unknown) =>
                                toast.error(
                                  e instanceof Error ? e.message : "Could not update copying",
                                ),
                            },
                          )
                        }
                      >
                        {sub.status === "active" ? "Pause" : "Resume"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        disabled={unsubscribe.isPending}
                        onClick={() =>
                          unsubscribe.mutate(sub.id, {
                            onSuccess: () => toast.success("Copying stopped"),
                          })
                        }
                      >
                        Stop
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Current positions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {openTrades.length === 0 ? (
                <p className="text-xs text-muted-foreground">No open copied positions.</p>
              ) : (
                openTrades.slice(0, 8).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 p-2.5 text-xs"
                  >
                    <div>
                      <p className="font-medium">
                        {t.symbol} {t.direction}
                      </p>
                      <p className="text-muted-foreground">Stake ${Number(t.stake).toFixed(2)}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">Running</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Recent copy executions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(copiedTrades ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">No copied trades yet.</p>
              ) : (
                (copiedTrades ?? []).slice(0, 8).map((t) => {
                  const pnl = Number(t.profit_loss ?? 0);
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between rounded-lg border border-border/60 p-2.5 text-xs"
                    >
                      <div>
                        <p className="font-medium">{t.symbol}</p>
                        <p className="text-muted-foreground">
                          {t.direction} · {t.status}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "font-semibold",
                          pnl >= 0 ? "text-success" : "text-destructive",
                        )}
                      >
                        {money(pnl)}
                      </span>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card border-warning/40 bg-warning/5">
          <CardContent className="flex items-start gap-3 py-3">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <p className="text-xs text-muted-foreground">
              Copy trading involves risk. Past performance does not guarantee future results. Values
              shown are calculated from your recorded copied trades.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default MyCopyTrading;
