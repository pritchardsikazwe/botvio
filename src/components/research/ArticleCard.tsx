import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDate, type ResearchArticle } from "@/lib/research/useResearchArticles";

const isImage = (src?: string | null) => !!src && (src.startsWith("http") || src.startsWith("/"));

const CardVisual = ({ article, className }: { article: ResearchArticle; className?: string }) => (
  <div
    className={cn(
      "relative overflow-hidden bg-gradient-to-br from-primary/15 via-card to-warning/10",
      className,
    )}
  >
    {isImage(article.coverImage || article.image) ? (
      <img
        src={(article.coverImage || article.image) as string}
        alt={article.title}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
      />
    ) : (
      <div className="flex h-full w-full items-center justify-center">
        <span className="text-4xl opacity-90">{article.image || "📊"}</span>
      </div>
    )}
    {article.market && (
      <span className="absolute bottom-2 left-2 rounded-md border border-border/60 bg-background/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground backdrop-blur">
        {article.market.label}
      </span>
    )}
  </div>
);

/** Premium editorial card used across every research surface. */
export const ArticleCard = ({ article, variant = "grid" }: { article: ResearchArticle; variant?: "grid" | "row" | "compact" }) => {
  if (variant === "compact") {
    return (
      <Link to={`/blog/${article.slug}`} className="group flex gap-3 rounded-lg p-2 transition-colors hover:bg-muted/40">
        <CardVisual article={article} className="h-14 w-14 shrink-0 rounded-md" />
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground group-hover:text-primary">
            {article.title}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
            {article.category} • {article.readMinutes} min
          </p>
        </div>
      </Link>
    );
  }

  if (variant === "row") {
    return (
      <Link
        to={`/blog/${article.slug}`}
        className="group flex items-center gap-4 rounded-xl border border-border/60 bg-card/60 p-3 transition-all hover:border-primary/50 hover:bg-card sm:gap-5 sm:p-4"
      >
        <CardVisual article={article} className="h-16 w-16 shrink-0 rounded-lg sm:h-20 sm:w-28" />
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{article.category}</Badge>
            <span className="text-[11px] text-muted-foreground">{formatDate(article.date)}</span>
          </div>
          <h3 className="line-clamp-2 font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
            {article.title}
          </h3>
          <p className="mt-1 hidden line-clamp-2 text-sm text-muted-foreground sm:block">{article.excerpt}</p>
        </div>
        <div className="hidden shrink-0 items-center gap-1 text-xs text-muted-foreground sm:flex">
          <Clock className="h-3.5 w-3.5" /> {article.readMinutes} min
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/blog/${article.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/60 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-card hover:shadow-lg"
    >
      <CardVisual article={article} className="aspect-[16/9] w-full" />
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge className="bg-primary/15 text-[10px] uppercase tracking-wider text-primary hover:bg-primary/20">
            {article.category}
          </Badge>
        </div>
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
          {article.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{article.excerpt}</p>
        <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-[11px] text-muted-foreground">
          <span>{article.readMinutes} min read • {formatDate(article.date)}</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
};
