import { useParams, Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, TrendingUp, ArrowRight, ExternalLink, BookOpen, Star, Zap } from "lucide-react";
import { blogContent } from "@/content/blogPosts";
import { DerivAffiliateButton } from "@/components/trading/DerivAffiliateButton";
import { TradeTip } from "@/components/trading/TradeTip";

const relatedPosts = [
  { slug: "how-to-start-forex-trading", title: "How to Start Forex Trading", emoji: "📈" },
  { slug: "how-to-earn-money-online-trading", title: "How to Earn Money Online", emoji: "💰" },
  { slug: "deriv-binary-options-complete-guide", title: "Deriv Binary Options Guide", emoji: "📊" },
  { slug: "best-boom-1000-strategy-using-botvio", title: "Best Boom 1000 Strategy", emoji: "💥" },
  { slug: "how-to-make-money-online-deriv", title: "Make Money with Deriv", emoji: "🏆" },
  { slug: "botvio-vs-manual-trading", title: "Botvio vs Manual Trading", emoji: "⚖️" },
];

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = blogContent[slug || ""];

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
    <div className="min-h-screen bg-background">
      <SEOHead title={post.title} description={post.excerpt} jsonLd={jsonLd} />
      <Header />

      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/20 via-warning/10 to-violet-500/20 border-b border-border/50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.15),transparent_60%)]" />
        <div className="container mx-auto px-4 py-10">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <Badge className="bg-gradient-to-r from-primary to-warning text-primary-foreground text-xs px-3 py-1">{post.category}</Badge>
            <span className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{post.readTime}</span>
            <span className="text-sm text-muted-foreground">{post.date}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-primary to-warning bg-clip-text text-transparent leading-tight max-w-4xl">
            {post.title}
          </h1>
          <p className="text-lg text-muted-foreground mt-3 max-w-2xl">{post.excerpt}</p>
        </div>
      </div>

      {/* Deriv Affiliate Top Banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-primary/10 to-warning/10 border-b border-border/30">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-warning" />
            <span className="text-sm font-medium">Start trading with Deriv — Free demo account with $10,000 virtual funds</span>
          </div>
          <DerivAffiliateButton size="sm" label="Open Free Account →" />
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Article */}
          <div className="lg:col-span-3">
            <article className="space-y-8">
              {/* Content with enhanced styling */}
              <div 
                className="prose prose-lg dark:prose-invert max-w-none
                  prose-headings:bg-gradient-to-r prose-headings:from-foreground prose-headings:to-primary prose-headings:bg-clip-text prose-headings:text-transparent
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-primary
                  prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-lg prose-blockquote:py-2 prose-blockquote:px-4
                  prose-img:rounded-xl prose-img:shadow-lg
                  prose-code:bg-primary/10 prose-code:text-primary prose-code:rounded prose-code:px-1.5 prose-code:py-0.5
                  prose-li:marker:text-primary"
                dangerouslySetInnerHTML={{ __html: post.content }} 
              />

              {/* Mid-article Deriv CTA */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-warning/10 to-emerald-500/15 border border-primary/20 p-8">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-warning/20 to-transparent rounded-bl-full" />
                <div className="relative z-10 text-center space-y-4">
                  <div className="inline-flex items-center gap-2 bg-primary/20 rounded-full px-4 py-1.5">
                    <Star className="h-4 w-4 text-warning fill-warning" />
                    <span className="text-sm font-semibold text-primary">Recommended</span>
                  </div>
                  <h3 className="text-2xl font-bold">Start Trading with Botvio + Deriv</h3>
                  <p className="text-muted-foreground max-w-lg mx-auto">Create your free Deriv account and connect to Botvio for AI-powered automated trading.</p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <DerivAffiliateButton size="lg" label="Create Free Deriv Account" />
                    <Link to="/"><Button size="lg" variant="outline">Try Botvio Free</Button></Link>
                  </div>
                </div>
              </div>

              <TradeTip type="disclaimer" tip="Trading involves risk. Past performance does not guarantee future results. Only trade with funds you can afford to lose." />

              {/* Bottom navigation */}
              <div className="border-t border-border/50 pt-8 mt-10 flex flex-wrap gap-3">
                <Link to="/"><Button className="bg-gradient-to-r from-primary to-warning text-primary-foreground">Get Started with Botvio</Button></Link>
                <Link to="/blog"><Button variant="outline">More Articles</Button></Link>
                <DerivAffiliateButton variant="outline" label="Open Deriv Account" />
              </div>
            </article>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Deriv CTA Card */}
            <Card className="overflow-hidden border-primary/30">
              <div className="h-3 bg-gradient-to-r from-primary via-warning to-emerald-500" />
              <CardContent className="pt-6 space-y-3 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-warning/20 flex items-center justify-center">
                  <TrendingUp className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-bold">Open Deriv Account</h3>
                <p className="text-xs text-muted-foreground">Trade forex, crypto & synthetics with AI-powered Botvio bot.</p>
                <DerivAffiliateButton size="default" className="w-full" />
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-gradient-to-br from-violet-500/5 to-primary/5">
              <CardContent className="pt-6 grid grid-cols-2 gap-3">
                {[
                  { label: "Users", value: "10K+", color: "text-primary" },
                  { label: "Trades/Day", value: "50K+", color: "text-warning" },
                  { label: "Win Rate", value: "72%", color: "text-emerald-400" },
                  { label: "Markets", value: "100+", color: "text-violet-400" },
                ].map(s => (
                  <div key={s.label} className="text-center p-2 rounded-lg bg-background/50">
                    <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Related Articles */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Related Articles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {relatedPosts.filter(p => p.slug !== slug).slice(0, 5).map(p => (
                  <Link key={p.slug} to={`/blog/${p.slug}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors py-1.5 px-2 rounded-lg hover:bg-primary/5">
                    <span>{p.emoji}</span>
                    <span className="line-clamp-1">{p.title}</span>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Risk Warning */}
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">
                  <strong>⚠️ Risk Warning:</strong> Trading binary options involves significant risk. Never trade with money you can't afford to lose.
                </p>
              </CardContent>
            </Card>

            {/* Second Deriv CTA */}
            <Card className="bg-gradient-to-br from-warning/10 to-primary/10 border-warning/30">
              <CardContent className="pt-6 space-y-3 text-center">
                <ExternalLink className="h-8 w-8 mx-auto text-warning" />
                <h3 className="font-bold text-sm">Trade Smarter</h3>
                <p className="text-xs text-muted-foreground">Join thousands trading with Botvio AI on Deriv.</p>
                <DerivAffiliateButton size="sm" className="w-full" variant="gold" label="Get Started →" />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BlogPost;
