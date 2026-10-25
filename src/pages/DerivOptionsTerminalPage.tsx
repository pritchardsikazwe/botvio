import { useState } from "react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { useDeriv } from "@/contexts/DerivContext";
import { DerivConnectionPanel } from "@/components/broker/DerivConnectionPanel";
import { AccountSwitcher } from "@/components/trading/AccountSwitcher";
import { DerivTradePanel } from "@/components/deriv-app/DerivTradePanel";
import { DerivTradeHistory } from "@/components/deriv-app/DerivTradeHistory";
import { AutoTradePanel } from "@/components/trading/AutoTradePanel";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EngineType } from "@/lib/signalEngines";
import { ArrowRight, Bot, History, LineChart, ShieldCheck, Wallet } from "lucide-react";

const CONTRACTS: { styleId: string; engine: EngineType; label: string; hint: string }[] = [
  { styleId: "rise-fall-scalping", engine: "rise_fall", label: "Rise / Fall", hint: "Up or down" },
  { styleId: "digit-contracts", engine: "match_differ", label: "Digits", hint: "Match, Over/Under, Even/Odd" },
  { styleId: "ticks", engine: "ticks", label: "Ticks", hint: "1–5 tick trades" },
  { styleId: "higher-lower", engine: "higher_lower", label: "Higher / Lower", hint: "Barrier price" },
  { styleId: "touch-no-touch", engine: "higher_lower", label: "Touch", hint: "Touch / No touch" },
  { styleId: "multipliers", engine: "multipliers", label: "Multipliers", hint: "Up/Down with SL/TP" },
  { styleId: "accumulators", engine: "accumulators", label: "Accumulators", hint: "Steady growth" },
  { styleId: "turbo", engine: "turbo", label: "Turbo", hint: "Short breakouts" },
  { styleId: "boom-crash", engine: "boom_crash", label: "Boom / Crash", hint: "Spike markets" },
];

const AUTO_MARKETS = [
  "R_10", "R_25", "R_50", "R_75", "R_100", "1HZ10V", "1HZ25V", "1HZ50V", "1HZ75V", "1HZ100V",
  "BOOM500", "BOOM1000", "CRASH500", "CRASH1000",
].map(s => ({ displaySymbol: s, label: s.replace("R_", "Volatility ").replace("1HZ", "Volatility ").replace(/V$/, " (1s)") }));

type Tab = "trade" | "auto" | "history";

export default function DerivOptionsTerminalPage() {
  const { user } = useAuth();
  const { isDerivConnected, accountId, balance, derivTokens, switchDerivToken, removeDerivToken } = useDeriv();
  const [tab, setTab] = useState<Tab>("trade");
  const [contract, setContract] = useState(CONTRACTS[0].styleId);
  const [showAccounts, setShowAccounts] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const active = CONTRACTS.find(c => c.styleId === contract) ?? CONTRACTS[0];

  return (
    <div className="min-h-screen bg-background pb-16">
      <SEOHead
        title="Deriv Options Terminal — Trade & Automate | BOTVIO"
        description="One BOTVIO page for Deriv Options: connect your Deriv account, trade Rise/Fall, Digits, Multipliers, Accumulators and more, run the auto bot and see your trades."
      />
      <Header />
      <main className="container mx-auto max-w-6xl px-3 py-4 md:px-4 md:py-6 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-black">Deriv Options</h1>
            <p className="text-sm text-muted-foreground">Connect, trade every contract type and run the bot — all on one page.</p>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn(isDerivConnected ? "border-success/30 bg-success/10 text-success" : "text-muted-foreground")}>
                {isDerivConnected ? `Connected${accountId ? ` · ${accountId}` : ""}` : "Not connected"}
              </Badge>
              {balance && <span className="text-sm font-bold tabular-nums">{balance.currency} {balance.balance.toFixed(2)}</span>}
              {isDerivConnected && (
                <Button size="sm" variant="outline" onClick={() => setShowAccounts(v => !v)}>
                  <Wallet className="h-4 w-4 mr-1" /> Accounts
                </Button>
              )}
            </div>
          )}
        </div>

        {!user ? (
          <Card><CardContent className="p-6 text-center space-y-3">
            <p className="font-semibold">Sign in to connect your Deriv account and start trading.</p>
            <Button size="lg" onClick={() => setAuthOpen(true)}>Sign in <ArrowRight className="h-4 w-4 ml-1" /></Button>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><ShieldCheck className="h-3 w-3" /> Secure Deriv sign-in</p>
          </CardContent></Card>
        ) : (
          <>
            {(!isDerivConnected || showAccounts) && (
              <Card><CardContent className="p-4 space-y-4">
                {!isDerivConnected && (
                  <div>
                    <p className="font-bold">Step 1 · Connect your Deriv account</p>
                    <p className="text-xs text-muted-foreground">Use a demo account first. Trades open on your own Deriv account.</p>
                  </div>
                )}
                {derivTokens.length > 0 && (
                  <AccountSwitcher tokens={derivTokens} onActivate={switchDerivToken} onRemove={removeDerivToken} />
                )}
                <DerivConnectionPanel />
              </CardContent></Card>
            )}

            <div className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-muted/30 p-1">
              {([["trade", "Trade", LineChart], ["auto", "Auto bot", Bot], ["history", "My trades", History]] as const).map(([id, label, Icon]) => (
                <button key={id} type="button" onClick={() => setTab(id)}
                  className={cn("flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-colors",
                    tab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>

            <ErrorBoundary>
              {tab === "trade" && (
                <div className="space-y-3">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {CONTRACTS.map(c => (
                      <button key={c.styleId} type="button" onClick={() => setContract(c.styleId)}
                        className={cn("min-w-[120px] shrink-0 rounded-xl border p-2.5 text-left transition-colors",
                          contract === c.styleId ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40")}>
                        <div className="text-sm font-bold">{c.label}</div>
                        <div className="text-[11px] text-muted-foreground">{c.hint}</div>
                      </button>
                    ))}
                  </div>
                  <DerivTradePanel key={active.styleId} styleId={active.styleId} engine={active.engine} />
                </div>
              )}
              {tab === "auto" && <AutoTradePanel scope="Deriv Options" availableAssets={AUTO_MARKETS} />}
              {tab === "history" && <DerivTradeHistory />}
            </ErrorBoundary>
          </>
        )}
      </main>
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
}
