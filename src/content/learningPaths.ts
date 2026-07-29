/**
 * Curated free learning curriculum. Each path is an ordered list of steps
 * pointing at existing lessons, blog posts, or hubs. No new backend needed —
 * progress is stored client-side in localStorage.
 */

export interface LearningStep {
  title: string;
  summary: string;
  href: string;
  estMinutes: number;
}

export interface LearningPath {
  slug: string;
  title: string;
  tagline: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  outcome: string;
  prerequisites: string;
  totalHours: number;
  steps: LearningStep[];
  nextPathSlug?: string;
}

export const learningPaths: LearningPath[] = [
  {
    slug: "forex-from-zero",
    title: "Forex From Zero",
    tagline: "Absolute beginner? Start here. Learn how forex actually works before risking a cent.",
    level: "Beginner",
    outcome:
      "Place your first structured demo trade with a written plan, a defined stop-loss, and a journaling habit.",
    prerequisites: "None. A laptop or phone and 4–6 hours across a week is enough.",
    totalHours: 6,
    steps: [
      {
        title: "What forex actually is",
        summary:
          "How currency pairs, quotes, and the interbank market work — in plain English.",
        href: "/forex-beginner-guide",
        estMinutes: 25,
      },
      {
        title: "Pips, lots and leverage explained",
        summary:
          "The three numbers every beginner mis-uses. Understand them before opening any account.",
        href: "/blog",
        estMinutes: 20,
      },
      {
        title: "Choose a regulated broker & open a demo",
        summary:
          "How to compare regulation, spreads, and platforms without falling for affiliate hype.",
        href: "/brokers",
        estMinutes: 30,
      },
      {
        title: "Install MT5 and place your first demo trade",
        summary:
          "Step-by-step walkthrough of buying and selling on a demo account safely.",
        href: "/install",
        estMinutes: 40,
      },
      {
        title: "Risk management: the 1% rule",
        summary:
          "Position sizing math and why professional traders limit risk per trade.",
        href: "/blog",
        estMinutes: 30,
      },
      {
        title: "Build a simple trading journal",
        summary:
          "The single habit that separates hobbyists from consistent traders.",
        href: "/blog",
        estMinutes: 25,
      },
      {
        title: "Trading psychology basics",
        summary:
          "Fear, greed, revenge trading — and the pre-trade checklist that keeps them contained.",
        href: "/blog",
        estMinutes: 30,
      },
      {
        title: "First live trade checklist",
        summary:
          "You are ready when you can tick every box: written plan, defined risk, journaled outcome.",
        href: "/methodology",
        estMinutes: 20,
      },
    ],
    nextPathSlug: "strategy-builder",
  },
  {
    slug: "strategy-builder",
    title: "Strategy Builder",
    tagline:
      "Take the concepts from the beginner path and turn them into a repeatable, testable strategy.",
    level: "Intermediate",
    outcome:
      "A documented, back-tested strategy you can execute the same way on Monday morning as on Friday afternoon.",
    prerequisites:
      "Comfort with MT5/TradingView, understanding of risk-per-trade, and at least 20 demo trades journaled.",
    totalHours: 9,
    steps: [
      {
        title: "Introduction to Smart Money Concepts",
        summary: "Order flow, liquidity, and why institutions trade differently to retail.",
        href: "/blog",
        estMinutes: 35,
      },
      {
        title: "Supply & demand zones",
        summary: "How to mark high-probability zones without curve-fitting the past.",
        href: "/blog",
        estMinutes: 40,
      },
      {
        title: "Order blocks & imbalances",
        summary: "Identifying institutional footprints on the chart with clear rules.",
        href: "/blog",
        estMinutes: 40,
      },
      {
        title: "Liquidity, sweeps & stop-hunts",
        summary: "Why price wicks past obvious levels and how to trade the reaction, not the bait.",
        href: "/blog",
        estMinutes: 35,
      },
      {
        title: "Session timing (London, New York, Asia)",
        summary: "When each pair actually moves and when to stay flat.",
        href: "/blog",
        estMinutes: 30,
      },
      {
        title: "XAUUSD (Gold) market structure",
        summary: "Reading Gold on the 4H and 1H — the same framework the desk uses for signals.",
        href: "/gold-trading-hub",
        estMinutes: 45,
      },
      {
        title: "Backtesting: manual and rule-based",
        summary: "The 100-trade sample rule and how to log results honestly.",
        href: "/blog",
        estMinutes: 45,
      },
      {
        title: "Write your one-page trading plan",
        summary: "Entry, invalidation, size, exit, review cadence — no more, no less.",
        href: "/methodology",
        estMinutes: 30,
      },
    ],
    nextPathSlug: "prop-firm-systematic",
  },
  {
    slug: "prop-firm-systematic",
    title: "Prop Firm & Systematic Trading",
    tagline:
      "For traders who can already execute a plan. This path is about scaling, capital efficiency, and removing yourself from the seat.",
    level: "Advanced",
    outcome:
      "Ability to pass a funded-account evaluation, or run a systematic Deriv/MT5 strategy with disciplined review cycles.",
    prerequisites:
      "You already trade a written plan, know your win-rate, and understand drawdown as more than a scary word.",
    totalHours: 10,
    steps: [
      {
        title: "How prop firms actually make money",
        summary: "Business model, evaluation math, and the metrics they really care about.",
        href: "/blog",
        estMinutes: 30,
      },
      {
        title: "Max drawdown math for evaluations",
        summary: "Daily vs total drawdown, trailing vs static — the rules that fail most candidates.",
        href: "/blog",
        estMinutes: 35,
      },
      {
        title: "Currency correlations & concentration risk",
        summary: "Why three trades can secretly be one bet, and how to avoid it.",
        href: "/blog",
        estMinutes: 30,
      },
      {
        title: "Position sizing models beyond 1%",
        summary: "Fixed fractional, Kelly-lite, volatility targeting — trade-offs of each.",
        href: "/blog",
        estMinutes: 40,
      },
      {
        title: "Systematic trading on Deriv indices",
        summary: "Building a rules-based approach to Boom, Crash and Volatility markets.",
        href: "/synthetic-indices",
        estMinutes: 45,
      },
      {
        title: "Working with algorithmic signals",
        summary: "How to consume, filter and audit signals without becoming a copy-paste trader.",
        href: "/methodology",
        estMinutes: 35,
      },
      {
        title: "Weekly & monthly review cycles",
        summary: "The two-hour Sunday review that compounds more than any indicator.",
        href: "/blog",
        estMinutes: 40,
      },
      {
        title: "Going full-time: expectations vs reality",
        summary: "Runway, taxes, isolation, and the psychological side no course talks about.",
        href: "/blog",
        estMinutes: 40,
      },
    ],
  },
];

export const learningPathBySlug = (slug: string) =>
  learningPaths.find((p) => p.slug === slug);