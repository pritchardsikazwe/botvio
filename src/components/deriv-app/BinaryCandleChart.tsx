import { useEffect, useRef } from "react";
import { createChart, createSeriesMarkers, CandlestickSeries, LineSeries, ColorType, type UTCTimestamp, type IChartApi, type ISeriesApi, type IPriceLine } from "lightweight-charts";
import type { NormalizedCandle, NormalizedTick } from "@/lib/marketData/types";
import { binaryRsiSeries, type BinarySetup } from "@/lib/binaryStrategies";

export function BinaryCandleChart({candles,analysisCandles,ticks,mode,setup}:{candles:NormalizedCandle[];analysisCandles:NormalizedCandle[];ticks:NormalizedTick[];mode:"ticks"|"candles";setup:BinarySetup}) {
  const container=useRef<HTMLDivElement>(null);
  const api=useRef<{chart:IChartApi;series:ISeriesApi<"Candlestick">|ISeriesApi<"Line">;line:ISeriesApi<"Line">;rsi:ISeriesApi<"Line">;markers:ReturnType<typeof createSeriesMarkers>;prices:IPriceLine[];fitted:boolean}|null>(null);
  useEffect(()=>{
    const element=container.current; if(!element) return;
    const styles=getComputedStyle(element);
    const color=(token:string)=>`hsl(${styles.getPropertyValue(token).trim()})`;
    const chart=createChart(element,{height:480,layout:{background:{type:ColorType.Solid,color:color("--card")},textColor:color("--muted-foreground")},grid:{vertLines:{color:color("--border")},horzLines:{color:color("--border")}},timeScale:{timeVisible:true,secondsVisible:mode==="ticks"},rightPriceScale:{borderColor:color("--border")}});
    const series=mode==="ticks"?chart.addSeries(LineSeries,{color:color("--primary"),lineWidth:2}):chart.addSeries(CandlestickSeries,{upColor:color("--success"),downColor:color("--destructive"),wickUpColor:color("--success"),wickDownColor:color("--destructive"),borderVisible:false});
    const line=chart.addSeries(LineSeries,{color:color("--warning"),lineWidth:2,lastValueVisible:false,priceLineVisible:false});
    const rsi=chart.addSeries(LineSeries,{color:color("--primary"),lineWidth:2,title:"RSI 14 · 1m",priceLineVisible:false,autoscaleInfoProvider:()=>({priceRange:{minValue:0,maxValue:100}})},1);
    for(const [price,token] of [[30,"--success"],[50,"--muted-foreground"],[70,"--destructive"]] as const) rsi.createPriceLine({price,color:color(token),lineStyle:2,lineWidth:1,title:String(price),axisLabelVisible:true});
    chart.panes()[0]?.setHeight(330);chart.panes()[1]?.setHeight(150);
    const markers=createSeriesMarkers(series,[]);
    api.current={chart,series,line,rsi,markers,prices:[],fitted:false};
    const resize=new ResizeObserver(()=>chart.applyOptions({width:element.clientWidth})); resize.observe(element);
    return ()=>{resize.disconnect();chart.remove();api.current=null;};
  },[mode]);
  useEffect(()=>{
    const instance=api.current,element=container.current;if(!instance||!element)return;
    const {chart,series,line,rsi,markers}=instance;
    const styles=getComputedStyle(element);
    const color=(token:string)=>`hsl(${styles.getPropertyValue(token).trim()})`;
    if(mode==="ticks") (series as ISeriesApi<"Line">).setData(ticks.map(t=>({time:t.time as UTCTimestamp,value:t.price})));
    else (series as ISeriesApi<"Candlestick">).setData(candles.map(c=>({...c,time:c.time as UTCTimestamp})));
    rsi.setData(binaryRsiSeries(analysisCandles).map(p=>({...p,time:p.time as UTCTimestamp})));
    instance.prices.forEach(price=>series.removePriceLine(price));instance.prices=[];
    for(const [title,price,token] of [["Support",setup.support,"--success"],["Resistance",setup.resistance,"--destructive"],["Signal entry",setup.direction!=="NO TRADE"?setup.entry:null,"--primary"]] as const) {
      if(price!=null) instance.prices.push(series.createPriceLine({price,color:color(token),lineWidth:1,lineStyle:2,axisLabelVisible:true,title}));
    }
    line.setData(setup.line.length===2?setup.line.map(p=>({time:p.time as UTCTimestamp,value:p.price})):[]);
    const point=mode==="ticks"?ticks.find(t=>setup.time!=null&&t.time>=setup.time):candles.find(c=>setup.time!=null&&c.time>=setup.time-60);
    markers.setMarkers(setup.direction!=="NO TRADE"&&point?[{time:point.time as UTCTimestamp,position:setup.direction==="RISE"?"belowBar":"aboveBar",color:color(setup.direction==="RISE"?"--success":"--destructive"),shape:setup.direction==="RISE"?"arrowUp":"arrowDown",text:`${setup.direction} · ${setup.duration}m`}]:[]);
    if((mode==="ticks"?ticks.length>1:candles.length>0)&&!instance.fitted){
      if(mode==="ticks"){const latest=ticks.at(-1);if(latest)chart.timeScale().setVisibleRange({from:(latest.time-300) as UTCTimestamp,to:(latest.time+15) as UTCTimestamp});}
      else chart.timeScale().fitContent();
      instance.fitted=true;
    }
  },[candles,analysisCandles,ticks,mode,setup]);
  return <div ref={container} className="h-[480px] w-full min-w-0" role="img" aria-label={`Deriv live ${mode==="ticks"?"tick":"candlestick"} chart with strategy overlays and RSI 14`} />;
}
