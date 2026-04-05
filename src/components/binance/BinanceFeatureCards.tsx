import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Coins, Rocket, Activity, BarChart3, Zap, Flame } from "lucide-react";

export const ArbitrageScanner = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-lg flex items-center gap-2">
        <ArrowUpDown className="h-5 w-5 text-primary" /> Arbitrage Scanner
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <p className="text-sm text-muted-foreground">Buy low on spot, sell higher on futures — real-time spread detection.</p>
      {[
        { pair: "BTC/USDT", spread: "+0.12%", status: "Active" },
        { pair: "ETH/USDT", spread: "+0.08%", status: "Active" },
        { pair: "SOL/USDT", spread: "+0.15%", status: "Hot" },
      ].map((item) => (
        <div key={item.pair} className="flex items-center justify-between bg-secondary/30 rounded-lg p-3">
          <span className="font-semibold text-sm">{item.pair}</span>
          <span className="text-emerald-500 font-mono text-sm">{item.spread}</span>
          <Badge variant={item.status === "Hot" ? "destructive" : "secondary"} className="text-xs">
            {item.status === "Hot" ? <Flame className="w-3 h-3 mr-1" /> : null}{item.status}
          </Badge>
        </div>
      ))}
      <p className="text-[10px] text-muted-foreground text-center">Live data requires Binance API connection</p>
    </CardContent>
  </Card>
);

export const StakingCard = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-lg flex items-center gap-2">
        <Coins className="h-5 w-5 text-yellow-500" /> Staking & Earn
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <p className="text-sm text-muted-foreground">Lock crypto → earn passive income. Best APY opportunities.</p>
      {[
        { coin: "ETH", apy: "3.2%", lock: "Flexible" },
        { coin: "BNB", apy: "5.8%", lock: "30 days" },
        { coin: "USDT", apy: "6.5%", lock: "60 days" },
        { coin: "SOL", apy: "7.1%", lock: "90 days" },
      ].map((s) => (
        <div key={s.coin} className="flex items-center justify-between bg-secondary/30 rounded-lg p-3">
          <span className="font-semibold text-sm">{s.coin}</span>
          <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">{s.apy} APY</Badge>
          <span className="text-xs text-muted-foreground">{s.lock}</span>
        </div>
      ))}
      <Button variant="outline" className="w-full text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/10" asChild>
        <a href="https://www.binance.com/en/earn" target="_blank" rel="noopener noreferrer">Explore on Binance <Coins className="ml-2 h-4 w-4" /></a>
      </Button>
    </CardContent>
  </Card>
);

export const LaunchpadCard = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-lg flex items-center gap-2">
        <Rocket className="h-5 w-5 text-purple-500" /> Launchpad & New Coins
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <p className="text-sm text-muted-foreground">Get early access to new token launches on Binance.</p>
      <div className="bg-gradient-to-r from-purple-500/10 to-primary/10 rounded-lg p-4 border border-purple-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Rocket className="h-5 w-5 text-purple-500" />
          <span className="font-bold">New Listing Alerts</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Botvio AI scans Binance announcements and alerts you to upcoming token launches before they go live.</p>
        <Badge variant="outline" className="text-purple-400 border-purple-400/30">Coming Soon</Badge>
      </div>
      <Button variant="outline" className="w-full text-purple-400 border-purple-400/30 hover:bg-purple-500/10" asChild>
        <a href="https://www.binance.com/en/launchpad" target="_blank" rel="noopener noreferrer">Binance Launchpad <Rocket className="ml-2 h-4 w-4" /></a>
      </Button>
    </CardContent>
  </Card>
);

export const ScalpingCard = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-lg flex items-center gap-2">
        <Activity className="h-5 w-5 text-emerald-500" /> AI Scalping Signals
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <p className="text-sm text-muted-foreground">Fast in-and-out trades powered by Botvio AI. High frequency, data-driven.</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <BarChart3 className="h-6 w-6 mx-auto mb-1 text-primary" />
          <p className="text-xs font-semibold">Win Rate Tracking</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <Zap className="h-6 w-6 mx-auto mb-1 text-yellow-500" />
          <p className="text-xs font-semibold">Sub-5min Trades</p>
        </div>
      </div>
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
        <p className="text-sm font-semibold text-emerald-500">Powered by Botvio AI Engine</p>
        <p className="text-xs text-muted-foreground">Gemini-driven analysis on 1H klines</p>
      </div>
    </CardContent>
  </Card>
);
