import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, Users, Activity, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLATFORM_LABEL } from "@/hooks/useCopyTrading";

export interface CopyProviderCardData {
  providerId: string;
  name: string;
  strategyName?: string | null;
  ownerLabel?: string | null;
  platform: string;
  brokerLabel?: string | null;
  marketLabel?: string | null;
  winRate: number | null;
  trades: number | null;
  netProfit: number | null;
  followers: number | null;
  maxDrawdownPercent?: number | null;
  riskLabel?: string | null;
  verified?: boolean;
  live?: boolean;
}

const fmtPct = (v: number | null | undefined) =>
  v === null || v === undefined ? "—" : `${v.toFixed(1)}%`;

const fmtMoney = (v: number | null | undefined) =>
  v === null || v === undefined ? "—" : `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(2)}`;

/**
 * Compact, scannable provider card for the BotvioCopy marketplace.
 * Metrics come from the existing provider records — nothing is invented;
 * unavailable values render as "—".
 */
export const CopyProviderCard = ({ data }: { data: CopyProviderCardData }) => {
  const profit = data.netProfit ?? null;

  return (
    <Card className="glass-card h-full border-border/60 transition-colors hover:border-primary/50">
      <CardContent className="flex h-full flex-col gap-4 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-base font-bold text-primary">
            {data.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-semibold uppercase tracking-wide">
                {data.strategyName || data.name}
              </p>
              {data.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />}
            </div>
            <p className="truncate text-xs text-muted-foreground">{data.name}</p>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 gap-1 text-[10px]",
              data.live
                ? "border-success/30 bg-success/10 text-success"
                : "border-border/60 text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                data.live ? "bg-success" : "bg-muted-foreground",
              )}
            />
            {data.live ? "Live" : "Idle"}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="text-[10px]">
            {PLATFORM_LABEL[data.platform] ?? data.platform.toUpperCase()}
            {data.brokerLabel ? ` • ${data.brokerLabel}` : ""}
          </Badge>
          {data.marketLabel && (
            <Badge variant="outline" className="text-[10px]">
              {data.marketLabel}
            </Badge>
          )}
          {data.riskLabel && (
            <Badge variant="outline" className="gap-1 text-[10px]">
              <ShieldCheck className="h-3 w-3" />
              {data.riskLabel}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-muted/40 p-2">
            <p
              className={cn(
                "text-sm font-bold",
                profit === null ? "" : profit >= 0 ? "text-success" : "text-destructive",
              )}
            >
              {fmtMoney(profit)}
            </p>
            <p className="text-[10px] text-muted-foreground">Net P/L (history)</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-2">
            <p className="text-sm font-bold">{fmtPct(data.winRate)}</p>
            <p className="text-[10px] text-muted-foreground">Win rate</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-2">
            <p className="text-sm font-bold">{fmtPct(data.maxDrawdownPercent)}</p>
            <p className="text-[10px] text-muted-foreground">Max drawdown</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Activity className="h-3.5 w-3.5" />
            {data.trades ?? 0} trades
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {data.followers ?? 0} followers
          </span>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/copy-trading/provider/${data.providerId}`}>View</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to={`/copy-trading/start/${data.providerId}`}>Copy</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
