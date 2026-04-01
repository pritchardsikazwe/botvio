import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Zap, Play } from "lucide-react";
import { blogContent } from "@/content/blogPosts";
import { DerivAffiliateButton } from "@/components/trading/DerivAffiliateButton";
import { supabase } from "@/integrations/supabase/client";

const relatedPosts = [
  { slug: "how-to-start-forex-trading", title: "How to Start Forex Trading" },
  { slug: "how-to-earn-money-online-trading", title: "How to Earn Money Online" },
  { slug: "deriv-binary-options-complete-guide", title: "Deriv Binary Options Guide" },
  { slug: "best-boom-1000-strategy-using-botvio", title: "Best Boom 1000 Strategy" },
  { slug: "what-is-botvio-ai-trading-bot", title: "What is Botvio AI Bot?" },
  { slug: "botvio-vs-manual-trading", title: "Botvio vs Manual Trading" },
];

/* ── AdSense ad slot ── */
const AdSlot = ({ position }: { position: string }) => {
  const adRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    try {
      if (adRef.current && typeof window !== "undefined") {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch {}
  }, []);

  return (
    <div className="my-8 text-center" ref={adRef}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-8741937856196827"
        data-ad-slot={position}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};

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

  const staticPost = blogContent[slug || ""];
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

      {/* Affiliate top bar */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-primary/10 to-warning/10 border-b border-border/30">
        <div className="container mx-auto px-4 py-2.5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-warning" />
            <span className="text-sm font-medium">Start trading with Deriv — Free demo account with $10,000 virtual funds</span>
          </div>
          <DerivAffiliateButton size="sm" label="Open Free Account →" />
        </div>
      </div>

      <div className="h-4" />

      <article className="mx-auto w-full max-w-3xl px-4 pb-16">
        {/* Hero */}
        <header className="mb-8">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>

          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
            <Badge className="bg-primary text-primary-foreground">{post.category}</Badge>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{post.readTime}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">{post.date}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">By {post.author}</span>
          </div>

          <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            {post.title}
          </h1>

          <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
            {post.excerpt}
          </p>

          {post.coverImage && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
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
            prose prose-slate dark:prose-invert max-w-none
            prose-headings:scroll-mt-24 prose-headings:text-foreground
            prose-h2:mt-10 prose-h2:text-2xl
            prose-h3:mt-8
            prose-p:leading-relaxed prose-p:text-muted-foreground
            prose-img:rounded-xl prose-img:shadow-sm prose-img:border prose-img:border-border
            prose-hr:my-10
            prose-a:text-primary prose-a:underline prose-a:decoration-primary/30 hover:prose-a:decoration-primary
            prose-strong:text-foreground
            prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-lg prose-blockquote:py-2 prose-blockquote:px-4
            prose-li:marker:text-primary
            prose-code:bg-muted prose-code:text-primary prose-code:rounded prose-code:px-1.5 prose-code:py-0.5
          "
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Ad in middle */}
        <AdSlot position="mid-article" />

        {/* Mid-article CTA */}
        <div className="mt-12 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="m-0 text-xl font-semibold text-foreground">Ready to try Botvio?</h3>
          <p className="mt-2 text-muted-foreground">
            Explore AI strategies for synthetic indices, digits, and MT5 copy trading. Start with demo first.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <DerivAffiliateButton size="lg" label="Create Free Deriv Account" />
            <Link to="/"><Button size="lg" variant="outline">Try Botvio Free</Button></Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            ⚠️ Risk disclaimer: Trading involves risk and losses can occur. Results are not guaranteed.
          </p>
        </div>

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
