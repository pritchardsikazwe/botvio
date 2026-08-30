import { Link } from "react-router-dom";
import { ArrowRight, Flame, Layers, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdSlot } from "./AdSlot";
import { ArticleCard } from "./ArticleCard";
import { DerivLiveChart } from "@/components/chart/DerivLiveChart";
import { RESEARCH_TOPICS, type ResearchMarket } from "@/lib/research/taxonomy";
import type { ResearchArticle } from "@/lib/research/useResearchArticles";

/**
 * Sticky research sidebar: live market snapshot (existing Botvio chart),
 * trending research, a clearly-labelled ad slot, the related Trading Hub
 * and popular topics. Nothing here fabricates data.
 */
export const ResearchSidebar = ({
  market,
  trending,
  className,
}: {
  market?: ResearchMarket | null;
  trending: ResearchArticle[];
  className?: string;
}) => (
  <aside className={className}>
    <div className="space-y-6 lg:sticky lg:top-24">
      {market && (
        <section className="overflow-hidden rounded-2xl border border-border/60 bg-card/60">
          <header className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Botvio Market Snapshot
            </span>
            <Badge variant="outline" className="text-[10px] uppercase">{market.broker}</Badge>
          </header>
          <div className="px-2 pt-2">
            <DerivLiveChart displaySymbol={market.displaySymbol} height={180} defaultGranularity={900} showHauza={false} />
          </div>
          <div className="p-4 pt-3">
            <p className="text-sm font-semibold text-foreground">{market.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{market.kind} • {market.broker}</p>
            <Link to={market.hub} className="mt-3 block">
              <Button size="sm" variant="outline" className="w-full gap-1.5">
                Open {market.hubLabel} <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </section>
      )}

      {trending.length > 0 && (
        <section className="rounded-2xl border border-border/60 bg-card/60 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <Flame className="h-3.5 w-3.5 text-primary" /> Trending Research
          </h3>
          <div className="space-y-1">
            {trending.slice(0, 5).map((a) => (
              <ArticleCard key={a.slug} article={a} variant="compact" />
            ))}
          </div>
        </section>
      )}

      <AdSlot placement="sidebar" />

      <section className="rounded-2xl border border-border/60 bg-card/60 p-4">
        <h3 className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <Layers className="h-3.5 w-3.5 text-primary" /> Popular Topics
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {RESEARCH_TOPICS.filter((t) => t.primary).map((t) => (
            <Link key={t.slug} to={`/blog/category/${t.slug}`}>
              <Badge variant="outline" className="text-[11px] transition-colors hover:border-primary/60 hover:text-primary">
                {t.label}
              </Badge>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card/60 p-4">
        <h3 className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <TrendingUp className="h-3.5 w-3.5 text-primary" /> Explore Botvio
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Signals", to: "/signals" },
            { label: "Trading Hubs", to: "/markets" },
            { label: "AI Chart Analysis", to: "/chart" },
            { label: "Academy", to: "/learn" },
          ].map((l) => (
            <Link key={l.to} to={l.to}>
              <Button variant="outline" size="sm" className="w-full text-xs">{l.label}</Button>
            </Link>
          ))}
        </div>
      </section>
    </div>
  </aside>
);
