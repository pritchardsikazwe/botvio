/**
 * Botvio Research taxonomy — presentation-layer only.
 *
 * Maps existing article metadata (category / title / excerpt) onto:
 *  - research topics used by the filter chips and category pages
 *  - a related Botvio market (display symbol understood by DerivLiveChart)
 *  - the matching Botvio Trading Hub route
 *
 * NO trading logic, no market data and no signals are produced here.
 */

export interface ResearchTopic {
  /** URL slug used by /blog/category/:slug */
  slug: string;
  label: string;
  /** Article categories (from the existing data) that belong to this topic */
  categories: string[];
  /** Extra keyword matches against title + excerpt */
  keywords?: string[];
  description: string;
  /** Shown in the primary filter row on the research landing page */
  primary?: boolean;
}

export const RESEARCH_TOPICS: ResearchTopic[] = [
  {
    slug: "forex",
    label: "Forex",
    categories: ["Forex", "Regional Guide"],
    keywords: ["eurusd", "gbpusd", "usdjpy", "currency", "cable", "majors"],
    description: "Currency-market research, session playbooks and pair-by-pair analysis.",
    primary: true,
  },
  {
    slug: "synthetic-indices",
    label: "Synthetic Indices",
    categories: ["Synthetic", "Synthetic Indices"],
    keywords: ["volatility 10", "volatility 25", "volatility 50", "volatility 75", "volatility 100", "boom", "crash", "step index", "synthetic"],
    description: "Deriv synthetic index structure, volatility behaviour and spike research.",
    primary: true,
  },
  {
    slug: "deriv",
    label: "Deriv",
    categories: ["Tutorial", "Guide"],
    keywords: ["deriv", "digits", "rise/fall", "rise and fall", "multiplier", "accumulator", "binary option"],
    description: "Deriv platform research: options, digits, multipliers and synthetic markets.",
    primary: true,
  },
  {
    slug: "weltrade",
    label: "Weltrade",
    categories: [],
    keywords: ["weltrade", "syntx", "mt5"],
    description: "Weltrade and MT5 research across forex, metals and index CFDs.",
    primary: true,
  },
  {
    slug: "cfds",
    label: "CFDs & Indices",
    categories: ["Indices", "CFD", "CFDs"],
    keywords: ["us30", "nas100", "ger40", "dow", "nasdaq", "dax", "index cfd"],
    description: "Index CFD research for US30, NAS100, GER40 and global benchmarks.",
    primary: true,
  },
  {
    slug: "gold",
    label: "Gold",
    categories: ["Gold"],
    keywords: ["gold", "xauusd", "xau/usd", "bullion", "silver", "xagusd"],
    description: "Gold and metals research — structure, key levels and session behaviour.",
    primary: true,
  },
  {
    slug: "crypto",
    label: "Crypto",
    categories: ["Crypto"],
    keywords: ["bitcoin", "btcusd", "ethereum", "altcoin", "on-chain"],
    description: "Digital-asset research covering Bitcoin, Ethereum and market rotations.",
    primary: true,
  },
  {
    slug: "binance",
    label: "Binance",
    categories: ["Binance"],
    keywords: ["binance", "spot trading", "futures funding"],
    description: "Binance market research, spot and futures mechanics.",
    primary: true,
  },
  {
    slug: "copy-trading",
    label: "Copy Trading",
    categories: ["Copy Trading"],
    keywords: ["copy trading", "copier", "provider", "follower"],
    description: "Copy-trading research: provider selection, drawdown control and expectations.",
    primary: true,
  },
  {
    slug: "strategies",
    label: "Strategies",
    categories: ["Strategy", "Strategies"],
    keywords: ["strategy", "setup", "scalping", "breakout", "swing"],
    description: "Documented trading strategies, entry frameworks and trade management.",
    primary: true,
  },
  {
    slug: "ai-trading",
    label: "AI Trading",
    categories: ["AI & Software", "AI & Finance", "AI"],
    keywords: ["ai ", "artificial intelligence", "machine learning", "chart analysis"],
    description: "How AI is applied to charts, signals and trade decision support.",
    primary: true,
  },
  {
    slug: "market-analysis",
    label: "Market Analysis",
    categories: ["Market Analysis", "Analysis"],
    keywords: ["forecast", "outlook", "analysis today"],
    description: "Technical and fundamental outlooks across Botvio's covered markets.",
    primary: true,
  },
  {
    slug: "education",
    label: "Education",
    categories: ["Education", "Earn Online"],
    keywords: ["beginner", "how to start", "learn", "basics", "explained"],
    description: "Structured trading education from first principles to execution.",
    primary: true,
  },
  {
    slug: "risk-management",
    label: "Risk Management",
    categories: ["Risk Management"],
    keywords: ["risk management", "position size", "lot size", "drawdown", "stop loss"],
    description: "Position sizing, drawdown control and capital-preservation research.",
  },
  {
    slug: "trading-psychology",
    label: "Trading Psychology",
    categories: ["Psychology", "Trading Psychology"],
    keywords: ["psychology", "discipline", "emotion", "mindset"],
    description: "The behavioural side of trading: discipline, tilt and routine.",
  },
  {
    slug: "broker-reviews",
    label: "Broker Reviews",
    categories: ["Brokers", "Broker Review", "Comparison"],
    keywords: ["broker", "review", "vs "],
    description: "Broker research for platforms Botvio already integrates with.",
  },
  {
    slug: "tools",
    label: "Forex Tools",
    categories: ["Tools"],
    keywords: ["calculator", "tool", "journal", "scanner"],
    description: "Practical calculators and tools that support trade planning.",
  },
  {
    slug: "signals",
    label: "Signals",
    categories: ["Signals"],
    keywords: ["signal"],
    description: "How Botvio signals are produced, scored and used responsibly.",
  },
  {
    slug: "market-news",
    label: "Market News",
    categories: ["News", "Market News"],
    keywords: ["news", "fomc", "cpi", "nfp", "calendar"],
    description: "Macro events and calendar research that moves the markets you trade.",
  },
  {
    slug: "case-studies",
    label: "Case Studies",
    categories: ["Case Study", "Case Studies"],
    keywords: ["case study", "journal review"],
    description: "Documented walk-throughs of real trading decisions and outcomes.",
  },
  {
    slug: "security",
    label: "Platform & Security",
    categories: ["Security", "Platform"],
    keywords: ["security", "safe", "encryption"],
    description: "Platform architecture, safety and account-protection research.",
  },
];

