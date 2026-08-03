import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Play,
  Rocket,
  Coins,
  TrendingUp,
  Bitcoin,
  Trophy,
  ShieldCheck,
  ImageIcon,
  Send,
  MessageCircle,
  Sparkles,
  LineChart,
  Bell,
  Zap,
  Clock,
  Target,
  Shield,
} from "lucide-react";
import { Link } from "react-router-dom";

const DERIV_URL =
  "https://track.deriv.com/_a_gq1w0BG0D1hit6RV3zsGNd7ZgqdRLk/1/";
const EXNESS_URL = "https://one.exness-track.com/a/ts1kvs1k";
const WELTRADE_URL = "https://gowt.net/ib67505";
const BINANCE_URL = "https://accounts.binance.com/register?ref=42924116";
const BYBIT_URL = "https://www.bybit.com/invite?ref=BOTVIO";
const FTMO_URL = "https://trader.ftmo.com/?affiliates=botvio";
const MFF_URL = "https://myforexfunds.com/?ref=botvio";

interface GuideSection {
  id: string;
  name: string;
  tagline: string;
  Icon: typeof Rocket;
  iconClass: string;
  borderClass: string;
  badge: string;
  signupUrl: string;
  ctaLabel: string;
  image: string;
  steps: string[];
  videos: { title: string; url: string }[];
  /**
   * Optional picture-guide screenshots for SEO + visual walkthrough.
   * Add objects like: { src: "/guides/deriv-step-1.png", caption: "Sign up screen" }
   * Place files in `public/guides/` so they resolve from the site root.
   */
  imageGuides?: { src: string; caption: string }[];
}

