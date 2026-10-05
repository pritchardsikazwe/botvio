import { useMemo, useState } from "react";
import { Activity, Wifi, WifiOff, Crosshair } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EngineSignal } from "@/lib/marketData/signalEngine";
import type { NormalizedCandle, Timeframe } from "@/lib/marketData/types";

interface Props {
  candles: NormalizedCandle[];
  symbolLabel: string;
  brokerLabel?: string;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  price: number | null;
  bid?: number | null;
  ask?: number | null;
  decimals?: number;
  status: string;
  signals?: EngineSignal[];
  activeSignal?: EngineSignal | null;
  showHauza?: boolean;
  /** Instrument-specific strategy label; never assumed to be global. */
  strategyName?: string;
  unavailableMessage?: string;
}

const TIMEFRAMES: Timeframe[] = ["1m","3m","5m","15m","30m","1H","4H","1D","3D"];

export function BrokerCandleChart({
  candles, symbolLabel, brokerLabel = "WELTRADE", timeframe, onTimeframeChange,
  price, bid, ask, decimals = 2, status, signals = [], activeSignal = null,
  showHauza = true, strategyName, unavailableMessage = "Market data unavailable",
}: Props) {
  const [hauzaOn, setHauzaOn] = useState(showHauza);
  const W = 900, H = 460;
  const padding = { top: 12, right: 68, bottom: 26, left: 10 };
  const chartW = W - padding.left - padding.right;
  const chartH = H - padding.top - padding.bottom;
  const visible = candles.slice(-100);
  const minP = visible.length ? Math.min(...visible.map(c => c.low)) : 0;
  const maxP = visible.length ? Math.max(...visible.map(c => c.high)) : 1;
  const range = maxP - minP || Math.max(Math.abs(maxP) * 0.001, 1);
  const step = visible.length ? chartW / visible.length : 0;
  const candleW = Math.max(2, step * 0.68);
  const yFor = (p: number) => padding.top + chartH - ((p - minP) / range) * chartH;
  const decimalsSafe = Math.min(8, Math.max(0, decimals));

  const priceLabels = useMemo(() =>
    visible.length ? Array.from({length: 6}, (_, i) => minP + range * i / 5) : [],
    [visible.length, minP, range]
  );

  const strategy = useMemo(() => {
    const text = (symbolLabel + " " + brokerLabel).toUpperCase();
    if (strategyName) return strategyName;
    if (text.includes("XAU") || text.includes("GOLD")) return "Gold Structure Strategy";
    if (text.includes("BTC") || text.includes("ETH") || text.includes("CRYPTO")) return "Crypto Momentum Strategy";
    if (text.includes("NAS") || text.includes("US30") || text.includes("GER40") || text.includes("INDEX")) return "Index Structure Strategy";
    if (text.includes("SYNTH") || text.includes("VOLATILITY") || text.includes("BOOM") || text.includes("CRASH") || text.includes("STEP") || text.includes("RISE") || text.includes("FALL")) return "Synthetic Structure Strategy";
    if (text.includes("WELTRADE") || text.includes("SYNTX")) return "Weltrade SyntX Strategy";
    return "Forex Structure Strategy";
  }, [symbolLabel, brokerLabel, strategyName]);

  const analysis = useMemo(() => {
    if (!hauzaOn || visible.length < 20) return null;
    type Pivot = { index:number; price:number };
    const supports:Pivot[] = [], resistances:Pivot[] = [];
    const left = 3, right = 3;
    for (let i = left; i < visible.length - right; i++) {
      const c = visible[i];
      const isLow = Array.from({length:left}, (_,k)=>k+1).every(k => visible[i-k].low > c.low) && Array.from({length:right}, (_,k)=>k+1).every(k => visible[i+k].low > c.low);
      const isHigh = Array.from({length:left}, (_,k)=>k+1).every(k => visible[i-k].high < c.high) && Array.from({length:right}, (_,k)=>k+1).every(k => visible[i+k].high < c.high);
      if (isLow) supports.push({index:i, price:c.low});
      if (isHigh) resistances.push({index:i, price:c.high});
    }

    const cluster = (items:Pivot[]) => {
      const tolerance = Math.max(range * 0.018, Math.abs(visible.at(-1)?.close ?? 0) * 0.00035);
      const groups:Pivot[][] = [];
      for (const item of items) {
        const group = groups.find(g => Math.abs(g.reduce((a,b)=>a+b.price,0)/g.length - item.price) <= tolerance);
        if (group) group.push(item); else groups.push([item]);
      }
      return groups.map(g => ({ index:g.at(-1)!.index, price:g.reduce((a,b)=>a+b.price,0)/g.length, touches:g.length }))
        .sort((a,b)=>b.touches-a.touches || b.index-a.index).slice(0,3).sort((a,b)=>a.price-b.price);
    };
    const s = cluster(supports).slice(-2);
    const r = cluster(resistances).slice(-2);
    const n=visible.length; let sx=0,sy=0,sxy=0,sxx=0;
    visible.forEach((c,i)=>{sx+=i;sy+=c.close;sxy+=i*c.close;sxx+=i*i;});
    const denom=n*sxx-sx*sx;
    const slope=denom ? (n*sxy-sx*sy)/denom : 0;
    const intercept=(sy-slope*sx)/n;
    const atrLookback=Math.min(14,n-1);
    const atr = atrLookback ? visible.slice(-atrLookback).reduce((sum,c,i,a)=>{
      const prev = visible[Math.max(0,n-atrLookback+i-1)]?.close ?? c.open;
      return sum + Math.max(c.high-c.low,Math.abs(c.high-prev),Math.abs(c.low-prev));
    },0)/atrLookback : range;
    const last=visible.at(-1)!;
    const prev=visible.at(-2)!;
    const nearestR=r.filter(x=>x.price>=last.close).sort((a,b)=>a.price-b.price)[0] ?? r.at(-1);
    const nearestS=s.filter(x=>x.price<=last.close).sort((a,b)=>b.price-a.price)[0] ?? s[0];
    const near=(level:number|null) => level!=null && Math.abs(last.close-level) <= Math.max(atr*0.7, range*0.025);
    const bullishBreakout=!!nearestR && prev.close <= nearestR.price && last.close > nearestR.price + atr*0.08;
    const bearishBreakdown=!!nearestS && prev.close >= nearestS.price && last.close < nearestS.price - atr*0.08;
    const body=Math.abs(last.close-last.open), upperWick=last.high-Math.max(last.open,last.close), lowerWick=Math.min(last.open,last.close)-last.low;
    const rejection = near(nearestR?.price ?? null) && upperWick > Math.max(body*1.5, atr*0.25) ? "Resistance rejection" : near(nearestS?.price ?? null) && lowerWick > Math.max(body*1.5, atr*0.25) ? "Support rejection" : null;
    const retest = !bullishBreakout && !bearishBreakdown && ((nearestR && Math.abs(last.close-nearestR.price)<Math.max(atr*0.45,range*0.015)) || (nearestS && Math.abs(last.close-nearestS.price)<Math.max(atr*0.45,range*0.015))) ? "Level retest" : null;
    const direction = slope > atr*0.035 ? "BULLISH" : slope < -atr*0.035 ? "BEARISH" : "RANGE";
    const structure = direction === "BULLISH" ? "Higher highs / higher lows" : direction === "BEARISH" ? "Lower highs / lower lows" : "Range structure";
    const lowA=supports.at(-2), lowB=supports.at(-1), highA=resistances.at(-2), highB=resistances.at(-1);
    return {
      supports:s, resistances:r, trendStart:intercept, trendEnd:intercept+slope*(n-1),
      trendDirection:direction, structure, atr,
      breakout:bullishBreakout ? "BREAKOUT" : bearishBreakdown ? "BREAKDOWN" : null,
      rejection, retest,
      supportTrend: lowA && lowB ? {x1:lowA.index,y1:lowA.price,x2:lowB.index,y2:lowB.price} : null,
      resistanceTrend: highA && highB ? {x1:highA.index,y1:highA.price,x2:highB.index,y2:highB.price} : null,
    };
  }, [hauzaOn, visible, range, strategyName, symbolLabel, brokerLabel]);

  const change = visible.length > 1 ? visible[visible.length-1].close - visible[0].open : 0;
  const changePct = visible.length > 1 && visible[0].open ? change / visible[0].open * 100 : 0;
  const isUp = change >= 0;
  const live = status === "live" || status === "delayed" || status === "reconnecting";

  return (
    <Card className="bg-card border-border/50 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <Activity className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-xs font-bold text-foreground truncate">{symbolLabel} · {brokerLabel}</span>
            {price != null && <span className={`text-xs font-bold tabular-nums ${isUp ? "text-success" : "text-destructive"}`}>{price.toFixed(decimalsSafe)}</span>}
            {visible.length > 1 && <Badge variant="outline" className={`text-[10px] ${isUp ? "border-success/30 text-success" : "border-destructive/30 text-destructive"}`}>{isUp ? "▲" : "▼"} {Math.abs(changePct).toFixed(2)}%</Badge>}
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {TIMEFRAMES.map(tf => <Button key={tf} size="sm" variant={timeframe===tf ? "default" : "ghost"} className="h-6 text-[10px] px-2" onClick={()=>onTimeframeChange(tf)}>{tf}</Button>)}
            <Badge variant="outline" className="h-6 px-2 text-[9px] font-bold border-primary/30 text-primary">{strategy}</Badge><Button size="sm" variant={hauzaOn ? "default" : "ghost"} className="h-6 text-[10px] px-2 ml-1" onClick={()=>setHauzaOn(v=>!v)}><Crosshair className="h-2.5 w-2.5 mr-1"/>{hauzaOn ? "Analysis On" : "Analysis Off"}</Button>
            <Badge variant="outline" className={`text-[10px] ml-1 ${live ? "border-success/30 text-success" : "border-destructive/30 text-destructive"}`}>
              {live ? <Wifi className="h-2.5 w-2.5 mr-1"/> : <WifiOff className="h-2.5 w-2.5 mr-1"/>}{live ? "Live" : "No data"}
            </Badge>
          </div>
        </div>

        <div style={{height:H}} className="relative">
          {visible.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">{unavailableMessage}</div>
          ) : (
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
              {priceLabels.map((p,i)=><g key={i}><line x1={padding.left} x2={padding.left+chartW} y1={yFor(p)} y2={yFor(p)} stroke="hsl(var(--border))" strokeOpacity=".3" strokeDasharray="2,3"/><text x={padding.left+chartW+5} y={yFor(p)+3} fontSize="10" fill="hsl(var(--muted-foreground))">{p.toFixed(decimalsSafe)}</text></g>)}
              {visible.map((c,i)=>{
                const x=padding.left+i*step+(step-candleW)/2, cx=x+candleW/2, up=c.close>=c.open;
                const color=up ? "hsl(var(--success))" : "hsl(var(--destructive))";
                return <g key={c.time}><line x1={cx} x2={cx} y1={yFor(c.high)} y2={yFor(c.low)} stroke={color} strokeWidth="1"/><rect x={x} y={yFor(Math.max(c.open,c.close))} width={candleW} height={Math.max(1,Math.abs(yFor(c.open)-yFor(c.close)))} fill={color}/></g>;
              })}
              {analysis && <g>
                {analysis.resistances.map((p,i)=><g key={`r${i}`}><line x1={padding.left} x2={padding.left+chartW} y1={yFor(p.price)} y2={yFor(p.price)} stroke="hsl(var(--destructive))" strokeWidth={p.touches > 1 ? "2" : "1.2"} strokeDasharray="6,4"/><text x={padding.left+4} y={yFor(p.price)-3} fontSize="9" fontWeight="bold" fill="hsl(var(--destructive))">R{i+1} · {p.touches}x</text></g>)}
                {analysis.supports.map((p,i)=><g key={`s${i}`}><line x1={padding.left} x2={padding.left+chartW} y1={yFor(p.price)} y2={yFor(p.price)} stroke="hsl(var(--success))" strokeWidth={p.touches > 1 ? "2" : "1.2"} strokeDasharray="6,4"/><text x={padding.left+4} y={yFor(p.price)+11} fontSize="9" fontWeight="bold" fill="hsl(var(--success))">S{i+1} · {p.touches}x</text></g>)}
                <line x1={padding.left} x2={padding.left+chartW} y1={yFor(analysis.trendStart)} y2={yFor(analysis.trendEnd)} stroke="hsl(var(--primary))" strokeWidth="2"/>
                {analysis.supportTrend && <line x1={padding.left+analysis.supportTrend.x1*step+step/2} x2={padding.left+analysis.supportTrend.x2*step+step/2} y1={yFor(analysis.supportTrend.y1)} y2={yFor(analysis.supportTrend.y2)} stroke="hsl(var(--success))" strokeWidth="1.5" opacity=".8"/>}
                {analysis.resistanceTrend && <line x1={padding.left+analysis.resistanceTrend.x1*step+step/2} x2={padding.left+analysis.resistanceTrend.x2*step+step/2} y1={yFor(analysis.resistanceTrend.y1)} y2={yFor(analysis.resistanceTrend.y2)} stroke="hsl(var(--destructive))" strokeWidth="1.5" opacity=".8"/>}
                <g>
                  <rect x={padding.left+8} y={padding.top+6} width="190" height="42" rx="6" fill="hsl(var(--background))" fillOpacity=".88" stroke="hsl(var(--border))"/>
                  <text x={padding.left+16} y={padding.top+20} fontSize="9" fontWeight="bold" fill="hsl(var(--foreground))">{analysis.trendDirection} · {analysis.structure}</text>
                  <text x={padding.left+16} y={padding.top+34} fontSize="8" fill="hsl(var(--muted-foreground))">{analysis.breakout ?? analysis.rejection ?? analysis.retest ?? "Structure intact"}</text>
                </g>
              </g>}
              {signals.slice(-4).map((s,i)=>{
                const candleIndex=visible.findIndex(c=>c.time===s.time);
                if(candleIndex<0) return null;
                const x=padding.left+candleIndex*step+step/2, y=s.direction==="BUY"?yFor(visible[candleIndex].low)+16:yFor(visible[candleIndex].high)-10;
                return <g key={`${s.id}-${i}`}><circle cx={x} cy={y} r="3" fill={s.direction==="BUY"?"hsl(var(--success))":"hsl(var(--destructive))"}/><text x={x+6} y={y+3} fontSize="8" fontWeight="bold" fill={s.direction==="BUY"?"hsl(var(--success))":"hsl(var(--destructive))"}>{s.direction} {s.confidence}%</text></g>;
              })}
              {activeSignal && <g>
                <line x1={padding.left} x2={padding.left+chartW} y1={yFor(activeSignal.entry)} y2={yFor(activeSignal.entry)} stroke="hsl(var(--primary))" strokeWidth="2"/>
                <text x={padding.left+4} y={yFor(activeSignal.entry)-4} fontSize="9" fontWeight="bold" fill="hsl(var(--primary))">ENTRY {activeSignal.entry.toFixed(decimalsSafe)}</text>
                <line x1={padding.left} x2={padding.left+chartW} y1={yFor(activeSignal.stopLoss)} y2={yFor(activeSignal.stopLoss)} stroke="hsl(var(--destructive))" strokeWidth="1.5" strokeDasharray="5,4"/>
                <line x1={padding.left} x2={padding.left+chartW} y1={yFor(activeSignal.takeProfit)} y2={yFor(activeSignal.takeProfit)} stroke="hsl(var(--success))" strokeWidth="1.5" strokeDasharray="5,4"/>
              </g>}
            </svg>
          )}
          {bid != null && ask != null && <div className="absolute right-2 top-2 rounded-md border bg-background/90 px-2 py-1 text-[9px] font-mono text-muted-foreground">B {bid.toFixed(decimalsSafe)} · A {ask.toFixed(decimalsSafe)}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
