import { useMyCopySubscriptions, useMyCopiedTrades, useMySubscriberCount, useMyProvider, useUnsubscribeFromProvider } from "@/hooks/useBotvio";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Users, UserPlus, Copy, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

export const CopyTradingTab = () => {
  const { data: subscriptions, isLoading } = useMyCopySubscriptions();
  const { data: copiedTrades } = useMyCopiedTrades();
  const { data: followerCount } = useMySubscriberCount();
  const { data: myProvider } = useMyProvider();
  const unsubscribe = useUnsubscribeFromProvider();

  const active = (subscriptions ?? []).filter((s) => s.status !== "stopped");

  return (
    <div className="space-y-4">
      {/* Follower stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="glass-card">
          <CardContent className="p-3 text-center">
            <Users className="h-4 w-4 mx-auto text-primary mb-1" />
            <p className="text-xl font-bold">{followerCount ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Followers</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-3 text-center">
            <UserPlus className="h-4 w-4 mx-auto text-primary mb-1" />
            <p className="text-xl font-bold">{active.length}</p>
            <p className="text-[10px] text-muted-foreground">Following</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-3 text-center">
            <Copy className="h-4 w-4 mx-auto text-primary mb-1" />
            <p className="text-xl font-bold">{copiedTrades?.length ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Copied trades</p>
          </CardContent>
        </Card>
      </div>

      {/* Providers I follow */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Signal providers you follow</CardTitle>
          <CardDescription className="text-xs">Trades from these providers mirror into your connected Deriv account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : active.length === 0 ? (
            <div className="text-center py-4 space-y-2">
              <p className="text-xs text-muted-foreground">You're not following anyone yet.</p>
              <Button size="sm" variant="outline" asChild>
                <Link to="/providers">Browse providers <ArrowRight className="h-3 w-3 ml-1" /></Link>
              </Button>
            </div>
          ) : active.map((sub) => (
            <div key={sub.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border/60">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{sub.provider?.display_name ?? "Provider"}</p>
                <p className="text-[11px] text-muted-foreground">
                  {sub.copy_mode ?? "fixed"} · stake ${sub.fixed_stake ?? 1}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/20">Active</Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={unsubscribe.isPending}
                  onClick={() => unsubscribe.mutate(sub.id)}
                >
                  Stop
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent copied trades */}
      <Card className="glass-card">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Recent copied trades</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(copiedTrades ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">No copied trades yet.</p>
          ) : (copiedTrades ?? []).slice(0, 8).map((t) => {
            const pnl = Number(t.profit_loss ?? 0);
            return (
              <div key={t.id} className="flex items-center justify-between text-xs p-2.5 rounded-lg border border-border/60">
                <div>
                  <p className="font-medium">{t.symbol}</p>
                  <p className="text-muted-foreground">{t.direction} · ${t.stake}</p>
                </div>
                <span className={cn("font-semibold flex items-center gap-1", pnl >= 0 ? "text-success" : "text-destructive")}>
                  {pnl >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Become a provider */}
      {!myProvider && (
        <Card className="glass-card border-primary/30">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Grow your own followers</p>
              <p className="text-xs text-muted-foreground">Publish your Deriv trades and earn from copiers.</p>
            </div>
            <Button size="sm" asChild><Link to="/providers">Apply</Link></Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};