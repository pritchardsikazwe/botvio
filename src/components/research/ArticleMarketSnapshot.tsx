import { Link } from "react-router-dom";
import { ArrowRight, LineChart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DerivLiveChart } from "@/components/chart/DerivLiveChart";
import type { ResearchMarket } from "@/lib/research/taxonomy";

/**
 * Market snapshot block used inside research articles.
 * Reuses the existing Botvio Trading Hub chart (DerivLiveChart) — no new
 * market data source, no decorative charts and no invented prices. Price,
 * trend and S/R come from the chart component itself.
 */
export const ArticleMarketSnapshot = ({
  market,
  height = 360,
  title = "Market Snapshot",
}: {
  market: ResearchMarket;
  height?: number;
  title?: string;
}) => (
  <section className="not-prose my-10 overflow-hidden rounded-2xl border border-border/60 bg-card/60">
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
      <div className="flex items-center gap-2">
        <LineChart className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{market.broker}</Badge>
        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{market.kind}</Badge>
        <Badge className="bg-primary/15 text-[10px] uppercase tracking-wider text-primary hover:bg-primary/20">
          {market.label}
        </Badge>
      </div>
    </header>

    <div className="p-2 sm:p-3">
      <DerivLiveChart displaySymbol={market.displaySymbol} height={height} defaultGranularity={900} showHauza />
    </div>

    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-4 py-3">
      <p className="text-xs text-muted-foreground">
        Live Botvio chart with the platform's support/resistance overlay. Market data may change.
      </p>
      <Link to={market.hub}>
        <Button size="sm" variant="outline" className="gap-1.5">
          Open {market.hubLabel} <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </Link>
    </footer>
  </section>
);
