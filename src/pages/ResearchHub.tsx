import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, BookOpen, LineChart, Sparkles } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { PageBanner } from "@/components/layout/PageBanner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArticleCard } from "@/components/research/ArticleCard";
import { AdSlot } from "@/components/research/AdSlot";
import { ArticleMarketSnapshot } from "@/components/research/ArticleMarketSnapshot";
import { ResearchSidebar } from "@/components/research/ResearchSidebar";
import { RESEARCH_MARKETS, type ResearchMarket } from "@/lib/research/taxonomy";
import { byTopic, sortArticles, useResearchArticles } from "@/lib/research/useResearchArticles";

interface HubConfig {
  slug: string;
  title: string;
  accent: string;
  description: string;
  /** research topics whose articles feed this page */
  topics: string[];
  /** markets shown as live hub tiles (must exist in RESEARCH_MARKETS) */
  markets: string[];
  faq: { q: string; a: string }[];
  hubs: { label: string; to: string }[];
}

const HUBS: HubConfig[] = [
  {
    slug: "synthetic-indices",
    title: "Synthetic Indices",
    accent: "Research",
    description:
      "Structure, volatility behaviour and spike research for Deriv synthetic indices — using the same live charts Botvio uses in its Trading Hubs.",
    topics: ["synthetic-indices", "strategies"],
    markets: ["R_10", "R_25", "R_50", "R_75", "R_100", "1HZ100V", "BOOM500", "BOOM1000", "CRASH500", "CRASH1000", "stpRNG"],
    faq: [
      { q: "What are Deriv synthetic indices?", a: "Synthetic indices are Deriv-generated instruments that simulate market volatility with a constant, published volatility profile. They trade 24/7 and are not tied to real-world assets." },
      { q: "Which synthetic indices does Botvio cover?", a: "Botvio streams the Volatility 10–100 family (including the 1-second variants), Boom 500/1000, Crash 500/1000 and the Step Index inside its Synthetic Indices Hub." },
      { q: "Are synthetic indices riskier than forex?", a: "They are high-volatility products. Position sizing and a fixed daily loss limit matter more here than on slower forex pairs. All content on this page is educational only." },
    ],
    hubs: [
      { label: "Synthetic Indices Hub", to: "/synthetic" },
      { label: "Deriv Options", to: "/deriv-options" },
      { label: "Rise & Fall", to: "/rise-fall" },
    ],
  },
  {
    slug: "deriv",
    title: "Deriv Market",
    accent: "Research",
    description:
      "Deriv platform research: synthetic indices, digital options, Rise/Fall, multipliers, tools and the education that supports them.",
    topics: ["deriv", "synthetic-indices", "signals"],
    markets: ["R_75", "R_100", "BOOM1000", "CRASH1000"],
    faq: [
      { q: "What can you trade on Deriv through Botvio?", a: "Botvio connects to Deriv for synthetic indices, forex, index CFDs and digital option contract types such as Rise/Fall, Digits and Multipliers." },
      { q: "Do I need a Deriv account to read this research?", a: "No. The research and charts are open. A Deriv account is only needed if you decide to trade." },
    ],
    hubs: [
      { label: "Deriv App Workspace", to: "/deriv-app" },
      { label: "Deriv Options", to: "/deriv-options" },
      { label: "Synthetic Indices Hub", to: "/synthetic" },
    ],
  },
  {
    slug: "weltrade",
    title: "Weltrade Market",
    accent: "Research",
    description:
      "Weltrade and MT5 research across forex majors, gold and index CFDs — with the Botvio charts and hubs that cover each instrument.",
    topics: ["weltrade", "forex", "gold", "cfds"],
    markets: ["XAU/USD", "EUR/USD", "GBP/USD", "USD/JPY", "NAS100", "US30", "GER40"],
    faq: [
      { q: "Which Weltrade instruments does Botvio cover?", a: "Gold (XAU/USD), the forex majors, and the US30, NAS100 and GER40 index CFDs, each with its own Botvio Trading Hub." },
      { q: "Does Botvio trade Weltrade accounts directly?", a: "Botvio connects to MT5 terminals through its bridge. The trading logic and execution rules are unchanged by this research section." },
    ],
    hubs: [
      { label: "Weltrade Hub", to: "/weltrade" },
      { label: "Gold Trading Hub", to: "/gold" },
      { label: "Global Markets", to: "/markets" },
    ],
  },
  {
    slug: "forex",
    title: "Forex & Metals",
    accent: "Research",
    description:
      "Currency and metals research: session behaviour, structure, key levels and the strategies Botvio documents for each pair.",
    topics: ["forex", "gold", "market-analysis"],
    markets: ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD", "USD/CHF", "NZD/USD", "EUR/JPY", "GBP/JPY", "XAU/USD", "XAG/USD"],
    faq: [
      { q: "Which forex pairs does Botvio research?", a: "The majors plus high-volatility crosses such as GBP/JPY and EUR/JPY, alongside gold and silver." },
      { q: "Are these forecasts guaranteed?", a: "No. Analysis describes conditions and levels at the time of writing. Market data may change and nothing here is financial advice." },
    ],
    hubs: [
      { label: "Global Markets", to: "/markets" },
      { label: "Gold Trading Hub", to: "/gold" },
      { label: "GBP/USD Hub", to: "/gbp-usd" },
    ],
  },
  {
    slug: "crypto",
    title: "Crypto & Binance",
    accent: "Research",
    description:
      "Digital-asset research covering Bitcoin, Ethereum and Binance market mechanics, with the Botvio hubs that track them.",
    topics: ["crypto", "binance"],
    markets: ["BTC/USD", "ETH/USD"],
    faq: [
      { q: "Which crypto markets does Botvio cover?", a: "Bitcoin and Ethereum through the Bitcoin Trading Hub and the Binance Hub, using public Binance and Deriv market data." },
      { q: "Is crypto research the same as a signal?", a: "No. Research is context. Signals are produced separately by Botvio's signal engine and are informational, not guaranteed outcomes." },
    ],
    hubs: [
      { label: "Bitcoin Trading Hub", to: "/bitcoin" },
      { label: "Binance Hub", to: "/binance" },
    ],
  },
  {
    slug: "cfds",
    title: "Index CFD",
    accent: "Research",
    description:
      "US30, NAS100 and GER40 research — opening-range behaviour, session overlaps and the Botvio hubs covering each index.",
    topics: ["cfds"],
    markets: ["US30", "NAS100", "GER40"],
    faq: [
      { q: "Which indices does Botvio cover?", a: "US30 (Dow Jones 30), NAS100 (Nasdaq 100) and GER40 (DAX 40), each with a dedicated Trading Hub and breakout overlay." },
      { q: "When are index CFDs most active?", a: "Around cash-market opens and the London/New York overlap. Individual articles cover the timing for each index." },
    ],
    hubs: [
      { label: "US30 Hub", to: "/us30" },
      { label: "NAS100 Hub", to: "/nas100" },
      { label: "GER40 Hub", to: "/ger40" },
    ],
  },
];

