import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  ChevronRight,
  ExternalLink,
  ListChecks,
  MessageCircle,
  Play,
  Send,
} from "lucide-react";
import { blogContent } from "@/content/blogPosts";
import { binanceBlogPosts } from "@/content/binanceBlogPosts";
import { dubaiBlogPosts } from "@/content/dubaiBlogPosts";
import { DUBAI_ARTICLE_SUPPLEMENTS } from "@/content/dubaiArticleSupplements";
import { DUBAI_EXPANDED_POSTS } from "@/content/dubaiExpandedPosts";
import { DUBAI_FINAL_POSTS } from "@/content/dubaiFinalPosts";
import { DUBAI_GOLD_COPY_POSTS } from "@/content/dubaiGoldCopyPosts";
import { DUBAI_ARABIC_POSTS } from "@/content/dubaiArabicPosts";
import { SAUDI_POSTS } from "@/content/saudiPosts";
import { LOCALIZED_DEEP_POSTS } from "@/content/localizedDeepPosts";
import { LOCALIZED_NATIVE_POSTS } from "@/content/localizedNativePosts";
import { LOCALIZED_MARKETS } from "@/content/localizedMarkets";
import { detectRegionalContext } from "@/content/regionalEditorial";
import { RegionalContextCard } from "@/components/research/RegionalContextCard";
import { AffiliateAccountGuide } from "@/components/affiliate/AffiliateAccountGuide";
import { supabase } from "@/integrations/supabase/client";
import { ArticleMeta } from "@/components/ArticleMeta";
import { getAuthor } from "@/content/authors";
import { useIsMobile } from "@/hooks/use-mobile";
import { SocialShareButtons } from "@/components/social/SocialShareButtons";
import { ArticleCard } from "@/components/research/ArticleCard";
import { ArticleContent } from "@/components/research/ArticleContent";
import { AdSlot } from "@/components/research/AdSlot";
import { ResearchSidebar } from "@/components/research/ResearchSidebar";
import {
  ARTICLE_TYPE_LABEL,
  ARTICLE_TYPE_NOTE,
  detectArticleType,
  detectMarket,
  primaryTopic,
} from "@/lib/research/taxonomy";
import { relatedArticles, sortArticles, useResearchArticles } from "@/lib/research/useResearchArticles";

/* ── Affiliate links (unchanged) ── */
const AFFILIATE_LINKS = {
  deriv: { name: "Deriv", url: "https://track.deriv.com/_a_gq1w0BG0D1hit6RV3zsGNd7ZgqdRLk/1/", cta: "Open Deriv Account" },
  exness: { name: "Exness", url: "https://one.exness-track.com/a/ts1kvs1k", cta: "Open Exness Account" },
  weltrade: { name: "Weltrade", url: "https://gowt.net/ib67505", cta: "Open Weltrade Account" },
  iqoption: { name: "IQ Option", url: "https://iqoption.net/lp/pwa-new/en/?aff=818055&aff_model=revenue", cta: "Open IQ Option Account" },
  pocketoption: { name: "Pocket Option", url: "https://pocket-friends.co/r/ylo6wciexb", cta: "Open Pocket Option Account" },
  binomo: { name: "Binomo", url: "https://binomo-r3.com/auth?a=249ff29b0265&t=0", cta: "Open Binomo Account" },
  binance: { name: "Binance", url: "https://www.binance.com/activity/referral-entry/CPA?ref=CPA_0047GJ3KHU", cta: "Open Binance Account" },
};

type BrokerKey = keyof typeof AFFILIATE_LINKS;

const detectBrokers = (title: string, content: string): BrokerKey[] => {
  const text = (title + " " + content).toLowerCase();
  const found: BrokerKey[] = [];
  if (text.includes("deriv") || text.includes("boom") || text.includes("crash") || text.includes("synthetic") || text.includes("digit")) found.push("deriv");
  if (text.includes("exness")) found.push("exness");
  if (text.includes("weltrade") || text.includes("syntx")) found.push("weltrade");
  if (text.includes("iq option") || text.includes("iqoption")) found.push("iqoption");
  if (text.includes("pocket option") || text.includes("pocketoption")) found.push("pocketoption");
  if (text.includes("binomo")) found.push("binomo");
  if (text.includes("binance") || text.includes("crypto")) found.push("binance");
  if (found.length === 0) found.push("deriv", "exness");
  return found;
};

