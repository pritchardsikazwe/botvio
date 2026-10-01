import { ArrowRight, Bot, CheckCircle2, ExternalLink, Link2, Radio, ShieldCheck, Smartphone } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { STANDALONE_APPS, getStandaloneApp, getStandaloneAppFromHost, type StandaloneAppId } from "@/config/standaloneApps";
import GoldTradingHub from "@/pages/GoldTradingHub";
import BinanceHub from "@/pages/BinanceHub";
import SyntheticHub from "@/pages/SyntheticHub";
import WeltradeHub from "@/pages/WeltradeHub";
import CopyMarketplace from "@/pages/copy/CopyMarketplace";

export function StandaloneAppsHub() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Botvio Standalone Trading Apps" description="Botvio Gold, Crypto, Synthetic, Weltrade and Deriv Copy Trading apps powered by one shared platform." />
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 max-w-3xl">
          <Badge className="mb-3 gap-2 bg-primary/10 text-primary hover:bg-primary/10"><Bot className="h-3.5 w-3.5" /> BOTVIO APP SUITE</Badge>
          <h1 className="text-3xl font-black sm:text-4xl">Five focused trading apps. One Botvio source.</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Each product has its own standalone entry point and app identity, while all products reuse the same Botvio account, signal engine, MT5 Bridge, copy-trading infrastructure and backend.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {STANDALONE_APPS.map((app) => (
            <Card key={app.id} className="glass-card overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-2xl">{app.icon}</div>
                  <Badge variant="outline" className="text-[10px]">STANDALONE</Badge>
                </div>
                <h2 className={`mt-4 text-lg font-black ${app.accent}`}>{app.name}</h2>
                <p className="mt-2 min-h-10 text-xs leading-5 text-muted-foreground">{app.description}</p>
                <div className="mt-4 space-y-1.5 text-[11px] text-muted-foreground">
                  {["Same Botvio account", "Same AI/signal infrastructure", "Same MT5 Bridge & risk controls"].map((x) => <div key={x} className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-success" />{x}</div>)}
                </div>
                <Button className="mt-5 w-full" asChild><Link to={app.path}>Open {app.shortName}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="mt-6 border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="flex items-center gap-2 text-sm font-bold"><Smartphone className="h-4 w-4 text-primary" /> Install individually</p><p className="mt-1 text-xs text-muted-foreground">Open any standalone app URL on mobile and install it as a standalone PWA. No separate frontend codebase is required.</p></div>
            <Button variant="outline" asChild><Link to="/botvio-robot"><Link2 className="mr-2 h-4 w-4" /> Botvio Robot</Link></Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export function StandaloneApp({ appId }: { appId: StandaloneAppId }) {
  const app = getStandaloneApp(appId)!;
  const pages = {
    "gold-robot": GoldTradingHub,
    "crypto-robot": BinanceHub,
    "synthetic-robot": SyntheticHub,
    "weltrade-robot": WeltradeHub,
    "deriv-copy": CopyMarketplace,
  } as const;
  const Page = pages[appId];
  return <Page />;
}

export function HostStandaloneApp() {
  const app = getStandaloneAppFromHost(window.location.hostname);
  if (!app) return null;
  return <StandaloneApp appId={app.id} />;
}
