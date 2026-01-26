import { useState, useEffect } from "react";
import { Header } from "@/components/trading/Header";
import { PriceDisplay } from "@/components/trading/PriceDisplay";
import { SignalCard } from "@/components/trading/SignalCard";
import { SupportResistanceLevels } from "@/components/trading/SupportResistanceLevels";
import { TokenInput } from "@/components/trading/TokenInput";
import { PairSelector } from "@/components/trading/PairSelector";
import { SniperEntry } from "@/components/trading/SniperEntry";
import { StrategyPanel } from "@/components/trading/StrategyPanel";
import { Signal, SupportResistance, MarketData } from "@/types/trading";
import { TrendingUp, History, Zap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [selectedPair, setSelectedPair] = useState("XAUUSD");
  const [isConnected, setIsConnected] = useState(false);

  // Mock market data - would come from API
  const [marketData, setMarketData] = useState<MarketData>({
    pair: "XAUUSD",
    price: 2347.85,
    change24h: 1.23,
    high24h: 2365.40,
    low24h: 2328.15,
    volume: 125400000,
  });

  // Simulate price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(prev => ({
        ...prev,
        price: prev.price + (Math.random() - 0.5) * 2,
        change24h: prev.change24h + (Math.random() - 0.5) * 0.1,
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Mock signals
  const signals: Signal[] = [
    {
      id: '1',
      type: 'BUY',
      pair: 'XAUUSD',
      entry: 2345.50,
      stopLoss: 2340.00,
      takeProfit: [2355.00, 2365.00, 2380.00],
      confidence: 92,
      timestamp: new Date(),
      strategy: 'Hauza Sniper Entry',
      status: 'ACTIVE',
    },
    {
      id: '2',
      type: 'SELL',
      pair: 'XAUUSD',
      entry: 2368.00,
      stopLoss: 2375.00,
      takeProfit: [2355.00, 2340.00],
      confidence: 78,
      timestamp: new Date(Date.now() - 3600000),
      strategy: 'S/R Resistance Break',
      status: 'CLOSED',
    },
  ];

  // Mock S/R levels
  const srLevels: SupportResistance[] = [
    { level: 2380.00, type: 'RESISTANCE', strength: 'STRONG', touches: 5 },
    { level: 2365.00, type: 'RESISTANCE', strength: 'MODERATE', touches: 3 },
    { level: 2340.00, type: 'SUPPORT', strength: 'STRONG', touches: 4 },
    { level: 2320.00, type: 'SUPPORT', strength: 'WEAK', touches: 2 },
  ];

  const handleTokenSubmit = (token: string) => {
    setIsConnected(true);
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
            <StrategyPanel />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-6 space-y-6">
            <PriceDisplay data={marketData} />
            <SniperEntry pair={selectedPair} currentPrice={marketData.price} />

            <div className="glass-card p-6">
              <Tabs defaultValue="active" className="w-full">
                <TabsList className="w-full grid grid-cols-3 bg-secondary/50">
                  <TabsTrigger value="active" className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Active
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Pending
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center gap-2">
                    <History className="w-4 h-4" />
                    History
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="active" className="mt-4 space-y-4">
                  {signals.filter(s => s.status === 'ACTIVE').map(signal => (
                    <SignalCard key={signal.id} signal={signal} />
                  ))}
                </TabsContent>
                
                <TabsContent value="pending" className="mt-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No pending signals</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="history" className="mt-4 space-y-4">
                  {signals.filter(s => s.status === 'CLOSED').map(signal => (
                    <SignalCard key={signal.id} signal={signal} />
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            <SupportResistanceLevels levels={srLevels} currentPrice={marketData.price} />
            
            {/* Quick Stats */}
            <div className="glass-card p-6">
              <span className="data-label mb-4 block">Performance</span>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-success/10 rounded-xl">
                  <p className="text-2xl font-bold text-success">87%</p>
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                </div>
                <div className="text-center p-4 bg-primary/10 rounded-xl">
                  <p className="text-2xl font-bold text-primary">156</p>
                  <p className="text-xs text-muted-foreground">Total Trades</p>
                </div>
                <div className="text-center p-4 bg-secondary rounded-xl">
                  <p className="text-2xl font-bold">2.3</p>
                  <p className="text-xs text-muted-foreground">Risk Ratio</p>
                </div>
                <div className="text-center p-4 bg-secondary rounded-xl">
                  <p className="text-2xl font-bold text-success">+$12.4K</p>
                  <p className="text-xs text-muted-foreground">Profit</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
