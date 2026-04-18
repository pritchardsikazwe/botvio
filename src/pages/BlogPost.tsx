import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Zap, Play, ExternalLink } from "lucide-react";
import { blogContent } from "@/content/blogPosts";
import { binanceBlogPosts } from "@/content/binanceBlogPosts";
import { DerivAffiliateButton } from "@/components/trading/DerivAffiliateButton";
import { supabase } from "@/integrations/supabase/client";

/* ── Affiliate links ── */
const AFFILIATE_LINKS = {
  deriv: { name: "Deriv", url: "https://deriv.partners/rx?sidi=F9C8D3BF-5854-499A-8497-F5C370F804DC&utm_campaign=dynamicworks&utm_medium=affiliate&utm_source=CU23827", cta: "Open Deriv Account", color: "from-red-500/10 to-red-600/10" },
  exness: { name: "Exness", url: "https://one.exness-track.com/a/ts1kvs1k", cta: "Open Exness Account", color: "from-yellow-500/10 to-amber-600/10" },
  weltrade: { name: "Weltrade", url: "https://gowt.net/ib67505", cta: "Open Weltrade Account", color: "from-blue-500/10 to-blue-600/10" },
  iqoption: { name: "IQ Option", url: "https://iqoption.net/lp/pwa-new/en/?aff=818055&aff_model=revenue", cta: "Open IQ Option Account", color: "from-green-500/10 to-green-600/10" },
  pocketoption: { name: "Pocket Option", url: "https://pocket-friends.co/r/ylo6wciexb", cta: "Open Pocket Option Account", color: "from-purple-500/10 to-purple-600/10" },
  binomo: { name: "Binomo", url: "https://binomo-r3.com/auth?a=249ff29b0265&t=0", cta: "Open Binomo Account", color: "from-amber-500/10 to-orange-600/10" },
  binance: { name: "Binance", url: "https://www.binance.com/activity/referral-entry/CPA?ref=CPA_0047GJ3KHU", cta: "Open Binance Account", color: "from-yellow-400/10 to-yellow-600/10" },
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
  // If none detected or generic forex/gold, show deriv + exness
  if (found.length === 0) found.push("deriv", "exness");
  return found;
};

/**
 * Inject contextual affiliate links into the article HTML.
 * Replaces the FIRST plain-text occurrence of each broker name with an anchor.
 * Skips text already inside <a>…</a> or HTML attributes.
 */
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
          (m) =>
            `<a href="${link.url}" target="_blank" rel="noopener sponsored" class="affiliate-inline-link" title="Open ${link.name} account">${m}</a>`
        );
        replaced = true;
      }
    }
    if (replaced) output = parts.join("");
  }
  return output;
};

const relatedPosts = [
  { slug: "how-to-start-forex-trading", title: "How to Start Forex Trading" },
  { slug: "how-to-earn-money-online-trading", title: "How to Earn Money Online" },
  { slug: "deriv-binary-options-complete-guide", title: "Deriv Binary Options Guide" },
  { slug: "best-boom-1000-strategy-using-botvio", title: "Best Boom 1000 Strategy" },
  { slug: "what-is-botvio-ai-trading-bot", title: "What is Botvio AI Bot?" },
  { slug: "botvio-vs-manual-trading", title: "Botvio vs Manual Trading" },
];

/* ── AdSense ad slot (temporarily disabled for AdSense policy review) ── */
const AdSlot = (_: { position: string }) => null;

