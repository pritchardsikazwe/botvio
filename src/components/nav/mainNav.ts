/** Botvio 2026 customer-facing information architecture. Keep underlying routes and engines intact; expose simple product entry points. */
import {
  BarChart3, Bot, BookOpen, ChartCandlestick, Coins, GraduationCap, Layers,
  LineChart, Newspaper, ScanSearch, Shield, Signal, Sparkles, Users, Wrench,
  Zap, type LucideIcon,
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

export const PRIMARY_NAV: NavGroup[] = [
  {
    label: "Markets", icon: BarChart3, to: "/markets",
    items: [
      { label: "All Markets", to: "/markets", icon: BarChart3 },
      { label: "Gold (XAU/USD)", to: "/gold", icon: Coins },
      { label: "Forex", to: "/eur-usd", icon: LineChart },
      { label: "Indices", to: "/us30", icon: BarChart3 },
      { label: "Bitcoin & Crypto", to: "/bitcoin", icon: Coins },
      { label: "Synthetic Indices", to: "/synthetic", icon: Layers },
      { label: "Weltrade Markets", to: "/weltrade", icon: Layers },
    ],
  },
  {
    label: "Signals", icon: Signal, to: "/signals",
    items: [
      { label: "Signals Center", to: "/signals", icon: Signal },
      { label: "Forex & CFD Signals", to: "/signals?market=forex", icon: LineChart },
      { label: "Synthetic Signals", to: "/signals?market=synthetics", icon: Layers },
      { label: "Options Signals", to: "/rise-fall", icon: ChartCandlestick },
      { label: "Signal History", to: "/signals/history", icon: Newspaper },
    ],
  },
  {
    label: "AI Bots", icon: Bot, to: "/bots",
    items: [
      { label: "Create AI Bot", to: "/bots", icon: Sparkles, description: "One simple guided bot setup" },
      { label: "My Bots", to: "/bots", icon: Bot },
      { label: "Advanced Bot Details", to: "/bot-detail", icon: Wrench },
    ],
  },
  {
    label: "Copy Trading", icon: Users, to: "/copy-trading",
    items: [
      { label: "Copy Marketplace", to: "/copy-trading", icon: Users },
      { label: "My Copy Trading", to: "/copy-trading/my", icon: BarChart3 },
      { label: "Become a Provider", to: "/copy-trading/become-provider", icon: Users },
      { label: "Provider Dashboard", to: "/provider-dashboard", icon: BarChart3 },
      { label: "Botvio Robot", to: "/botvio-robot", icon: Bot },
    ],
  },
  {
    label: "DERIV", icon: Zap, to: "/rise-fall",
    items: [
      { label: "Options", to: "/rise-fall", icon: ChartCandlestick, description: "Rise/Fall signals and automation" },
      { label: "MT5 / CFDs", to: "/connections", icon: LineChart, description: "Normal MT5 account onboarding" },
      { label: "Synthetic Markets", to: "/synthetic", icon: Layers },
      { label: "Connect Deriv", to: "/connections", icon: Shield },
    ],
  },
  {
    label: "AI", icon: Sparkles, to: "/chart/XAUUSD",
    items: [
      { label: "AI Chart Analysis", to: "/chart/XAUUSD", icon: ScanSearch },
      { label: "AI Signal Analysis", to: "/authority-signals", icon: Sparkles },
      { label: "Market Scanner", to: "/market-analysis", icon: ScanSearch },
      { label: "Strategies", to: "/strategies", icon: Layers },
    ],
  },
  {
    label: "Learn", icon: GraduationCap, to: "/learn",
    items: [
      { label: "Start Here", to: "/learning-paths", icon: GraduationCap },
      { label: "Academy", to: "/learn", icon: BookOpen },
      { label: "Beginner Guide", to: "/beginner-guide", icon: BookOpen },
      { label: "Methodology", to: "/methodology", icon: Shield },
      { label: "Docs", to: "/docs", icon: BookOpen },
    ],
  },
];

export const MORE_NAV: { label: string; items: NavItem[] }[] = [
  {
    label: "Trading & Tools",
    items: [
      { label: "Trading Workspace", to: "/trading", icon: ChartCandlestick },
      { label: "Market & News Trader Hub", to: "/news-trader-hub", icon: ScanSearch },
      { label: "Economic Calendar", to: "/news-calendar", icon: Newspaper },
      { label: "Marketplace", to: "/marketplace", icon: Layers },
      { label: "Performance Transparency", to: "/performance-transparency", icon: BarChart3 },
      { label: "Connections", to: "/connections", icon: Shield },
    ],
  },
  {
    label: "Company & Support",
    items: [
      { label: "About Botvio", to: "/about", icon: BookOpen },
      { label: "Contact", to: "/contact", icon: BookOpen },
      { label: "FAQ", to: "/faq", icon: BookOpen },
      { label: "Install App", to: "/install", icon: Bot },
    ],
  },
  {
    label: "Trust & Legal",
    items: [
      { label: "Risk Disclosure", to: "/disclaimer", icon: Shield },
      { label: "Affiliate Disclosure", to: "/affiliate-disclosure", icon: Shield },
      { label: "Terms", to: "/terms", icon: Shield },
      { label: "Privacy", to: "/privacy", icon: Shield },
    ],
  },
];

export const BOTTOM_NAV: NavItem[] = [
  { label: "Markets", to: "/markets", icon: ChartCandlestick },
  { label: "Signals", to: "/signals", icon: Signal },
  { label: "AI Bots", to: "/bots", icon: Bot },
  { label: "DERIV", to: "/rise-fall", icon: Zap },
  { label: "Learn", to: "/learn", icon: GraduationCap },
];
