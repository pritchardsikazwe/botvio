import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { AssetAvailability } from "@/services/deriv/derivSymbols";
import { Loader2, RefreshCw } from "lucide-react";

const STATUS_META = {
  available: { dot: "bg-success", label: "Available" },
  limited: { dot: "bg-amber-500", label: "Limited" },
  unavailable: { dot: "bg-destructive", label: "Unavailable" },
} as const;

interface AssetSelectorProps {
  assets: AssetAvailability[];
  value: string;
  onChange: (symbol: string) => void;
  loading?: boolean;
  onRefresh?: () => void;
  /** Group the dropdown by Deriv market (Synthetics, Forex, …) */
  groupByMarket?: boolean;
  className?: string;
}

/**
 * Asset picker driven purely by live Deriv availability. Unavailable assets are
 * disabled and always explain why — never silently hidden.
 */
export const AssetSelector = ({
  assets, value, onChange, loading, onRefresh, groupByMarket = true, className,
}: AssetSelectorProps) => {
  const selected = assets.find((a) => a.symbol === value) ?? null;

  const groups = groupByMarket
    ? assets.reduce<Record<string, AssetAvailability[]>>((acc, a) => {
        const key = a.market ? a.market.replace(/_/g, " ") : "Other";
        (acc[key] ||= []).push(a);
        return acc;
      }, {})
    : { All: assets };

  const renderItem = (a: AssetAvailability) => (
    <SelectItem key={a.symbol} value={a.symbol} disabled={a.status === "unavailable"}>
      <span className="flex items-center gap-2">
        <span className={cn("h-2 w-2 shrink-0 rounded-full", STATUS_META[a.status].dot)} />
        <span className={cn(a.status === "unavailable" && "text-muted-foreground line-through")}>
          {a.displayName}
        </span>
      </span>
    </SelectItem>
  );

  return (
    <TooltipProvider>
      <div className={cn("space-y-1.5", className)}>
        <div className="flex items-center gap-2">
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder={loading ? "Loading assets…" : "Select asset"} />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {Object.entries(groups).map(([market, list]) => (
                <SelectGroup key={market}>
                  <SelectLabel className="capitalize">{market}</SelectLabel>
                  {list.map(renderItem)}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>

          {onRefresh && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="outline" onClick={onRefresh} disabled={loading} aria-label="Refresh assets">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh available assets from Deriv</TooltipContent>
            </Tooltip>
          )}
        </div>

        {selected && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px]",
                selected.status === "available" && "border-success/30 bg-success/10 text-success",
                selected.status === "limited" && "border-amber-500/30 bg-amber-500/10 text-amber-600",
                selected.status === "unavailable" && "border-destructive/30 bg-destructive/10 text-destructive",
              )}
            >
              {STATUS_META[selected.status].label}
            </Badge>
            {selected.reason ? (
              <span className="text-muted-foreground">{selected.reason}</span>
            ) : (
              <span className="text-muted-foreground">Confirmed tradable by Deriv right now.</span>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};