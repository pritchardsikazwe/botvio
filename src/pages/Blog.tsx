import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Search, Clock, TrendingUp, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { DerivAffiliateButton } from "@/components/trading/DerivAffiliateButton";

const blogPosts = [
  {
    slug: "what-is-botvio-ai-trading-bot",
    title: "What is Botvio AI Trading Bot?",
    excerpt: "Botvio is an AI-powered trading bot platform that automates your Deriv trading with advanced strategies like Hauza Sniper.",
    category: "Guide",
    readTime: "8 min",
    date: "2026-02-20",
    featured: true,
    image: "🤖",
  },
  {
    slug: "how-to-trade-deriv-digits-using-botvio",
    title: "How to Trade Deriv Digits Using Botvio",
    excerpt: "Master Digit trading on Deriv using Botvio's Markov transition analysis and frequency divergence strategies.",
    category: "Tutorial",
    readTime: "10 min",
    date: "2026-02-18",
    featured: true,
    image: "🎯",
  },
  {
    slug: "best-boom-1000-strategy-using-botvio",
    title: "Best Boom 1000 Strategy Using Botvio",
    excerpt: "Discover the most effective Boom 1000 strategy powered by Botvio's spike detection engine.",
    category: "Strategy",
    readTime: "12 min",
    date: "2026-02-15",
    featured: true,
    image: "💥",
  },
  {
    slug: "how-to-start-forex-trading",
    title: "How to Start Forex Trading in 2026 — Complete Beginner Guide",
    excerpt: "Learn how to start forex trading from scratch. This guide covers everything from choosing a broker to placing your first trade with Botvio.",
    category: "Forex",
    readTime: "15 min",
    date: "2026-02-22",
    featured: true,
    image: "📈",
  },
  {
    slug: "how-to-earn-money-online-trading",
    title: "How to Earn Money Online with Trading in 2026",
    excerpt: "Discover proven ways to earn money online through binary options, forex, and synthetic indices trading with Botvio AI bot.",
    category: "Earn Online",
    readTime: "12 min",
    date: "2026-02-21",
    image: "💰",
  },
  {
    slug: "how-to-make-money-online-deriv",
    title: "How to Make Money Online with Deriv Binary Options",
    excerpt: "Step-by-step guide to making money online using Deriv binary options and Botvio automated trading.",
    category: "Earn Online",
    readTime: "14 min",
    date: "2026-02-19",
    image: "🏆",
  },
  {
    slug: "deriv-binary-options-complete-guide",
    title: "Deriv Binary Options — Complete Guide for Beginners",
    excerpt: "Everything you need to know about trading binary options on Deriv. Learn contract types, strategies, and how Botvio automates it all.",
    category: "Guide",
    readTime: "16 min",
    date: "2026-02-17",
    image: "📊",
  },
  {
    slug: "botvio-vs-manual-trading",
    title: "Botvio vs Manual Trading: Complete Comparison",
    excerpt: "Should you use Botvio's automated trading or trade manually? We compare speed, accuracy, and profitability.",
    category: "Comparison",
    readTime: "9 min",
    date: "2026-02-12",
    image: "⚖️",
  },
  {
    slug: "is-botvio-safe",
    title: "Is Botvio Safe? Security & Trust Analysis",
    excerpt: "A comprehensive review of Botvio's security architecture, encryption, and data protection measures.",
    category: "Security",
    readTime: "7 min",
    date: "2026-02-10",
    image: "🔒",
  },
  {
    slug: "botvio-volatility-index-trading-guide",
    title: "Complete Volatility Index Trading Guide with Botvio",
    excerpt: "Trade Volatility 10-100 indices using Botvio's specialized strategies for consistent profits.",
    category: "Guide",
    readTime: "11 min",
    date: "2026-02-08",
    image: "📉",
  },
  {
    slug: "botvio-accumulator-strategy",
    title: "Botvio Accumulator Strategy: Steady Growth Trading",
    excerpt: "Master the Accumulator trading mode with Botvio's stability analysis engine.",
    category: "Strategy",
    readTime: "8 min",
    date: "2026-02-05",
    image: "📈",
  },
  {
    slug: "botvio-multiplier-trading-explained",
    title: "Multiplier Trading Explained: Botvio's Approach",
    excerpt: "Understand how Botvio trades Multiplier contracts on Deriv with dynamic multiplier selection.",
    category: "Tutorial",
    readTime: "9 min",
    date: "2026-02-03",
    image: "🔢",
  },
];

const categories = ["All", "Guide", "Tutorial", "Strategy", "Comparison", "Security", "Forex", "Earn Online"];

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
    description: "Expert trading guides on how to start forex, how to earn online, Deriv binary options, and AI-powered automated trading strategies.",
    url: "https://botvio.live/blog",
    publisher: { "@type": "Organization", name: "Botvio", url: "https://botvio.live" },
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Blog – How to Start Forex, Earn Online & AI Trading"
        description="Expert guides on how to start forex trading, how to earn money online, Deriv binary options strategies, and AI-powered automated trading with Botvio."
        jsonLd={jsonLd}
      />
      <Header />
      <main className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            <div className="space-y-3">
              <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-warning bg-clip-text text-transparent">Botvio Trading Blog</h1>
              <p className="text-muted-foreground max-w-2xl">Expert guides on forex trading, earning online, Deriv binary options, and AI-powered automated strategies.</p>
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
              <div className="grid md:grid-cols-2 gap-6">
                {featured.map(post => (
                  <Link key={post.slug} to={`/blog/${post.slug}`}>
                    <Card className="h-full hover:border-primary/50 transition-all hover:shadow-lg cursor-pointer group overflow-hidden">
                      <div className="h-32 bg-gradient-to-br from-primary/20 to-warning/20 flex items-center justify-center text-5xl">
                        {post.image}
                      </div>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-gradient-to-r from-primary to-warning text-primary-foreground">{post.category}</Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{post.readTime}</span>
                        </div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">{post.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
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
                  <Card className="hover:border-primary/50 transition-all hover:shadow-md cursor-pointer group">
                    <CardContent className="flex items-center gap-6 py-5">
                      <div className="text-3xl w-12 h-12 flex items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-warning/10 shrink-0">
                        {post.image}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{post.category}</Badge>
                          <span className="text-xs text-muted-foreground">{post.date}</span>
                        </div>
                        <h3 className="font-semibold group-hover:text-primary transition-colors">{post.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">No articles found matching your search.</div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Deriv CTA */}
            <Card className="bg-gradient-to-br from-primary/10 to-warning/10 border-primary/30">
              <CardContent className="pt-6 space-y-3 text-center">
                <TrendingUp className="h-10 w-10 mx-auto text-primary" />
                <h3 className="font-bold">Start Trading Now</h3>
                <p className="text-sm text-muted-foreground">Create your free Deriv account and trade with Botvio AI.</p>
                <DerivAffiliateButton size="default" className="w-full" label="Create Deriv Account" />
              </CardContent>
            </Card>

            {/* Popular Categories */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Popular Topics</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {["How to Start Forex", "Earn Money Online", "Deriv Binary Options", "AI Trading Bot", "Boom/Crash Strategy"].map(t => (
                  <Button key={t} variant="ghost" size="sm" className="w-full justify-start text-xs" onClick={() => setSearch(t.split(" ").slice(-2).join(" "))}>
                    <ArrowRight className="h-3 w-3 mr-2" />{t}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Risk Warning */}
            <Card className="border-destructive/20">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">
                  <strong>⚠️ Risk Warning:</strong> Trading binary options involves significant risk. Past performance does not guarantee future results. Never trade with money you can't afford to lose.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Blog;
