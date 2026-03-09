import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { TradeModesGrid } from "@/components/trading/TradeModesGrid";

const TradeModes = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Trade Modes — Digits, Multipliers, Rise/Fall & Boom/Crash" description="Explore 8+ trading modes on Botvio including Digits, Multipliers, Rise/Fall, Higher/Lower, Boom/Crash, Ticks, Accumulators & Turbo. Each mode has a dedicated Hauza Sniper strategy guide with entry rules and risk management." />
      <Header />
      <main className="container mx-auto px-4 py-6">
        <TradeModesGrid />
      </main>
    </div>
  );
};

export default TradeModes;
