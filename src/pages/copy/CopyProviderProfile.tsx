import { useParams, Link } from "react-router-dom";
import { Users, Activity, TrendingUp, ShieldAlert, BadgeCheck, ArrowLeft } from "lucide-react";
import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProviders } from "@/hooks/useBotvio";
import { useCopyStrategies, PLATFORM_LABEL } from "@/hooks/useCopyTrading";
import { CopyInviteLinkButton } from "@/components/copy/CopyInviteLinkButton";

const fmtPct = (v: number | null | undefined) =>
  v === null || v === undefined ? "—" : `${Number(v).toFixed(1)}%`;

/** Provider profile — historical performance, published strategies and copy CTA. */
const CopyProviderProfile = () => {
  const { providerId } = useParams<{ providerId: string }>();
  const { data: providers, isLoading } = useProviders();
  const { data: strategies } = useCopyStrategies();

  const provider = providers?.find((p) => p.id === providerId);
  const providerStrategies = (strategies ?? []).filter((s) => s.provider_id === providerId);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={provider ? `${provider.display_name} – Copy Trading Provider` : "Copy Trading Provider"}
        description="Review verified provider performance, risk limits and published copy strategies before you start copying with your own risk settings."
      />
      <Header />

      <main className="container mx-auto max-w-4xl space-y-5 px-4 py-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/copy-trading">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Copy Trading
          </Link>
        </Button>

        {isLoading ? (
          <Skeleton className="h-40" />
        ) : !provider ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <p className="mb-4 text-sm text-muted-foreground">This provider is not available.</p>
              <Button asChild>
                <Link to="/copy-trading">Browse providers</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="glass-card">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-xl font-bold text-primary">
                    {provider.display_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="flex items-center gap-2 text-xl font-bold">
                      {provider.display_name}
                      {provider.verified && <BadgeCheck className="h-5 w-5 text-primary" />}
                    </h1>
                    {provider.bio && (
                      <p className="mt-1 text-sm text-muted-foreground">{provider.bio}</p>
                    )}
                  </div>
                  <Button asChild>
                    <Link to={`/copy-trading/start/${provider.id}`}>Copy strategy</Link>
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg bg-muted/40 p-3 text-center">
                    <p className="text-lg font-bold">{fmtPct(provider.win_rate)}</p>
                    <p className="text-[10px] text-muted-foreground">Win rate (history)</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3 text-center">
                    <p className="text-lg font-bold">{provider.total_trades ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground">Closed trades</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3 text-center">
                    <p className="text-lg font-bold">${Number(provider.total_profit ?? 0).toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">Net P/L (history)</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3 text-center">
                    <p className="text-lg font-bold">{provider.total_subscribers ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground">Followers</p>
                  </div>
                </div>

                <p className="flex items-start gap-2 text-[11px] text-muted-foreground">
                  <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                  All metrics are historical, taken from closed trades recorded on Botvio. Copy
                  trading involves risk and past performance does not guarantee future results.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Published strategies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {providerStrategies.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    This provider has not published a strategy profile yet. You can still copy their
                    trades using your own risk settings.
                  </p>
                ) : (
                  providerStrategies.map((s) => (
                    <div key={s.id} className="space-y-2 rounded-lg border border-border/60 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{s.name}</p>
                        <Badge variant="secondary" className="text-[10px]">
                          {PLATFORM_LABEL[s.platform] ?? s.platform}
                          {s.broker_label ? ` • ${s.broker_label}` : ""}
                        </Badge>
                      </div>
                      {s.description && (
                        <p className="text-xs text-muted-foreground">{s.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {s.markets.map((m) => (
                          <Badge key={m} variant="outline" className="text-[10px]">
                            {m}
                          </Badge>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                        <div className="rounded bg-muted/40 p-2">
                          <p className="font-semibold">{Number(s.max_risk_per_trade).toFixed(2)}%</p>
                          <p className="text-muted-foreground">Risk / trade</p>
                        </div>
                        <div className="rounded bg-muted/40 p-2">
                          <p className="font-semibold">{Number(s.max_daily_loss_percent).toFixed(0)}%</p>
                          <p className="text-muted-foreground">Daily loss cap</p>
                        </div>
                        <div className="rounded bg-muted/40 p-2">
                          <p className="font-semibold">{Number(s.max_drawdown_percent).toFixed(0)}%</p>
                          <p className="text-muted-foreground">Drawdown cap</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-3 text-center text-xs text-muted-foreground">
              <div className="rounded-lg border border-border/60 p-3">
                <Activity className="mx-auto mb-1 h-4 w-4 text-primary" />
                Live copy status after you start
              </div>
              <div className="rounded-lg border border-border/60 p-3">
                <TrendingUp className="mx-auto mb-1 h-4 w-4 text-primary" />
                Your own risk limits
              </div>
              <div className="rounded-lg border border-border/60 p-3">
                <Users className="mx-auto mb-1 h-4 w-4 text-primary" />
                Your account stays private
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default CopyProviderProfile;