const SECTIONS: GuideSection[] = [
  {
    id: "deriv",
    name: "Deriv",
    tagline: "Synthetic indices, forex & 24/7 markets",
    Icon: Rocket,
    iconClass: "text-primary",
    borderClass: "border-primary/40",
    badge: "Most Recommended",
    signupUrl: DERIV_URL,
    ctaLabel: "Open Deriv Account",
    image:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=70",
    steps: [
      'Visit the Deriv website and tap "Sign Up"',
      "Register using Email, Google, or Facebook",
      "Verify your email address using the link sent to your inbox",
      "Create a secure password (min 8 chars, upper + lower + number)",
      "Fill in your personal details (name, country, phone)",
      "Complete KYC verification: upload ID + proof of address",
      "Choose a Demo or Real account (Standard / Synthetic / MT5)",
      "Deposit funds via card, Skrill, USDT or local payment",
      "Practice on the Demo account before going live",
    ],
    videos: [
      { title: "How to Open a Deriv Account (Full Walkthrough)", url: "https://www.youtube.com/watch?v=Y0H2WgRkV9o" },
      { title: "Deriv MT5 Setup for Beginners", url: "https://www.youtube.com/watch?v=ZQX4t9c4Vw0" },
    ],
    imageGuides: [
      // Drop screenshots into public/guides/ and reference them here:
      // { src: "/guides/deriv-1-signup.png", caption: "Step 1 — Sign Up form" },
      // { src: "/guides/deriv-2-verify.png", caption: "Step 2 — Email verification" },
    ],
  },
  {
    id: "exness",
    name: "Exness",
    tagline: "Tight-spread gold, forex & metals",
    Icon: Coins,
    iconClass: "text-warning",
    borderClass: "border-warning/40",
    badge: "Lowest Spreads",
    signupUrl: EXNESS_URL,
    ctaLabel: "Open Exness Account",
    image:
      "https://images.unsplash.com/photo-1620266757065-5814239881fd?auto=format&fit=crop&w=1200&q=70",
    steps: [
      "Go to the Exness registration page",
      "Select your country and enter your email",
      "Create a strong password and continue",
      "Choose your account type (Standard recommended for beginners)",
      "Verify your phone number via SMS code",
      "Upload your government-issued ID for KYC",
      "Upload proof of address (bank statement / utility bill)",
      "Fund your account via card, crypto or local bank",
      "Download MT4 / MT5 and log in with your credentials",
    ],
    videos: [
      { title: "Exness Registration & Verification Guide", url: "https://www.youtube.com/watch?v=8mP4xQ1n3vY" },
      { title: "Deposit & Withdraw on Exness", url: "https://www.youtube.com/watch?v=YOMcD8oXyfM" },
    ],
    imageGuides: [
      // { src: "/guides/exness-1-signup.png", caption: "Exness signup page" },
    ],
  },
  {
    id: "weltrade",
    name: "Weltrade",
    tagline: "Syntx, PainX & GainX exclusive indices",
    Icon: TrendingUp,
    iconClass: "text-info",
    borderClass: "border-info/40",
    badge: "Exclusive Indices",
    signupUrl: WELTRADE_URL,
    ctaLabel: "Open Weltrade Account",
    image:
      "https://images.unsplash.com/photo-1642790551116-18e150f248e3?auto=format&fit=crop&w=1200&q=70",
    steps: [
      "Visit the Weltrade signup page",
      "Enter your full name, email and phone number",
      "Set a secure password and confirm your country",
      "Verify your email through the confirmation link",
      "Open a new trading account (Pro / Premium / Crypto)",
      "Submit KYC documents (ID + selfie + proof of address)",
      "Fund your account via card, crypto, or e-wallet",
      "Download MT4 / MT5 and log in",
      "Subscribe to Syntx / PainX / GainX in the platform",
    ],
    videos: [
      { title: "Weltrade Account Opening (Step by Step)", url: "https://www.youtube.com/watch?v=Q1m2pH7s9aE" },
      { title: "How to Trade Syntx on Weltrade", url: "https://www.youtube.com/watch?v=lqJpJxF7hH4" },
    ],
    imageGuides: [
      // { src: "/guides/weltrade-1-signup.png", caption: "Weltrade signup form" },
    ],
  },
  {
    id: "crypto",
    name: "Crypto Accounts (Binance & Bybit)",
    tagline: "Spot, futures & USDT funding wallets",
    Icon: Bitcoin,
    iconClass: "text-warning",
    borderClass: "border-warning/40",
    badge: "USDT Ready",
    signupUrl: BINANCE_URL,
    ctaLabel: "Open Binance Account",
    image:
      "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=1200&q=70",
    steps: [
      "Pick an exchange — Binance (most liquidity) or Bybit (great for futures)",
      "Sign up with email or phone — use a strong password and 2FA",
      "Verify identity (KYC): passport / national ID + selfie",
      "Enable Google Authenticator for security",
      "Buy USDT with card, P2P or local bank transfer",
      "Transfer USDT to your Spot or Futures wallet",
      "Subscribe to Botvio Binance signals for entries & exits",
      "Use only 1–2% of capital per trade",
      "Withdraw profits to your bank or wallet weekly",
    ],
    videos: [
      { title: "Binance Account Setup & KYC", url: "https://www.youtube.com/watch?v=t_T8FfBl1lY" },
      { title: "Bybit Futures for Beginners", url: "https://www.youtube.com/watch?v=GU7lQ9R9ESs" },
    ],
    imageGuides: [
      // { src: "/guides/binance-1-signup.png", caption: "Binance signup screen" },
      // { src: "/guides/bybit-1-signup.png", caption: "Bybit signup screen" },
    ],
  },
  {
    id: "funded",
    name: "Funded / Prop Firm Accounts",
    tagline: "Trade firm capital — keep up to 90% profit",
    Icon: Trophy,
    iconClass: "text-primary",
    borderClass: "border-primary/40",
    badge: "Prop Trading",
    signupUrl: FTMO_URL,
    ctaLabel: "Start FTMO Challenge",
    image:
      "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=70",
    steps: [
      "Choose a prop firm — FTMO, MyForexFunds, FundedNext or The5ers",
      "Pick your account size ($10k → $200k+)",
      "Pay the one-time evaluation fee (refunded on payout)",
      "Pass Phase 1: hit profit target (usually 8–10%) without breaking rules",
      "Pass Phase 2: lower target (4–5%) — proves consistency",
      "Sign the trader agreement to receive a funded account",
      "Trade with firm capital — follow daily/max drawdown rules",
      "Withdraw profits monthly (typically 80–90% split)",
      "Scale your account by hitting consistent profit milestones",
    ],
    videos: [
      { title: "FTMO Challenge: How to Pass First Try", url: "https://www.youtube.com/watch?v=A9aS5ZJjQjI" },
      { title: "Best Prop Firms in 2025 Compared", url: "https://www.youtube.com/watch?v=8M6cT0p2nJg" },
    ],
    imageGuides: [
      // { src: "/guides/ftmo-1-dashboard.png", caption: "FTMO dashboard overview" },
    ],
  },
];

const TOC_ITEMS = SECTIONS.map((s) => ({ id: s.id, name: s.name, Icon: s.Icon }));

const SOCIAL_LINKS = [
  {
    name: "Telegram",
    Icon: Send,
    url: "https://t.me/boaborea",
    handle: "@boaborea",
    color: "text-info",
    border: "border-info/40",
  },
  {
    name: "WhatsApp Channel",
    Icon: MessageCircle,
    url: "https://whatsapp.com/channel/0029VbAfFXbIT6Kbng6ypX0V",
    handle: "Follow channel",
    color: "text-success",
    border: "border-success/40",
  },
];

