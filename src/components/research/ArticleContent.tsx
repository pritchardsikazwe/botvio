import { Fragment, useMemo } from "react";
import { AdSlot, adOpportunities } from "./AdSlot";
import { ArticleMarketSnapshot } from "./ArticleMarketSnapshot";
import type { ResearchMarket } from "@/lib/research/taxonomy";

const PROSE_CLASSES = `
  blog-prose
  prose prose-lg dark:prose-invert max-w-none
  prose-headings:font-sans prose-headings:tracking-tight prose-headings:text-foreground prose-headings:scroll-mt-24
  prose-h2:text-2xl sm:prose-h2:text-3xl prose-h2:font-bold prose-h2:mt-10 prose-h2:mb-4 prose-h2:leading-snug prose-h2:pb-2 prose-h2:border-b prose-h2:border-border/60
  prose-h3:text-xl sm:prose-h3:text-2xl prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-3
  prose-h4:text-lg prose-h4:font-semibold prose-h4:mt-6 prose-h4:mb-2
  prose-p:text-[1.0425rem] prose-p:leading-[1.85] prose-p:text-foreground/90 prose-p:my-5
  prose-li:text-[1.0425rem] prose-li:leading-[1.8] prose-li:text-foreground/90 prose-li:my-2
  prose-ul:my-5 prose-ul:pl-6 prose-ol:my-5 prose-ol:pl-6
  prose-img:rounded-2xl prose-img:border prose-img:border-border prose-img:my-8
  prose-hr:my-10 prose-hr:border-border/60
  prose-a:text-primary prose-a:font-medium prose-a:underline prose-a:decoration-primary/40 prose-a:underline-offset-4
  prose-strong:text-foreground prose-strong:font-semibold
  prose-blockquote:border-l-4 prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-xl prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:my-7 prose-blockquote:not-italic prose-blockquote:font-medium prose-blockquote:text-foreground
  prose-li:marker:text-primary
  prose-table:my-7 prose-table:text-[0.95rem]
  prose-th:bg-muted/50 prose-th:text-foreground prose-th:font-semibold prose-th:px-3 prose-th:py-2
  prose-td:px-3 prose-td:py-2 prose-td:border-border/60
  prose-code:bg-muted prose-code:text-primary prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.9em]
  prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border prose-pre:rounded-xl prose-pre:p-4 prose-pre:my-7
`;

/** Split article HTML into H2 sections so charts and ads land between sections. */
const splitSections = (html: string): string[] => {
  if (!html) return [];
  const parts = html.split(/(?=<h2[\s>])/i).filter((s) => s.trim().length > 0);
  return parts.length ? parts : [html];
};

/**
 * Renders article HTML with editorial rhythm: the live market snapshot appears
 * after the intro, and ad slots are spaced between major sections based on
 * article length. Ads are never placed over charts or CTAs.
 */
export const ArticleContent = ({
  html,
  market,
  isMobile,
}: {
  html: string;
  market?: ResearchMarket | null;
  isMobile: boolean;
}) => {
  const sections = useMemo(() => splitSections(html), [html]);
  const wordCount = useMemo(() => html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).length, [html]);

  const ads = adOpportunities(wordCount, isMobile);
  // Space ads evenly through the body, never in the first or last section.
  const adAfter = new Set<number>();
  if (sections.length > 2 && ads > 0) {
    const step = Math.max(2, Math.floor((sections.length - 1) / (ads + 1)));
    for (let i = 1; i <= ads; i++) {
      const idx = i * step;
      if (idx < sections.length - 1) adAfter.add(idx);
    }
  }

  // Market snapshot after the intro section (before the first H2 body block).
  const snapshotAfter = sections.length > 1 ? 0 : -1;

  return (
    <div>
      {sections.map((section, i) => (
        <Fragment key={i}>
          <div className={PROSE_CLASSES} dangerouslySetInnerHTML={{ __html: section }} />
          {market && i === snapshotAfter && (
            <ArticleMarketSnapshot market={market} height={isMobile ? 280 : 380} />
          )}
          {adAfter.has(i) && <AdSlot placement="in-content" />}
        </Fragment>
      ))}
    </div>
  );
};