export const getTopic = (slug: string) => RESEARCH_TOPICS.find((t) => t.slug === slug);

/** Markets Botvio already streams, with the hub they belong to. */
export interface ResearchMarket {
  /** display symbol accepted by DerivLiveChart / mapToDerivSymbol */
  displaySymbol: string;
  label: string;
  broker: "Deriv" | "Weltrade" | "Binance";
  kind: "Synthetic Index" | "Forex" | "Metal" | "Index CFD" | "Crypto";
  /** Existing Botvio hub route */
  hub: string;
  hubLabel: string;
  /** matched against title + excerpt (lowercase) */
  keywords: string[];
}

export const RESEARCH_MARKETS: ResearchMarket[] = [
  // ── Deriv synthetic indices ──
  { displaySymbol: "R_10", label: "Volatility 10", broker: "Deriv", kind: "Synthetic Index", hub: "/synthetic", hubLabel: "Synthetic Indices Hub", keywords: ["volatility 10", "v10 index"] },
  { displaySymbol: "R_25", label: "Volatility 25", broker: "Deriv", kind: "Synthetic Index", hub: "/synthetic", hubLabel: "Synthetic Indices Hub", keywords: ["volatility 25"] },
  { displaySymbol: "R_50", label: "Volatility 50", broker: "Deriv", kind: "Synthetic Index", hub: "/synthetic", hubLabel: "Synthetic Indices Hub", keywords: ["volatility 50"] },
  { displaySymbol: "R_75", label: "Volatility 75", broker: "Deriv", kind: "Synthetic Index", hub: "/synthetic", hubLabel: "Synthetic Indices Hub", keywords: ["volatility 75"] },
  { displaySymbol: "R_100", label: "Volatility 100", broker: "Deriv", kind: "Synthetic Index", hub: "/synthetic", hubLabel: "Synthetic Indices Hub", keywords: ["volatility 100"] },
  { displaySymbol: "1HZ100V", label: "Volatility 100 (1s)", broker: "Deriv", kind: "Synthetic Index", hub: "/synthetic", hubLabel: "Synthetic Indices Hub", keywords: ["volatility 100 (1s)", "1s index"] },
  { displaySymbol: "BOOM500", label: "Boom 500", broker: "Deriv", kind: "Synthetic Index", hub: "/synthetic", hubLabel: "Synthetic Indices Hub", keywords: ["boom 500"] },
  { displaySymbol: "BOOM1000", label: "Boom 1000", broker: "Deriv", kind: "Synthetic Index", hub: "/synthetic", hubLabel: "Synthetic Indices Hub", keywords: ["boom 1000"] },
  { displaySymbol: "CRASH500", label: "Crash 500", broker: "Deriv", kind: "Synthetic Index", hub: "/synthetic", hubLabel: "Synthetic Indices Hub", keywords: ["crash 500"] },
  { displaySymbol: "CRASH1000", label: "Crash 1000", broker: "Deriv", kind: "Synthetic Index", hub: "/synthetic", hubLabel: "Synthetic Indices Hub", keywords: ["crash 1000"] },
  { displaySymbol: "stpRNG", label: "Step Index", broker: "Deriv", kind: "Synthetic Index", hub: "/synthetic", hubLabel: "Synthetic Indices Hub", keywords: ["step index"] },

  // ── Metals ──
  { displaySymbol: "XAU/USD", label: "Gold — XAU/USD", broker: "Weltrade", kind: "Metal", hub: "/gold", hubLabel: "Gold Trading Hub", keywords: ["xauusd", "xau/usd", "gold"] },
  { displaySymbol: "XAG/USD", label: "Silver — XAG/USD", broker: "Weltrade", kind: "Metal", hub: "/silver", hubLabel: "Silver Trading Hub", keywords: ["xagusd", "xag/usd", "silver"] },

  // ── Forex ──
  { displaySymbol: "EUR/USD", label: "EUR/USD", broker: "Weltrade", kind: "Forex", hub: "/markets", hubLabel: "Global Markets", keywords: ["eurusd", "eur/usd", "euro dollar"] },
  { displaySymbol: "GBP/USD", label: "GBP/USD", broker: "Weltrade", kind: "Forex", hub: "/gbp-usd", hubLabel: "GBP/USD Trading Hub", keywords: ["gbpusd", "gbp/usd", "cable"] },
  { displaySymbol: "USD/JPY", label: "USD/JPY", broker: "Weltrade", kind: "Forex", hub: "/markets", hubLabel: "Global Markets", keywords: ["usdjpy", "usd/jpy"] },
  { displaySymbol: "AUD/USD", label: "AUD/USD", broker: "Weltrade", kind: "Forex", hub: "/markets", hubLabel: "Global Markets", keywords: ["audusd", "aud/usd"] },
  { displaySymbol: "USD/CAD", label: "USD/CAD", broker: "Weltrade", kind: "Forex", hub: "/markets", hubLabel: "Global Markets", keywords: ["usdcad", "usd/cad"] },
  { displaySymbol: "USD/CHF", label: "USD/CHF", broker: "Weltrade", kind: "Forex", hub: "/markets", hubLabel: "Global Markets", keywords: ["usdchf", "usd/chf"] },
  { displaySymbol: "NZD/USD", label: "NZD/USD", broker: "Weltrade", kind: "Forex", hub: "/markets", hubLabel: "Global Markets", keywords: ["nzdusd", "nzd/usd"] },
  { displaySymbol: "EUR/JPY", label: "EUR/JPY", broker: "Weltrade", kind: "Forex", hub: "/markets", hubLabel: "Global Markets", keywords: ["eurjpy", "eur/jpy"] },
  { displaySymbol: "GBP/JPY", label: "GBP/JPY", broker: "Weltrade", kind: "Forex", hub: "/markets", hubLabel: "Global Markets", keywords: ["gbpjpy", "gbp/jpy", "dragon"] },

  // ── Index CFDs ──
  { displaySymbol: "US30", label: "US30 — Dow Jones 30", broker: "Weltrade", kind: "Index CFD", hub: "/us30", hubLabel: "US30 Trading Hub", keywords: ["us30", "dow jones", "dow 30"] },
  { displaySymbol: "NAS100", label: "NAS100 — Nasdaq 100", broker: "Weltrade", kind: "Index CFD", hub: "/nas100", hubLabel: "NAS100 Trading Hub", keywords: ["nas100", "nasdaq 100", "ustec"] },
  { displaySymbol: "GER40", label: "GER40 — DAX 40", broker: "Weltrade", kind: "Index CFD", hub: "/ger40", hubLabel: "GER40 Trading Hub", keywords: ["ger40", "dax 40", "germany 40", "dax"] },

  // ── Crypto ──
  { displaySymbol: "BTC/USD", label: "BTC/USD", broker: "Binance", kind: "Crypto", hub: "/bitcoin", hubLabel: "Bitcoin Trading Hub", keywords: ["btcusd", "btc/usd", "bitcoin"] },
  { displaySymbol: "ETH/USD", label: "ETH/USD", broker: "Binance", kind: "Crypto", hub: "/binance", hubLabel: "Binance Hub", keywords: ["ethusd", "eth/usd", "ethereum", "eth/btc"] },
];

