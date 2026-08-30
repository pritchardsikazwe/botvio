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

/** Primary desktop navigation, in the order required by the redesign brief. */
export const PRIMARY_NAV: NavGroup[] = [
  {
    label: "Markets",
    icon: BarChart3,
    to: "/markets",
    items: [
      { label: "All Markets", to: "/markets", icon: BarChart3, description: "Live prices, trend & signal per market" },
      { label: "US Markets", to: "/markets/us", icon: LineChart },
      { label: "Europe", to: "/markets/europe", icon: LineChart },
      { label: "Asia", to: "/markets/asia", icon: LineChart },
      { label: "Middle East", to: "/markets/middle-east", icon: LineChart },
      { label: "Africa", to: "/markets/africa", icon: LineChart },
      { label: "Crypto", to: "/markets/crypto", icon: Coins },
      { label: "Synthetic Indices", to: "/synthetic", icon: Layers },
    ],
  },
  {
    label: "Signals",
    icon: Signal,
    to: "/signals",
    items: [
      { label: "Live Signals", to: "/signals", icon: Signal, description: "Forex, CFDs, Gold, Crypto & Synthetic" },
      { label: "Signal History", to: "/signals/history", icon: Newspaper },
      { label: "Authority AI Signals", to: "/authority-signals", icon: Sparkles },
      { label: "Synthetic Signals", to: "/synthetic", icon: Layers },
      { label: "Binary Options", to: "/binary-options", icon: ChartCandlestick },
    ],
  },
  {
    label: "Copy Trading",
    icon: Users,
    to: "/providers",
    items: [
      { label: "Discover Providers", to: "/providers", icon: Users, description: "Verified traders & performance" },
      { label: "Provider Dashboard", to: "/provider-dashboard", icon: BarChart3 },
      { label: "My Trades", to: "/trade-history", icon: Newspaper },
    ],
  },
  {
    label: "Deriv Options",
    icon: Zap,
    to: "/deriv-options",
    items: [
      { label: "Options Workspace", to: "/deriv-options", icon: Zap },
      { label: "Rise & Fall", to: "/rise-fall", icon: LineChart },
      { label: "Deriv App", to: "/deriv-app", icon: Bot },
      { label: "Trade Modes", to: "/trade-modes", icon: Layers },
      { label: "Connections", to: "/connections", icon: Shield },
    ],
  },
  {
    label: "Binance",
    icon: Coins,
    to: "/binance",
    items: [
      { label: "Binance Hub", to: "/binance", icon: Coins },
      { label: "Crypto Markets", to: "/markets/crypto", icon: LineChart },
      { label: "Trading Bots", to: "/bots/binance", icon: Bot },
      { label: "Binance Settings", to: "/settings/binance", icon: Wrench },
    ],
  },
  {
    label: "Trading Hubs",
    icon: ChartCandlestick,
    to: "/markets",
    items: [
      { label: "Gold (XAU/USD)", to: "/gold", icon: Coins },
      { label: "Silver (XAG/USD)", to: "/silver", icon: Coins },
      { label: "Bitcoin (BTC/USD)", to: "/bitcoin", icon: Coins },
      { label: "EUR/USD", to: "/eur-usd", icon: LineChart },
      { label: "GBP/USD", to: "/gbp-usd", icon: LineChart },
      { label: "USD/JPY", to: "/usd-jpy", icon: LineChart },
      { label: "US30 (Dow)", to: "/us30", icon: BarChart3 },
      { label: "NAS100 (Nasdaq)", to: "/nas100", icon: BarChart3 },
      { label: "GER40 (DAX)", to: "/ger40", icon: BarChart3 },
      { label: "Synthetic Markets", to: "/synthetic", icon: Layers },
      { label: "Weltrade Hub", to: "/weltrade", icon: Layers },
    ],
  },
  {
    label: "AI Tools",
    icon: Sparkles,
    to: "/authority-signals",
    items: [
      { label: "AI Chart Analysis", to: "/chart/XAUUSD", icon: ScanSearch, description: "Upload a chart, get structured analysis" },
      { label: "AI Signal Analysis", to: "/authority-signals", icon: Sparkles },
      { label: "Market Scanner", to: "/market-analysis", icon: ScanSearch },
      { label: "Trading Workspace", to: "/trading", icon: ChartCandlestick },
    ],
  },
  {
    label: "Tools",
    icon: Wrench,
    to: "/trade-modes",
    items: [
      { label: "Strategies", to: "/strategies", icon: Layers },
      { label: "Trade Modes", to: "/trade-modes", icon: Calculator },
      { label: "Economic Calendar", to: "/news-calendar", icon: Newspaper },
      { label: "Flipping Challenges", to: "/flipping-challenges", icon: Zap },
      { label: "P2P Trading", to: "/p2p", icon: Users },
      { label: "Marketplace", to: "/marketplace", icon: Layers },
    ],
  },
  {
    label: "Education",
    icon: GraduationCap,
    to: "/learn",
    items: [
      { label: "Start Here", to: "/learning-paths", icon: GraduationCap, description: "Guided learning paths" },
      { label: "Academy", to: "/learn", icon: BookOpen },
      { label: "Beginner Guide", to: "/beginner-guide", icon: BookOpen },
      { label: "Case Studies", to: "/case-studies", icon: Newspaper },
      { label: "Docs", to: "/docs", icon: BookOpen },
    ],
  },
  {
    label: "Research",
    icon: LineChart,
    to: "/market-analysis",
    items: [
      { label: "Market Analysis", to: "/market-analysis", icon: LineChart },
      { label: "News & Calendar", to: "/news-calendar", icon: Newspaper },
      { label: "Methodology", to: "/methodology", icon: Shield },
      { label: "Performance Transparency", to: "/performance-transparency", icon: BarChart3 },
      { label: "Whitepaper", to: "/whitepaper", icon: BookOpen },
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

/** Mobile bottom navigation. */
export const BOTTOM_NAV: NavItem[] = [
  { label: "Home", to: "/", icon: BarChart3 },
  { label: "Markets", to: "/markets", icon: ChartCandlestick },
  { label: "Signals", to: "/signals", icon: Signal },
  { label: "AI", to: "/authority-signals", icon: Sparkles },
];
