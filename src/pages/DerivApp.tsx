import { useState } from "react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { useDeriv } from "@/contexts/DerivContext";
import { DerivConnectionPanel } from "@/components/broker/DerivConnectionPanel";
import { AccountSwitcher } from "@/components/trading/AccountSwitcher";
import { DerivTradePanel } from "@/components/deriv-app/DerivTradePanel";
import { SignalEngineTab } from "@/components/deriv-app/SignalEngineTab";
import { CopyTradingTab } from "@/components/deriv-app/CopyTradingTab";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Wifi, TrendingUp, Layers, Radar, Users, Wallet, ShieldCheck, ArrowRight,
} from "lucide-react";

type TabId = "account" | "rise-fall" | "multipliers" | "signals" | "copy";

const TABS: { id: TabId; label: string; icon: typeof Wifi }[] = [
  { id: "account", label: "Account", icon: Wifi },
  { id: "rise-fall", label: "Rise/Fall", icon: TrendingUp },
  { id: "multipliers", label: "Multipliers", icon: Layers },
  { id: "signals", label: "Signals", icon: Radar },
  { id: "copy", label: "Copy", icon: Users },
];

const DerivApp = () => {
  const { user } = useAuth();
  const { isDerivConnected, accountId, balance, equity, derivTokens, switchDerivToken, removeDerivToken } = useDeriv();
  const [tab, setTab] = useState<TabId>("account");
  const [authOpen, setAuthOpen] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead
          title="Deriv Options App | Botvio"
          description="Trade Deriv Rise/Fall and Multipliers, run the Botvio signal engine and manage copy trading followers from one app-style dashboard."
        />
        <Header />
        <main className="container mx-auto max-w-lg px-4 py-16 space-y-6">
          <h1 className="text-3xl font-black text-center">Botvio Deriv App</h1>
          <p className="text-center text-muted-foreground text-sm">
            Sign in to open your Deriv workspace — Rise/Fall, Multipliers, the signal engine and copy trading in one place.
          </p>
          <Card className="glass-card">
            <CardContent className="p-5 space-y-3">
              <Button className="w-full" size="lg" onClick={() => setAuthOpen(true)}>
                Sign in to continue <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
              <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Secure OAuth or API token connection
              </p>
            </CardContent>
          </Card>
        </main>
        <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <SEOHead
        title="Deriv Options App | Botvio"
        description="Your Deriv workspace: Rise/Fall, Multipliers, live signal engine and copy trading followers in one app-style dashboard."
      />
      <Header />

      {/* App status bar */}
      <div className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="container mx-auto max-w-3xl px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] text-muted-foreground">Deriv balance</p>
            <p className="text-lg font-bold tabular-nums">
              {balance ? `${balance.currency} ${balance.balance.toFixed(2)}` : "—"}
            </p>
          </div>
          <div className="text-right">
            <Badge
              variant="outline"
              className={cn("text-[10px]", isDerivConnected
                ? "bg-success/10 text-success border-success/20"
                : "bg-muted text-muted-foreground")}
            >
              {isDerivConnected ? `Deriv Connected${accountId ? ` · ${accountId}` : ""}` : "Not connected"}
            </Badge>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Equity {equity ? equity.toFixed(2) : "0.00"}
            </p>
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-3xl px-4 py-5">
        {tab === "account" && (
          <div className="space-y-4">
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-primary" /> Your Deriv accounts
                </CardTitle>
                <CardDescription className="text-xs">
                  Switch between demo and real accounts, or link another one below.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {derivTokens.length > 0 ? (
                  <AccountSwitcher
                    tokens={derivTokens}
                    onActivate={switchDerivToken}
                    onRemove={removeDerivToken}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">No linked accounts yet — connect one below.</p>
                )}
              </CardContent>
            </Card>

            <DerivConnectionPanel />

            <Card className="glass-card">
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Full connections manager</p>
                  <p className="text-xs text-muted-foreground">MT5 bridge, saved connections and more.</p>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/connections">Open</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {tab === "rise-fall" && <DerivTradePanel styleId="rise-fall-scalping" engine="rise_fall" />}
        {tab === "multipliers" && <DerivTradePanel styleId="multipliers" engine="multipliers" />}
        {tab === "signals" && <SignalEngineTab />}
        {tab === "copy" && <CopyTradingTab />}
      </main>

      {/* App-style bottom tab bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur">
        <div className="container mx-auto max-w-3xl grid grid-cols-5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                tab === id ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn("h-5 w-5", tab === id && "scale-110 transition-transform")} />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default DerivApp;