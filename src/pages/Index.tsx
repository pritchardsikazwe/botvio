import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { DerivConnection } from "@/components/trading/DerivConnection";
import { TradingGuide, TradingHelpPanel } from "@/components/trading/TradingGuide";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap, Target, AlertTriangle, Bot, TrendingUp,
  ArrowRight, Zap, BookOpen, Package, MessageCircle,
  ExternalLink, Download, Smartphone, Sparkles, Signal,
  BarChart3, Hash, TrendingDown, Activity
} from "lucide-react";
import { ChartUpload } from "@/components/signals/ChartUpload";
import { HomeSignalsWidget } from "@/components/signals/HomeSignalsWidget";
import { CourseEnrollmentCards } from "@/components/courses/CourseEnrollmentCards";
import { MarketDashboard } from "@/components/trading/MarketDashboard";
import { NotificationBanner } from "@/components/notifications/NotificationBanner";
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
            <a href="https://gowt.net/ib67505" target="_blank" rel="noopener noreferrer" className="block">
              <Button variant="outline" className="w-full h-12 font-extrabold text-sm gap-2 border-warning/40 text-warning hover:bg-warning/10">
                <TrendingUp className="h-4 w-4" /> Weltrade
              </Button>
            </a>
            <Link to="/gold" className="block">
              <Button variant="outline" className="w-full h-12 font-extrabold text-sm gap-2 border-primary/40 text-primary hover:bg-primary/10">
                <Sparkles className="h-4 w-4" /> Gold Hub
              </Button>
            </Link>
            <Link to="/weltrade" className="block">
              <Button variant="outline" className="w-full h-12 font-extrabold text-sm gap-2 border-warning/40 text-warning hover:bg-warning/10">
                <Activity className="h-4 w-4" /> SyntX Hub
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
          </div>
        </section>

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
          <MarketDashboard />
        </section>

        {/* 4 — Featured Products (4 max) */}
        {displayProducts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Featured Products
              </h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/marketplace">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayProducts.map((product) => {
                const productLink = product.type === "bot" ? "/bots" : product.type === "signal_pack" ? "/signals" : product.type === "course" ? "/learn" : "/marketplace";
                return (
                  <Card key={product.id} className="glass-card hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          {product.type === "bot" ? <Bot className="h-4 w-4 text-primary" /> : product.type === "signal_pack" ? <Target className="h-4 w-4 text-primary" /> : product.type === "course" ? <GraduationCap className="h-4 w-4 text-primary" /> : <Zap className="h-4 w-4 text-primary" />}
                          {product.name}
                        </CardTitle>
                        {product.price_usd > 0 ? <Badge variant="secondary">${product.price_usd}</Badge> : <Badge variant="outline">Free</Badge>}
                      </div>
                      <CardDescription>{product.short_description || "Trading tool"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="capitalize">{product.type?.replace("_", " ") || "Product"}</Badge>
                        <Button size="sm" variant="outline" asChild><Link to={productLink}>View</Link></Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* 5 — Deriv API Connection + Trading Modes */}
        <section>
          <DerivConnection />
          <div className="mt-4">
            <p className="text-sm font-medium text-muted-foreground mb-3">Quick Trade Modes</p>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5"
                onClick={() => navigate('/trade/style/ticks')}
              >
                <BarChart3 className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Ticks</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5"
                onClick={() => navigate('/trade/style/multipliers')}
              >
                <TrendingUp className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Multipliers</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5"
                onClick={() => navigate('/trade/style/digits')}
              >
                <Hash className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Digits</span>
              </Button>
            </div>
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

        {/* 7 — Courses */}
        {displayCourses.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Learn Trading Strategies
              </h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/learn">All Courses <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {displayCourses.map((course) => (
                <Card key={course.id} className="glass-card hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate(`/learn/${course.slug}`)}>
                  <CardHeader className="pb-2">
                    <Badge variant="outline" className="w-fit mb-2">{course.category}</Badge>
                    <CardTitle className="text-base">{course.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{course.lessons} lessons</span>
                      <Button size="sm" variant="gold"><GraduationCap className="h-4 w-4 mr-2" />Start</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

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