/**
 * Botvio global information architecture (Phase 1 of the platform redesign).
 * Single source of truth for the desktop header, mobile menu and bottom nav.
 * Only routes that already exist in AppRoutes are referenced here.
 */
import {
  BarChart3,
  Bot,
  BookOpen,
  Calculator,
  ChartCandlestick,
  Coins,
  GraduationCap,
  Layers,
  LineChart,
  Newspaper,
  ScanSearch,
  Shield,
  Signal,
  Sparkles,
  Users,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon?: LucideIcon;
  description?: string;
}

export interface NavGroup {
  label: string;
  icon: LucideIcon;
  to?: string;
  items?: NavItem[];
}

/**
 * Primary desktop navigation — the seven Botvio pillars plus Blog.
 * Markets · Signals · Trade · Copy Trading · AI · Tools · Learn
 */
export const PRIMARY_NAV: NavGroup[] = [
  {
    label: "Markets",
    icon: BarChart3,
    to: "/markets",
    items: [
      { label: "All Markets", to: "/markets", icon: BarChart3, description: "Live prices, trend & signal per market" },
      { label: "Gold (XAU/USD)", to: "/gold", icon: Coins, description: "Commodities hub" },
      { label: "Silver (XAG/USD)", to: "/silver", icon: Coins },
      { label: "EUR/USD", to: "/eur-usd", icon: LineChart, description: "Forex & CFDs" },
      { label: "GBP/USD", to: "/gbp-usd", icon: LineChart },
      { label: "USD/JPY", to: "/usd-jpy", icon: LineChart },
      { label: "US30 · NAS100 · GER40", to: "/us30", icon: BarChart3, description: "Index CFD hubs" },
      { label: "Bitcoin (BTC/USD)", to: "/bitcoin", icon: Coins, description: "Crypto" },
      { label: "Crypto Markets", to: "/markets/crypto", icon: Coins },
      { label: "Deriv Synthetic Indices", to: "/synthetic", icon: Layers, description: "Volatility, Boom, Crash, Jump" },
      { label: "Weltrade Markets", to: "/weltrade", icon: Layers },
    ],
  },
  {
    label: "Signals",
    icon: Signal,
    to: "/signals",
    items: [
      { label: "Signals Center", to: "/signals", icon: Signal, description: "Every market in one feed" },
      { label: "Forex & CFD Signals", to: "/signals?market=forex", icon: LineChart },
      { label: "Synthetic Signals", to: "/signals?market=synthetics", icon: Layers },
      { label: "Options Signals", to: "/binary-options", icon: ChartCandlestick },
      { label: "Binance Signals", to: "/signals?market=binance", icon: Coins },
      { label: "Weltrade Signals", to: "/weltrade", icon: Layers },
      { label: "Authority AI Signals", to: "/authority-signals", icon: Sparkles },
      { label: "Signal History", to: "/signals/history", icon: Newspaper },
    ],
  },
  {
    label: "Trade",
    icon: ChartCandlestick,
    to: "/trading",
    items: [
      { label: "Trading Workspace", to: "/trading", icon: ChartCandlestick, description: "CFD execution & open trades" },
      { label: "Trade Options", to: "/deriv-options", icon: Zap, description: "Deriv contract selector" },
      { label: "Rise & Fall", to: "/rise-fall", icon: LineChart },
      { label: "Deriv App", to: "/deriv-app", icon: Bot },
      { label: "Synthetic Trading", to: "/synthetic", icon: Layers },
      { label: "Binance Hub", to: "/binance", icon: Coins },
      { label: "Trade Modes", to: "/trade-modes", icon: Layers },
      { label: "Connections", to: "/connections", icon: Shield, description: "Brokers & accounts" },
    ],
  },
  {
    label: "Copy Trading",
    icon: Users,
    to: "/copy-trading",
    items: [
      { label: "Copy Marketplace", to: "/copy-trading", icon: Users, description: "Verified providers & performance" },
      { label: "My Copy Trading", to: "/copy-trading/my", icon: BarChart3, description: "Active strategies & copy status" },
      { label: "Become a Provider", to: "/copy-trading/become-provider", icon: Users },
      { label: "Provider Dashboard", to: "/provider-dashboard", icon: BarChart3 },
      { label: "My Trades", to: "/trade-history", icon: Newspaper },
      { label: "P2P Trading", to: "/p2p", icon: Users },
    ],
  },
  {
    label: "AI",
    icon: Sparkles,
    to: "/chart/XAUUSD",
    items: [
      { label: "AI Chart Analysis", to: "/chart/XAUUSD", icon: ScanSearch, description: "Upload a chart, get structured analysis" },
      { label: "AI Signal Analysis", to: "/authority-signals", icon: Sparkles },
      { label: "Market Scanner", to: "/market-analysis", icon: ScanSearch },
      { label: "Strategies", to: "/strategies", icon: Layers },
    ],
  },
  {
    label: "Tools",
    icon: Wrench,
    to: "/tools",
    items: [
      { label: "All Trading Tools", to: "/tools", icon: Wrench, description: "Calculators, sessions & calendar" },
      { label: "Economic Calendar", to: "/news-calendar", icon: Newspaper },
      { label: "Trade Modes", to: "/trade-modes", icon: Calculator },
      { label: "Flipping Challenges", to: "/flipping-challenges", icon: Zap },
      { label: "Marketplace", to: "/marketplace", icon: Layers },
      { label: "Performance Transparency", to: "/performance-transparency", icon: BarChart3 },
    ],
  },
  {
    label: "Learn",
    icon: GraduationCap,
    to: "/learn",
    items: [
      { label: "Start Here", to: "/learning-paths", icon: GraduationCap, description: "Guided learning paths" },
      { label: "Academy", to: "/learn", icon: BookOpen },
      { label: "Beginner Guide", to: "/beginner-guide", icon: BookOpen },
      { label: "Case Studies", to: "/case-studies", icon: Newspaper },
      { label: "Methodology", to: "/methodology", icon: Shield },
      { label: "Docs", to: "/docs", icon: BookOpen },
    ],
  },
  {
    label: "Blog",
    icon: Newspaper,
    to: "/blog",
  },
];


