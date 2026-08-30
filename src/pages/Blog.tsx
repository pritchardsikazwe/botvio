import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, BookOpen, Clock, LineChart, Newspaper, Search, Sparkles } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { PageBanner } from "@/components/layout/PageBanner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArticleCard } from "@/components/research/ArticleCard";
import { AdSlot } from "@/components/research/AdSlot";
import { ResearchSidebar } from "@/components/research/ResearchSidebar";
import { RESEARCH_TOPICS } from "@/lib/research/taxonomy";
import {
  byTopic,
  formatDate,
  searchArticles,
  sortArticles,
  useResearchArticles,
  type SortKey,
  type ResearchArticle,
} from "@/lib/research/useResearchArticles";

const PAGE_SIZE = 12;

const SORTS: { value: SortKey; label: string }[] = [
  { value: "latest", label: "Latest" },
  { value: "featured", label: "Featured" },
  { value: "trending", label: "Trending" },
  { value: "most-read", label: "Most Read" },
  { value: "reading-time", label: "Longest Reads" },
];

const SectionHeader = ({
  eyebrow,
  title,
  to,
  linkLabel = "View all",
}: {
  eyebrow?: string;
  title: string;
  to?: string;
  linkLabel?: string;
}) => (
  <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
    <div>
      {eyebrow && (
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">{eyebrow}</p>
      )}
      <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h2>
    </div>
    {to && (
      <Link to={to} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        {linkLabel} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    )}
  </div>
);

const TopicRow = ({
  eyebrow,
  title,
  to,
  articles,
}: {
  eyebrow: string;
  title: string;
  to: string;
  articles: ResearchArticle[];
}) => {
  if (!articles.length) return null;
  return (
    <section>
      <SectionHeader eyebrow={eyebrow} title={title} to={to} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {articles.slice(0, 3).map((a) => (
          <ArticleCard key={a.slug} article={a} />
        ))}
      </div>
    </section>
  );
};

