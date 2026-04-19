import React, { useEffect, useRef } from "react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Search, Clock, TrendingUp, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DerivAffiliateButton } from "@/components/trading/DerivAffiliateButton";
import { supabase } from "@/integrations/supabase/client";
import { AdsterraNativeBanner } from "@/components/adverts/AdsterraNativeBanner";

// AdSense temporarily disabled while site content expands to meet AdSense Program Policies.
// Re-enable by restoring the <ins class="adsbygoogle"> markup once approved.
const BlogAdSlot = (_: { slot: string }) => null;

const blogPosts = [
  {
    slug: "what-is-botvio-ai-trading-bot",
    title: "What is Botvio AI Trading Bot?",
    excerpt: "Botvio is an AI-powered trading bot platform that automates your Deriv trading with advanced Botvio AI strategies.",
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
    slug: "best-gold-brokers-xauusd-trading",
    title: "Best Gold Brokers for XAUUSD Trading in 2026",
    excerpt: "Compare top gold brokers including Exness, Deriv & Weltrade. Find the best spreads and conditions for XAUUSD trading.",
    category: "Gold",
    readTime: "10 min",
    date: "2026-03-01",
    featured: true,
    image: "🥇",
  },
  {
    slug: "gold-signals-xauusd-daily-analysis",
    title: "Gold Signals & XAUUSD Daily Analysis — How Botvio Delivers",
    excerpt: "Learn how Botvio generates daily gold signals and XAUUSD analysis using AI chart analysis tools for gold traders.",
    category: "Gold",
    readTime: "8 min",
    date: "2026-03-03",
    image: "📊",
  },
  {
    slug: "deriv-signals-forex-trading-guide",
    title: "Deriv Signals — Free Forex Trading Signals for 2026",
    excerpt: "Get free Deriv signals for synthetic indices, forex and gold. AI-powered signal generation for Deriv traders.",
    category: "Signals",
    readTime: "9 min",
    date: "2026-03-02",
    image: "📡",
  },
  {
    slug: "exness-signals-gold-forex",
    title: "Exness Signals — Gold & Forex Trading Signals",
    excerpt: "Free Exness signals for XAUUSD, EUR/USD and major forex pairs. AI analysis tools for Exness traders.",
    category: "Signals",
    readTime: "8 min",
    date: "2026-02-28",
    image: "⚡",
  },
  {
    slug: "weltrade-signals-forex-gold",
    title: "Weltrade Signals — Forex & Gold Copy Trading",
    excerpt: "Weltrade signals and copy trading for gold and forex. Follow top XAUUSD traders on Weltrade with Botvio.",
    category: "Signals",
    readTime: "7 min",
    date: "2026-02-27",
    image: "🌍",
  },
  {
    slug: "ai-forex-chart-analysis-tools",
    title: "AI Forex Chart Analysis Tools — Free Technical Analysis",
    excerpt: "Upload any forex or gold chart and get instant AI-powered technical analysis with support, resistance & trade setups.",
    category: "Guide",
    readTime: "11 min",
    date: "2026-03-04",
    featured: true,
    image: "🤖",
  },
  {
    slug: "forex-mentorship-learn-gold-trading",
    title: "Forex Mentorship — Learn Gold Trading from Experts",
    excerpt: "Join Botvio's forex mentorship program. Learn XAUUSD analysis, risk management & professional trading strategies.",
    category: "Forex",
    readTime: "12 min",
    date: "2026-03-05",
    featured: true,
    image: "🎓",
  },
  // ══════ BINANCE BLOG POSTS ══════
  { slug: "btc-price-prediction-this-week", title: "BTC Price Prediction This Week", excerpt: "Bitcoin technical analysis and price targets for this week.", category: "Market Analysis", readTime: "5 min", date: "2026-04-08", featured: true, image: "₿" },
  { slug: "top-altcoins-to-buy-today", title: "Top Altcoins to Buy Today", excerpt: "AI-analyzed altcoins showing strong technical setups.", category: "Market Analysis", readTime: "6 min", date: "2026-04-07", featured: true, image: "🚀" },
  { slug: "best-indicators-binance-trading", title: "Best Indicators for Binance Trading", excerpt: "Top 7 indicators every Binance trader should master.", category: "Education", readTime: "8 min", date: "2026-04-06", featured: false, image: "📊" },
  { slug: "how-i-turned-100-into-1000-binance", title: "How I Turned $100 Into $1,000 on Binance", excerpt: "A realistic 90-day case study using AI signals.", category: "Case Study", readTime: "10 min", date: "2026-04-05", featured: true, image: "💰" },
  { slug: "binance-futures-for-beginners", title: "Binance Futures for Beginners", excerpt: "Complete beginner's guide to leverage and margin trading.", category: "Education", readTime: "12 min", date: "2026-04-04", featured: false, image: "📈" },
  { slug: "best-binance-strategy-2026", title: "Best Binance Strategy for 2026", excerpt: "The most effective crypto trading strategy for current markets.", category: "Strategies", readTime: "8 min", date: "2026-04-03", featured: false, image: "🎯" },
  { slug: "free-crypto-signals-binance", title: "Free Crypto Signals for Binance", excerpt: "How to access free AI-generated crypto signals.", category: "Signals", readTime: "5 min", date: "2026-04-02", featured: false, image: "📡" },
  { slug: "binance-scalping-tips", title: "Binance Scalping Tips: 10 Rules", excerpt: "Master crypto scalping with 10 essential rules.", category: "Strategies", readTime: "7 min", date: "2026-04-01", featured: false, image: "⚡" },
  { slug: "binance-dca-strategy", title: "DCA Strategy for Binance", excerpt: "Dollar-cost averaging for long-term wealth building.", category: "Strategies", readTime: "6 min", date: "2026-03-30", featured: false, image: "🔄" },
  { slug: "understanding-binance-fees", title: "Understanding Binance Fees", excerpt: "Complete breakdown of all Binance fee structures.", category: "Education", readTime: "6 min", date: "2026-03-28", featured: false, image: "💸" },
  { slug: "binance-security-best-practices", title: "Binance Security: 10 Steps to Protect Crypto", excerpt: "Essential security practices for your Binance account.", category: "Education", readTime: "7 min", date: "2026-03-26", featured: false, image: "🔒" },
  { slug: "binance-p2p-trading-guide", title: "Binance P2P Trading Guide", excerpt: "Buy crypto with local currency via P2P.", category: "Education", readTime: "7 min", date: "2026-03-24", featured: false, image: "🤝" },
  { slug: "binance-bnb-token-guide", title: "BNB Token: Complete Guide", excerpt: "Everything about Binance's native cryptocurrency.", category: "Education", readTime: "6 min", date: "2026-03-22", featured: false, image: "🪙" },
  { slug: "crypto-market-psychology", title: "Crypto Market Psychology: Fear & Greed", excerpt: "Understanding market emotions for better decisions.", category: "Education", readTime: "8 min", date: "2026-03-20", featured: false, image: "🧠" },
  { slug: "binance-launchpad-guide", title: "Binance Launchpad: Token Launches", excerpt: "How to earn free tokens from new launches.", category: "Education", readTime: "6 min", date: "2026-03-18", featured: false, image: "🚀" },
  { slug: "reading-crypto-charts-beginner", title: "Reading Crypto Charts: Beginner's Guide", excerpt: "Learn candlesticks, timeframes, and patterns.", category: "Education", readTime: "10 min", date: "2026-03-16", featured: false, image: "📉" },
  { slug: "binance-margin-trading-explained", title: "Binance Margin Trading Explained", excerpt: "Cross vs isolated margin and interest rates.", category: "Education", readTime: "7 min", date: "2026-03-14", featured: false, image: "📐" },
  { slug: "top-5-crypto-mistakes-avoid", title: "Top 5 Crypto Mistakes to Avoid", excerpt: "Common mistakes new traders make and how to fix them.", category: "Education", readTime: "6 min", date: "2026-03-12", featured: false, image: "⚠️" },
  { slug: "binance-api-trading-setup", title: "Binance API Trading Setup", excerpt: "Connect bots safely with API keys.", category: "Education", readTime: "8 min", date: "2026-03-10", featured: false, image: "🔌" },
  { slug: "binance-stablecoin-earning", title: "Earn with Stablecoins on Binance", excerpt: "Earn 2-10% APY on USDT and USDC.", category: "Education", readTime: "5 min", date: "2026-03-08", featured: false, image: "💵" },
  { slug: "crypto-portfolio-management", title: "Crypto Portfolio Management", excerpt: "Build a balanced portfolio with proper allocation.", category: "Strategies", readTime: "7 min", date: "2026-03-06", featured: false, image: "📋" },
  { slug: "binance-trading-journal-template", title: "Trading Journal: Free Template", excerpt: "The most important habit for profitable trading.", category: "Education", readTime: "6 min", date: "2026-03-04", featured: false, image: "📓" },
  { slug: "bitcoin-halving-impact-trading", title: "Bitcoin Halving Impact on Trading", excerpt: "How halvings affect crypto markets.", category: "Market Analysis", readTime: "7 min", date: "2026-03-02", featured: false, image: "⛏️" },
  { slug: "defi-on-binance-smart-chain", title: "DeFi on BNB Smart Chain", excerpt: "DEX trading, yield farming, and lending guide.", category: "Education", readTime: "8 min", date: "2026-02-28", featured: false, image: "🌐" },
  { slug: "binance-tax-guide", title: "Crypto Tax Guide for Binance", excerpt: "Understanding taxes for crypto traders.", category: "Education", readTime: "7 min", date: "2026-02-26", featured: false, image: "🧾" },
  { slug: "crypto-candlestick-patterns", title: "Top 10 Candlestick Patterns", excerpt: "Essential patterns for crypto trading.", category: "Education", readTime: "9 min", date: "2026-02-24", featured: false, image: "🕯️" },
  { slug: "binance-order-types-explained", title: "Binance Order Types Explained", excerpt: "Market, limit, stop, OCO — when to use each.", category: "Education", readTime: "7 min", date: "2026-02-22", featured: false, image: "📝" },
  { slug: "crypto-bull-bear-market-strategies", title: "Bull & Bear Market Strategies", excerpt: "Adapt your strategy for market conditions.", category: "Strategies", readTime: "8 min", date: "2026-02-20", featured: false, image: "🐂" },
  { slug: "binance-grid-bot-strategy", title: "Grid Bot Strategy for Binance", excerpt: "Automate range trading with grid bots.", category: "Strategies", readTime: "7 min", date: "2026-02-18", featured: false, image: "🔲" },
  { slug: "understanding-funding-rates", title: "Understanding Funding Rates", excerpt: "Use funding rates for trading decisions.", category: "Education", readTime: "6 min", date: "2026-02-16", featured: false, image: "📊" },
  { slug: "binance-trading-for-africa", title: "Binance Trading in Africa", excerpt: "Getting started guide for African traders.", category: "Regional", readTime: "8 min", date: "2026-02-14", featured: false, image: "🌍" },
  { slug: "binance-trading-for-asia", title: "Binance Trading in Asia", excerpt: "Regional guide for Asian crypto markets.", category: "Regional", readTime: "7 min", date: "2026-02-12", featured: false, image: "🌏" },
  { slug: "crypto-whales-track-binance", title: "How to Track Crypto Whales", excerpt: "Follow whale movements for better trades.", category: "Strategies", readTime: "7 min", date: "2026-02-10", featured: false, image: "🐋" },
  { slug: "binance-earn-vs-defi", title: "Binance Earn vs DeFi", excerpt: "Centralized vs decentralized earning compared.", category: "Education", readTime: "6 min", date: "2026-02-08", featured: false, image: "⚖️" },
  { slug: "altcoin-season-binance", title: "Altcoin Season: How to Profit", excerpt: "Position your portfolio for altcoin rallies.", category: "Strategies", readTime: "7 min", date: "2026-02-06", featured: false, image: "🌊" },
  { slug: "binance-futures-vs-spot", title: "Futures vs Spot Trading", excerpt: "In-depth comparison for Binance traders.", category: "Education", readTime: "7 min", date: "2026-02-04", featured: false, image: "⚔️" },
  { slug: "binance-mobile-trading-tips", title: "Mobile Trading Tips for Binance", excerpt: "Optimize your smartphone trading experience.", category: "Education", readTime: "5 min", date: "2026-02-02", featured: false, image: "📱" },
  { slug: "crypto-support-resistance-trading", title: "Support & Resistance Trading", excerpt: "Master key levels for better entries.", category: "Strategies", readTime: "8 min", date: "2026-01-30", featured: false, image: "📏" },
  { slug: "binance-web3-wallet-guide", title: "Binance Web3 Wallet Guide", excerpt: "Set up Web3 wallet for DeFi access.", category: "Education", readTime: "6 min", date: "2026-01-28", featured: false, image: "👛" },
  { slug: "crypto-news-trading-strategy", title: "News Trading Strategy", excerpt: "Trade crypto news events profitably.", category: "Strategies", readTime: "7 min", date: "2026-01-26", featured: false, image: "📰" },
  { slug: "binance-referral-program-guide", title: "Binance Referral Program Guide", excerpt: "Earn passive income with referrals.", category: "Education", readTime: "5 min", date: "2026-01-24", featured: false, image: "🔗" },
  { slug: "automated-crypto-portfolio-rebalancing", title: "Automated Portfolio Rebalancing", excerpt: "Automate your portfolio maintenance.", category: "Strategies", readTime: "6 min", date: "2026-01-22", featured: false, image: "⚙️" },
  { slug: "binance-trading-psychology-tips", title: "Trading Psychology Tips", excerpt: "Master your emotions for better results.", category: "Education", readTime: "7 min", date: "2026-01-20", featured: false, image: "🧘" },
  { slug: "ethereum-trading-binance", title: "Ethereum Trading on Binance", excerpt: "Complete guide to trading ETH.", category: "Market Analysis", readTime: "7 min", date: "2026-01-18", featured: false, image: "💎" },
  { slug: "binance-liquidation-prevention", title: "How to Avoid Liquidation", excerpt: "Prevent futures liquidation with proper management.", category: "Education", readTime: "6 min", date: "2026-01-16", featured: false, image: "🛡️" },
  { slug: "solana-trading-binance", title: "Solana Trading on Binance", excerpt: "Guide & AI signals for SOL trading.", category: "Market Analysis", readTime: "6 min", date: "2026-01-14", featured: false, image: "☀️" },
  { slug: "how-to-short-bitcoin-binance", title: "How to Short Bitcoin on Binance", excerpt: "Profit when BTC price drops.", category: "Education", readTime: "6 min", date: "2026-01-12", featured: false, image: "📉" },
  { slug: "binance-smart-money-concepts", title: "Smart Money Concepts for Binance", excerpt: "Apply institutional SMC to crypto trading.", category: "Strategies", readTime: "9 min", date: "2026-01-10", featured: false, image: "🏦" },
];

