import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { PriceDisplay } from "@/components/trading/PriceDisplay";
import { SupportResistanceLevels } from "@/components/trading/SupportResistanceLevels";
import { DerivConnection } from "@/components/trading/DerivConnection";
import { PairSelector } from "@/components/trading/PairSelector";
import { SniperEntry } from "@/components/trading/SniperEntry";
import { StrategyPanel } from "@/components/trading/StrategyPanel";
import { BotvioSniperPanel } from "@/components/trading/BotvioSniperPanel";
import { PerformancePanel } from "@/components/trading/PerformancePanel";
import { QuickTrade } from "@/components/trading/QuickTrade";
import { ActiveBotsWidget } from "@/components/trading/ActiveBotsWidget";
import { AutoTradingPanel } from "@/components/trading/AutoTradingPanel";
import { HomeSignalsWidget } from "@/components/signals/HomeSignalsWidget";
import { ChartUpload } from "@/components/signals/ChartUpload";
import { TradingGuide, TradingHelpPanel } from "@/components/trading/TradingGuide";
import { MarketData } from "@/types/trading";
import { useAuth } from "@/contexts/AuthContext";
import { useDeriv } from "@/contexts/DerivContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Target, AlertTriangle, Bot, TrendingUp, ArrowRight, Zap, BookOpen, Package, HelpCircle, MessageCircle, ExternalLink, Download, Smartphone } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

