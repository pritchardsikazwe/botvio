import { useState, useEffect } from "react";
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
import { SupportResistance, MarketData } from "@/types/trading";
import { useAuth } from "@/contexts/AuthContext";
import { useDeriv } from "@/contexts/DerivContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Target, AlertTriangle, Bot, TrendingUp, ArrowRight, Zap, BookOpen } from "lucide-react";
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

  // Featured Bots
  const featuredBots = [
    { id: 1, name: "Botvio Sniper", description: "XAUUSD S/R strategy", markets: "Forex, Gold", isPremium: false },
    { id: 2, name: "V75 Scalper", description: "Volatility 75 scalping", markets: "Synthetic Indices", isPremium: true },
    { id: 3, name: "Boom Catcher", description: "Boom/Crash spikes", markets: "Boom/Crash", isPremium: false },
  ];

  // Featured Courses
  const featuredCourses = [
    { id: 1, title: "Botvio Sniper Mastery", category: "botvio-sniper", lessons: 8, slug: "botvio-sniper-intro" },
    { id: 2, title: "VIX Trading Essentials", category: "vix", lessons: 5, slug: "vix-intro" },
    { id: 3, title: "News Trading Strategy", category: "news-trading", lessons: 4, slug: "news-trading-intro" },
  ];

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

        {/* Featured Bots Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Featured Trading Bots
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/bots">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredBots.map((bot) => (
              <Card key={bot.id} className="glass-card hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      {bot.name}
                    </CardTitle>
                    {bot.isPremium && <Badge variant="secondary">Premium</Badge>}
                  </div>
                  <CardDescription>{bot.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground text-sm">{bot.markets}</span>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/bots">Activate</Link>
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

      {/* Onboarding Dialog */}
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="glass-card border-border sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">Welcome to Botvio!</DialogTitle>
                <DialogDescription>AI Trading Platform</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-muted-foreground">
              Botvio Sniper is a precise trading strategy that combines:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-success">✓</span>
                Support & Resistance zone detection
              </li>
              <li className="flex items-center gap-2">
                <span className="text-success">✓</span>
                Wick rejection analysis for sniper entries
              </li>
              <li className="flex items-center gap-2">
                <span className="text-success">✓</span>
                EMA 20 trend confirmation filter
              </li>
            </ul>

            <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Trading involves risk. Past performance does not guarantee future results. 
                Only trade with money you can afford to lose.
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <Button 
              variant="gold" 
              className="flex-1"
              onClick={() => {
                handleCloseOnboarding();
                navigate('/learn');
              }}
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              View Full Training
            </Button>
            <Button variant="outline" onClick={handleCloseOnboarding}>
              Start Trading
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
