import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { DerivOptionsTradingTerminal } from "@/components/trading/DerivOptionsTradingTerminal";

export default function DerivOptionsTerminalPage() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Deriv Options Terminal — Free Live Trading | BOTVIO"
        description="BOTVIO's free Deriv Options terminal with live synthetic markets, exact 2026 Deriv symbols, strategy analysis, demo and real account trading, and optional auto-trading."
      />
      <Header />
      <main className="container mx-auto max-w-7xl px-3 py-4 md:px-4 md:py-6">
        <div className="mb-4">
          <h1 className="text-2xl md:text-3xl font-black">Deriv Options Terminal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Free BOTVIO terminal · connect your own Deriv account to trade.
          </p>
        </div>
        <DerivOptionsTradingTerminal />
      </main>
    </div>
  );
}