// Categories auto-detected from posts below

const Blog = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  // Fetch DB posts
  const { data: dbPosts } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select("slug, title, excerpt, category, read_time, published_at, created_at, cover_image, keywords")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      return data || [];
    },
  });

  // Merge: DB posts first, then static (skip duplicates)
  const dbSlugs = new Set((dbPosts || []).map(p => p.slug));
  const mergedPosts = [
    ...(dbPosts || []).map(p => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt || "",
      category: p.category || "Guide",
      readTime: p.read_time || "5 min",
      date: p.published_at || p.created_at,
      featured: false,
      image: "📝",
    })),
    ...blogPosts.filter(p => !dbSlugs.has(p.slug)),
  ];

  // Auto-detect categories from all posts
  const categories = ["All", ...Array.from(new Set(mergedPosts.map(p => p.category))).sort()];

  const filtered = mergedPosts.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    return matchSearch && matchCat;
  });

  const featured = filtered.filter(p => p.featured);
  const rest = filtered.filter(p => !p.featured);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Botvio Forex & Gold Trading Blog",
    description: "Expert guides on forex signals, gold trading, XAUUSD analysis, AI chart analysis, Deriv signals, Exness signals, Weltrade signals, and forex mentorship.",
    url: "https://botvio.live/blog",
    publisher: { "@type": "Organization", name: "Botvio", url: "https://botvio.live" },
    keywords: "forex signals, gold signals, XAUUSD signals, AI forex analysis, gold trading, gold brokers, gold analysis, deriv signals, exness signals, weltrade signals, forex mentorship, AI chart analysis, gold traders, forex trading signals, copy trading signals, best gold broker, XAUUSD analysis, free forex signals, trading mentorship, binance signals",
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead seoKey="blog"
        title="Blog – Gold Signals, Forex Mentorship & AI Chart Analysis"
        description="Expert guides on gold trading signals, XAUUSD analysis, forex mentorship, Deriv signals, Exness signals, Weltrade signals & AI-powered chart analysis tools."
        jsonLd={jsonLd}
      />
      <Header />
      <main className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            <div className="space-y-3">
              <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-warning bg-clip-text text-transparent">Forex & Gold Trading Blog</h1>
              <p className="text-muted-foreground max-w-2xl">Expert guides on gold signals, XAUUSD analysis, forex mentorship, Deriv signals, Exness signals, Weltrade signals & AI chart analysis.</p>
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

            <AdsterraNativeBanner />

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
            {/* Multi-Broker CTAs */}
            <Card className="bg-gradient-to-br from-primary/10 to-warning/10 border-primary/30">
              <CardContent className="pt-6 space-y-3">
                <TrendingUp className="h-10 w-10 mx-auto text-primary" />
                <h3 className="font-bold text-center">Start Trading Now</h3>
                <p className="text-sm text-muted-foreground text-center">Open a free account with a trusted broker.</p>
                <a href="https://one.exness-track.com/a/ts1kvs1k" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="w-full gap-1 mb-2">Open Exness Account <ExternalLink className="h-3 w-3" /></Button>
                </a>
                <DerivAffiliateButton size="sm" className="w-full" label="Open Deriv Account" />
                <a href="https://gowt.net/ib67505" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="w-full gap-1 mt-2">Open Weltrade Account <ExternalLink className="h-3 w-3" /></Button>
                </a>
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

            {/* AdSense Sidebar Ad */}
            <BlogAdSlot slot="sidebar-1" />

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
