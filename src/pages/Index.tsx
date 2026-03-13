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
import { CourseEnrollmentCards } from "@/components/courses/CourseEnrollmentCards";
import { MarketDashboard } from "@/components/trading/MarketDashboard";
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
      <SEOHead
        title="Forex Signals & AI Analysis Dashboard"
        description="Free forex signals, AI chart analysis, gold trading mentorship, Deriv signals, Exness signals & XAUUSD analysis tools."
      />
      <Header />

      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* 0 — Shortcuts */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <a href="https://one.exness-track.com/a/ts1kvs1k" target="_blank" rel="noopener noreferrer" className="block">
              <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-sm gap-2">
                <TrendingUp className="h-4 w-4" /> Trade on Exness
              </Button>
            </a>
            <a href="https://deriv.partners/rx?sidi=F9C8D3BF-5854-499A-8497-F5C370F804DC&utm_campaign=dynamicworks&utm_medium=affiliate&utm_source=CU23827" target="_blank" rel="noopener noreferrer" className="block">
              <Button variant="outline" className="w-full h-12 font-extrabold text-sm gap-2 border-destructive/40 text-destructive hover:bg-destructive/10">
                <TrendingUp className="h-4 w-4" /> Trade on Deriv
              </Button>
            </a>
            <Link to="/gold" className="block">
              <Button variant="outline" className="w-full h-12 font-extrabold text-sm gap-2 border-primary/40 text-primary hover:bg-primary/10">
                <Sparkles className="h-4 w-4" /> Gold Hub
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
              <Button variant="outline" className="w-full h-12 font-extrabold text-sm gap-2 border-accent-foreground/20 text-foreground hover:bg-accent/50">
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

        {/* 0.5 — High-Impact News Events */}
        <NewsEventCards />

        {/* 1 — Latest Trading Signals */}
        <section>
          <HomeSignalsWidget />
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

        {/* 3 — Premium Mentorship Programs */}
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
          <CourseEnrollmentCards compact />
        </section>

        {/* 3c — Live Market Intelligence */}
        <section>
          <MarketDashboard homeMode />
        </section>

        {/* 5 — Deriv Options Shortcut */}
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
          <p className="text-xs text-muted-foreground text-center max-w-3xl mx-auto mb-2">
            <strong>Risk Warning:</strong> Trading binary options and CFDs involves significant risk. Past performance is not indicative of future results.
          </p>
          <p className="text-xs text-muted-foreground text-center max-w-3xl mx-auto">
            Botvio is powered by Deriv API. Botvio is not affiliated with or endorsed by Deriv.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;