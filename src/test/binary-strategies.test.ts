import { describe, expect, it } from "vitest";
import { analyzeBinary, binaryRiskStop, detectDoublePattern } from "@/lib/binaryStrategies";
const limits={hourly:5,consecutiveLosses:3,dailyLoss:10,quality:80};
const now=Date.parse("2026-10-30T07:33:00Z");
describe("binary strategy rules",()=>{
  it("uses a 3-minute Precision expiry",()=>expect(analyzeBinary([],"precision",now).duration).toBe(3));
  it("uses a 5-minute Trend Confirmation expiry",()=>expect(analyzeBinary([],"trend",now).duration).toBe(5));
  it("rejects insufficient data rather than inventing signals",()=>expect(analyzeBinary([],"precision",now).direction).toBe("NO TRADE"));
  it("requires a neckline break to confirm a W pattern",()=>{
    const candles=Array.from({length:10},(_,i)=>({time:i*60,open:11,close:i===9?13:11,high:12,low:10}));
    const pivots=[{index:2,time:120,price:10},{index:6,time:360,price:10.1}];
    expect(detectDoublePattern(candles,pivots,true,0.5)).toBe(true);
    candles[9].close=11;
    expect(detectDoublePattern(candles,pivots,true,0.5)).toBe(false);
  });
  it("rejects stale market data",()=>{
    const candles=Array.from({length:90},(_,i)=>({time:now/1000-20000+i*60,open:100,close:100,high:101,low:99}));
    expect(analyzeBinary(candles,"trend",now).direction).toBe("NO TRADE");
    expect(analyzeBinary(candles,"trend",now).reason).toContain("stale");
  });
});
describe("binary automation limits",()=>{
  it("stops at the configured hourly cap",()=>expect(binaryRiskStop(limits,[],Array(5).fill(now-1000),now)).toBe("Hourly trade limit reached"));
  it("stops after three consecutive losses",()=>expect(binaryRiskStop(limits,[1,2,3].map(id=>({id,time:now-id*1000,profit:-1})),[],now)).toBe("Consecutive-loss limit reached"));
  it("stops at the configured daily loss",()=>expect(binaryRiskStop(limits,[{id:1,time:now,profit:-10}],[],now)).toBe("Daily loss limit reached"));
  it("rejects a quality threshold below 75",()=>expect(binaryRiskStop({...limits,quality:50},[],[],now)).toBe("Invalid risk limits"));
  it("does not count yesterday's losses in today's loss cap",()=>expect(binaryRiskStop(limits,[{id:1,time:now-86400000,profit:-10}],[],now)).toBeNull());
});