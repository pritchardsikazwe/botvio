export interface AuthorProfile {
  slug: string;
  name: string;
  role: string;
  bio: string;
  longBio: string;
  expertise: string[];
  credentials: string[];
  email?: string;
  avatar?: string;
}

export const AUTHORS: Record<string, AuthorProfile> = {
  "botvio-editorial-team": {
    slug: "botvio-editorial-team",
    name: "Botvio Editorial Team",
    role: "Independent Trading Educators",
    bio: "The Botvio Editorial Team is a collective of independent traders, technical analysts and financial writers publishing plain-English trading education from Lusaka, Zambia.",
    longBio:
      "The Botvio Editorial Team publishes independent trading education, market analysis and platform reviews for readers across Africa, Europe and Asia. Every article is written and edited by human contributors, cross-checked against public market data (Deriv, Binance, TradingView, official exchange notices) and updated whenever the underlying facts change. We do not accept payment in exchange for positive coverage. When an article contains affiliate links, it carries a visible Affiliate Disclosure badge at the top of the page.",
    expertise: [
      "Forex & synthetic indices",
      "Deriv & Binance platforms",
      "Technical analysis",
      "AI-assisted chart review",
      "Risk management",
    ],
    credentials: [
      "10+ years combined live-market experience",
      "Independent — not employed by any broker",
      "Follows the Botvio Editorial Policy & Fact-Checking Standards",
    ],
    email: "info@botvio.live",
  },
};

export const DEFAULT_AUTHOR_SLUG = "botvio-editorial-team";

export const getAuthor = (slugOrName?: string | null): AuthorProfile => {
  if (!slugOrName) return AUTHORS[DEFAULT_AUTHOR_SLUG];
  const bySlug = AUTHORS[slugOrName];
  if (bySlug) return bySlug;
  const byName = Object.values(AUTHORS).find(
    (a) => a.name.toLowerCase() === slugOrName.toLowerCase(),
  );
  return byName || AUTHORS[DEFAULT_AUTHOR_SLUG];
};