/** "More" menu — secondary and trust/legal destinations. */
export const MORE_NAV: { label: string; items: NavItem[] }[] = [
  {
    label: "Platform",
    items: [
      { label: "Brokers", to: "/brokers", icon: Shield },
      { label: "Strategies", to: "/strategies", icon: Layers },
      { label: "Marketplace", to: "/marketplace", icon: Layers },
      { label: "Pricing & Plans", to: "/billing", icon: Coins },

      { label: "Live Feed", to: "/live", icon: Zap },
      { label: "Affiliate Program", to: "/affiliate", icon: Users },
      { label: "Install App", to: "/install", icon: Bot },
    ],
  },
  {
    label: "Company & Support",
    items: [
      { label: "About Botvio", to: "/about", icon: BookOpen },
      { label: "Contact", to: "/contact", icon: BookOpen },
      { label: "FAQ", to: "/faq", icon: BookOpen },
      { label: "Testimonials", to: "/testimonials", icon: Users },
      { label: "Press", to: "/press", icon: Newspaper },
    ],
  },
  {
    label: "Trust & Legal",
    items: [
      { label: "Editorial Policy", to: "/editorial-policy", icon: Shield },
      { label: "Risk Disclosure", to: "/disclaimer", icon: Shield },
      { label: "Affiliate Disclosure", to: "/affiliate-disclosure", icon: Shield },
      { label: "Terms", to: "/terms", icon: Shield },
      { label: "Privacy", to: "/privacy", icon: Shield },
    ],
  },
];

/** Mobile bottom navigation — Markets, Signals, Trade, AI, Learn. */
export const BOTTOM_NAV: NavItem[] = [
  { label: "Markets", to: "/markets", icon: ChartCandlestick },
  { label: "Signals", to: "/signals", icon: Signal },
  { label: "Trade", to: "/trading", icon: Zap },
  { label: "AI", to: "/chart/XAUUSD", icon: Sparkles },
  { label: "Learn", to: "/learn", icon: GraduationCap },
];

