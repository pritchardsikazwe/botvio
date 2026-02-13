import { useState, useEffect } from "react";
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
import { HomeSignalsWidget } from "@/components/signals/HomeSignalsWidget";
import { ChartUpload } from "@/components/signals/ChartUpload";
import { TradingHelpPanel } from "@/components/trading/TradingGuide";
import { MarketData } from "@/types/trading";
import { useAuth } from "@/contexts/AuthContext";
import { useDeriv } from "@/contexts/DerivContext";

const Trading = () => {
  const { settings } = useAuth();
  const { authorized, lastTick, subscribeTicks, unsubscribeTicks } = useDeriv();
  const [selectedPair, setSelectedPair] = useState("");

  useEffect(() => {
    if (settings?.default_pair) setSelectedPair(settings.default_pair);
  }, [settings]);

  useEffect(() => {
    if (authorized && selectedPair) subscribeTicks(selectedPair);
    return () => { if (authorized) unsubscribeTicks(selectedPair); };
  }, [authorized, selectedPair, subscribeTicks, unsubscribeTicks]);

  const [marketData, setMarketData] = useState<MarketData>({
    pair: "XAUUSD", price: 2347.85, change24h: 1.23,
    high24h: 2365.40, low24h: 2328.15, volume: 125400000,
  });

  useEffect(() => {
    if (lastTick) {
      let displayPair = lastTick.symbol;
      if (lastTick.symbol.startsWith("frx")) displayPair = lastTick.symbol.replace("frx", "");
      else if (lastTick.symbol.startsWith("cry")) displayPair = lastTick.symbol.replace("cry", "");
      setMarketData(prev => ({ ...prev, pair: displayPair, price: lastTick.quote }));
    }
  }, [lastTick]);

  useEffect(() => {
    if (authorized) return;
    const interval = setInterval(() => {
      setMarketData(prev => ({
        ...prev,
        price: prev.price + (Math.random() - 0.5) * 2,
        change24h: prev.change24h + (Math.random() - 0.5) * 0.1,
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, [authorized]);

  const handleSymbolChange = (derivSymbol: string) => {
    let displayPair = derivSymbol;
    if (derivSymbol.startsWith("frx")) displayPair = derivSymbol.replace("frx", "");
    else if (derivSymbol.startsWith("cry")) displayPair = derivSymbol.replace("cry", "");
    setSelectedPair(displayPair);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Trading Workspace" description="Full trading workspace with pair selection, strategies, signals & AI analysis" noIndex />
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            <div className="glass-card p-4">
              <span className="data-label mb-3 block">Trading Pair</span>
              <PairSelector selectedPair={selectedPair} onPairChange={setSelectedPair} />
            </div>
            <DerivConnection onSymbolChange={handleSymbolChange} />
            <QuickTrade symbol={selectedPair} />
            <StrategyPanel />
            <TradingHelpPanel />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-6 space-y-6">
            <PriceDisplay data={marketData} />
            <SniperEntry pair={selectedPair} currentPrice={marketData.price} />
            <div className="glass-card p-6">
              <BotvioSniperPanel symbol={selectedPair} timeframe={settings?.default_timeframe || "M5"} />
            </div>
            <ChartUpload />
            <HomeSignalsWidget />
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            <SupportResistanceLevels levels={[]} currentPrice={marketData.price} />
            <PerformancePanel />
            <ActiveBotsWidget />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Trading;
