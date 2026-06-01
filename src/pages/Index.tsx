import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { TradingGuide, TradingHelpPanel } from "@/components/trading/TradingGuide";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap, Target, AlertTriangle, Bot, TrendingUp,
  ArrowRight, Zap, BookOpen, Package, MessageCircle,
  ExternalLink, Download, Smartphone, Sparkles, Signal,
  BarChart3, Hash, TrendingDown, Activity, Newspaper, Globe, Wifi,
  Crown, Check, Star, Brain
} from "lucide-react";
import { ChartUpload } from "@/components/signals/ChartUpload";
import { HomeSignalsWidget } from "@/components/signals/HomeSignalsWidget";
import { SignalsPerformanceTracker } from "@/components/signals/SignalsPerformanceTracker";
import { TrainingVideosGrid } from "@/components/training/TrainingVideosGrid";
import { BrokerStarterCards } from "@/components/training/BrokerStarterCards";
import { CourseEnrollmentCards } from "@/components/courses/CourseEnrollmentCards";
import { LiveTradingHubCards } from "@/components/trading/LiveTradingHubCards";
import { MoreTradingHubsList } from "@/components/trading/MoreTradingHubsList";
import { TradingHubsSidebar } from "@/components/trading/TradingHubsSidebar";
import { NotificationBanner } from "@/components/notifications/NotificationBanner";
import { NewsEventCards } from "@/components/news/NewsEventCard";
import { useNavigate, Link } from "react-router-dom";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user) {
      const seen = localStorage.getItem("botvio_onboarding_seen");
      if (!seen) setShowOnboarding(true);
    }
  }, [user]);

  const handleCloseOnboarding = () => {
    localStorage.setItem("botvio_onboarding_seen", "true");
    setShowOnboarding(false);
  };

  // Featured products (limit 4)
  const { data: featuredProducts } = useQuery({
    queryKey: ["featured-products-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .limit(2);
      if (error) throw error;
      return data;
    },
    staleTime: 60 * 1000,
  });

  const { data: dbCourses } = useQuery({
    queryKey: ["home-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("education_lessons")
        .select("category")
        .order("category");
      if (error) throw error;
      const categories = new Map<string, number>();
      data?.forEach((l) => {
        categories.set(l.category || "general", (categories.get(l.category || "general") || 0) + 1);
      });
      return Array.from(categories.entries())
        .map(([cat, count], i) => ({
          id: i,
          title: cat.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
          category: cat,
          lessons: count,
          slug: cat,
        }))
        .slice(0, 4);
    },
    staleTime: 5 * 60 * 1000,
  });

  const displayProducts = featuredProducts ?? [];
  const displayCourses = dbCourses ?? [];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead seoKey="home"
        title="Forex Signals & AI Analysis Dashboard"
        description="Free forex signals, AI chart analysis, gold trading mentorship, Deriv signals, Exness signals & XAUUSD analysis tools."
      />
      <Header />

      <main className="container mx-auto px-4 py-6 space-y-8">
        <h1 className="sr-only">Botvio — Forex Signals and AI Analysis Dashboard</h1>
        {/* 0 — Shortcuts */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <a href="https://deriv.partners/rx?sidi=F9C8D3BF-5854-499A-8497-F5C370F804DC&utm_campaign=dynamicworks&utm_medium=affiliate&utm_source=CU23827" target="_blank" rel="noopener noreferrer" className="block">
              <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-sm gap-2">
                <TrendingUp className="h-4 w-4" /> Trade on Deriv
              </Button>
            </a>
            <a href="https://one.exness-track.com/a/ts1kvs1k" target="_blank" rel="noopener noreferrer" className="block">
              <Button variant="outline" className="w-full h-12 font-extrabold text-sm gap-2 border-warning/40 text-warning hover:bg-warning/10">
                <TrendingUp className="h-4 w-4" /> Trade on Exness
              </Button>
            </a>
            <Link to="/gold" className="block">
              <Button variant="outline" className="w-full h-12 font-extrabold text-sm gap-2 border-warning/40 text-warning hover:bg-warning/10">
                🥇 Gold Hub
              </Button>
            </Link>
            <Link to="/bitcoin" className="block">
              <Button variant="outline" className="w-full h-12 font-extrabold text-sm gap-2 border-primary/40 text-primary hover:bg-primary/10">
                ₿ Bitcoin Hub
              </Button>
            </Link>
            <Link to="/silver" className="block">
              <Button variant="outline" className="w-full h-12 font-extrabold text-sm gap-2 border-muted-foreground/40 text-muted-foreground hover:bg-muted/40">
                🥈 Silver Hub
              </Button>
            </Link>
            <Link to="/gbpusd" className="block">
              <Button variant="outline" className="w-full h-12 font-extrabold text-sm gap-2 border-primary/40 text-primary hover:bg-primary/10">
                £ GBP/USD Hub
              </Button>
            </Link>
            <Link to="/weltrade" className="block">
              <Button variant="outline" className="w-full h-12 font-extrabold text-sm gap-2 border-warning/40 text-warning hover:bg-warning/10">
                <Activity className="h-4 w-4" /> Weltrade Hub
              </Button>
            </Link>
            <Link to="/news-calendar" className="block">
              <Button variant="outline" className="w-full h-12 font-extrabold text-sm gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 animate-pulse">
                <Newspaper className="h-4 w-4" /> 📰 News Calendar
              </Button>
            </Link>
            <Link to="/chart/XAUUSD" className="block">
              <Button variant="outline" className="w-full h-12 font-extrabold text-sm gap-2 border-primary/40 text-primary hover:bg-primary/10">
                <BarChart3 className="h-4 w-4" /> Chart Analysis
              </Button>
            </Link>
            <a href="https://chat.whatsapp.com/KInahrKam85BTyFbIgC3zJ" target="_blank" rel="noopener noreferrer" className="block">
              <Button variant="outline" className="w-full h-12 font-extrabold text-sm gap-2 border-success/40 text-success hover:bg-success/10">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </Button>
            </a>
            <a href="https://www.youtube.com/@Forexsmartmoneyconcept" target="_blank" rel="noopener noreferrer" className="block">
              <Button variant="outline" className="w-full h-12 font-extrabold text-sm gap-2 border-destructive/40 text-destructive hover:bg-destructive/10">
                <ExternalLink className="h-4 w-4" /> YouTube
              </Button>
            </a>
            <Link to="/deriv-options" className="block">
              <Button variant="outline" className="w-full h-12 font-extrabold text-sm gap-2 border-primary/40 text-primary hover:bg-primary/10 animate-pulse">
                <Wifi className="h-4 w-4" /> Deriv AI Options
              </Button>
            </Link>
            <Link to="/trade/style/boom-crash" className="block">
              <Button variant="outline" className="w-full h-12 font-extrabold text-sm gap-2 border-orange-500/40 text-orange-500 hover:bg-orange-500/10 animate-pulse">
                <Brain className="h-4 w-4" /> AI Spike Predict
              </Button>
            </Link>
            <Link to="/binary-options" className="block">
              <Button variant="outline" className="w-full h-12 font-extrabold text-sm gap-2 border-success/40 text-success hover:bg-success/10 animate-pulse">
                <Signal className="h-4 w-4" /> 🎯 Binary Signals
              </Button>
            </Link>
            <Link to="/live" className="block">
              <Button variant="outline" className="w-full h-12 font-extrabold text-sm gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 animate-pulse">
                <Wifi className="h-4 w-4" /> 🔴 Botvio Live
              </Button>
            </Link>
            <Link to="/flipping-challenges" className="block">
              <Button variant="outline" className="w-full h-12 font-extrabold text-sm gap-2 border-primary/40 text-primary hover:bg-primary/10">
                <Target className="h-4 w-4" /> Flipping Challenges
              </Button>
            </Link>
            <Link to="/sports-betting" className="block">
              <Button variant="outline" className="w-full h-12 font-extrabold text-sm gap-2 border-success/40 text-success hover:bg-success/10">
                ⚽ Sports Betting
              </Button>
            </Link>
            <Link to="/binance" className="block">
              <Button variant="outline" className="w-full h-12 font-extrabold text-sm gap-2 border-yellow-500/40 text-yellow-500 hover:bg-yellow-500/10">
                <TrendingUp className="h-4 w-4" /> 🔥 Binance Hub
              </Button>
            </Link>
            <Link to="/synthetic-hub" className="block">
              <Button variant="outline" className="w-full h-12 font-extrabold text-sm gap-2 border-primary/40 text-primary hover:bg-primary/10 animate-pulse">
                <Sparkles className="h-4 w-4" /> 🚀 Synthetic Hub
              </Button>
            </Link>
            <Link to="/auto-trade" className="block">
              <Button variant="outline" className="w-full h-12 font-extrabold text-sm gap-2 border-success/40 text-success hover:bg-success/10 animate-pulse">
                <Bot className="h-4 w-4" /> 🤖 24/7 Auto Trade
              </Button>
            </Link>
          </div>

          {/* Broker Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
            <Link to="/brokers/deriv" className="block">
              <Button variant="outline" className="w-full h-10 text-xs font-bold gap-1 border-destructive/40 text-destructive hover:bg-destructive/10">
                🔴 Deriv
              </Button>
            </Link>
            <Link to="/brokers/pocket-option" className="block">
              <Button variant="outline" className="w-full h-10 text-xs font-bold gap-1 border-blue-500/40 text-blue-500 hover:bg-blue-500/10">
                🔵 Pocket Option
              </Button>
            </Link>
            <Link to="/brokers/iq-option" className="block">
              <Button variant="outline" className="w-full h-10 text-xs font-bold gap-1 border-yellow-500/40 text-yellow-500 hover:bg-yellow-500/10">
                🟡 IQ Option
              </Button>
            </Link>
            <Link to="/brokers/binomo" className="block">
              <Button variant="outline" className="w-full h-10 text-xs font-bold gap-1 border-purple-500/40 text-purple-500 hover:bg-purple-500/10">
                🟣 Binomo
              </Button>
            </Link>
          </div>

          {/* Market Dashboard Shortcuts */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-3">
            <Link to="/markets" className="block">
              <Button variant="outline" className="w-full h-10 text-xs font-bold gap-1 border-primary/40 text-primary hover:bg-primary/10">
                <Globe className="h-3 w-3" /> All Markets
              </Button>
            </Link>
            <Link to="/markets/us" className="block">
              <Button variant="outline" className="w-full h-10 text-xs font-bold gap-1">🇺🇸 US</Button>
            </Link>
            <Link to="/markets/europe" className="block">
              <Button variant="outline" className="w-full h-10 text-xs font-bold gap-1">🇪🇺 Europe</Button>
            </Link>
            <Link to="/markets/middle-east" className="block">
              <Button variant="outline" className="w-full h-10 text-xs font-bold gap-1">🇸🇦 Middle East</Button>
            </Link>
            <Link to="/markets/crypto" className="block">
              <Button variant="outline" className="w-full h-10 text-xs font-bold gap-1">₿ Crypto</Button>
            </Link>
            <Link to="/markets/africa" className="block">
              <Button variant="outline" className="w-full h-10 text-xs font-bold gap-1">🌍 Africa</Button>
            </Link>
          </div>
        </section>

        {/* 1 — Latest Trading Signals */}
        <section>
          <HomeSignalsWidget />
        </section>

        {/* 2.5 — Training Videos */}

        {/* 2.5 — Training Videos */}
        <section>
          <TrainingVideosGrid />
        </section>

        {/* 2.6 — Best Forex Brokers to Start With */}
        <section>
          <BrokerStarterCards />
        </section>

        {/* 2 — AI Chart Analysis */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-extrabold text-foreground">AI Chart Analysis</h2>
            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs font-bold">Free</Badge>
          </div>
          <ChartUpload />
        </section>

        {/* 3 — Subscription Plans */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Subscription Plans
            </h2>
            <Badge className="bg-success/20 text-success border-success/30 text-xs font-bold">Start Free</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Free Trial */}
            <Card className="glass-card border-muted-foreground/20 hover:border-primary/40 transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">Free Trial</CardTitle>
                <p className="text-2xl font-extrabold text-foreground">$0<span className="text-sm font-normal text-muted-foreground">/forever</span></p>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> 1 chart upload / day</div>
                <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> Community signals</div>
                <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> Basic education</div>
                <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> 1 trading account</div>
                <Button variant="outline" className="w-full mt-3 text-xs" size="sm" asChild>
                  <Link to="/billing">Get Started</Link>
                </Button>
              </CardContent>
            </Card>
            {/* Basic */}
            <Card className="glass-card border-primary/30 hover:border-primary/60 transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">Basic <Badge className="text-[10px] bg-primary/20 text-primary">Popular</Badge></CardTitle>
                <p className="text-2xl font-extrabold text-foreground">$10<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> 50 chart analyses / week</div>
                <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> Premium signals</div>
                <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> Copy trading access</div>
                <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> 3 trading accounts, 5 bots</div>
                <Button className="w-full mt-3 text-xs bg-primary hover:bg-primary/90" size="sm" asChild>
                  <Link to="/billing">Subscribe</Link>
                </Button>
              </CardContent>
            </Card>
            {/* Standard */}
            <Card className="glass-card border-warning/30 hover:border-warning/60 transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">Standard <Star className="h-4 w-4 text-warning" /></CardTitle>
                <p className="text-2xl font-extrabold text-foreground">$25<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> 100 chart analyses / month</div>
                <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> Premium monthly signals</div>
                <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> Copy trading & premium bots</div>
                <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> Provider listing</div>
                <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> 5 trading accounts, 10 bots</div>
                <Button className="w-full mt-3 text-xs bg-warning hover:bg-warning/90 text-warning-foreground" size="sm" asChild>
                  <Link to="/billing">Subscribe</Link>
                </Button>
              </CardContent>
            </Card>
            {/* VIP */}
            <Card className="glass-card border-destructive/30 hover:border-destructive/60 transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-destructive text-destructive-foreground text-[10px] font-bold px-3 py-0.5 rounded-bl-lg">BEST VALUE</div>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">VIP <Crown className="h-4 w-4 text-destructive" /></CardTitle>
                <p className="text-2xl font-extrabold text-foreground">$49<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> Unlimited chart analyses</div>
                <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> Premium signals</div>
                <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> Sports betting access</div>
                <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> Global markets access</div>
                <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> All strategies & courses</div>
                <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> Unlimited accounts & bots</div>
                <Button className="w-full mt-3 text-xs bg-destructive hover:bg-destructive/90 text-destructive-foreground" size="sm" asChild>
                  <Link to="/billing">Go VIP</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">All plans include chart analysis usage. Strategies can also be purchased individually from the <Link to="/marketplace" className="text-primary underline">Marketplace</Link>.</p>
        </section>

        {/* 4 — Premium Mentorship Programs */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Premium Mentorship Programs
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/learn">All Courses <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
          <CourseEnrollmentCards compact homeMode />
        </section>

        {/* 5 — Live Trading Hubs (Gold / Silver / Bitcoin / GBP/USD) */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-4">
            <aside className="hidden md:block">
              <TradingHubsSidebar />
            </aside>
            <div className="space-y-4 min-w-0">
              <LiveTradingHubCards />
              <MoreTradingHubsList />
              {/* Mobile: show the sidebar nav inline at the bottom of the section */}
              <div className="md:hidden">
                <TradingHubsSidebar />
              </div>
            </div>
          </div>
        </section>

        {/* 6 — Deriv Options Shortcut */}
        <section>
          <Link to="/deriv-options" className="block">
            <Card className="glass-card border-primary/30 hover:border-primary/60 transition-all hover:scale-[1.01] cursor-pointer overflow-hidden">
              <CardContent className="py-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-destructive flex items-center justify-center">
                      <Wifi className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Deriv Options & API Trading</h3>
                      <p className="text-sm text-muted-foreground">Connect your Deriv account • 8+ contract types • 50+ markets • Auto trading bots</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">Digits</Badge>
                    <Badge variant="outline" className="text-xs">Multipliers</Badge>
                    <Badge variant="outline" className="text-xs">Boom/Crash</Badge>
                    <Button variant="gold" size="sm">
                      <Zap className="h-4 w-4 mr-2" /> Open Trading Hub <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Quick Trade Mode Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <Link to="/trade/style/digit-contracts" className="block">
              <Card className="glass-card border-violet-500/30 hover:border-violet-500/60 hover:scale-[1.02] transition-all cursor-pointer h-full">
                <CardContent className="pt-5 pb-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-muted/50 text-violet-400">
                      <Hash className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px]">Fast</Badge>
                  </div>
                  <p className="font-bold text-sm">Digits (Matches/Differs)</p>
                  <p className="text-xs text-muted-foreground">Predict the last digit. 1-10 tick contracts with 90%+ win rates on Differs.</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/trade/style/boom-crash" className="block">
              <Card className="glass-card border-orange-500/30 hover:border-orange-500/60 hover:scale-[1.02] transition-all cursor-pointer h-full">
                <CardContent className="pt-5 pb-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-muted/50 text-orange-400">
                      <Zap className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px]">Advanced</Badge>
                  </div>
                  <p className="font-bold text-sm">Boom / Crash Spikes</p>
                  <p className="text-xs text-muted-foreground">Catch explosive spike movements. Wait for drought patterns before entering.</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/trade/style/ticks" className="block">
              <Card className="glass-card border-pink-500/30 hover:border-pink-500/60 hover:scale-[1.02] transition-all cursor-pointer h-full">
                <CardContent className="pt-5 pb-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-muted/50 text-pink-400">
                      <Activity className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px]">Ultra-Fast</Badge>
                  </div>
                  <p className="font-bold text-sm">Ticks Trading</p>
                  <p className="text-xs text-muted-foreground">Ultra-fast 1-5 tick contracts. Pure price action with instant results.</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        {/* Binance Tools Shortcut Cards */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🔶</span>
            <h2 className="text-xl font-bold">Binance Tools</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link to="/binance" className="block">
              <Card className="glass-card border-yellow-500/30 hover:border-yellow-500/60 hover:scale-[1.02] transition-all cursor-pointer h-full">
                <CardContent className="pt-5 pb-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-muted/50 text-yellow-500">
                      <Zap className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px] border-yellow-500/30 text-yellow-500">AI</Badge>
                  </div>
                  <p className="font-bold text-sm">AI Scalping Signals</p>
                  <p className="text-xs text-muted-foreground">Real-time crypto scalping signals for BTC, ETH, SOL & more.</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/binance" className="block">
              <Card className="glass-card border-orange-500/30 hover:border-orange-500/60 hover:scale-[1.02] transition-all cursor-pointer h-full">
                <CardContent className="pt-5 pb-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-muted/50 text-orange-500">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px] border-orange-500/30 text-orange-500">Scanner</Badge>
                  </div>
                  <p className="font-bold text-sm">Arbitrage Scanner</p>
                  <p className="text-xs text-muted-foreground">Detect cross-exchange price gaps and arbitrage opportunities.</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/binance" className="block">
              <Card className="glass-card border-success/30 hover:border-success/60 hover:scale-[1.02] transition-all cursor-pointer h-full">
                <CardContent className="pt-5 pb-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-muted/50 text-success">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px] border-success/30 text-success">Yield</Badge>
                  </div>
                  <p className="font-bold text-sm">Staking & Earn</p>
                  <p className="text-xs text-muted-foreground">Top staking APY rates and passive income opportunities.</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>
        {/* 6 — Quick Links */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-primary" />
              Quick Links
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a href="https://deriv.partners/rx?sidi=F9C8D3BF-5854-499A-8497-F5C370F804DC&utm_campaign=dynamicworks&utm_medium=affiliate&utm_source=CU23827" target="_blank" rel="noopener noreferrer" className="block">
              <Card className="glass-card hover:border-primary/50 transition-all hover:scale-[1.02] cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30">
                      <TrendingUp className="h-6 w-6 text-red-500" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Deriv</CardTitle>
                      <CardDescription className="text-xs">Binary options & CFDs</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent><Badge variant="outline" className="text-xs">Open Account →</Badge></CardContent>
              </Card>
            </a>
            <a href="https://one.exness-track.com/a/ts1kvs1k" target="_blank" rel="noopener noreferrer" className="block">
              <Card className="glass-card hover:border-warning/50 transition-all hover:scale-[1.02] cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-warning/20 to-yellow-600/20 border border-warning/30">
                      <TrendingUp className="h-6 w-6 text-warning" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Exness</CardTitle>
                      <CardDescription className="text-xs">Forex & CFDs trading</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent><Badge variant="outline" className="text-xs text-warning border-warning/30">Open Account →</Badge></CardContent>
              </Card>
            </a>
            <a href="https://www.binance.com/activity/referral-entry/CPA?ref=CPA_0047GJ3KHU" target="_blank" rel="noopener noreferrer" className="block">
              <Card className="glass-card hover:border-yellow-500/50 transition-all hover:scale-[1.02] cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                      <Target className="h-6 w-6 text-yellow-500" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Binance</CardTitle>
                      <CardDescription className="text-xs">Crypto exchange</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent><Badge variant="outline" className="text-xs text-yellow-500 border-yellow-500/30">Open Account →</Badge></CardContent>
              </Card>
            </a>
            <a href="https://chat.whatsapp.com/KInahrKam85BTyFbIgC3zJ" target="_blank" rel="noopener noreferrer" className="block">
              <Card className="glass-card hover:border-success/50 transition-all hover:scale-[1.02] cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-success/20 to-green-600/20 border border-success/30">
                      <MessageCircle className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <CardTitle className="text-base">WhatsApp</CardTitle>
                      <CardDescription className="text-xs">Trading community</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent><Badge variant="outline" className="text-xs text-success border-success/30">Join Group →</Badge></CardContent>
              </Card>
            </a>
          </div>
        </section>

        {/* 7 — All Courses Link */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Trading Education
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/learn">All Courses <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </section>

        {/* 8 — Banners */}
        <section className="space-y-4">
          <NotificationBanner />
          <Card className="glass-card border-primary/30 overflow-hidden">
            <CardContent className="py-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-warning flex items-center justify-center">
                    <Smartphone className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Get the Botvio App</h3>
                    <p className="text-sm text-muted-foreground">Install on your phone for instant access, push alerts & offline mode</p>
                  </div>
                </div>
                <Button variant="gold" asChild><Link to="/install"><Download className="h-4 w-4 mr-2" />Install App</Link></Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <TradingGuide showOnboarding={showOnboarding} onCloseOnboarding={handleCloseOnboarding} />

      {/* Latest Articles */}
      <LatestArticles />

      {/* Latest Strategies */}
      <LatestStrategies />

      <footer className="border-t border-border/50 mt-8 py-6 px-4">
        <div className="container mx-auto">
          {/* Internal navigation links */}
          <nav className="flex flex-wrap justify-center gap-4 text-sm mb-4" aria-label="Footer navigation">
            <Link to="/signals" className="text-muted-foreground hover:text-primary transition-colors">Forex Signals</Link>
            <Link to="/gold" className="text-muted-foreground hover:text-primary transition-colors">Gold Hub</Link>
            <Link to="/bots" className="text-muted-foreground hover:text-primary transition-colors">Trading Bots</Link>
            <Link to="/providers" className="text-muted-foreground hover:text-primary transition-colors">Copy Trading</Link>
            <Link to="/learn" className="text-muted-foreground hover:text-primary transition-colors">Learn Trading</Link>
            <Link to="/chart/XAUUSD" className="text-muted-foreground hover:text-primary transition-colors">Chart Analysis</Link>
            <Link to="/blog" className="text-muted-foreground hover:text-primary transition-colors">Blog</Link>
            <Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors">FAQ</Link>
            <Link to="/affiliate" className="text-muted-foreground hover:text-primary transition-colors">Affiliate</Link>
            <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms</Link>
            <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Privacy</Link>
          </nav>
          <div className="flex justify-center mb-3">
            <img src="/botvio-logo.png" alt="Botvio Logo" width="160" height="40" className="h-10 w-auto" loading="lazy" decoding="async" />
          </div>
          <p className="text-xs text-muted-foreground text-center max-w-3xl mx-auto mb-2">
            <strong>Risk Warning:</strong> Trading binary options and CFDs involves significant risk. Past performance is not indicative of future results.
          </p>
          <p className="text-xs text-muted-foreground text-center max-w-3xl mx-auto mb-2">
            Botvio is powered by Deriv API. Botvio is not affiliated with or endorsed by Deriv.
          </p>
          {/* Official Contact Disclaimer */}
          <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border/50 max-w-2xl mx-auto">
            <p className="text-xs text-muted-foreground text-center">
              <strong className="text-foreground">⚠️ Official Contact Disclaimer:</strong> Our only official contact channels are email{" "}
              <a href="mailto:info@botvio.live" className="text-primary hover:underline font-medium">info@botvio.live</a>{" "}
              and WhatsApp numbers provided on this platform. Do not trust any other contact claiming to represent Botvio.
            </p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Support Button */}
      <a
        href="https://wa.me/260966284085?text=Hi%20Botvio%20Support%2C%20I%20need%20help"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-emerald-500 text-white shadow-lg hover:bg-emerald-600 transition-all hover:scale-105 animate-pulse hover:animate-none"
        aria-label="WhatsApp Support"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="text-sm font-medium hidden sm:inline">Support</span>
      </a>
    </div>
  );
};

