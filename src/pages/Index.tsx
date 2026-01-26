import { useState, useEffect } from "react";
import { Header } from "@/components/trading/Header";
import { PriceDisplay } from "@/components/trading/PriceDisplay";
import { SupportResistanceLevels } from "@/components/trading/SupportResistanceLevels";
import { TokenInput } from "@/components/trading/TokenInput";
import { PairSelector } from "@/components/trading/PairSelector";
import { SniperEntry } from "@/components/trading/SniperEntry";
import { StrategyPanel } from "@/components/trading/StrategyPanel";
import { HauzaSniperPanel } from "@/components/trading/HauzaSniperPanel";
import { PerformancePanel } from "@/components/trading/PerformancePanel";
import { DerivWalletBalance } from "@/components/trading/DerivWalletBalance";
import { QuickTrade } from "@/components/trading/QuickTrade";
import { SupportResistance, MarketData } from "@/types/trading";
import { useAuth } from "@/contexts/AuthContext";
import { useDeriv } from "@/contexts/DerivContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GraduationCap, Target, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { user, settings } = useAuth();
  const { authorized, lastTick, subscribeTicks, unsubscribeTicks } = useDeriv();
  const navigate = useNavigate();
  const [selectedPair, setSelectedPair] = useState("XAUUSD");
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
    if (lastTick && lastTick.symbol === selectedPair) {
      setMarketData(prev => ({
        ...prev,
        pair: lastTick.symbol,
        price: lastTick.quote,
      }));
    }
  }, [lastTick, selectedPair]);

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

  const handleTokenSubmit = (token: string) => {
    console.log('Connected to Deriv');
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
            
            <TokenInput onTokenSubmit={handleTokenSubmit} />
            <DerivWalletBalance />
            <QuickTrade symbol={selectedPair} />
            <StrategyPanel />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-6 space-y-6">
            <PriceDisplay data={marketData} />
            <SniperEntry pair={selectedPair} currentPrice={marketData.price} />

            {/* Hauza Sniper Signals Panel */}
            <div className="glass-card p-6">
              <HauzaSniperPanel 
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
                <DialogTitle className="text-xl">Welcome to Hauza Sniper!</DialogTitle>
                <DialogDescription>XAUUSD Trading Strategy</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-muted-foreground">
              Hauza Sniper is a precise trading strategy that combines:
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
    </div>
  );
};

export default Index;