const Index = () => {
  const { user, settings } = useAuth();
  const { authorized, lastTick, subscribeTicks, unsubscribeTicks } = useDeriv();
  const navigate = useNavigate();
  const [selectedPair, setSelectedPair] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Use user's saved settings
  useEffect(() => {
    if (settings?.default_pair) {
      setSelectedPair(settings.default_pair);
    }
  }, [settings]);

  // Show onboarding for new users (check localStorage to show only once)
  useEffect(() => {
    if (user) {
      const hasSeenOnboarding = localStorage.getItem('botvio_onboarding_seen');
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [user]);

  // Subscribe to ticks when connected to Deriv
  useEffect(() => {
    if (authorized && selectedPair) {
      subscribeTicks(selectedPair);
    }
    return () => {
      if (authorized) {
        unsubscribeTicks(selectedPair);
      }
    };
  }, [authorized, selectedPair, subscribeTicks, unsubscribeTicks]);

  const handleCloseOnboarding = () => {
    localStorage.setItem('botvio_onboarding_seen', 'true');
    setShowOnboarding(false);
  };

  // Market data - use live Deriv data when connected
  const [marketData, setMarketData] = useState<MarketData>({
    pair: "XAUUSD",
    price: 2347.85,
    change24h: 1.23,
    high24h: 2365.40,
    low24h: 2328.15,
    volume: 125400000,
  });

  // Update market data from Deriv ticks
  useEffect(() => {
    if (lastTick) {
      // Map Deriv symbol back to display name
      let displayPair = lastTick.symbol;
      if (lastTick.symbol.startsWith("frx")) {
        displayPair = lastTick.symbol.replace("frx", "");
      } else if (lastTick.symbol.startsWith("cry")) {
        displayPair = lastTick.symbol.replace("cry", "");
      }
      
      setMarketData(prev => ({
        ...prev,
        pair: displayPair,
        price: lastTick.quote,
      }));
    }
  }, [lastTick]);

  // Fallback: Simulate price updates when not connected
  useEffect(() => {
    if (authorized) return; // Don't simulate when connected
    
    const interval = setInterval(() => {
      setMarketData(prev => ({
        ...prev,
        price: prev.price + (Math.random() - 0.5) * 2,
        change24h: prev.change24h + (Math.random() - 0.5) * 0.1,
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, [authorized]);

  // Fetch featured products from database — include all types
  const { data: featuredProducts } = useQuery({
    queryKey: ["featured-products-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data;
    },
    staleTime: 60 * 1000,
  });

  // Fetch real courses from DB
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
      return Array.from(categories.entries()).map(([cat, count], i) => ({
        id: i,
        title: cat.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
        category: cat,
        lessons: count,
        slug: cat,
      })).slice(0, 4);
    },
    staleTime: 5 * 60 * 1000,
  });

  const displayProducts = featuredProducts ?? [];
  const displayCourses = dbCourses ?? [];

  const handleSymbolChange = (derivSymbol: string) => {
    // Map Deriv symbol to display pair for UI
    let displayPair = derivSymbol;
    if (derivSymbol.startsWith("frx")) {
      displayPair = derivSymbol.replace("frx", "");
    } else if (derivSymbol.startsWith("cry")) {
      displayPair = derivSymbol.replace("cry", "");
    }
    setSelectedPair(displayPair);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Trading Dashboard" description="AI-powered trading dashboard with live signals, bots, and copy trading" noIndex />
      <Header />

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            <div className="glass-card p-4">
              <span className="data-label mb-3 block">Trading Pair</span>
              <PairSelector selectedPair={selectedPair} onPairChange={setSelectedPair} />
            </div>
            
            {/* Single unified Deriv connection panel */}
            <DerivConnection onSymbolChange={handleSymbolChange} />
            
            <QuickTrade symbol={selectedPair} />
            <StrategyPanel />
            <TradingHelpPanel />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-6 space-y-6">
            <PriceDisplay data={marketData} />
            <SniperEntry pair={selectedPair} currentPrice={marketData.price} />

            {/* Botvio Sniper Signals Panel */}
            <div className="glass-card p-6">
              <BotvioSniperPanel 
                symbol={selectedPair} 
                timeframe={settings?.default_timeframe || "M5"} 
              />
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            <AutoTradingPanel />
            <ActiveBotsWidget />
            <SupportResistanceLevels levels={[]} currentPrice={marketData.price} />
            <PerformancePanel />
          </div>
        </div>

        {/* AI Chart Analysis Section */}
        <div className="mt-8">
          <ChartUpload />
        </div>

        {/* Affiliate & Community Links */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-primary" />
              Quick Links
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Deriv Affiliate Link */}
            <a 
              href="https://deriv.partners/rx?sidi=F9C8D3BF-5854-499A-8497-F5C370F804DC&utm_campaign=dynamicworks&utm_medium=affiliate&utm_source=CU23827" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block"
            >
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
                <CardContent>
                  <Badge variant="outline" className="text-xs">
                    Open Account →
                  </Badge>
                </CardContent>
              </Card>
            </a>

            {/* Exness Affiliate Link */}
            <a 
              href="https://one.exness-track.com/a/ts1kvs1k" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block"
            >
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
                <CardContent>
                  <Badge variant="outline" className="text-xs text-warning border-warning/30">
                    Open Account →
                  </Badge>
                </CardContent>
              </Card>
            </a>

            {/* Binance Affiliate Link */}
            <a 
              href="https://www.binance.com/activity/referral-entry/CPA?ref=CPA_0047GJ3KHU" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block"
            >
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
                <CardContent>
                  <Badge variant="outline" className="text-xs text-yellow-500 border-yellow-500/30">
                    Open Account →
                  </Badge>
                </CardContent>
              </Card>
            </a>

            {/* WhatsApp Community Link */}
            <a 
              href="https://chat.whatsapp.com/KInahrKam85BTyFbIgC3zJ" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block"
            >
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
                <CardContent>
                  <Badge variant="outline" className="text-xs text-success border-success/30">
                    Join Group →
                  </Badge>
                </CardContent>
              </Card>
            </a>
          </div>
        </div>

        {/* Latest Trading Signals */}
        <HomeSignalsWidget />

        {/* Featured Products Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Featured Products
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/marketplace">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayProducts.map((product) => {
              const productLink = product.type === "bot" ? "/bots" 
                : product.type === "signal_pack" ? "/signals" 
                : product.type === "course" ? "/learn" 
                : "/marketplace";
              return (
                <Card key={product.id} className="glass-card hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        {product.type === "bot" ? <Bot className="h-4 w-4 text-primary" /> : 
                         product.type === "signal_pack" ? <Target className="h-4 w-4 text-primary" /> :
                         product.type === "course" ? <GraduationCap className="h-4 w-4 text-primary" /> :
                         <Zap className="h-4 w-4 text-primary" />}
                        {product.name}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        {product.type === "course" && (
                          <Badge variant="outline" className="text-[10px] border-primary text-primary">Soon</Badge>
                        )}
                        {product.price_usd > 0 ? (
                          <Badge variant="secondary">${product.price_usd}</Badge>
                        ) : (
                          <Badge variant="outline">Free</Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription>{product.short_description || "Trading tool"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="capitalize">
                        {product.type?.replace("_", " ") || "Product"}
                      </Badge>
                      <Button size="sm" variant="outline" asChild>
                        <Link to={productLink}>View</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Featured Courses Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Learn Trading Strategies
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/learn">
                All Courses <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
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
                    <Button size="sm" variant="gold">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Start
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Push Notifications Banner */}
        <div className="mt-8">
          <Card className="glass-card border-warning/30 overflow-hidden">
            <CardContent className="py-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-warning to-orange-500 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">🔔 Push Notifications — Coming Soon</h3>
                    <p className="text-sm text-muted-foreground">
                      Get instant alerts for signals, trade executions, and market moves. Install the app to be ready!
                    </p>
                  </div>
                </div>
                <Button variant="gold" asChild>
                  <Link to="/install">
                    <Download className="h-4 w-4 mr-2" />
                    Install App
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Install App Banner */}
        <div className="mt-4">
          <Card className="glass-card border-primary/30 overflow-hidden">
            <CardContent className="py-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-warning flex items-center justify-center">
                    <Smartphone className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Get the Botvio App</h3>
                    <p className="text-sm text-muted-foreground">
                      Install on your phone for instant access, push alerts & offline mode
                    </p>
                  </div>
                </div>
                <Button variant="gold" asChild>
                  <Link to="/install">
                    <Download className="h-4 w-4 mr-2" />
                    Install App
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Trading Guide Onboarding */}
      <TradingGuide 
        showOnboarding={showOnboarding} 
        onCloseOnboarding={handleCloseOnboarding} 
      />

      {/* Disclaimer Footer */}
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
