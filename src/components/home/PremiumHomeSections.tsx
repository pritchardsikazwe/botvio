import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Brain,
  BookOpen,
  BarChart3,
  ArrowRight,
  Shield,
  TrendingUp,
  Sparkles,
  Star,
  Quote,
} from "lucide-react";
import { blogContent } from "@/content/blogPosts";

/**
 * Premium editorial home sections (Phase 1 of the AdSense/Helpful-Content
 * roadmap). These render above the existing dashboard content on `/` so the
 * page has a proper hero, trending analysis, market overview, education,
 * broker comparison, latest articles, testimonials and an FAQ before any
 * ad-eligible zones.
 */

const trending = [
  { title: "Gold (XAU/USD) Analysis", to: "/gold", tag: "Gold" },
  { title: "EUR/USD Forecast", to: "/eur-usd", tag: "Forex" },
  { title: "GBP/USD Forecast", to: "/gbp-usd", tag: "Forex" },
  { title: "BTC/USD Analysis", to: "/bitcoin", tag: "Crypto" },
  { title: "USD/JPY Forecast", to: "/usd-jpy", tag: "Forex" },
];

const marketOverview: {
  label: string;
  items: { name: string; to: string }[];
}[] = [
  {
    label: "Forex",
    items: [
      { name: "EUR/USD", to: "/chart/EURUSD" },
      { name: "GBP/USD", to: "/chart/GBPUSD" },
      { name: "USD/JPY", to: "/chart/USDJPY" },
      { name: "AUD/USD", to: "/chart/AUDUSD" },
      { name: "USD/CAD", to: "/chart/USDCAD" },
    ],
  },
  {
    label: "Crypto",
    items: [
      { name: "BTC/USD", to: "/chart/BTCUSD" },
      { name: "ETH/USD", to: "/chart/ETHUSD" },
      { name: "Binance Hub", to: "/binance" },
    ],
  },
  {
    label: "Indices",
    items: [
      { name: "US30", to: "/us30" },
      { name: "NAS100", to: "/nas100" },
      { name: "GER40", to: "/ger40" },
    ],
  },
  {
    label: "Commodities",
    items: [
      { name: "Gold (XAU/USD)", to: "/chart/XAUUSD" },
      { name: "Silver (XAG/USD)", to: "/chart/XAGUSD" },
    ],
  },
  {
    label: "Synthetic Indices",
    items: [
      { name: "Boom 1000", to: "/synthetic-hub" },
      { name: "Crash 1000", to: "/synthetic-hub" },
      { name: "Volatility 75", to: "/synthetic-hub" },
      { name: "Synthetic Hub", to: "/synthetic-hub" },
    ],
  },
];

const educationCards = [
  {
    title: "What is Forex?",
    desc: "The 24-hour global currency market explained in plain English.",
    to: "/learn/forex-basics/what-is-forex",
  },
  {
    title: "How AI Helps Traders",
    desc: "Where machine analysis genuinely beats gut-feel — and where it doesn't.",
    to: "/learn/ai-trading/how-ai-helps-traders",
  },
  {
    title: "Risk Management",
    desc: "Fixed-fractional sizing, stop placement and daily loss limits.",
    to: "/learn/risk-management/complete-guide",
  },
  {
    title: "Trading Psychology",
    desc: "System-based fixes for the four failure modes every trader faces.",
    to: "/learn/psychology/trading-psychology",
  },
  {
    title: "How Copy Trading Works",
    desc: "Master accounts, mirrored execution, and the risks nobody warns you about.",
    to: "/learn/copy-trading/how-it-works",
  },
  {
    title: "Beginner Trading Guide",
    desc: "A 30-day roadmap from your first chart to a working demo strategy.",
    to: "/learn/forex-beginner-mentorship",
  },
];

const brokers = [
  { name: "Deriv", to: "/brokers/deriv", best: "Synthetic indices & digital options", min: "$5" },
  { name: "Exness", to: "/brokers/exness", best: "Ultra-tight spreads on gold", min: "$10" },
  { name: "Weltrade", to: "/brokers/weltrade", best: "Proprietary indices access", min: "$25" },
];

