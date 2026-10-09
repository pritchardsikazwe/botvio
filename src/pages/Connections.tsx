import { AuthModal } from "@/components/auth/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Header } from "@/components/trading/Header";
import { TradingConnectionsCenter } from "@/components/tradecopy/TradingConnectionsCenter";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

const Connections = () => {
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-6xl space-y-4 px-3 py-5 sm:px-4 sm:py-6">
        {!user ? (
          <section className="mx-auto max-w-xl rounded-2xl border border-border/60 bg-card p-6 text-center sm:p-8">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Connect your trading account</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to connect your MT5 account, choose your Botvio trading source and control automated copying.
            </p>
            <Button className="mt-5" onClick={() => setAuthOpen(true)}>Sign in / Create account</Button>
          </section>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Trading setup</h1>
              <p className="mt-1 text-sm text-muted-foreground">Connect once. Choose your markets. Start or pause your robot when you want.</p>
            </div>
            <TradingConnectionsCenter />
          </>
        )}
      </main>
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
};

export default Connections;