/* ── YouTube embed ── */
const YouTubeEmbed = ({ url }: { url: string }) => {
  let videoId = "";
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) videoId = u.pathname.slice(1);
    else videoId = u.searchParams.get("v") || "";
  } catch { return null; }
  if (!videoId) return null;

  return (
    <div className="my-8">
      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-foreground">
        <Play className="h-4 w-4 text-primary" />
        Watch the video guide
      </div>
      <div className="relative w-full overflow-hidden rounded-2xl border border-border shadow-sm" style={{ paddingBottom: "56.25%" }}>
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

  const staticPost = blogContent[slug || ""] || binanceBlogPosts[slug || ""];
  const post = dbPost
    ? {
        title: dbPost.title,
        excerpt: dbPost.excerpt || "",
        category: dbPost.category || "Guide",
        readTime: dbPost.read_time || "5 min",
        date: new Date(dbPost.published_at || dbPost.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
        content: dbPost.content_html,
        coverImage: dbPost.cover_image,
        author: dbPost.author || "Botvio Team",
        metaTitle: dbPost.meta_title,
        metaDescription: dbPost.meta_description,
        youtubeUrl: (dbPost as any).youtube_url as string | null,
      }
    : staticPost
    ? { ...staticPost, coverImage: undefined, author: "Botvio Team", metaTitle: undefined, metaDescription: undefined, youtubeUrl: null }
    : null;

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Article not found</h1>
          <Link to="/blog"><Button>Back to Blog</Button></Link>
        </main>
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: { "@type": "Organization", name: "Botvio" },
    publisher: { "@type": "Organization", name: "Botvio", url: "https://botvio.live", logo: { "@type": "ImageObject", url: "https://botvio.live/icon-512.png" } },
    mainEntityOfPage: `https://botvio.live/blog/${slug}`,
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <SEOHead title={post.metaTitle || post.title} description={post.metaDescription || post.excerpt} jsonLd={jsonLd} />
      <Header />

      {/* Contextual Affiliate top bar */}
      {(() => {
        const brokers = detectBrokers(post.title, post.content || "");
        const primary = AFFILIATE_LINKS[brokers[0]];
        return (
          <div className={`bg-gradient-to-r ${primary.color} border-b border-border/30`}>
            <div className="container mx-auto px-4 py-2.5 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium">Start trading with {primary.name} — Free demo account available</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {brokers.map(b => (
                  <a key={b} href={AFFILIATE_LINKS[b].url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="default" className="gap-1 text-xs">
                      {AFFILIATE_LINKS[b].cta} <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      <div className="h-4" />

      <article className="mx-auto w-full max-w-2xl px-4 pb-16 sm:px-6">
        {/* Hero */}
        <header className="mb-10">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>

          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
            <Badge className="bg-primary text-primary-foreground">{post.category}</Badge>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{post.readTime}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">{post.date}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">By {post.author}</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight leading-[1.15] text-foreground sm:text-5xl mb-5">
            {post.title}
          </h1>

          <p className="text-xl leading-[1.65] text-muted-foreground font-light">
            {post.excerpt}
          </p>

          {post.coverImage && (
            <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-md">
              <img src={post.coverImage} alt={post.title} className="h-auto w-full object-cover" loading="lazy" />
            </div>
          )}
        </header>

        {/* Ad after intro */}
        <AdSlot position="after-intro" />

        {/* YouTube Video */}
        {post.youtubeUrl && <YouTubeEmbed url={post.youtubeUrl} />}

        {/* Content */}
        <section
          className="
            blog-prose
            prose prose-lg prose-slate dark:prose-invert max-w-none
            prose-headings:font-sans prose-headings:tracking-tight prose-headings:text-foreground prose-headings:scroll-mt-24
            prose-h2:text-3xl prose-h2:font-bold prose-h2:mt-14 prose-h2:mb-5 prose-h2:leading-snug prose-h2:pb-2 prose-h2:border-b prose-h2:border-border/60
            prose-h3:text-2xl prose-h3:font-semibold prose-h3:mt-10 prose-h3:mb-4 prose-h3:leading-snug
            prose-h4:text-xl prose-h4:font-semibold prose-h4:mt-8 prose-h4:mb-3
            prose-p:text-[1.0625rem] prose-p:leading-[1.85] prose-p:text-foreground/90 prose-p:my-6 prose-p:tracking-[0.005em]
            prose-li:text-[1.0625rem] prose-li:leading-[1.8] prose-li:text-foreground/90 prose-li:my-2.5
            prose-ul:my-6 prose-ul:pl-6 prose-ol:my-6 prose-ol:pl-6
            prose-img:rounded-2xl prose-img:shadow-md prose-img:border prose-img:border-border prose-img:my-10
            prose-hr:my-12 prose-hr:border-border/60
            prose-a:text-primary prose-a:font-medium prose-a:underline prose-a:decoration-primary/40 prose-a:underline-offset-4 hover:prose-a:decoration-primary
            prose-strong:text-foreground prose-strong:font-semibold
            prose-blockquote:border-l-4 prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-xl prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:my-8 prose-blockquote:not-italic prose-blockquote:font-medium prose-blockquote:text-foreground
            prose-li:marker:text-primary
            prose-code:bg-muted prose-code:text-primary prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.9em] prose-code:font-mono
            prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border prose-pre:rounded-xl prose-pre:p-5 prose-pre:my-8
          "
          dangerouslySetInnerHTML={{ __html: injectAffiliateLinks(post.content) }}
        />

        {/* Ad in middle */}
        <AdSlot position="mid-article" />

        {/* Mid-article CTA — contextual broker links */}
        {(() => {
          const brokers = detectBrokers(post.title, post.content || "");
          return (
            <div className="mt-12 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="m-0 text-xl font-semibold text-foreground">Ready to start trading?</h3>
              <p className="mt-2 text-muted-foreground">
                Open a free account with a trusted broker and start practicing with a demo account.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row flex-wrap">
                {brokers.map(b => (
                  <a key={b} href={AFFILIATE_LINKS[b].url} target="_blank" rel="noopener noreferrer">
                    <Button size="lg" className="gap-2 w-full sm:w-auto">
                      {AFFILIATE_LINKS[b].cta} <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                ))}
                <Link to="/"><Button size="lg" variant="outline">Try Botvio Free</Button></Link>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                ⚠️ Risk disclaimer: Trading involves risk and losses can occur. Results are not guaranteed.
              </p>
            </div>
          );
        })()}

        {/* Related */}
        <div className="mt-10 border-t border-border pt-8">
          <h3 className="font-semibold text-foreground mb-4">📚 Related Articles</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {relatedPosts.filter(p => p.slug !== slug).slice(0, 4).map(p => (
              <Link key={p.slug} to={`/blog/${p.slug}`} className="rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-colors">
                <span className="text-sm font-medium text-foreground">{p.title}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Ad at end */}
        <AdSlot position="end-article" />

        {/* Bottom nav */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/"><Button variant="gold">Get Started with Botvio</Button></Link>
          <Link to="/blog"><Button variant="outline">More Articles</Button></Link>
        </div>
      </article>
    </div>
  );
};

export default BlogPost;