const Blog = () => {
  const { articles, isLoading } = useResearchArticles();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") || "");
  const [topic, setTopic] = useState(params.get("topic") || "all");
  const [sort, setSort] = useState<SortKey>("latest");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const primaryTopics = RESEARCH_TOPICS.filter((t) => t.primary);

  const filtered = useMemo(() => {
    let list = articles;
    if (topic !== "all") list = byTopic(list, topic);
    list = searchArticles(list, search);
    return sortArticles(list, sort);
  }, [articles, topic, search, sort]);

  const isSearching = search.trim().length > 0 || topic !== "all";
  const hero = useMemo(
    () => articles.find((a) => a.featured && a.market) || articles.find((a) => a.featured) || articles[0],
    [articles],
  );
  const featured = useMemo(
    () => articles.filter((a) => a.featured && a.slug !== hero?.slug).slice(0, 6),
    [articles, hero],
  );
  const latest = useMemo(() => articles.filter((a) => a.slug !== hero?.slug), [articles, hero]);
  const trending = useMemo(() => sortArticles(articles, "trending").slice(0, 5), [articles]);

  const updateTopic = (slug: string) => {
    setTopic(slug);
    setVisible(PAGE_SIZE);
    const next = new URLSearchParams(params);
    if (slug === "all") next.delete("topic");
    else next.set("topic", slug);
    setParams(next, { replace: true });
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Blog",
        name: "Botvio Trading Research & Intelligence",
        url: "https://botvio.live/blog",
        description:
          "Market analysis, synthetic indices research, trading strategies, broker insights, education and practical tools from the Botvio trading ecosystem.",
        publisher: { "@type": "Organization", name: "Botvio", url: "https://botvio.live" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://botvio.live/" },
          { "@type": "ListItem", position: 2, name: "Research", item: "https://botvio.live/blog" },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        seoKey="blog"
        title="Botvio Research — Trading Analysis, Strategies & Education"
        description="Market analysis, Deriv synthetic indices research, forex and gold studies, strategies, broker insights and trading education from the Botvio platform."
        jsonLd={jsonLd}
      />
      <Header />

      <main className="container mx-auto space-y-10 px-4 py-6 sm:py-8">
        <PageBanner
          title="Trading Intelligence Built Around the Markets You"
          accent="Trade"
          description="Market analysis, synthetic indices research, trading strategies, broker insights, education and practical tools — powered by the Botvio trading ecosystem."
          crumbs={[{ label: "Home", to: "/" }, { label: "Research" }]}
          features={[
            { icon: LineChart, label: "Market Analysis", sub: "Forex, gold, indices, crypto" },
            { icon: Sparkles, label: "Synthetic Research", sub: "Deriv volatility & spikes" },
            { icon: BookOpen, label: "Education", sub: "Beginner to advanced" },
            { icon: Newspaper, label: "Broker Insights", sub: "Platforms Botvio supports" },
          ]}
          stats={[
            { value: `${articles.length}+`, label: "Research articles" },
            { value: `${primaryTopics.length}`, label: "Research topics" },
            { value: "Live", label: "Botvio charts in articles" },
          ]}
          action={
            <div className="flex flex-wrap gap-2">
              <a href="#latest-research">
                <Button variant="gold" className="gap-1.5">Explore Research <ArrowRight className="h-4 w-4" /></Button>
              </a>
              <Link to="/markets">
                <Button variant="outline">Explore Trading Hubs</Button>
              </Link>
            </div>
          }
        />

        {/* Search + filters */}
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search research — Volatility 75, Gold, Deriv, EUR/USD, Copy Trading…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setVisible(PAGE_SIZE);
                }}
                className="pl-10"
                aria-label="Search research articles"
              />
            </div>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="w-full sm:w-44" aria-label="Sort research">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            <Button
              size="sm"
              variant={topic === "all" ? "default" : "outline"}
              onClick={() => updateTopic("all")}
              className="shrink-0"
            >
              All
            </Button>
            {primaryTopics.map((t) => (
              <Button
                key={t.slug}
                size="sm"
                variant={topic === t.slug ? "default" : "outline"}
                onClick={() => updateTopic(t.slug)}
                className="shrink-0"
              >
                {t.label}
              </Button>
            ))}
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-12">
            {isSearching ? (
              <section id="latest-research">
                <SectionHeader
                  eyebrow="Results"
                  title={`${filtered.length} article${filtered.length === 1 ? "" : "s"}${topic !== "all" ? ` in ${RESEARCH_TOPICS.find((t) => t.slug === topic)?.label}` : ""}`}
                />
                {filtered.length === 0 ? (
                  <p className="rounded-xl border border-border/60 bg-card/50 p-6 text-sm text-muted-foreground">
                    No research matched that search. Try a market (Volatility 75, XAU/USD), a broker (Deriv, Weltrade) or a topic (risk management).
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filtered.slice(0, visible).map((a) => (
                      <ArticleCard key={a.slug} article={a} />
                    ))}
                  </div>
                )}
                {filtered.length > visible && (
                  <div className="mt-6 text-center">
                    <Button variant="outline" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                      Load more research
                    </Button>
                  </div>
                )}
              </section>
            ) : (
              <>
                {/* Featured hero article */}
                {hero && (
                  <section>
                    <SectionHeader eyebrow="Botvio Research" title="Featured Research" />
                    <Link
                      to={`/blog/${hero.slug}`}
                      className="group grid overflow-hidden rounded-2xl border border-border/60 bg-card/60 transition-all hover:border-primary/50 hover:shadow-lg md:grid-cols-2"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-primary/20 via-card to-warning/10 md:aspect-auto">
                        {(hero.coverImage || hero.image)?.startsWith?.("http") || (hero.coverImage || hero.image)?.startsWith?.("/") ? (
                          <img
                            src={(hero.coverImage || hero.image) as string}
                            alt={hero.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-6xl">{hero.image || "📈"}</div>
                        )}
                      </div>
                      <div className="flex flex-col justify-center gap-4 p-6 sm:p-8">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="bg-primary/15 text-[10px] uppercase tracking-wider text-primary hover:bg-primary/20">
                            {hero.category}
                          </Badge>
                          {hero.market && (
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{hero.market.label}</Badge>
                          )}
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" /> {hero.readMinutes} min read
                          </span>
                          <span className="text-xs text-muted-foreground">{formatDate(hero.date)}</span>
                        </div>
                        <h3 className="text-2xl font-bold leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-3xl">
                          {hero.title}
                        </h3>
                        <p className="text-muted-foreground">{hero.excerpt}</p>
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                          Read Full Analysis <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </Link>
                  </section>
                )}

                {featured.length > 0 && (
                  <section>
                    <SectionHeader eyebrow="Editor's Picks" title="Selected Research" />
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {featured.map((a) => (
                        <ArticleCard key={a.slug} article={a} />
                      ))}
                    </div>
                  </section>
                )}

                <AdSlot placement="below-intro" />

                <TopicRow eyebrow="Deriv" title="Synthetic Indices Research" to="/research/synthetic-indices" articles={byTopic(articles, "synthetic-indices")} />
                <TopicRow eyebrow="Currencies & Metals" title="Forex & Gold Research" to="/research/forex" articles={[...byTopic(articles, "forex"), ...byTopic(articles, "gold")]} />
                <TopicRow eyebrow="Brokers" title="Broker Research" to="/blog/category/broker-reviews" articles={byTopic(articles, "broker-reviews")} />
                <TopicRow eyebrow="Academy" title="Trading Education" to="/blog/category/education" articles={byTopic(articles, "education")} />
                <TopicRow eyebrow="Technology" title="AI & Trading Technology" to="/blog/category/ai-trading" articles={byTopic(articles, "ai-trading")} />

                <section id="latest-research">
                  <SectionHeader eyebrow="Archive" title="Latest Analysis" />
                  <div className="space-y-3">
                    {latest.slice(0, visible).map((a) => (
                      <ArticleCard key={a.slug} article={a} variant="row" />
                    ))}
                  </div>
                  {latest.length > visible && (
                    <div className="mt-6 text-center">
                      <Button variant="outline" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                        Load more research
                      </Button>
                    </div>
                  )}
                  {isLoading && <p className="mt-4 text-sm text-muted-foreground">Loading research…</p>}
                </section>
              </>
            )}
          </div>

          <ResearchSidebar market={hero?.market ?? null} trending={trending} className="hidden lg:block" />
        </div>
      </main>
    </div>
  );
};

export default Blog;
