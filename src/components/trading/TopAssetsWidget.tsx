import { useTopAssets, TopAsset } from "@/hooks/useTopAssets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, TrendingUp, Clock, Target, Zap, BarChart3, Activity, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

const BROKER_NAMES: Record<string, string> = {
  "pocket-option": "Pocket Option",
  "quotex": "Quotex",
  "deriv": "Deriv",
  "iq-option": "IQ Option",
  "binomo": "Binomo",
};

const BROKER_COLORS: Record<string, string> = {
  "pocket-option": "text-blue-400",
  "quotex": "text-emerald-400",
  "deriv": "text-red-400",
  "iq-option": "text-amber-400",
  "binomo": "text-purple-400",
};

function formatExpiry(seconds: number): string {
  if (seconds <= 10) return `${seconds} ticks`;
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}

function getScoreColor(score: number): string {
  if (score >= 85) return "text-success";
  if (score >= 70) return "text-primary";
  if (score >= 55) return "text-warning";
  return "text-destructive";
}

function getScoreBg(score: number): string {
  if (score >= 85) return "bg-success/20 border-success/30";
  if (score >= 70) return "bg-primary/20 border-primary/30";
  if (score >= 55) return "bg-warning/20 border-warning/30";
  return "bg-destructive/20 border-destructive/30";
}

const AssetCard = ({ asset, rank }: { asset: TopAsset; rank: number }) => {
  const medalEmoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/30 last:border-0">
      {/* Rank */}
      <div className="w-10 h-10 rounded-xl bg-muted/40 flex items-center justify-center shrink-0 text-lg font-bold">
        {typeof medalEmoji === "string" && medalEmoji.length <= 2 ? medalEmoji : (
          <span className="text-sm text-muted-foreground">{medalEmoji}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-bold text-sm truncate">{asset.symbol}</span>
          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${BROKER_COLORS[asset.best_broker] || "text-primary"}`}>
            {BROKER_NAMES[asset.best_broker] || asset.best_broker}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <Clock className="h-2.5 w-2.5" /> {formatExpiry(asset.best_expiry)}
          </span>
          <span className="flex items-center gap-0.5">
            <Target className="h-2.5 w-2.5" /> {asset.accuracy_today}% acc
          </span>
          <span className="flex items-center gap-0.5">
            <Activity className="h-2.5 w-2.5" /> {asset.opportunities_today} signals
          </span>
        </div>
      </div>

      {/* Score */}
      <div className={`w-12 h-12 rounded-xl border flex flex-col items-center justify-center shrink-0 ${getScoreBg(asset.score)}`}>
        <span className={`text-sm font-black ${getScoreColor(asset.score)}`}>{asset.score}</span>
        <span className="text-[8px] text-muted-foreground">score</span>
      </div>
    </div>
  );
};

interface TopAssetsWidgetProps {
  brokerSlug?: string;
  compact?: boolean;
}

export const TopAssetsWidget = ({ brokerSlug, compact = false }: TopAssetsWidgetProps) => {
  const globalType = brokerSlug
    ? (["pocket-option", "quotex"].includes(brokerSlug) ? "otc" : brokerSlug === "deriv" ? "synthetic" : "global")
    : "global";

  const { data: globalData, isLoading: globalLoading, refetch: refetchGlobal } = useTopAssets(globalType, brokerSlug || "");
  const { data: otcData } = useTopAssets("otc", "", 5);
  const { data: syntheticData } = useTopAssets("synthetic", "", 5);

  if (compact) {
    const rankings = globalData?.rankings || [];
    return (
      <Card className="glass-card border-primary/30">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              🏆 Top 5 Assets Today
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => refetchGlobal()} className="h-7 w-7 p-0">
              <RefreshCw className={`h-3.5 w-3.5 ${globalLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {globalLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-12 bg-muted/20 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : rankings.length > 0 ? (
            <div>
              {rankings.map((asset, i) => (
                <AssetCard key={asset.symbol} asset={asset} rank={i + 1} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Ranking data building... check back shortly.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-primary/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            🏆 Top 5 Assets Today
          </CardTitle>
          <Badge variant="outline" className="text-[10px]">
            <Zap className="h-2.5 w-2.5 mr-0.5" /> AI Ranked
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Best assets to trade right now, ranked by today's performance, volatility, and AI confidence.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="bg-muted/30 border border-border/40 mb-4 w-full">
            <TabsTrigger value="all" className="flex-1 text-xs gap-1">
              <BarChart3 className="h-3 w-3" /> All
            </TabsTrigger>
            <TabsTrigger value="otc" className="flex-1 text-xs gap-1">
              <TrendingUp className="h-3 w-3" /> OTC
            </TabsTrigger>
            <TabsTrigger value="synthetic" className="flex-1 text-xs gap-1">
              <Zap className="h-3 w-3" /> Synthetic
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <RankingList data={globalData} loading={globalLoading} />
          </TabsContent>
          <TabsContent value="otc">
            <RankingList data={otcData} loading={false} />
          </TabsContent>
          <TabsContent value="synthetic">
            <RankingList data={syntheticData} loading={false} />
          </TabsContent>
        </Tabs>

        <div className="mt-4 pt-3 border-t border-border/30 text-center">
          <Link to="/binary-options">
            <Button variant="outline" size="sm" className="text-xs">
              View All Broker Signals →
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

function RankingList({ data, loading }: { data: any; loading: boolean }) {
  const rankings = data?.rankings || [];

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-12 bg-muted/20 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (rankings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        Ranking data building... check back shortly.
      </p>
    );
  }

  return (
    <div>
      {rankings.map((asset: TopAsset, i: number) => (
        <AssetCard key={asset.symbol} asset={asset} rank={i + 1} />
      ))}
    </div>
  );
}
