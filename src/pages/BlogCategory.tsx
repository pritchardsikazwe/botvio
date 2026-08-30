import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, Layers, Search } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { PageBanner } from "@/components/layout/PageBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArticleCard } from "@/components/research/ArticleCard";
import { AdSlot } from "@/components/research/AdSlot";
import { ResearchSidebar } from "@/components/research/ResearchSidebar";
import { RESEARCH_TOPICS, getTopic } from "@/lib/research/taxonomy";
import { byTopic, searchArticles, sortArticles, useResearchArticles } from "@/lib/research/useResearchArticles";

const PAGE_SIZE = 12;

const BlogCategory = () => {
  const { slug = "" } = useParams();
  const topic = getTopic(slug);
  const { articles } = useResearchArticles();
  const [search, setSearch] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const list = useMemo(() => {
    if (!topic) return [];
    return sortArticles(searchArticles(byTopic(articles, topic.slug), search), "latest");
  }, [articles, topic, search]);

  const trending = useMemo(() => sortArticles(list, "trending").slice(0, 5), [list]);

  if (!topic) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="mb-4 text-2xl font-bold">Topic not found</h1>
          <Link to="/blog"><Button>Back to Research</Button></Link>
        </main>
      </div>
    );
  }

  const canonical = `https://botvio.live/blog/category/${topic.slug}`;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${topic.label} Research — Botvio Trading Intelligence`}
        description={topic.description}
        jsonLd={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "CollectionPage",
              name: `${topic.label} Research`,
              description: topic.description,
              url: canonical,
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://botvio.live/" },
                { "@type": "ListItem", position: 2, name: "Research", item: "https://botvio.live/blog" },
                { "@type": "ListItem", position: 3, name: topic.label, item: canonical },
              ],
            },
          ],
        }}
      />
      <Header />

      <main className="container mx-auto space-y-8 px-4 py-6 sm:py-8">
        <PageBanner
          title={`${topic.label}`}
          accent="Research"
          description={topic.description}
          crumbs={[{ label: "Home", to: "/" }, { label: "Research", to: "/blog" }, { label: topic.label }]}
          features={[{ icon: Layers, label: `${list.length} articles`, sub: "Updated continuously" }]}
          action={
            <Link to="/blog">
              <Button variant="outline" className="gap-1.5">All research <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          }
        />

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={`Search ${topic.label} research…`}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setVisible(PAGE_SIZE); }}
                className="pl-10"
                aria-label={`Search ${topic.label} research`}
              />
            </div>

            {list.length === 0 ? (
              <p className="rounded-xl border border-border/60 bg-card/50 p-6 text-sm text-muted-foreground">
                No articles in this topic yet.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {list.slice(0, visible).map((a) => (
                  <ArticleCard key={a.slug} article={a} />
                ))}
              </div>
            )}

            {list.length > visible && (
              <div className="text-center">
                <Button variant="outline" onClick={() => setVisible((v) => v + PAGE_SIZE)}>Load more</Button>
              </div>
            )}

            <AdSlot placement="before-related" />

            <section className="rounded-2xl border border-border/60 bg-card/60 p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Other topics</h2>
              <div className="flex flex-wrap gap-2">
                {RESEARCH_TOPICS.filter((t) => t.slug !== topic.slug).map((t) => (
                  <Link key={t.slug} to={`/blog/category/${t.slug}`}>
                    <Button variant="outline" size="sm" className="text-xs">{t.label}</Button>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <ResearchSidebar market={list[0]?.market ?? null} trending={trending} className="hidden lg:block" />
        </div>
      </main>
    </div>
  );
};

export default BlogCategory;