const testimonials = [
  {
    quote:
      "Botvio's Gold analysis pages are the first thing I read every London open. The bias framework is simple enough to actually follow.",
    name: "Chipo M.",
    role: "Prop-firm trader, Lusaka",
  },
  {
    quote:
      "I used the AI chart analyzer for one week and it caught a NAS100 short I completely missed. The context beats generic signal groups.",
    name: "Daniel K.",
    role: "Part-time trader, Nairobi",
  },
  {
    quote:
      "Finally an education section that isn't recycled Investopedia. The SMC + risk management combo is genuinely useful.",
    name: "Amaka O.",
    role: "Swing trader, Lagos",
  },
];

const faq = [
  {
    q: "Is Botvio free to use?",
    a: "Yes. Our education hub, market analysis pages, calculators and daily forecasts are free. Some premium tools — live signals, auto-trading and the AI chart analyzer beyond the free daily quota — require a paid plan.",
  },
  {
    q: "Do you provide guaranteed signals?",
    a: "No. Nobody can guarantee trading results, and any platform that promises them is misleading you. Botvio publishes probabilistic setups with clear invalidation levels so you can decide whether the risk-to-reward fits your plan.",
  },
  {
    q: "Which brokers does Botvio support?",
    a: "We publish independent reviews of Deriv, Exness, HFM, XM, Weltrade, IC Markets and FP Markets, and integrate directly with Deriv (OAuth) and MetaTrader 5 (via our bridge EA) for execution.",
  },
  {
    q: "Can beginners use Botvio?",
    a: "Yes — start with the Forex From Zero learning path, run everything on a demo account for at least 30 days, and only move to a live account once you can follow your own written rules without breaking them.",
  },
  {
    q: "Where is Botvio based?",
    a: "Botvio is edited from Lusaka, Zambia. Support is handled by the Botvio Editorial Team at info@botvio.live and +260 966 284 085.",
  },
];

function latestArticles(limit: number) {
  return Object.entries(blogContent)
    .map(([slug, post]) => ({ slug, ...post }))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, limit);
}

export function PremiumHomeHero() {
  return (
    <section
      aria-labelledby="premium-hero-title"
      className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-6 md:p-10"
    >
      <div className="max-w-3xl">
        <Badge className="mb-3 bg-primary/20 text-primary border-primary/30">
          <Sparkles className="h-3 w-3 mr-1" /> AI Botvio Platform
        </Badge>
        <h1
          id="premium-hero-title"
          className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight"
        >
          AI Forex Trading Made Smarter
        </h1>
        <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
          Trade with confidence using AI-powered market analysis, in-depth forex
          education, independent broker reviews, copy trading and daily forecasts —
          all in one place.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/learning-paths">
            <Button size="lg" className="gap-2 font-bold">
              <BookOpen className="h-4 w-4" /> Start Learning
            </Button>
          </Link>
          <Link to="/market-analysis">
            <Button size="lg" variant="outline" className="gap-2 font-bold">
              <BarChart3 className="h-4 w-4" /> View Today's Analysis
            </Button>
          </Link>
          <Link to="/signals?tab=chart-analysis">
            <Button size="lg" variant="outline" className="gap-2 font-bold">
              <Brain className="h-4 w-4" /> AI Chart Analysis
            </Button>
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Trading forex, CFDs and synthetic indices carries substantial risk.
          Educational content only — not investment advice.
        </p>
      </div>
    </section>
  );
}

