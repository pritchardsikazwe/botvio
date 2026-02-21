import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Search, Clock, User, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const blogPosts = [
  {
    slug: "what-is-botvio-ai-trading-bot",
    title: "What is Botvio AI Trading Bot?",
    excerpt: "Botvio is an AI-powered trading bot platform that automates your Deriv trading with advanced strategies like Hauza Sniper. Learn how Botvio uses EMA crossovers, RSI analysis, and Markov transition models to generate profitable signals across synthetic indices.",
    category: "Guide",
    readTime: "8 min",
    date: "2026-02-20",
    featured: true,
  },
  {
    slug: "how-to-trade-deriv-digits-using-botvio",
    title: "How to Trade Deriv Digits Using Botvio",
    excerpt: "Master Digit trading on Deriv using Botvio's specialized digit engines. This guide covers Match, Differ, Even/Odd, and Over/Under contracts with Botvio's Markov transition analysis and frequency divergence strategies.",
    category: "Tutorial",
    readTime: "10 min",
    date: "2026-02-18",
    featured: true,
  },
  {
    slug: "best-boom-1000-strategy-using-botvio",
    title: "Best Boom 1000 Strategy Using Botvio",
    excerpt: "Discover the most effective Boom 1000 strategy powered by Botvio's spike detection engine. Learn how Botvio identifies spike droughts, volatility compression patterns, and optimal entry windows for Boom and Crash indices.",
    category: "Strategy",
    readTime: "12 min",
    date: "2026-02-15",
    featured: true,
  },
  {
    slug: "botvio-vs-manual-trading",
    title: "Botvio vs Manual Trading: Complete Comparison",
    excerpt: "Should you use Botvio's automated trading or trade manually? We compare speed, accuracy, emotional discipline, and profitability between Botvio AI-powered automation and traditional manual trading approaches.",
    category: "Comparison",
    readTime: "9 min",
    date: "2026-02-12",
  },
  {
    slug: "is-botvio-safe",
    title: "Is Botvio Safe? Security & Trust Analysis",
    excerpt: "A comprehensive review of Botvio's security architecture. Learn how Botvio encrypts broker tokens, implements server-side trade execution, and protects your trading accounts with enterprise-grade security measures.",
    category: "Security",
    readTime: "7 min",
    date: "2026-02-10",
  },
  {
    slug: "botvio-volatility-index-trading-guide",
    title: "Complete Volatility Index Trading Guide with Botvio",
    excerpt: "Trade Volatility 10, 25, 50, 75, and 100 indices using Botvio's specialized strategies. Learn how Botvio's EMA-based signal engines adapt to different volatility regimes for consistent profits.",
    category: "Guide",
    readTime: "11 min",
    date: "2026-02-08",
  },
  {
    slug: "botvio-accumulator-strategy",
    title: "Botvio Accumulator Strategy: Steady Growth Trading",
    excerpt: "Master the Accumulator trading mode with Botvio. Learn how Botvio's stability analysis engine identifies low-volatility trend phases perfect for accumulator contracts on Deriv.",
    category: "Strategy",
    readTime: "8 min",
    date: "2026-02-05",
  },
  {
    slug: "botvio-multiplier-trading-explained",
    title: "Multiplier Trading Explained: Botvio's Approach",
    excerpt: "Understand how Botvio trades Multiplier contracts on Deriv. From EMA 9/21 crossover signals to dynamic multiplier selection based on volatility, Botvio automates every aspect of multiplier trading.",
    category: "Tutorial",
    readTime: "9 min",
    date: "2026-02-03",
  },
];

const categories = ["All", "Guide", "Tutorial", "Strategy", "Comparison", "Security"];

const Blog = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = blogPosts.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    return matchSearch && matchCat;
  });

  const featured = filtered.filter(p => p.featured);
  const rest = filtered.filter(p => !p.featured);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Botvio Trading Blog",
    description: "Expert trading guides, strategies, and tutorials for automated trading with Botvio AI bots on Deriv.",
    url: "https://botvio.live/blog",
    publisher: { "@type": "Organization", name: "Botvio", url: "https://botvio.live" },
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Blog – AI Trading Guides & Strategies"
        description="Expert guides on AI trading bots, Deriv strategies, digit trading, Boom/Crash analysis, and more. Learn how Botvio automates profitable trading."
        jsonLd={jsonLd}
      />
      <Header />
      <main className="container mx-auto px-4 py-10 space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-extrabold tracking-tight">Botvio Trading Blog</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">Expert guides, strategies, and tutorials for automated trading with Botvio on Deriv.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search articles..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(c => (
              <Button key={c} size="sm" variant={activeCategory === c ? "default" : "outline"} onClick={() => setActiveCategory(c)}>{c}</Button>
            ))}
          </div>
        </div>

        {featured.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6">
            {featured.map(post => (
              <Link key={post.slug} to={`/blog/${post.slug}`}>
                <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{post.category}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{post.readTime}</span>
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">{post.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
                    <div className="flex items-center gap-1 mt-4 text-primary text-sm font-medium">Read More <ArrowRight className="h-4 w-4" /></div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {rest.map(post => (
            <Link key={post.slug} to={`/blog/${post.slug}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
                <CardContent className="flex items-center gap-6 py-5">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{post.category}</Badge>
                      <span className="text-xs text-muted-foreground">{post.date}</span>
                    </div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">{post.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No articles found matching your search.</div>
        )}
      </main>
    </div>
  );
};

export default Blog;