/** Inject contextual affiliate links into article HTML (first mention per broker). */
const injectAffiliateLinks = (html: string): string => {
  if (!html) return html;
  const brokerPatterns: { key: BrokerKey; regex: RegExp }[] = [
    { key: "pocketoption", regex: /\bPocket Option\b/i },
    { key: "iqoption", regex: /\bIQ Option\b/i },
    { key: "weltrade", regex: /\bWeltrade\b/i },
    { key: "binance", regex: /\bBinance\b/i },
    { key: "binomo", regex: /\bBinomo\b/i },
    { key: "exness", regex: /\bExness\b/i },
    { key: "deriv", regex: /\bDeriv\b/i },
  ];

  let output = html;
  for (const { key, regex } of brokerPatterns) {
    const parts = output.split(/(<a\b[^>]*>[\s\S]*?<\/a>|<[^>]+>)/gi);
    let replaced = false;
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0 && !replaced && regex.test(parts[i])) {
        const link = AFFILIATE_LINKS[key];
        parts[i] = parts[i].replace(
          regex,
          (m) => `<a href="${link.url}" target="_blank" rel="noopener sponsored" class="affiliate-inline-link" title="Open ${link.name} account">${m}</a>`,
        );
        replaced = true;
      }
    }
    if (replaced) output = parts.join("");
  }
  return output;
};