const BeginnerGuide = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Beginner Guide: How to Create a Trading Account | Botvio"
        description="Step-by-step guide to opening a Deriv, Exness, Weltrade, crypto exchange, and funded prop-firm account. Includes images and YouTube tutorials."
        ogType="article"
      />

      <div className="container max-w-5xl mx-auto px-4 py-6 space-y-6">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </Link>

        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-background to-warning/10 p-6 md:p-8">
          <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 border border-primary/40">
            <BookOpen className="h-3 w-3 text-primary" />
            <span className="text-[9px] font-bold text-primary uppercase tracking-wide">Beginner Guide</span>
          </div>
          <p className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">📘 Step-by-Step</p>
          <h1 className="text-2xl md:text-4xl font-black leading-tight mt-2">
            How to Create a Trading Account
          </h1>
          <p className="text-sm text-muted-foreground mt-3 max-w-2xl">
            Complete beginner-friendly walkthroughs for Deriv, Exness, Weltrade, crypto exchanges, and funded prop firms. Watch the YouTube videos for each broker and follow every step.
          </p>
        </div>

        {/* Table of contents */}
        <Card className="glass-card border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              What you'll learn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {TOC_ITEMS.map(({ id, name, Icon }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="flex items-center gap-2 p-2 rounded-md border border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-xs font-semibold leading-tight truncate">{name}</span>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sections */}
        {SECTIONS.map((section) => {
          const { Icon } = section;
          return (
            <Card
              key={section.id}
              id={section.id}
              className={`glass-card ${section.borderClass} overflow-hidden scroll-mt-20`}
            >
              <div className="relative aspect-[16/6] bg-muted overflow-hidden">
                <img
                  src={section.image}
                  alt={`${section.name} trading account setup`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                <Badge className={`absolute top-3 right-3 text-[10px] font-bold border bg-background/80 backdrop-blur-sm ${section.iconClass} ${section.borderClass}`}>
                  {section.badge}
                </Badge>
              </div>

              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-background border ${section.borderClass}`}>
                    <Icon className={`h-5 w-5 ${section.iconClass}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{section.name}</CardTitle>
                    <CardDescription className="text-xs">{section.tagline}</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Steps */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-2">
                    Step-by-step
                  </p>
                  <ol className="space-y-1.5">
                    {section.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <span className={`flex-shrink-0 w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5`}>
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Videos */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-2">
                    Watch on YouTube
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {section.videos.map((v) => (
                      <a
                        key={v.url}
                        href={v.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 p-2.5 rounded-md border border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
                      >
                        <div className="p-1.5 rounded-md bg-destructive/15 border border-destructive/30 flex-shrink-0">
                          <Play className="h-3.5 w-3.5 text-destructive fill-destructive" />
                        </div>
                        <span className="text-xs font-semibold leading-tight">{v.title}</span>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Picture guide gallery */}
                {section.imageGuides && section.imageGuides.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                      <ImageIcon className="h-3 w-3" />
                      Picture Guide
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {section.imageGuides.map((img, i) => (
                        <figure
                          key={i}
                          className="rounded-md overflow-hidden border border-border bg-muted"
                        >
                          <img
                            src={img.src}
                            alt={`${section.name} guide — ${img.caption}`}
                            loading="lazy"
                            className="w-full h-28 object-cover"
                          />
                          <figcaption className="px-2 py-1.5 text-[10px] text-muted-foreground leading-tight">
                            {img.caption}
                          </figcaption>
                        </figure>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA */}
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <Button variant="gold" size="sm" className="flex-1" asChild>
                    <a href={section.signupUrl} target="_blank" rel="noopener noreferrer sponsored">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                      {section.ctaLabel}
                      <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                    </a>
                  </Button>
                  {section.id === "crypto" && (
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <a href={BYBIT_URL} target="_blank" rel="noopener noreferrer sponsored">
                        Open Bybit Account
                        <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                      </a>
                    </Button>
                  )}
                  {section.id === "funded" && (
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <a href={MFF_URL} target="_blank" rel="noopener noreferrer sponsored">
                        MyForexFunds Challenge
                        <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Now use Botvio — beginner workflow */}
        <Card className="glass-card border-primary/40 bg-gradient-to-br from-primary/10 via-background to-info/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-1 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">After Sign Up</span>
            </div>
            <CardTitle className="text-xl md:text-2xl">Now Use Botvio to Trade Smarter</CardTitle>
            <CardDescription className="text-xs">
              Your account is ready. Here are the 3 simple ways Botvio helps you find winning trades — no experience needed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1 — AI Chart Analysis */}
            <div className="rounded-lg border border-primary/30 bg-background/50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center">
                  <span className="text-sm font-black text-primary">1</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold">AI Chart Analysis (Upload Any Chart)</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                    Take a screenshot of any chart — forex, gold, crypto, synthetics — and upload it to Botvio.
                    Our AI reads the candles, trend, support/resistance, and momentum indicators, then tells you in plain English:
                    <strong className="text-foreground"> buy or sell, entry price, stop loss, and take profit.</strong>
                  </p>
                  <ul className="text-[11px] text-muted-foreground space-y-0.5 mb-2">
                    <li>• Works on TradingView, MT4/MT5, Deriv, or your phone screenshots</li>
                    <li>• Confidence score shows how strong the setup is</li>
                    <li>• Multi-timeframe view (1H → 4H → Daily) like a pro trader</li>
                  </ul>
                  <Button variant="gold" size="sm" asChild>
                    <Link to="/chart">
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      Try AI Chart Analysis
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Step 2 — Trading Hubs */}
            <div className="rounded-lg border border-warning/30 bg-background/50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-warning/15 border border-warning/40 flex items-center justify-center">
                  <span className="text-sm font-black text-warning">2</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <LineChart className="h-4 w-4 text-warning" />
                    <h3 className="text-sm font-bold">Trading Hubs — Live Signals by Asset</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                    Each asset has its own hub — Gold, Bitcoin, EUR/USD, GBP/USD, Boom & Crash, Volatility indices, and more.
                    Open a hub to see <strong className="text-foreground">live price, AI-generated signal, win-rate, and the exact trade plan</strong> for that market right now.
                  </p>
                  <ul className="text-[11px] text-muted-foreground space-y-0.5 mb-2">
                    <li>• Signals refresh automatically every few minutes</li>
                    <li>• Built-in chart so you can verify before you trade</li>
                    <li>• Hauxa strategy overlay (EMA 20/50, RSI, ATR) on every signal</li>
                  </ul>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/gold-trading-hub">Gold Hub</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/bitcoin-trading-hub">Bitcoin Hub</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/synthetic">Synthetic Hub</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 — Home signals feed */}
            <div className="rounded-lg border border-info/30 bg-background/50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-info/15 border border-info/40 flex items-center justify-center">
                  <span className="text-sm font-black text-info">3</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Bell className="h-4 w-4 text-info" />
                    <h3 className="text-sm font-bold">Follow Signals on the Home Page</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                    Don't want to upload charts or pick a hub? Just open the Botvio home page.
                    Every signal posted by our team and AI appears in the live feed —
                    <strong className="text-foreground"> buy/sell direction, entry, SL, TP, and reasoning.</strong>
                    Copy the trade into your broker (Deriv, Exness, Weltrade, Binance) and you're done.
                  </p>
                  <ul className="text-[11px] text-muted-foreground space-y-0.5 mb-2">
                    <li>• Free signals visible to everyone — no setup needed</li>
                    <li>• Win / Loss / Running tags so you can track performance</li>
                    <li>• Optional WhatsApp & Telegram alerts the second a signal drops</li>
                  </ul>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/signals">
                      <Bell className="h-3.5 w-3.5 mr-1.5" />
                      View Live Signals
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Why Botvio */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-primary" />
                Why Beginners Choose Botvio
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { Icon: Zap, title: "No experience needed", desc: "AI does the analysis — you just follow the trade plan." },
                  { Icon: Target, title: "Clear entry, SL & TP", desc: "Every signal is complete — no guesswork on where to enter or exit." },
                  { Icon: Clock, title: "Saves hours daily", desc: "Skip 100s of charts — Botvio scans markets 24/7 for you." },
                  { Icon: Shield, title: "Risk-managed", desc: "Built-in lockouts after losses keep your account safe." },
                  { Icon: LineChart, title: "Works on any broker", desc: "Deriv, Exness, Weltrade, Binance, MT4/MT5 — all supported." },
                  { Icon: Sparkles, title: "Multi-market coverage", desc: "Forex, gold, crypto, synthetics & stocks in one place." },
                ].map(({ Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-2">
                    <Icon className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold leading-tight">{title}</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social media links */}
        <Card className="glass-card border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" />
              Follow Botvio for Daily Signals & Tutorials
            </CardTitle>
            <CardDescription className="text-xs">
              Join our community across every platform — free signals, account setup help, and live trading sessions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {SOCIAL_LINKS.map(({ name, Icon, url, handle, color, border }) => (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2.5 p-2.5 rounded-md border ${border} hover:bg-primary/5 transition-all`}
                >
                  <Icon className={`h-4 w-4 flex-shrink-0 ${color}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold leading-tight truncate">{name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{handle}</p>
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        <p className="text-[10px] text-muted-foreground text-center py-4">
          ⚠️ Trading involves risk. Capital is at risk. Some links contain affiliate referrals which support Botvio at no cost to you.
        </p>
      </div>
    </div>
  );
};

export default BeginnerGuide;
