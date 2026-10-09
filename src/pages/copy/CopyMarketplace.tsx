import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Users, TrendingUp, ShieldAlert, Sparkles, Plus, LayoutDashboard, Bot, ArrowRight } from "lucide-react";
import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { PageBanner } from "@/components/layout/PageBanner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProviders, useMySubscriberCount } from "@/hooks/useBotvio";
import { useCopyStrategies, type CopyStrategy } from "@/hooks/useCopyTrading";
import { CopyProviderCard, type CopyProviderCardData } from "@/components/copy/CopyProviderCard";

type TabKey = "all" | "deriv" | "mt5" | "forex" | "cfds" | "synthetic" | "crypto";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "deriv", label: "Deriv" },
  { key: "mt5", label: "MT5" },
  { key: "forex", label: "Forex" },
  { key: "cfds", label: "CFDs" },
  { key: "synthetic", label: "Synthetic" },
  { key: "crypto", label: "Crypto" },
];

const FOREX = ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "XAUUSD", "XAGUSD"];
const CFDS = ["NAS100", "US30", "GER40"];
const SYNTHETIC = ["Boom", "Crash", "Volatility", "Rise/Fall", "Digits", "Multipliers"];
const CRYPTO = ["BTC", "ETH", "SOL", "BNB", "XRP", "USDT"];

const matchesGroup = (markets: string[], group: string[]) =>
  markets.some((m) => group.some((g) => m.toUpperCase().includes(g.toUpperCase())));

const riskLabel = (s?: CopyStrategy) => {
  if (!s) return null;
  const risk = Number(s.max_risk_per_trade ?? 0);
  if (risk <= 0.75) return "Conservative";
  if (risk <= 1.5) return "Balanced";
  return "Aggressive";
};