const haystack = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(" ").toLowerCase();

/** Best-effort market match for an article. Returns null when no market fits. */
export function detectMarket(title: string, category?: string, excerpt?: string): ResearchMarket | null {
  const text = haystack(title, category, excerpt);
  let best: { market: ResearchMarket; score: number } | null = null;
  for (const market of RESEARCH_MARKETS) {
    for (const kw of market.keywords) {
      if (text.includes(kw)) {
        const score = kw.length;
        if (!best || score > best.score) best = { market, score };
      }
    }
  }
  return best?.market ?? null;
}

/** Topics an article belongs to, most specific first. */
export function detectTopics(title: string, category?: string, excerpt?: string): ResearchTopic[] {
  const text = haystack(title, excerpt);
  const cat = (category || "").toLowerCase();
  const matched = RESEARCH_TOPICS.filter((topic) => {
    if (topic.categories.some((c) => c.toLowerCase() === cat)) return true;
    return (topic.keywords || []).some((kw) => text.includes(kw));
  });
  return matched;
}

export function primaryTopic(title: string, category?: string, excerpt?: string): ResearchTopic | null {
  return detectTopics(title, category, excerpt)[0] ?? null;
}

/** Article presentation type, drives which visual blocks a template renders. */
export type ArticleType =
  | "market-analysis"
  | "education"
  | "strategy"
  | "broker-review"
  | "news"
  | "tool-guide"
  | "copy-trading"
  | "ai-trading"
  | "synthetic-research"
  | "case-study";