const findMarket = (symbol: string) => RESEARCH_MARKETS.find((m) => m.displaySymbol === symbol);

const ResearchHub = () => {
  const { slug = "" } = useParams();
  const config = HUBS.find((h) => h.slug === slug);
  const { articles } = useResearchArticles();
  const [selected, setSelected] = useState<ResearchMarket | null>(null);

  const list = useMemo(() => {
    if (!config) return [];
    const seen = new Set<string>();
    const out = [] as typeof articles;
    for (const topic of config.topics) {
      for (const a of byTopic(articles, topic)) {
        if (!seen.has(a.slug)) {
          seen.add(a.slug);
          out.push(a);
        }
      }
    }
    return sortArticles(out, "latest");
  }, [articles, config]);

  const education = useMemo(() => list.filter((a) => a.type === "education").slice(0, 3), [list]);
  const strategies = useMemo(() => list.filter((a) => a.type === "strategy" || a.type === "synthetic-research").slice(0, 3), [list]);
  const trending = useMemo(() => sortArticles(list, "trending").slice(0, 5), [list]);

  if (!config) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="mb-4 text-2xl font-bold">Research page not found</h1>
          <Link to="/blog"><Button>Back to Research</Button></Link>
        </main>
      </div>
    );
  }

  const markets = config.markets.map(findMarket).filter(Boolean) as ResearchMarket[];
  const activeMarket = selected || markets[0] || null;
  const canonical = `https://botvio.lovable.app/research/${config.slug}`;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${config.title} Research — Botvio Trading Intelligence`}
        description={config.description}
        jsonLd={{
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "CollectionPage", name: `${config.title} Research`, description: config.description, url: canonical },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://botvio.lovable.app/" },
                { "@type": "ListItem", position: 2, name: "Research", item: "https://botvio.lovable.app/blog" },
                { "@type": "ListItem", position: 3, name: config.title, item: canonical },
              ],
            },
            {
              "@type": "FAQPage",
              mainEntity: config.faq.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            },
          ],
        }}
      />
      <Header />

      <main className="container mx-auto space-y-10 px-4 py-6 sm:py-8">
        <PageBanner
          title={config.title}
          accent={config.accent}
          description={config.description}
          crumbs={[{ label: "Home", to: "/" }, { label: "Research", to: "/blog" }, { label: config.title }]}
          features={[
            { icon: LineChart, label: `${markets.length} markets`, sub: "Live Botvio charts" },
            { icon: BookOpen, label: `${list.length} articles`, sub: "Analysis & education" },
            { icon: Sparkles, label: "Trading Hubs", sub: "One click from research" },
          ]}
          action={
            <div className="flex flex-wrap gap-2">
              {config.hubs.map((h) => (
                <Link key={h.to} to={h.to}>
                  <Button variant="outline" size="sm" className="gap-1.5">{h.label} <ArrowRight className="h-3.5 w-3.5" /></Button>
                </Link>
              ))}
            </div>
          }
        />

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-10">
            {/* Live market hubs */}
            {markets.length > 0 && (
              <section>
                <h2 className="mb-3 text-xl font-bold tracking-tight text-foreground">Live Market Hubs</h2>
                <div className="mb-4 flex flex-wrap gap-2">
                  {markets.map((m) => (
                    <Button
                      key={m.displaySymbol}
                      size="sm"
                      variant={activeMarket?.displaySymbol === m.displaySymbol ? "default" : "outline"}
                      onClick={() => setSelected(m)}
                    >
                      {m.label}
                    </Button>
                  ))}
                </div>
                {activeMarket && <ArticleMarketSnapshot market={activeMarket} title={`${activeMarket.label} — Live Chart`} />}
              </section>
            )}

            <AdSlot placement="below-intro" />

            <section>
              <h2 className="mb-4 text-xl font-bold tracking-tight text-foreground">Latest {config.title} Analysis</h2>
              {list.length === 0 ? (
                <p className="rounded-xl border border-border/60 bg-card/50 p-6 text-sm text-muted-foreground">
                  No articles published in this area yet.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {list.slice(0, 9).map((a) => (
                    <ArticleCard key={a.slug} article={a} />
                  ))}
                </div>
              )}
            </section>

            {education.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-bold tracking-tight text-foreground">Educational Guides</h2>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {education.map((a) => (
                    <ArticleCard key={a.slug} article={a} />
                  ))}
                </div>
              </section>
            )}

            {strategies.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-bold tracking-tight text-foreground">Related Strategies</h2>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {strategies.map((a) => (
                    <ArticleCard key={a.slug} article={a} />
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="mb-4 text-xl font-bold tracking-tight text-foreground">Frequently Asked Questions</h2>
              <Accordion type="single" collapsible className="rounded-2xl border border-border/60 bg-card/60 px-4">
                {config.faq.map((f, i) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger className="text-left text-sm font-semibold">{f.q}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>

            <section className="rounded-2xl border border-border/60 bg-card/60 p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Related Trading Hubs</h2>
              <div className="flex flex-wrap gap-2">
                {markets.map((m) => (
                  <Link key={m.displaySymbol + m.hub} to={m.hub}>
                    <Badge variant="outline" className="cursor-pointer text-xs hover:border-primary/60 hover:text-primary">
                      {m.hubLabel} · {m.label}
                    </Badge>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <ResearchSidebar market={activeMarket} trending={trending} className="hidden lg:block" />
        </div>
      </main>
    </div>
  );
};

export default ResearchHub;
