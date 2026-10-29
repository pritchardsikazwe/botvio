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
import { Link } from "react-router-dom";
import { ArrowRight, Bot, History, Home, Lightbulb, LineChart, ShieldCheck, Wallet } from "lucide-react";

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

const TIPS: Record<string, { markets: string; timeframe: string; tips: string[] }> = {
  "rise-fall-scalping": { markets: "Volatility 10/25/50 (1s), Volatility 75", timeframe: "5–10 ticks or 1–5 minutes", tips: ["Trade with the short-term trend: 3+ ticks in one direction before entry.", "Avoid entering right after a big spike — wait for 2–3 calm ticks.", "Use the same stake each trade; never double after a loss."] },
  "digit-contracts": { markets: "Volatility 10 (1s), Volatility 100 (1s)", timeframe: "1 tick (Over/Under: 1–5 ticks)", tips: ["Even/Odd and Matches/Differs are close to random — keep stakes small.", "Differs pays little but wins often; Matches pays big but rarely wins.", "Over 2 / Under 7 balance win rate and payout better than extreme barriers."] },
  "ticks": { markets: "Volatility 10/25 (1s)", timeframe: "1–5 ticks", tips: ["Shorter ticks = more noise; 5 ticks gives trends time to show.", "Only trade when the live chart shows a clear direction.", "Stop after 3 losses in a row and review."] },
  "higher-lower": { markets: "Volatility 50/75/100", timeframe: "3–15 minutes", tips: ["Barriers further away pay more but win less often.", "Place the barrier on the side of the current trend.", "Longer durations suit higher-volatility indices."] },
  "touch-no-touch": { markets: "Volatility 75/100, Jump indices", timeframe: "5 ticks – 5 minutes", tips: ["Touch suits high-volatility markets; No Touch suits calm ones.", "Check the recent range before setting the barrier.", "Avoid Touch on Volatility 10 — moves are too small."] },
  "multipliers": { markets: "Volatility 75/100, Boom/Crash", timeframe: "Minutes to hours, managed by SL/TP", tips: ["Always set Stop Loss and Take Profit before buying.", "Lower multipliers (x20–x100) give price room to breathe.", "Close manually if the trend reverses — don't wait for stop out."] },
  "accumulators": { markets: "Volatility 10/25 (calm markets)", timeframe: "Seconds; take profit early", tips: ["Use 1–2% growth rate — higher rates knock out faster.", "Take profit after a few ticks; greed is the main risk.", "Avoid during fast or spiky movement."] },
  "turbo": { markets: "Volatility 75/100", timeframe: "15 seconds – 5 minutes", tips: ["Turbo works on clear breakouts — wait for price to leave a range.", "Barrier further away = cheaper but easier to knock out.", "Keep stakes small; turbos can lose the full stake quickly."] },
  "boom-crash": { markets: "Boom 500/1000, Crash 500/1000", timeframe: "5-minute bias, short holds", tips: ["Boom spikes up, Crash spikes down — trade the spike direction only.", "Spikes are unpredictable in timing; never use large stakes.", "Exit after the spike; the drift between spikes runs the other way."] },
};

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
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm" variant="outline"><Link to="/"><Home className="h-4 w-4 mr-1" /> Home</Link></Button>
          {user && (
            <>
              <Badge variant="outline" className={cn(isDerivConnected ? "border-success/30 bg-success/10 text-success" : "text-muted-foreground")}>
                {isDerivConnected ? `Connected${accountId ? ` · ${accountId}` : ""}` : "Not connected"}
              </Badge>
              {balance && <span className="text-sm font-bold tabular-nums">{balance.currency} {balance.balance.toFixed(2)}</span>}
              {isDerivConnected && (
                <Button size="sm" variant="outline" onClick={() => setShowAccounts(v => !v)}>
                  <Wallet className="h-4 w-4 mr-1" /> Accounts
                </Button>
              )}
            </>
          )}
          </div>
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
                  {TIPS[active.styleId] && (
                    <Card className="border-primary/20 bg-primary/5"><CardContent className="p-3 space-y-2">
                      <div className="flex items-center gap-2 text-sm font-bold"><Lightbulb className="h-4 w-4 text-primary" /> {active.label} tips</div>
                      <div className="grid gap-2 sm:grid-cols-2 text-xs">
                        <div className="rounded-lg bg-background/60 p-2"><span className="text-muted-foreground">Suggested markets</span><p className="font-semibold">{TIPS[active.styleId].markets}</p></div>
                        <div className="rounded-lg bg-background/60 p-2"><span className="text-muted-foreground">Suggested duration</span><p className="font-semibold">{TIPS[active.styleId].timeframe}</p></div>
                      </div>
                      <ul className="list-disc pl-4 space-y-0.5 text-xs text-muted-foreground">{TIPS[active.styleId].tips.map(t => <li key={t}>{t}</li>)}</ul>
                      <p className="text-[10px] text-muted-foreground">Educational guidance only — no result is guaranteed. Practise on demo first and risk only 1–2% per trade.</p>
                    </CardContent></Card>
                  )}
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
