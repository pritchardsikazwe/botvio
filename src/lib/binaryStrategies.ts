import { RSI, EMA, ATR } from "technicalindicators";
import type { NormalizedCandle } from "@/lib/marketData/types";

export type BinaryStrategy = "precision" | "trend";
export interface Pivot { index: number; time: number; price: number }
export function binaryRsiSeries(candles: NormalizedCandle[], now = Date.now()) {
  const closed = candles.filter(c => (c.time + 60) * 1000 <= now);
  if (closed.some((c,i)=>![c.time,c.close].every(Number.isFinite)||(i>0&&c.time<=closed[i-1].time))) return [];
  const values = RSI.calculate({ values: closed.map(c=>c.close), period: 14 });
  return values.map((value,i)=>({time:closed[i+14].time,value}));
}
export interface BinarySetup {
  strategy: BinaryStrategy; duration: 3 | 5; direction: "RISE" | "FALL" | "NO TRADE";
  quality: number; rsi: number | null; trend: "Bullish" | "Bearish" | "Sideways";
  support: number | null; resistance: number | null; pattern: string; trendline: string;
  confirmations: string[]; reason: string; entry: number | null; time: number | null;
  line: Pivot[];
}
export function detectDoublePattern(candles: NormalizedCandle[], pivots: Pivot[], low: boolean, tolerance: number) {
  const a = pivots.at(-2), b = pivots.at(-1), last = candles.at(-1);
  if (!a || !b || !last || b.index - a.index < 3 || b.index - a.index > 35 || candles.length - b.index > 12 || Math.abs(a.price - b.price) > tolerance) return false;
  const between = candles.slice(a.index + 1, b.index);
  const neckline = low ? Math.max(...between.map(c => c.high)) : Math.min(...between.map(c => c.low));
  return low ? last.close > neckline : last.close < neckline;
}
export function analyzeBinary(candles: NormalizedCandle[], strategy: BinaryStrategy, now = Date.now()): BinarySetup {
  const base: BinarySetup = { strategy, duration: strategy === "precision" ? 3 : 5, direction: "NO TRADE", quality: 0, rsi: null, trend: "Sideways", support: null, resistance: null, pattern: "None confirmed", trendline: "No confirmation", confirmations: [], reason: "Waiting for 80 closed 1-minute candles", entry: null, time: null, line: [] };
  // Never use a forming candle, invalid OHLC, or an out-of-order sequence.
  const closed = candles.filter(c => (c.time + 60) * 1000 <= now);
  if (closed.length < 80 || closed.some((c, i) => ![c.time,c.open,c.high,c.low,c.close].every(Number.isFinite) || c.low > Math.min(c.open,c.close) || c.high < Math.max(c.open,c.close) || (i > 0 && c.time <= closed[i-1].time))) return base;
  const last = closed.at(-1), prev = closed.at(-2);
  if (!last || !prev) return base;
  if (now - (last.time + 60) * 1000 > 90_000) return { ...base, reason: "Data unavailable: candles are stale" };
  const closes = closed.map(c => c.close);
  const r = RSI.calculate({ values: closes, period: 14 }).at(-1);
  const priorR = RSI.calculate({ values: closes.slice(0,-1), period: 14 }).at(-1);
  const fast = EMA.calculate({ values: closes, period: 9 }).at(-1);
  const slow = EMA.calculate({ values: closes, period: 21 }).at(-1);
  const long = EMA.calculate({ values: closes, period: 50 }).at(-1);
  const atr = ATR.calculate({ high: closed.map(c=>c.high), low: closed.map(c=>c.low), close: closes, period:14 }).at(-1);
  if (r == null || priorR == null || fast == null || slow == null || long == null || !atr) return base;
  const lows: Pivot[] = [], highs: Pivot[] = [];
  for (let i = Math.max(2, closed.length - 65); i < closed.length - 2; i++) {
    const c = closed[i], neighbors = [closed[i-2],closed[i-1],closed[i+1],closed[i+2]];
    if (neighbors.every(n=>c.low<n.low)) lows.push({index:i,time:c.time,price:c.low});
    if (neighbors.every(n=>c.high>n.high)) highs.push({index:i,time:c.time,price:c.high});
  }
  const support = lows.filter(p=>p.price<=last.close).sort((a,b)=>b.price-a.price)[0]?.price ?? null;
  const resistance = highs.filter(p=>p.price>=last.close).sort((a,b)=>a.price-b.price)[0]?.price ?? null;
  const w = detectDoublePattern(closed,lows,true,atr*0.6), m = detectDoublePattern(closed,highs,false,atr*0.6);
  const up = fast > slow && slow > long, down = fast < slow && slow < long;
  const bull = last.close > last.open, bear = last.close < last.open;
  const body = Math.abs(last.close-last.open);
  const supportBounce = support != null && last.low <= support+atr*0.35 && bull && Math.min(last.open,last.close)-last.low > Math.max(body*0.8,atr*0.2);
  const resistanceReject = resistance != null && last.high >= resistance-atr*0.35 && bear && last.high-Math.max(last.open,last.close) > Math.max(body*0.8,atr*0.2);
  const hi = highs.at(-1), lo = lows.at(-1);
  const breakoutUp = hi != null && prev.close <= hi.price && last.close > hi.price+atr*0.1;
  const breakoutDown = lo != null && prev.close >= lo.price && last.close < lo.price-atr*0.1;
  const linePivots = up ? lows.slice(-2) : highs.slice(-2);
  const [a,b] = linePivots;
  const projected = a && b ? b.price + (b.price-a.price)/(b.index-a.index)*(closed.length-1-b.index) : null;
  const lineUp = projected != null && up && last.low <= projected+atr*0.3 && last.close>projected && bull;
  const lineDown = projected != null && down && last.high >= projected-atr*0.3 && last.close<projected && bear;
  const rise: string[] = [], fall: string[] = [];
  if (w) rise.push("Confirmed W neckline break"); if (m) fall.push("Confirmed M neckline break");
  if (supportBounce) rise.push("Support bounce"); if (resistanceReject) fall.push("Resistance rejection");
  if (lineUp) rise.push("Rising trendline rejection"); if (lineDown) fall.push("Falling trendline rejection");
  if (strategy === "precision") {
    if (r >= 30 && r <= 58 && r > priorR) rise.push("RSI reversal momentum");
    if (r >= 42 && r <= 70 && r < priorR) fall.push("RSI reversal momentum");
    if (bull && last.close>prev.close) rise.push("Bullish close confirmation");
    if (bear && last.close<prev.close) fall.push("Bearish close confirmation");
  } else {
    if (up) rise.push("EMA trend aligned"); if (down) fall.push("EMA trend aligned");
    if (breakoutUp) rise.push("Resistance breakout"); if (breakoutDown) fall.push("Support breakdown");
    if (r>=50 && r<=68 && r>priorR) rise.push("Trend-safe RSI");
    if (r>=32 && r<=50 && r<priorR) fall.push("Trend-safe RSI");
    if (bull && last.close>prev.close) rise.push("Bullish close confirmation");
    if (bear && last.close<prev.close) fall.push("Bearish close confirmation");
  }
  const required = strategy === "precision" ? 3 : 4;
  const riseStructure = w || supportBounce || lineUp || (strategy === "trend" && breakoutUp);
  const fallStructure = m || resistanceReject || lineDown || (strategy === "trend" && breakoutDown);
  let direction: BinarySetup["direction"] = rise.length>=required && riseStructure ? "RISE" : fall.length>=required && fallStructure ? "FALL" : "NO TRADE";
  const conflict = riseStructure && fallStructure;
  const extended = last.high-last.low>atr*2.5 || Math.abs(last.close-fast)>atr*1.5 || r>78 || r<22;
  if (conflict || extended) direction="NO TRADE";
  if (strategy==="trend" && ((direction==="RISE" && !up) || (direction==="FALL" && !down))) direction="NO TRADE";
  const confirmations = direction==="FALL" ? fall : direction==="RISE" ? rise : rise.length>=fall.length ? rise : fall;
  const structure = rise.length>=fall.length ? riseStructure : fallStructure;
  const reason = conflict ? "Conflicting price structures; wait for a clear direction" : extended ? "Price or RSI is extended; wait for a pullback" : !structure ? "Waiting for a support/resistance reaction, confirmed M/W pattern or trendline setup" : confirmations.length<required ? `Waiting for ${required-confirmations.length} more confirmation${required-confirmations.length===1?"":"s"} (${confirmations.length}/${required})` : strategy==="trend" && direction==="NO TRADE" ? "Waiting for EMA trend alignment" : confirmations.join(" · ");
  return { ...base, direction, quality: direction==="NO TRADE" ? Math.min(74, Math.round(confirmations.length/required*70)) : Math.min(95, 55+confirmations.length*8), rsi:r, trend:up?"Bullish":down?"Bearish":"Sideways", support,resistance, pattern:w?"W confirmed":m?"M confirmed":"None confirmed", trendline:lineUp||lineDown?"Rejection confirmed":breakoutUp||breakoutDown?"Break confirmed":"No confirmation", confirmations, reason, entry:last.close, time:last.time+60, line:linePivots };
}

