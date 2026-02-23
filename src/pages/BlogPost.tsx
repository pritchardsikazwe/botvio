import { useParams, Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, TrendingUp, ArrowRight } from "lucide-react";
import { blogContent } from "@/content/blogPosts";
import { DerivAffiliateButton } from "@/components/trading/DerivAffiliateButton";
import { TradeTip } from "@/components/trading/TradeTip";

const relatedPosts = [
  { slug: "how-to-start-forex-trading", title: "How to Start Forex Trading" },
  { slug: "how-to-earn-money-online-trading", title: "How to Earn Money Online" },
  { slug: "deriv-binary-options-complete-guide", title: "Deriv Binary Options Guide" },
  { slug: "best-boom-1000-strategy-using-botvio", title: "Best Boom 1000 Strategy" },
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
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Article */}
          <div className="lg:col-span-3">
            <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
              <ArrowLeft className="h-4 w-4" /> Back to Blog
            </Link>

            <article className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge className="bg-gradient-to-r from-primary to-warning text-primary-foreground">{post.category}</Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{post.readTime}</span>
                  <span className="text-sm text-muted-foreground">{post.date}</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{post.title}</h1>
                <p className="text-lg text-muted-foreground">{post.excerpt}</p>
              </div>

              <div className="prose prose-lg dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />

              {/* CTA Section */}
              <div className="bg-gradient-to-r from-primary/10 to-warning/10 rounded-xl p-6 space-y-3 text-center">
                <h3 className="text-xl font-bold">Start Trading with Botvio Today</h3>
                <p className="text-muted-foreground">Create your free Deriv account and start automated trading.</p>
                <div className="flex gap-3 justify-center">
                  <DerivAffiliateButton size="lg" label="Create Deriv Account" />
                  <Link to="/"><Button size="lg" variant="outline">Try Botvio Free</Button></Link>
                </div>
              </div>

              <TradeTip type="disclaimer" tip="Trading involves risk. Past performance does not guarantee future results. Only trade with funds you can afford to lose." />

              <div className="border-t pt-6 mt-10">
                <div className="flex gap-3">
                  <Link to="/"><Button>Get Started with Botvio</Button></Link>
                  <Link to="/blog"><Button variant="outline">More Articles</Button></Link>
                </div>
              </div>
            </article>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-primary/10 to-warning/10 border-primary/30">
              <CardContent className="pt-6 space-y-3 text-center">
                <TrendingUp className="h-10 w-10 mx-auto text-primary" />
                <h3 className="font-bold text-sm">Open Deriv Account</h3>
                <p className="text-xs text-muted-foreground">Trade with Botvio AI bot for free.</p>
                <DerivAffiliateButton size="sm" className="w-full" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Related Articles</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {relatedPosts.filter(p => p.slug !== slug).map(p => (
                  <Link key={p.slug} to={`/blog/${p.slug}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors py-1">
                    <ArrowRight className="h-3 w-3 shrink-0" />
                    {p.title}
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card className="border-destructive/20">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">
                  <strong>⚠️ Disclaimer:</strong> This article is for educational purposes only. Trading binary options carries significant risk.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BlogPost;
