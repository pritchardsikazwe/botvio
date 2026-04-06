import { useEffect, useRef, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Lightbulb, ExternalLink, Loader2 } from "lucide-react";

const BINANCE_AFFILIATE = "https://www.binance.com/activity/referral-entry/CPA?ref=CPA_0047GJ3KHU";

interface CryptoInstrumentCardProps {
  symbol: string;
  displayName: string;
  tip: string;
}

type SignalType = "BUY" | "SELL" | "WAIT";

function useScalpingSignal(symbol: string) {
  const [prices, setPrices] = useState<number[]>([]);
  const [signal, setSignal] = useState<{ type: SignalType; strength: number; label: string } | null>(null);

  useEffect(() => {
    // Fetch recent klines (5m candles) for momentum analysis
    fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=5m&limit=20`)
      .then(r => r.json())
      .then((klines: any[]) => {
        if (!Array.isArray(klines)) return;
        const closes = klines.map((k: any) => parseFloat(k[4]));
        setPrices(closes);
      })
      .catch(() => {});
    
    const interval = setInterval(() => {
      fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=5m&limit=20`)
        .then(r => r.json())
        .then((klines: any[]) => {
          if (!Array.isArray(klines)) return;
          const closes = klines.map((k: any) => parseFloat(k[4]));
          setPrices(closes);
        })
        .catch(() => {});
    }, 30000);

    return () => clearInterval(interval);
  }, [symbol]);

  useEffect(() => {
    if (prices.length < 10) return;

    // EMA calculation
    const ema = (data: number[], period: number) => {
      const k = 2 / (period + 1);
      let result = data[0];
      for (let i = 1; i < data.length; i++) {
        result = data[i] * k + result * (1 - k);
      }
      return result;
    };

    const ema5 = ema(prices, 5);
    const ema10 = ema(prices, 10);
    const ema20 = ema(prices.length >= 20 ? prices : prices, Math.min(20, prices.length));

    // RSI calculation (simple)
    let gains = 0, losses = 0;
    for (let i = 1; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff > 0) gains += diff;
      else losses -= diff;
    }
    const rs = losses === 0 ? 100 : gains / losses;
    const rsi = 100 - (100 / (1 + rs));

    // Momentum score
    const currentPrice = prices[prices.length - 1];
    const priceVsEma5 = ((currentPrice - ema5) / ema5) * 100;
    const priceVsEma10 = ((currentPrice - ema10) / ema10) * 100;
    const emaAlignment = ema5 > ema10 ? 1 : -1;

    // Combined signal
    let score = 0;
    score += priceVsEma5 > 0.05 ? 2 : priceVsEma5 < -0.05 ? -2 : 0;
    score += priceVsEma10 > 0.05 ? 1 : priceVsEma10 < -0.05 ? -1 : 0;
    score += emaAlignment * 2;
    score += rsi > 60 ? 1 : rsi < 40 ? -1 : 0;
    score += rsi > 70 ? -1 : rsi < 30 ? 1 : 0; // Overbought/oversold reversal

    let type: SignalType;
    let strength: number;
    let label: string;

    if (score >= 3) {
      type = "BUY";
      strength = Math.min(score / 6 * 100, 95);
      label = strength > 70 ? "Strong Buy" : "Buy";
    } else if (score <= -3) {
      type = "SELL";
      strength = Math.min(Math.abs(score) / 6 * 100, 95);
      label = strength > 70 ? "Strong Sell" : "Sell";
    } else {
      type = "WAIT";
      strength = Math.abs(score) / 6 * 100;
      label = "Wait";
    }

    setSignal({ type, strength: Math.round(strength), label });
  }, [prices]);

  return signal;
}

export function CryptoInstrumentCard({ symbol, displayName, tip }: CryptoInstrumentCardProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [prevPrice, setPrevPrice] = useState<number | null>(null);
  const [change24h, setChange24h] = useState<number | null>(null);
  const scalpSignal = useScalpingSignal(symbol);

  useEffect(() => {
    fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`)
      .then(r => r.json())
      .then(d => {
        setPrice(parseFloat(d.lastPrice));
        setChange24h(parseFloat(d.priceChangePercent));
      })
      .catch(() => {});
  }, [symbol]);

  useEffect(() => {
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`);
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        const p = parseFloat(data.p);
        setPrice((prev) => {
          setPrevPrice(prev);
          return p;
        });
      } catch {}
    };
    ws.onerror = () => {};
    return () => ws.close();
  }, [symbol]);

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.async = true;
    script.type = "text/javascript";
    script.innerHTML = JSON.stringify({
      symbol: `BINANCE:${symbol}`,
      width: "100%",
      height: 160,
      locale: "en",
      dateRange: "1D",
      colorTheme: "dark",
      isTransparent: true,
      autosize: false,
      largeChartUrl: "",
      noTimeScale: false,
    });
    chartRef.current.appendChild(script);
  }, [symbol]);

  const isUp = price !== null && prevPrice !== null && price >= prevPrice;
  const changeColor = price !== null && prevPrice !== null ? (isUp ? "text-emerald-500" : "text-red-500") : "text-muted-foreground";

  const signalColor = scalpSignal?.type === "BUY" ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-500" 
    : scalpSignal?.type === "SELL" ? "bg-red-500/15 border-red-500/40 text-red-500" 
    : "bg-yellow-500/15 border-yellow-500/40 text-yellow-500";

  return (
    <Card className="overflow-hidden border-border/50 hover:border-primary/30 transition-colors">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">{displayName}</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">SPOT</Badge>
            {change24h !== null && (
              <span className={`text-[10px] font-mono font-semibold ${change24h >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {change24h >= 0 ? "+" : ""}{change24h.toFixed(2)}%
              </span>
            )}
          </div>
          <div className={`flex items-center gap-1 font-mono text-sm font-semibold ${changeColor}`}>
            {price !== null ? (
              <>
                {prevPrice !== null && (isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />)}
                ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: price < 1 ? 6 : 2 })}
              </>
            ) : (
              <span className="text-muted-foreground text-xs animate-pulse">Loading…</span>
            )}
          </div>
        </div>

        {/* Scalping Signal Badge */}
        <div className="px-4 py-1.5">
          {scalpSignal ? (
            <div className={`flex items-center justify-between rounded-lg border px-3 py-2 ${signalColor}`}>
              <div className="flex items-center gap-2">
                {scalpSignal.type === "BUY" ? <TrendingUp className="w-4 h-4" /> : scalpSignal.type === "SELL" ? <TrendingDown className="w-4 h-4" /> : <Loader2 className="w-4 h-4" />}
                <span className="font-bold text-sm">{scalpSignal.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-background/50 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-current" style={{ width: `${scalpSignal.strength}%` }} />
                </div>
                <span className="text-[10px] font-mono font-bold">{scalpSignal.strength}%</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-border/50 px-3 py-2 text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="text-xs">Analyzing...</span>
            </div>
          )}
        </div>

        {/* Chart */}
        <div ref={chartRef} className="h-[160px] overflow-hidden" />

        {/* Tip */}
        <div className="px-4 pb-2 pt-1">
          <div className="flex items-start gap-2 bg-secondary/40 rounded-lg p-2.5">
            <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">{tip}</p>
          </div>
        </div>

        {/* Trade Now Button */}
        <div className="px-4 pb-3">
          <Button size="sm" className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-xs" asChild>
            <a href={`${BINANCE_AFFILIATE}&symbol=${symbol}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Trade {displayName} on Binance
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
