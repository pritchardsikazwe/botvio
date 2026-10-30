import { useEffect, useState } from "react";
import { createDerivAdapter } from "@/lib/marketData/adapters/derivAdapter";
import type { FeedStatus, NormalizedCandle, NormalizedTick, Timeframe } from "@/lib/marketData/types";

export function useBinaryCandleFeed(symbol: string, timeframe: Timeframe = "1m", enabled=true) {
  const [candles,setCandles]=useState<NormalizedCandle[]>([]);
  const [status,setStatus]=useState<FeedStatus>("idle");
  const [error,setError]=useState<string|null>(null);
  const [price,setPrice]=useState<number|null>(null);
  const [ticks,setTicks]=useState<NormalizedTick[]>([]);
  const [revision,setRevision]=useState(0);
  useEffect(()=>{
    setCandles([]); setTicks([]); setPrice(null); setError(null); setStatus("idle");
    if(!enabled || !symbol) return;
    const adapter=createDerivAdapter({feedSymbol:symbol,timeframe,historyLimit:180});
    adapter.start({
      onSnapshot:rows=>setCandles(rows),
      onCandle:c=>setCandles(rows=>{const next=rows.filter(r=>r.time!==c.time); return [...next,c].sort((a,b)=>a.time-b.time).slice(-180);}),
      onTick:t=>{if(!Number.isFinite(t.time)||!Number.isFinite(t.price))return;setPrice(t.price);setTicks(rows=>[...rows.filter(r=>r.time<t.time),t].slice(-500));},
      onStatus:(next,detail)=>{setStatus(next); if(detail?.error) setError(detail.error); else if(next==="live") setError(null);},
    });
    return ()=>adapter.stop();
  },[symbol,timeframe,enabled,revision]);
  return {candles,ticks,status,error,price,refresh:()=>setRevision(v=>v+1)};
}