/** BotvioCopy marketplace — discover providers and their published strategies. */
const CopyMarketplace = () => {
  const { data: providers, isLoading } = useProviders();
  const { data: strategies } = useCopyStrategies();
  const { data: myFollowers } = useMySubscriberCount();

  const [tab, setTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("followers");
  const [risk, setRisk] = useState("any");

  const cards = useMemo<(CopyProviderCardData & { markets: string[] })[]>(() => {
    const byProvider = new Map<string, CopyStrategy>();
    (strategies ?? []).forEach((s) => {
      if (!byProvider.has(s.provider_id)) byProvider.set(s.provider_id, s as CopyStrategy);
    });

    return (providers ?? []).map((p) => {
      const strategy = byProvider.get(p.id);
      const platform = strategy?.platform ?? (p.primary_market === "mt5" ? "mt5" : "deriv");
      return {
        providerId: p.id,
        name: p.display_name,
        strategyName: strategy?.name ?? null,
        platform,
        brokerLabel: strategy?.broker_label ?? null,
        marketLabel: strategy?.trading_style ?? p.primary_market ?? null,
        winRate: p.win_rate ?? null,
        trades: p.total_trades ?? null,
        netProfit: p.total_profit ?? null,
        followers: p.total_subscribers ?? null,
        maxDrawdownPercent: strategy ? Number(strategy.max_drawdown_percent) : null,
        riskLabel: riskLabel(strategy),
        verified: !!p.verified,
        live: !!strategy && strategy.status === "active",
        markets: strategy?.markets ?? [],
      };
    });
  }, [providers, strategies]);

  const filtered = useMemo(() => {
    let list = cards;

    if (tab === "deriv" || tab === "mt5") list = list.filter((c) => c.platform === tab);
    if (tab === "forex") list = list.filter((c) => matchesGroup(c.markets, FOREX));
    if (tab === "cfds") list = list.filter((c) => matchesGroup(c.markets, CFDS));
    if (tab === "synthetic")
      list = list.filter((c) => c.platform === "deriv" || matchesGroup(c.markets, SYNTHETIC));
    if (tab === "crypto")
      list = list.filter((c) => c.platform === "binance" || matchesGroup(c.markets, CRYPTO));

    if (risk !== "any") list = list.filter((c) => (c.riskLabel ?? "").toLowerCase() === risk);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.strategyName ?? "").toLowerCase().includes(q) ||
          c.markets.some((m) => m.toLowerCase().includes(q)),
      );
    }

    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sort === "winrate") return (b.winRate ?? 0) - (a.winRate ?? 0);
      if (sort === "profit") return (b.netProfit ?? 0) - (a.netProfit ?? 0);
      if (sort === "drawdown")
        return (a.maxDrawdownPercent ?? 999) - (b.maxDrawdownPercent ?? 999);
      if (sort === "trades") return (b.trades ?? 0) - (a.trades ?? 0);
      return (b.followers ?? 0) - (a.followers ?? 0);
    });
    return sorted;
  }, [cards, tab, risk, search, sort]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        seoKey="providers"
        title="Copy Trading – Follow Verified Deriv & MT5 Traders"
        description="Browse verified BotvioCopy providers, compare real performance and risk, then copy their trades to your own Deriv, MT5 or Binance account with your own risk limits."
      />
      <Header />

      <main className="container mx-auto space-y-6 px-4 py-6">
        <PageBanner
          title="Copy"
          accent="Trading"
          description="Connect your account, choose a provider, set your risk, start copying. Your account stays yours — provider credentials are never shared."
          crumbs={[{ label: "Home", to: "/" }, { label: "Copy Trading" }]}
          features={[
            { icon: Sparkles, label: "Deriv & Synthetics", sub: "Options, multipliers, digits" },
            { icon: TrendingUp, label: "Forex & CFDs", sub: "MT5 accounts" },
            { icon: Users, label: "Crypto", sub: "Where supported" },
          ]}
          stats={[
            { icon: Users, value: String(providers?.length ?? 0), label: "Providers" },
            { icon: LayoutDashboard, value: String(strategies?.length ?? 0), label: "Strategies" },
            { icon: Users, value: String(myFollowers ?? 0), label: "My followers" },
          ]}
          action={
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/copy-trading/my">My copy trading</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/copy-trading/become-provider">
                  <Plus className="mr-1.5 h-4 w-4" /> Become a provider
                </Link>
              </Button>
            </div>
          }
        />

        <Card className="glass-card border-warning/40 bg-warning/5">
          <CardContent className="flex items-start gap-3 py-3">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <p className="text-xs text-muted-foreground">
              Copy trading involves risk. Past performance does not guarantee future results. All
              figures shown are historical results from completed trades — never projections.
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-emerald-500/25 bg-gradient-to-r from-emerald-500/10 via-background to-primary/5">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold">Botvio Master</h2>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Official Botvio Robot</span>
                </div>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Follow Botvio’s official automated strategy on your own MT5 follower account. Choose your risk settings, test on demo first, and pause or stop copying whenever you want.
                </p>
              </div>
            </div>
            <Button asChild className="min-h-11 shrink-0">
              <Link to="/copy-trading/onboarding">Follow Botvio Master <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-transparent p-0">
            {TABS.map((t) => (
              <TabsTrigger key={t.key} value={t.key} className="rounded-full border border-border/60 px-3 text-xs">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            placeholder="Search provider, strategy or market"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="followers">Most followers</SelectItem>
              <SelectItem value="profit">Highest net P/L</SelectItem>
              <SelectItem value="winrate">Best win rate</SelectItem>
              <SelectItem value="drawdown">Lowest drawdown</SelectItem>
              <SelectItem value="trades">Most trades</SelectItem>
            </SelectContent>
          </Select>
          <Select value={risk} onValueChange={setRisk}>
            <SelectTrigger>
              <SelectValue placeholder="Risk level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any risk level</SelectItem>
              <SelectItem value="conservative">Conservative</SelectItem>
              <SelectItem value="balanced">Balanced</SelectItem>
              <SelectItem value="aggressive">Aggressive</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" asChild>
            <Link to="/provider-dashboard">Provider dashboard</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-56" />
            <Skeleton className="h-56" />
            <Skeleton className="h-56" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h2 className="mb-1 text-lg font-semibold">No providers match these filters</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Try clearing the filters, or publish your own strategy.
              </p>
              <Button asChild>
                <Link to="/copy-trading/become-provider">Become a provider</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <CopyProviderCard key={c.providerId} data={c} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CopyMarketplace;
