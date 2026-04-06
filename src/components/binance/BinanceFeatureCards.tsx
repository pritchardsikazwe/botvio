import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Coins, Rocket, Activity, BarChart3, Zap, Flame, TrendingUp, TrendingDown, Loader2, RefreshCw } from "lucide-react";

const BINANCE_AFFILIATE = "https://www.binance.com/activity/referral-entry/CPA?ref=CPA_0047GJ3KHU";

// ─── Live Arbitrage Scanner ───
interface SpreadData {
  pair: string;
  spotPrice: number;
  futuresPrice: number;
  spread: number;
  status: string;
}

function useArbitrageData() {
  const [data, setData] = useState<SpreadData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const pairs = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT"];
      const [spotRes, futuresRes] = await Promise.all([
        fetch("https://api.binance.com/api/v3/ticker/price?" + pairs.map(p => `symbols=["${pairs.join('","')}"]`).slice(0, 1)),
        fetch("https://fapi.binance.com/fapi/v1/ticker/price"),
      ]);
      
      const spotAll: any[] = await spotRes.json();
      const futuresAll: any[] = await futuresRes.json();
      
      const spotMap = new Map<string, number>();
      if (Array.isArray(spotAll)) spotAll.forEach((s: any) => spotMap.set(s.symbol, parseFloat(s.price)));
      
      const futuresMap = new Map<string, number>();
      if (Array.isArray(futuresAll)) futuresAll.forEach((f: any) => futuresMap.set(f.symbol, parseFloat(f.price)));

      const spreads: SpreadData[] = pairs.map(pair => {
        const spot = spotMap.get(pair) || 0;
        const futures = futuresMap.get(pair) || 0;
        const spread = spot > 0 ? ((futures - spot) / spot) * 100 : 0;
        return {
          pair: pair.replace("USDT", "/USDT"),
          spotPrice: spot,
          futuresPrice: futures,
          spread,
          status: Math.abs(spread) > 0.1 ? "Hot" : "Active",
        };
      }).filter(s => s.spotPrice > 0);

      setData(spreads.sort((a, b) => Math.abs(b.spread) - Math.abs(a.spread)));
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading, refetch: fetchData };
}

export const ArbitrageScanner = () => {
  const { data, loading, refetch } = useArbitrageData();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5 text-primary" /> Arbitrage Scanner
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={refetch}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">Spot vs Futures spread detection — live from Binance.</p>
        {loading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading live spreads…
          </div>
        ) : data.length > 0 ? (
          data.map((item) => (
            <div key={item.pair} className="flex items-center justify-between bg-secondary/30 rounded-lg p-3">
              <span className="font-semibold text-sm">{item.pair}</span>
              <span className={`font-mono text-sm font-semibold ${item.spread >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {item.spread >= 0 ? "+" : ""}{item.spread.toFixed(3)}%
              </span>
              <Badge variant={item.status === "Hot" ? "destructive" : "secondary"} className="text-xs">
                {item.status === "Hot" ? <Flame className="w-3 h-3 mr-1" /> : null}{item.status}
              </Badge>
            </div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground text-center py-4">Unable to fetch spreads</p>
        )}
        <p className="text-[10px] text-muted-foreground text-center">Auto-refreshes every 30s</p>
      </CardContent>
    </Card>
  );
};

// ─── Live Scalping Signals ───
interface ScalpSignal {
  symbol: string;
  display: string;
  signal: "BUY" | "SELL" | "WAIT";
  strength: number;
  change: number;
  price: number;
  volume: number;
}

function useScalpingSignals() {
  const [signals, setSignals] = useState<ScalpSignal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSignals = async () => {
    try {
      const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "DOGEUSDT", "AVAXUSDT", "ADAUSDT"];
      
      const klinePromises = symbols.map(s =>
        fetch(`https://api.binance.com/api/v3/klines?symbol=${s}&interval=5m&limit=20`)
          .then(r => r.json())
          .catch(() => [])
      );
      
      const tickerRes = await fetch("https://api.binance.com/api/v3/ticker/24hr");
      const tickers: any[] = await tickerRes.json();
      const tickerMap = new Map<string, any>();
      if (Array.isArray(tickers)) tickers.forEach(t => tickerMap.set(t.symbol, t));
      
      const allKlines = await Promise.all(klinePromises);
      
      const results: ScalpSignal[] = symbols.map((sym, i) => {
        const klines = allKlines[i];
        const ticker = tickerMap.get(sym);
        if (!Array.isArray(klines) || klines.length < 10) {
          return { symbol: sym, display: sym.replace("USDT", "/USDT"), signal: "WAIT" as const, strength: 0, change: 0, price: 0, volume: 0 };
        }
        
        const closes = klines.map((k: any) => parseFloat(k[4]));
        const volumes = klines.map((k: any) => parseFloat(k[5]));
        
        // EMA
        const ema = (data: number[], period: number) => {
          const k = 2 / (period + 1);
          let r = data[0];
          for (let j = 1; j < data.length; j++) r = data[j] * k + r * (1 - k);
          return r;
        };
        
        const ema5 = ema(closes, 5);
        const ema10 = ema(closes, 10);
        
        // RSI
        let gains = 0, losses = 0;
        for (let j = 1; j < closes.length; j++) {
          const diff = closes[j] - closes[j - 1];
          if (diff > 0) gains += diff; else losses -= diff;
        }
        const rs = losses === 0 ? 100 : gains / losses;
        const rsi = 100 - (100 / (1 + rs));
        
        // Volume spike
        const avgVol = volumes.slice(0, -1).reduce((a, b) => a + b, 0) / (volumes.length - 1);
        const volSpike = volumes[volumes.length - 1] / avgVol;
        
        let score = 0;
        score += ema5 > ema10 ? 2 : -2;
        score += rsi > 55 ? 1 : rsi < 45 ? -1 : 0;
        score += rsi > 70 ? -2 : rsi < 30 ? 2 : 0;
        score += volSpike > 1.5 ? (ema5 > ema10 ? 1 : -1) : 0;
        
        const currentPrice = closes[closes.length - 1];
        const priceChange = ticker ? parseFloat(ticker.priceChangePercent) : 0;
        const vol24h = ticker ? parseFloat(ticker.quoteVolume) : 0;
        
        let signal: "BUY" | "SELL" | "WAIT";
        let strength: number;
        
        if (score >= 3) {
          signal = "BUY";
          strength = Math.min(Math.round(score / 6 * 100), 95);
        } else if (score <= -3) {
          signal = "SELL";
          strength = Math.min(Math.round(Math.abs(score) / 6 * 100), 95);
        } else {
          signal = "WAIT";
          strength = Math.round(Math.abs(score) / 6 * 100);
        }
        
        return { symbol: sym, display: sym.replace("USDT", "/USDT"), signal, strength, change: priceChange, price: currentPrice, volume: vol24h };
      });
      
      setSignals(results);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 30000);
    return () => clearInterval(interval);
  }, []);

  return { signals, loading, refetch: fetchSignals };
}

