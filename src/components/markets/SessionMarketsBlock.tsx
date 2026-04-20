import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DerivLiveChart } from "@/components/chart/DerivLiveChart";
import { TradingViewAdvancedChart } from "@/components/chart/TradingViewAdvancedChart";
import { mapToDerivSymbol } from "@/hooks/useDerivLiveTicks";
import { DailyOutlookCard, type DailyOutlookCardProps } from "./DailyOutlookCard";
import { Clock, Activity } from "lucide-react";

export interface SessionInstrument {
  /** TradingView symbol, e.g. "NASDAQ:NDX" — used as fallback when Deriv doesn't list this asset */
  tvSymbol: string;
  label: string;        // e.g. "NASDAQ 100"
  symbolBadge?: string; // e.g. "NAS100"
  /**
   * Optional explicit Deriv display symbol (e.g. "XAU/USD", "NAS100", "GER40").
   * When provided OR when the badge/label maps to a Deriv-supported symbol,
   * the chart uses the same live Deriv engine as the Gold Trading Hub
   * (real candles + Hauza overlay) instead of the TradingView widget.
   */
  derivDisplaySymbol?: string;
  outlook: DailyOutlookCardProps;
}

export interface SessionMarketsBlockProps {
  sessionEmoji: string;
  sessionName: string;        // "New York Session" / "London Session"
  sessionHours: string;       // "13:30 – 20:00 UTC"
  isOpen: boolean;
  description: string;
  instruments: SessionInstrument[];
}

/** Try every available hint to find a Deriv-supported symbol. */
function resolveDerivSymbol(inst: SessionInstrument): string | null {
  const candidates = [inst.derivDisplaySymbol, inst.symbolBadge, inst.label]
    .filter(Boolean) as string[];
  for (const c of candidates) {
    if (mapToDerivSymbol(c)) return c;
  }
  return null;
}

/**
 * Reusable section: session header + grid of live charts paired with
 * daily-outlook cards (technical + fundamental + Hauza + new-trader tips).
 *
 * Charts mirror the Gold Trading Hub experience:
 *   • Deriv live candles + Hauza overlay (clear, instant) when supported
 *   • TradingView Advanced Chart fallback for non-Deriv assets
 *     (Aramco / TASI / DFM etc.)
 */
export function SessionMarketsBlock({
  sessionEmoji,
  sessionName,
  sessionHours,
  isOpen,
  description,
  instruments,
}: SessionMarketsBlockProps) {
  return (
    <section className="space-y-4">
      <Card className={isOpen ? "border-success/40 bg-success/5" : "border-border"}>
        <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{sessionEmoji}</span>
            <div>
              <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                {sessionName}
                {isOpen ? (
                  <Badge className="bg-success/20 text-success border-success/40 gap-1 text-[10px]">
                    <Activity className="h-2.5 w-2.5 animate-pulse" /> LIVE
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <Clock className="h-2.5 w-2.5" /> Closed
                  </Badge>
                )}
              </h2>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono">{sessionHours}</Badge>
        </CardContent>
      </Card>

      {instruments.map((inst) => {
        const derivSym = resolveDerivSymbol(inst);
        const chartLabel = `${inst.label}${inst.symbolBadge ? ` · ${inst.symbolBadge}` : ""}`;
        return (
          <div key={inst.tvSymbol} className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3">
              {derivSym ? (
                <DerivLiveChart
                  displaySymbol={derivSym}
                  height={420}
                  defaultGranularity={300}
                  showHauza
                />
              ) : (
                <TradingViewAdvancedChart
                  symbol={inst.tvSymbol}
                  label={chartLabel}
                  height={420}
                  interval="60"
                  withHauza
                />
              )}
            </div>
            <div className="lg:col-span-2">
              <DailyOutlookCard {...inst.outlook} />
            </div>
          </div>
        );
      })}
    </section>
  );
}