const LatestArticles = () => {
  const { data: articles } = useQuery({
    queryKey: ["latest-blog-posts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select("slug, title, excerpt, category, read_time, cover_image")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(3);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!articles || articles.length === 0) return null;

  return (
    <section className="px-4 mt-8">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Latest Articles
          </h2>
          <Link to="/blog" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {articles.map((post) => (
            <Link key={post.slug} to={`/blog/${post.slug}`}>
              <Card className="h-full border-border bg-card hover:border-primary/50 transition-colors overflow-hidden">
                {post.cover_image && (
                  <img src={post.cover_image} alt={post.title} className="w-full h-28 object-cover" loading="lazy" />
                )}
                <CardContent className="p-3">
                  <Badge variant="outline" className="text-[10px] mb-1.5">{post.category}</Badge>
                  <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-snug">{post.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{post.excerpt}</p>
                  <span className="text-[10px] text-muted-foreground mt-1.5 block">{post.read_time}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

const LatestStrategies = () => {
  const { data: strategies } = useQuery({
    queryKey: ["latest-strategies-home"],
    queryFn: async () => {
      const { data } = await supabase
        .from("strategies")
        .select("slug, title, description, market, pricing_type, cover_image_url")
        .eq("is_public", true)
        .order("downloads", { ascending: false })
        .limit(3);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!strategies || strategies.length === 0) return null;

  return (
    <section className="px-4 mt-8">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Top Strategies
          </h2>
          <Link to="/strategies" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {strategies.map((s) => (
            <Link key={s.slug} to={`/${s.slug}`}>
              <Card className="h-full border-border bg-card hover:border-primary/50 transition-colors overflow-hidden">
                {s.cover_image_url && (
                  <img src={s.cover_image_url} alt={s.title} className="w-full h-28 object-cover" loading="lazy" />
                )}
                <CardContent className="p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Badge variant="outline" className="text-[10px]">{s.market}</Badge>
                    <Badge className={`text-[10px] ${s.pricing_type === "free" ? "bg-success/20 text-success border-success/30" : "bg-primary/20 text-primary border-primary/30"}`}>
                      {s.pricing_type === "free" ? "Free" : "Paid"}
                    </Badge>
                  </div>
                  <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-snug">{s.title}</h3>
                  {s.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Index;