import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { TradeModesGrid } from "@/components/trading/TradeModesGrid";

const TradeModes = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Trade Modes" description="Choose your trading style — Digits, Multipliers, Rise/Fall, Boom/Crash and more" />
      <Header />
      <main className="container mx-auto px-4 py-6">
        <TradeModesGrid />
      </main>
    </div>
  );
};

export default TradeModes;