export function detectArticleType(title: string, category?: string, excerpt?: string): ArticleType {
  const text = haystack(title, excerpt);
  const cat = (category || "").toLowerCase();
  if (/(synthetic|boom|crash|volatility \d)/.test(text)) return "synthetic-research";
  if (cat.includes("market analysis") || /forecast|outlook|analysis today/.test(text)) return "market-analysis";
  if (cat.includes("broker") || /\breview\b/.test(text)) return "broker-review";
  if (cat.includes("news") || /fomc|cpi|nfp release/.test(text)) return "news";
  if (cat.includes("tool") || /calculator/.test(text)) return "tool-guide";
  if (/copy trading/.test(text)) return "copy-trading";
  if (/\bai\b|artificial intelligence/.test(text)) return "ai-trading";
  if (cat.includes("strategy")) return "strategy";
  if (cat.includes("case")) return "case-study";
  return "education";
}

export const ARTICLE_TYPE_LABEL: Record<ArticleType, string> = {
  "market-analysis": "Market Analysis",
  education: "Educational Guide",
  strategy: "Trading Strategy",
  "broker-review": "Broker Review",
  news: "Market News",
  "tool-guide": "Tool Guide",
  "copy-trading": "Copy Trading",
  "ai-trading": "AI Trading",
  "synthetic-research": "Synthetic Index Research",
  "case-study": "Case Study",
};

/** Trust note shown under the article meta, by type. */
export const ARTICLE_TYPE_NOTE: Record<ArticleType, string> = {
  "market-analysis": "Market analysis — levels and conditions change. Market data may change.",
  education: "Educational content only. Not financial advice.",
  strategy: "Educational strategy documentation — not a guaranteed outcome.",
  "broker-review": "Broker information may change. Botvio may earn affiliate commission — see our affiliate disclosure.",
  news: "News summary — verify details with primary sources before trading.",
  "tool-guide": "Tool documentation. Outputs depend on the inputs you provide.",
  "copy-trading": "Copy trading carries risk. Past performance is not a reliable indicator of future results.",
  "ai-trading": "AI-assisted analysis is decision support, not a guaranteed outcome.",
  "synthetic-research": "Synthetic indices are high-volatility products. Educational content only.",
  "case-study": "Documented example — not a representation of typical results.",
};
