import { performanceGate } from "./performanceGate.ts";
const mk=(t:number,w:number,e:number)=>({total:t,wins:w,losses:t-w,winRate:w/t*100,profitFactor:1,expectancyR:e,recentLosses:0});
Deno.test("falls back to timeframe sample when strategy sample is small", () => {
  const idx = new Map([["gainx 600|5m|s",mk(5,4,0.5)],["gainx 600|5m|*",mk(100,35,-0.15)]]);
  if (performanceGate(idx as any,"GainX 600","5m","s").allowed) throw new Error("should block");
});
Deno.test("allows positive expectancy", () => {
  const idx = new Map([["flipx 1|1m|*",mk(40,22,0.25)]]);
  if (!performanceGate(idx as any,"FlipX 1","1m","x").allowed) throw new Error("should allow");
});
