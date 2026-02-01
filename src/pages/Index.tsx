import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { HomeSignalsWidget } from "@/components/signals/HomeSignalsWidget";
import { TradingGuide, TradingHelpPanel } from "@/components/trading/TradingGuide";
import { SupportResistance, MarketData } from "@/types/trading";
import { useAuth } from "@/contexts/AuthContext";
import { useDeriv } from "@/contexts/DerivContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Target, AlertTriangle, Bot, TrendingUp, ArrowRight, Zap, BookOpen, Package, HelpCircle } from "lucide-react";
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
      const hasSeenOnboarding = localStorage.getItem('hauza_onboarding_seen');
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
    localStorage.setItem('hauza_onboarding_seen', 'true');
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

  // Mock S/R levels
  const srLevels: SupportResistance[] = [
    { level: 2380.00, type: 'RESISTANCE', strength: 'STRONG', touches: 5 },
    { level: 2365.00, type: 'RESISTANCE', strength: 'MODERATE', touches: 3 },
    { level: 2340.00, type: 'SUPPORT', strength: 'STRONG', touches: 4 },
    { level: 2320.00, type: 'SUPPORT', strength: 'WEAK', touches: 2 },
  ];

  // Fetch featured products from database
  const { data: featuredProducts } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .eq("is_featured", true)
        .limit(6);
      if (error) throw error;
      return data;
    },
    staleTime: 60 * 1000, // 1 minute cache
  });

  // Fallback featured bots (used if no products in DB)
  const defaultFeaturedBots = [
    { id: "1", name: "Botvio Sniper", short_description: "XAUUSD S/R strategy", type: "bot", price_usd: 0 },
    { id: "2", name: "V75 Scalper", short_description: "Volatility 75 scalping", type: "bot", price_usd: 29 },
    { id: "3", name: "Boom Catcher", short_description: "Boom/Crash spikes", type: "bot", price_usd: 0 },
  ];

  // Featured Courses (can also come from products table)
  const featuredCourses = [
    { id: 1, title: "Botvio Sniper Mastery", category: "botvio-sniper", lessons: 8, slug: "botvio-sniper-intro" },
    { id: 2, title: "VIX Trading Essentials", category: "vix", lessons: 5, slug: "vix-intro" },
    { id: 3, title: "News Trading Strategy", category: "news-trading", lessons: 4, slug: "news-trading-intro" },
  ];

  const displayProducts = featuredProducts && featuredProducts.length > 0 
    ? featuredProducts 
    : defaultFeaturedBots;

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
            <SupportResistanceLevels levels={srLevels} currentPrice={marketData.price} />
            <PerformancePanel />
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
              <Link to="/bots">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {displayProducts.map((product) => (
              <Card key={product.id} className="glass-card hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      {product.name}
                    </CardTitle>
                    {product.price_usd > 0 && (
                      <Badge variant="secondary">${product.price_usd}</Badge>
                    )}
                    {product.price_usd === 0 && (
                      <Badge variant="outline">Free</Badge>
                    )}
                  </div>
                  <CardDescription>{product.short_description || "Trading strategy"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="capitalize">
                      {product.type?.replace("_", " ") || "Strategy"}
                    </Badge>
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/bots">View</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredCourses.map((course) => (
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
