import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TradingViewAdvancedChart } from "@/components/chart/TradingViewAdvancedChart";
import { DailyOutlookCard, type DailyOutlookCardProps } from "./DailyOutlookCard";
import { Clock, Activity } from "lucide-react";

export interface SessionInstrument {
  /** TradingView symbol, e.g. "NASDAQ:NDX" */
  tvSymbol: string;
  label: string;        // e.g. "NASDAQ 100"
  symbolBadge?: string; // e.g. "NAS100"
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

/**
 * A reusable section that renders a session header + a grid of
 * TradingView Advanced charts (with Hauza indicators preloaded)
 * paired with daily outlook cards (technical + fundamental + Hauza + new-trader tips).
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

      {instruments.map((inst) => (
        <div key={inst.tvSymbol} className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <TradingViewAdvancedChart
              symbol={inst.tvSymbol}
              label={`${inst.label}${inst.symbolBadge ? ` · ${inst.symbolBadge}` : ""}`}
              height={420}
              interval="60"
              withHauza
            />
          </div>
          <div className="lg:col-span-2">
            <DailyOutlookCard {...inst.outlook} />
          </div>
        </div>
      ))}
    </section>
  );
}
