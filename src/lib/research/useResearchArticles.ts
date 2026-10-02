/**
 * Single source of truth for research article METADATA in the UI layer.
 *
 * Merges the editor-managed `posts` table (Lovable Cloud) with the existing
 * static article index. No second article database is created — this only
 * normalises what already exists so every research surface (landing page,
 * category pages, market research pages, search, related articles) reads
 * the same shape.
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BLOG_INDEX, type BlogIndexEntry } from "@/content/blogIndex";
import { DUBAI_BLOG_INDEX } from "@/content/dubaiBlogIndex";
import {
  detectArticleType,
  detectMarket,
  detectTopics,
  type ArticleType,
  type ResearchMarket,
  type ResearchTopic,
} from "./taxonomy";

export interface ResearchArticle extends BlogIndexEntry {
  coverImage?: string | null;
  source: "db" | "static";
  topics: ResearchTopic[];
  market: ResearchMarket | null;
  type: ArticleType;
  /** epoch ms, used for sorting */
  time: number;
  readMinutes: number;
}

const parseMinutes = (readTime?: string) => {
  const n = parseInt((readTime || "").replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : 6;
};

const decorate = (entry: BlogIndexEntry & { coverImage?: string | null; source: "db" | "static" }): ResearchArticle => ({
  ...entry,
  topics: detectTopics(entry.title, entry.category, entry.excerpt),
  market: detectMarket(entry.title, entry.category, entry.excerpt),
  type: detectArticleType(entry.title, entry.category, entry.excerpt),
  time: new Date(entry.date).getTime() || 0,
  readMinutes: parseMinutes(entry.readTime),
});

export const STATIC_ARTICLES: ResearchArticle[] = [...BLOG_INDEX, ...DUBAI_BLOG_INDEX].map((p) =>
  decorate({ ...p, source: "static" }),
);

export function useResearchArticles() {
  const { data: dbPosts, isLoading } = useQuery({
    queryKey: ["research-articles"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select("slug, title, excerpt, category, read_time, published_at, created_at, cover_image")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      return data || [];
    },
  });

  const articles = useMemo<ResearchArticle[]>(() => {
    const fromDb = (dbPosts || []).map((p: any) =>
      decorate({
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt || "",
        category: p.category || "Guide",
        readTime: p.read_time || "6 min",
        date: p.published_at || p.created_at,
        featured: false,
        image: p.cover_image || undefined,
        coverImage: p.cover_image,
        source: "db",
      }),
    );
    const dbSlugs = new Set(fromDb.map((p) => p.slug));
    return [...fromDb, ...STATIC_ARTICLES.filter((p) => !dbSlugs.has(p.slug))].sort(
      (a, b) => b.time - a.time,
    );
  }, [dbPosts]);

  return { articles, isLoading };
}

/* ── query helpers (pure) ────────────────────────────────────── */

export const searchArticles = (articles: ResearchArticle[], q: string) => {
  const term = q.trim().toLowerCase();
  if (!term) return articles;
  return articles.filter((a) =>
    [a.title, a.excerpt, a.category, a.market?.label, a.market?.broker, ...a.topics.map((t) => t.label)]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(term),
  );
};

export const byTopic = (articles: ResearchArticle[], slug: string) =>
  articles.filter((a) => a.topics.some((t) => t.slug === slug));

export const byMarket = (articles: ResearchArticle[], displaySymbol: string) =>
  articles.filter((a) => a.market?.displaySymbol === displaySymbol);

export type SortKey = "latest" | "most-read" | "trending" | "featured" | "reading-time";

export const sortArticles = (articles: ResearchArticle[], key: SortKey) => {
  const list = [...articles];
  switch (key) {
    case "featured":
      return list.sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || b.time - a.time);
    case "reading-time":
      return list.sort((a, b) => b.readMinutes - a.readMinutes);
    // "Most read" / "Trending" use editorial featured status + recency, the only
    // signals available without fabricating traffic numbers.
    case "most-read":
      return list.sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || b.readMinutes - a.readMinutes);
    case "trending":
      return list.sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || b.time - a.time);
    default:
      return list.sort((a, b) => b.time - a.time);
  }
};

/**
 * Related articles for a slug, scored by shared market → topics → category.
 * Works for the 200+ existing articles with no manual curation.
 */
export const relatedArticles = (
  articles: ResearchArticle[],
  current: { slug: string; title: string; category?: string; excerpt?: string },
  limit = 6,
): ResearchArticle[] => {
  const market = detectMarket(current.title, current.category, current.excerpt);
  const topicSlugs = new Set(detectTopics(current.title, current.category, current.excerpt).map((t) => t.slug));

  return articles
    .filter((a) => a.slug !== current.slug)
    .map((a) => {
      let score = 0;
      if (market && a.market?.displaySymbol === market.displaySymbol) score += 6;
      if (market && a.market?.broker === market.broker) score += 1;
      score += a.topics.filter((t) => topicSlugs.has(t.slug)).length * 3;
      if (current.category && a.category === current.category) score += 2;
      if (a.featured) score += 1;
      return { a, score };
    })
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score || y.a.time - x.a.time)
    .slice(0, limit)
    .map((x) => x.a);
};

export const formatDate = (date: string) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};