export interface BinaryLimits { hourly: number; consecutiveLosses: number; dailyLoss: number; quality: number }
export interface BinaryResult { id: number; time: number; profit: number }
export function binaryRiskStop(limits: BinaryLimits, results: BinaryResult[], entries: number[], now=Date.now()) {
  if (![limits.hourly,limits.consecutiveLosses,limits.dailyLoss,limits.quality].every(Number.isFinite) || limits.hourly<1 || limits.hourly>20 || limits.consecutiveLosses<1 || limits.consecutiveLosses>10 || limits.dailyLoss<=0 || limits.quality<75 || limits.quality>95) return "Invalid risk limits";
  if (entries.filter(t=>now-t<3_600_000).length>=limits.hourly) return "Hourly trade limit reached";
  if (entries.filter(t=>new Date(t).toISOString().slice(0,10)===new Date(now).toISOString().slice(0,10)).length>=20) return "Daily 20-trade limit reached";
  const ordered=[...results].sort((a,b)=>b.time-a.time);
  let streak=0; for(const r of ordered) { if(r.profit>=0) break; streak++; }
  if(streak>=limits.consecutiveLosses) return "Consecutive-loss limit reached";
  const day=new Date(now).toISOString().slice(0,10);
  const pnl=results.filter(r=>new Date(r.time).toISOString().slice(0,10)===day).reduce((sum,r)=>sum+r.profit,0);
  if(pnl<=-limits.dailyLoss) return "Daily loss limit reached";
  return null;
}