export const ScalpingCard = () => {
  const { signals, loading, refetch } = useScalpingSignals();
  const buyCount = signals.filter(s => s.signal === "BUY").length;
  const sellCount = signals.filter(s => s.signal === "SELL").length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-500" /> AI Scalping Signals
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={refetch}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">Live momentum-based scalping signals — EMA + RSI + Volume analysis on 5m klines.</p>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 text-center">
            <TrendingUp className="h-4 w-4 mx-auto text-emerald-500 mb-1" />
            <p className="text-lg font-bold text-emerald-500">{buyCount}</p>
            <p className="text-[10px] text-muted-foreground">Buy Signals</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-center">
            <TrendingDown className="h-4 w-4 mx-auto text-red-500 mb-1" />
            <p className="text-lg font-bold text-red-500">{sellCount}</p>
            <p className="text-[10px] text-muted-foreground">Sell Signals</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-2 text-center">
            <Zap className="h-4 w-4 mx-auto text-yellow-500 mb-1" />
            <p className="text-lg font-bold">{signals.length}</p>
            <p className="text-[10px] text-muted-foreground">Tracked</p>
          </div>
        </div>
        
        {/* Live Signals */}
        {loading ? (
          <div className="flex items-center justify-center py-4 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Scanning markets…
          </div>
        ) : (
          <div className="space-y-2 max-h-[260px] overflow-y-auto">
            {signals.map((s) => (
              <div key={s.symbol} className="flex items-center justify-between bg-secondary/30 rounded-lg p-2.5">
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">{s.display}</span>
                  <span className={`text-[10px] font-mono ${s.change >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {s.change >= 0 ? "+" : ""}{s.change.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={s.signal === "BUY" ? "default" : s.signal === "SELL" ? "destructive" : "secondary"}
                    className={`text-xs font-bold ${s.signal === "BUY" ? "bg-emerald-500 hover:bg-emerald-600" : ""}`}
                  >
                    {s.signal === "BUY" ? <TrendingUp className="w-3 h-3 mr-1" /> : s.signal === "SELL" ? <TrendingDown className="w-3 h-3 mr-1" /> : null}
                    {s.signal}
                  </Badge>
                  <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">{s.strength}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
          <p className="text-sm font-semibold text-emerald-500">Powered by Botvio AI Engine</p>
          <p className="text-xs text-muted-foreground">EMA crossover + RSI + Volume spike analysis on 5m klines</p>
        </div>
        <p className="text-[10px] text-muted-foreground text-center">Auto-refreshes every 30s • Not financial advice</p>
      </CardContent>
    </Card>
  );
};

// ─── Staking Card (unchanged but with affiliate) ───
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
        <a href={BINANCE_AFFILIATE} target="_blank" rel="noopener noreferrer">Explore on Binance <Coins className="ml-2 h-4 w-4" /></a>
      </Button>
    </CardContent>
  </Card>
);

// ─── Launchpad Card ───
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
        <a href={BINANCE_AFFILIATE} target="_blank" rel="noopener noreferrer">Binance Launchpad <Rocket className="ml-2 h-4 w-4" /></a>
      </Button>
    </CardContent>
  </Card>
);