export function TrendingAnalysis() {
  return (
    <section aria-labelledby="trending-analysis-title">
      <div className="flex items-center justify-between mb-3">
        <h2 id="trending-analysis-title" className="text-lg md:text-xl font-extrabold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" /> Trending Analysis
        </h2>
        <Link to="/market-analysis" className="text-sm text-primary hover:underline flex items-center gap-1">
          All markets <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {trending.map((t) => (
          <Link key={t.to} to={t.to} className="block">
            <Card className="h-full hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <Badge variant="outline" className="text-[10px] mb-2">{t.tag}</Badge>
                <h3 className="text-sm font-bold text-foreground leading-snug">{t.title}</h3>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  Read forecast <ArrowRight className="h-3 w-3" />
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function MarketOverview() {
  return (
    <section aria-labelledby="market-overview-title">
      <h2 id="market-overview-title" className="text-lg md:text-xl font-extrabold mb-3 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" /> Market Overview
      </h2>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        {marketOverview.map((group) => (
          <Card key={group.label} className="h-full">
            <CardContent className="p-4">
              <h3 className="text-sm font-extrabold text-foreground mb-2">{group.label}</h3>
              <ul className="space-y-1.5">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                    >
                      <ArrowRight className="h-3 w-3" /> {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function HomeEducation() {
  return (
    <section aria-labelledby="home-education-title">
      <div className="flex items-center justify-between mb-3">
        <h2 id="home-education-title" className="text-lg md:text-xl font-extrabold flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" /> Learn Forex the Right Way
        </h2>
        <Link to="/education" className="text-sm text-primary hover:underline flex items-center gap-1">
          Education hub <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {educationCards.map((e) => (
          <Link key={e.to} to={e.to} className="block">
            <Card className="h-full hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <h3 className="text-sm font-extrabold text-foreground">{e.title}</h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{e.desc}</p>
                <p className="text-xs text-primary mt-2 flex items-center gap-1">
                  Read guide <ArrowRight className="h-3 w-3" />
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function FeaturedBrokers() {
  return (
    <section aria-labelledby="featured-brokers-title">
      <div className="flex items-center justify-between mb-3">
        <h2 id="featured-brokers-title" className="text-lg md:text-xl font-extrabold flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" /> Featured Broker Reviews
        </h2>
        <Link to="/brokers" className="text-sm text-primary hover:underline flex items-center gap-1">
          Compare all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {brokers.map((b) => (
          <Card key={b.to} className="h-full hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-extrabold text-foreground">{b.name}</h3>
                <Badge variant="outline" className="text-[10px]">Min {b.min}</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">Best for:</span> {b.best}
              </p>
              <div className="mt-3">
                <Link to={b.to}>
                  <Button size="sm" variant="outline" className="w-full font-bold gap-1">
                    Read review <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground mt-3">
        Some broker links are affiliate links. We only recommend brokers we've
        independently reviewed. See our{" "}
        <Link to="/affiliate-disclosure" className="underline hover:text-primary">
          affiliate disclosure
        </Link>
        .
      </p>
    </section>
  );
}

export function LatestArticles() {
  const posts = latestArticles(6);
  if (posts.length === 0) return null;
  return (
    <section aria-labelledby="latest-articles-title">
      <div className="flex items-center justify-between mb-3">
        <h2 id="latest-articles-title" className="text-lg md:text-xl font-extrabold flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" /> Latest Articles
        </h2>
        <Link to="/blog" className="text-sm text-primary hover:underline flex items-center gap-1">
          All articles <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
          <Link key={p.slug} to={`/blog/${p.slug}`} className="block">
            <Card className="h-full hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-[10px]">{p.category}</Badge>
                  <span className="text-[10px] text-muted-foreground">{p.readTime}</span>
                </div>
                <h3 className="text-sm font-extrabold text-foreground leading-snug line-clamp-2">{p.title}</h3>
                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{p.excerpt}</p>
                <p className="text-[10px] text-muted-foreground mt-2">
                  {new Date(p.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function HomeTestimonials() {
  return (
    <section aria-labelledby="home-testimonials-title">
      <h2 id="home-testimonials-title" className="text-lg md:text-xl font-extrabold mb-3 flex items-center gap-2">
        <Star className="h-5 w-5 text-primary" /> What Traders Say
      </h2>
      <div className="grid gap-3 md:grid-cols-3">
        {testimonials.map((t) => (
          <Card key={t.name} className="h-full">
            <CardContent className="p-5">
              <Quote className="h-5 w-5 text-primary mb-2" />
              <p className="text-sm text-foreground leading-relaxed">"{t.quote}"</p>
              <p className="mt-3 text-xs font-bold text-foreground">{t.name}</p>
              <p className="text-[11px] text-muted-foreground">{t.role}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function HomeFAQ() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <section aria-labelledby="home-faq-title">
      <h2 id="home-faq-title" className="text-lg md:text-xl font-extrabold mb-3">
        Frequently Asked Questions
      </h2>
      <Accordion type="single" collapsible className="w-full">
        {faq.map((f, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="text-sm font-bold text-left">{f.q}</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
              {f.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </section>
  );
}

export function PremiumHomeSections() {
  return (
    <>
      <PremiumHomeHero />
      <TrendingAnalysis />
      <MarketOverview />
      <HomeEducation />
      <FeaturedBrokers />
      <LatestArticles />
      <HomeTestimonials />
      <HomeFAQ />
    </>
  );
}