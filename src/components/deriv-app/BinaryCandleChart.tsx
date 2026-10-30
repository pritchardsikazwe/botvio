import { useEffect, useRef } from "react";
import { createChart, CandlestickSeries, LineSeries, ColorType, type UTCTimestamp } from "lightweight-charts";
import type { NormalizedCandle } from "@/lib/marketData/types";
import type { BinarySetup } from "@/lib/binaryStrategies";

export function BinaryCandleChart({candles,setup}:{candles:NormalizedCandle[];setup:BinarySetup}) {
  const container=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const element=container.current; if(!element) return;
    const styles=getComputedStyle(element);
    const color=(token:string)=>`hsl(${styles.getPropertyValue(token).trim()})`;
    const chart=createChart(element,{height:360,layout:{background:{type:ColorType.Solid,color:color("--card")},textColor:color("--muted-foreground")},grid:{vertLines:{color:color("--border")},horzLines:{color:color("--border")}},timeScale:{timeVisible:true,secondsVisible:false},rightPriceScale:{borderColor:color("--border")}});
    const series=chart.addSeries(CandlestickSeries,{upColor:color("--success"),downColor:color("--destructive"),wickUpColor:color("--success"),wickDownColor:color("--destructive"),borderVisible:false});
    series.setData(candles.map(c=>({...c,time:c.time as UTCTimestamp})));
    for(const [title,price,token] of [["Support",setup.support,"--success"],["Resistance",setup.resistance,"--destructive"],["Signal entry",setup.direction!=="NO TRADE"?setup.entry:null,"--primary"]] as const) {
      if(price!=null) series.createPriceLine({price,color:color(token),lineWidth:1,lineStyle:2,axisLabelVisible:true,title});
    }
    if(setup.line.length===2) {const line=chart.addSeries(LineSeries,{color:color("--primary"),lineWidth:2,lastValueVisible:false,priceLineVisible:false}); line.setData(setup.line.map(p=>({time:p.time as UTCTimestamp,value:p.price})));}
    chart.timeScale().fitContent();
    const resize=new ResizeObserver(()=>chart.applyOptions({width:element.clientWidth})); resize.observe(element);
    return ()=>{resize.disconnect();chart.remove();};
  },[candles,setup]);
  return <div ref={container} className="h-[360px] w-full min-w-0" role="img" aria-label="Deriv live candlestick chart with support, resistance and trendline" />;
}