/* ── YouTube embed ── */
const YouTubeEmbed = ({ url }: { url: string }) => {
  let videoId = "";
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) videoId = u.pathname.slice(1);
    else videoId = u.searchParams.get("v") || "";
  } catch {
    return null;
  }
  if (!videoId) return null;

  return (
    <div className="my-8">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
        <Play className="h-4 w-4 text-primary" /> Watch the video guide
      </div>
      <div className="relative w-full overflow-hidden rounded-2xl border border-border" style={{ paddingBottom: "56.25%" }}>
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${videoId}`}
          title="Video guide"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </div>
  );
};

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const isMobile = useIsMobile();
  const { articles } = useResearchArticles();

  const { data: dbPost } = useQuery({
    queryKey: ["post", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select("*")
        .eq("slug", slug!)
        .eq("is_published", true)
        .maybeSingle();
      return data;
    },
    enabled: !!slug,
  });

  const staticPost = blogContent[slug || ""] || binanceBlogPosts[slug || ""] || dubaiBlogPosts[slug || ""] || DUBAI_EXPANDED_POSTS[slug || ""] || DUBAI_FINAL_POSTS[slug || ""] || DUBAI_GOLD_COPY_POSTS[slug || ""] || SAUDI_POSTS[slug || ""] || LOCALIZED_DEEP_POSTS[slug || ""];
  const post = dbPost
    ? {
        title: dbPost.title,
        excerpt: dbPost.excerpt || "",
        category: dbPost.category || "Guide",
        readTime: dbPost.read_time || "5 min",
        date: new Date(dbPost.published_at || dbPost.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
        updatedDate: dbPost.updated_at ? new Date(dbPost.updated_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : undefined,
        content: dbPost.content_html,
        coverImage: dbPost.cover_image,
        author: dbPost.author || "Botvio Editorial Team",
        metaTitle: dbPost.meta_title,
        metaDescription: dbPost.meta_description,
        youtubeUrl: (dbPost as any).youtube_url as string | null,
      }
    : staticPost
      ? { ...staticPost, updatedDate: undefined, coverImage: undefined, author: "Botvio Editorial Team", metaTitle: undefined, metaDescription: undefined, youtubeUrl: null }
      : null;

  const regionalContext = useMemo(() => (post ? detectRegionalContext(post.title, post.excerpt, post.category) : null), [post?.title, post?.excerpt, post?.category]);
  const market = useMemo(
    () => (post ? detectMarket(post.title, post.category, post.excerpt) : null),
    [post?.title, post?.category, post?.excerpt],
  );
  const topic = useMemo(() => (post ? primaryTopic(post.title, post.category, post.excerpt) : null), [post?.title, post?.category, post?.excerpt]);
  const articleType = useMemo(
    () => (post ? detectArticleType(post.title, post.category, post.excerpt) : "education"),
    [post?.title, post?.category, post?.excerpt],
  );
  const related = useMemo(
    () => (post && slug ? relatedArticles(articles, { slug, title: post.title, category: post.category, excerpt: post.excerpt }, 6) : []),
    [articles, post?.title, post?.category, post?.excerpt, slug],
  );
  const trending = useMemo(() => sortArticles(articles, "trending").filter((a) => a.slug !== slug).slice(0, 5), [articles, slug]);

  const contentHtml = useMemo(() => injectAffiliateLinks(post?.content || ""), [post?.content]);

  /** Section headings become an "In this research" outline (no invented content). */
  const outline = useMemo(() => {
    const out: string[] = [];
    const re = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(post?.content || "")) && out.length < 8) {
      const text = m[1].replace(/<[^>]+>/g, "").trim();
      if (text) out.push(text);
    }
    return out;
  }, [post?.content]);

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12 text-center">
          <h1 className="mb-4 text-2xl font-bold">Article not found</h1>
          <Link to="/blog"><Button>Back to Research</Button></Link>
        </main>
      </div>
    );
  }

  const brokers = detectBrokers(post.title, post.content || "");
  const canonical = `https://botvio.live/blog/${slug}`;
  const localizedMarket = slug ? Object.values(LOCALIZED_MARKETS).find((m) => slug.endsWith(`-${m.country.toLowerCase()}`) && !!LOCALIZED_NATIVE_POSTS[slug]) : null;
  const arabicCanonical = slug && DUBAI_ARABIC_POSTS[slug] ? `https://botvio.live/ar/blog/${slug}` : slug && SAUDI_POSTS[slug] ? `https://botvio.live/ar/saudi-blog/${slug}` : localizedMarket?.lang === "ar" ? `https://botvio.live/ar/markets/${localizedMarket.slug}/blog/${slug}` : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: post.title,
        description: post.excerpt,
        datePublished: post.date,
        dateModified: post.updatedDate || post.date,
        author: (() => {
          const a = getAuthor(post.author);
          return { "@type": "Person", name: a.name, url: `https://botvio.live/authors/${a.slug}`, jobTitle: a.role, knowsAbout: a.expertise };
        })(),
        publisher: { "@type": "Organization", name: "Botvio", url: "https://botvio.live", logo: { "@type": "ImageObject", url: "https://botvio.live/icon-512.png" } },
        mainEntityOfPage: canonical,
        image: post.coverImage || `https://botvio.live/blog/${slug}.png`,
        articleSection: post.category,
        inLanguage: "en-US",
        keywords: Array.from(new Set([
          post.category,
          topic?.label,
          market?.label,
          ...post.title.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 3),
          "trading research", "Botvio",
        ].filter(Boolean) as string[])).slice(0, 15).join(", "),
        wordCount: (post.content || "").replace(/<[^>]+>/g, " ").trim().split(/\s+/).length,
        url: canonical,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://botvio.live/" },
          { "@type": "ListItem", position: 2, name: "Research", item: "https://botvio.live/blog" },
          ...(topic ? [{ "@type": "ListItem", position: 3, name: topic.label, item: `https://botvio.live/blog/category/${topic.slug}` }] : []),
          { "@type": "ListItem", position: topic ? 4 : 3, name: post.title, item: canonical },
        ],
      },
      ...(() => {
        const faqs: { q: string; a: string }[] = [];
        const html = post.content || "";
        const re = /<h3[^>]*>([^<]+?\?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(html)) && faqs.length < 8) {
          faqs.push({ q: m[1].trim(), a: m[2].replace(/<[^>]+>/g, "").trim() });
        }
        if (!faqs.length) return [];
        return [{
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }];
      })(),
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={post.metaTitle || post.title}
        description={post.metaDescription || post.excerpt}
        ogImage={post.coverImage || `/blog/${slug}.png`}
        ogType="article"
        alternateLocales={arabicCanonical ? [{ code: "en", href: canonical }, { code: "ar-AE", href: arabicCanonical }] : undefined}
        jsonLd={jsonLd}
      />
      <Header />

      <main className="container mx-auto px-4 py-6 sm:py-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/blog" className="hover:text-primary">Research</Link>
          {topic && (
            <>
              <ChevronRight className="h-3 w-3" />
              <Link to={`/blog/category/${topic.slug}`} className="hover:text-primary">{topic.label}</Link>
            </>
          )}
          <ChevronRight className="h-3 w-3" />
          <span className="line-clamp-1 text-foreground/80">{post.title}</span>
        </nav>

        {/* Article header */}
        <header className="mb-6 max-w-4xl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge className="bg-primary/15 text-[10px] uppercase tracking-[0.18em] text-primary hover:bg-primary/20">
              {ARTICLE_TYPE_LABEL[articleType]}
            </Badge>
            {market && <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{market.label} · {market.broker}</Badge>}
          </div>

          <h1 className="text-3xl font-extrabold leading-[1.15] tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>

          <p className="mt-4 text-lg font-light leading-[1.65] text-muted-foreground">{post.excerpt}</p>

          <div className="mt-5">
            <ArticleMeta
              category={post.category}
              readTime={post.readTime}
              publishedDate={post.date}
              updatedDate={post.updatedDate}
              authorName={post.author}
            />
          </div>

          {regionalContext && <RegionalContextCard context={regionalContext} />}

          {regionalContext?.key === "dubai" && (
            <div className="mt-5">
              <AffiliateAccountGuide broker="deriv" affiliateUrl={AFFILIATE_LINKS.deriv.url} compact />
            </div>
          )}\n\n          <div className="flex flex-wrap items-center gap-3">
            <SocialShareButtons title={post.title} description={post.excerpt} label="Share research" />
            <p className="text-xs text-muted-foreground">{ARTICLE_TYPE_NOTE[articleType]}</p>
          </div>
        </header>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Main column */}
          <article className="min-w-0">
            {post.coverImage && (
              <div className="mb-8 overflow-hidden rounded-2xl border border-border bg-card">
                <img src={post.coverImage} alt={post.title} className="h-auto w-full object-cover" loading="lazy" decoding="async" />
              </div>
            )}

            {outline.length > 2 && (
              <nav className="mb-8 rounded-2xl border border-border/60 bg-card/60 p-5" aria-label="In this research">
                <h2 className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <ListChecks className="h-3.5 w-3.5 text-primary" /> In this research
                </h2>
                <ul className="grid gap-1.5 text-sm text-foreground/85 sm:grid-cols-2">
                  {outline.map((h) => (
                    <li key={h} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            {post.youtubeUrl && <YouTubeEmbed url={post.youtubeUrl} />}

            <ArticleContent html={contentHtml} market={market} isMobile={!!isMobile} />

            {DUBAI_ARTICLE_SUPPLEMENTS[slug] && (
              <section className="prose prose-sm sm:prose-base dark:prose-invert mt-8 max-w-none rounded-2xl border border-border/60 bg-card/40 p-5 sm:p-7" aria-label="Dubai-specific research supplement">
                <div dangerouslySetInnerHTML={{ __html: DUBAI_ARTICLE_SUPPLEMENTS[slug] }} />
              </section>
            )}

            {/* Related Trading Hub */}
            {market && (
              <section className="mt-10 overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Related Botvio Trading Hub</p>
                <h2 className="mt-2 text-xl font-bold text-foreground">{market.label}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Live {market.kind.toLowerCase()} chart, support/resistance overlay and the Botvio tools that cover this market.
                </p>
                <Link to={market.hub} className="mt-4 inline-block">
                  <Button variant="gold" className="gap-1.5">Open {market.hubLabel} <ArrowRight className="h-4 w-4" /></Button>
                </Link>
              </section>
            )}

            {/* Broker CTA — clearly separated from ad slots */}
            <section className="mt-6 rounded-2xl border border-border/60 bg-card/60 p-5">
              <h2 className="text-lg font-semibold text-foreground">Explore broker information</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Botvio integrates with the brokers below. Links are affiliate links — see our{" "}
                <Link to="/affiliate-disclosure" className="text-primary underline">affiliate disclosure</Link>.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {brokers.map((b) => (
                  <a key={b} href={AFFILIATE_LINKS[b].url} target="_blank" rel="noopener sponsored noreferrer">
                    <Button size="sm" variant="outline" className="gap-1.5">
                      {AFFILIATE_LINKS[b].cta} <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                ))}
                <Link to="/brokers"><Button size="sm" variant="ghost">All broker reviews</Button></Link>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Trading involves risk of loss. Nothing in this article is financial advice.
              </p>
            </section>

            <AdSlot placement="before-related" />

            {/* Related research */}
            {related.length > 0 && (
              <section className="mt-4">
                <h2 className="mb-4 text-xl font-bold tracking-tight text-foreground">Related Research</h2>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {related.map((a) => (
                    <ArticleCard key={a.slug} article={a} />
                  ))}
                </div>
              </section>
            )}

            {/* Explore Botvio */}
            <section className="mt-10 rounded-2xl border border-border/60 bg-card/60 p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Explore Botvio</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: "Signals", to: "/signals" },
                  { label: "Trading Hubs", to: "/markets" },
                  { label: "Tools", to: "/chart" },
                  { label: "Academy", to: "/learn" },
                ].map((l) => (
                  <Link key={l.to} to={l.to}>
                    <Button variant="outline" size="sm" className="w-full">{l.label}</Button>
                  </Link>
                ))}
              </div>
            </section>

            {/* Community */}
            <section className="mt-6 rounded-2xl border border-border/60 bg-card/60 p-5">
              <h2 className="text-lg font-semibold text-foreground">Join the Botvio community</h2>
              <p className="mt-1 text-sm text-muted-foreground">Market discussion, new research and platform updates.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href="https://chat.whatsapp.com/KInahrKam85BTyFbIgC3zJ" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="gap-1.5 bg-success text-success-foreground hover:bg-success/90">
                    <MessageCircle className="h-4 w-4" /> Join WhatsApp
                  </Button>
                </a>
                <a href="https://t.me/+AZjYpDncHEA5OTM0" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Send className="h-4 w-4" /> Join Telegram
                  </Button>
                </a>
                <Link to="/blog"><Button size="sm" variant="ghost">More research</Button></Link>
              </div>
            </section>

            <AdSlot placement="end-of-article" />
          </article>

          <ResearchSidebar market={market} trending={trending} className="hidden lg:block" />
        </div>
      </main>
    </div>
  );
};

export default BlogPost;
