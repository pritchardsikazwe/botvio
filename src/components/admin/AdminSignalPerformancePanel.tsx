import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Target, TrendingUp, BarChart3 } from "lucide-react";

type Signal = {
  symbol: string | null; strategy_name: string | null; timeframe: string | null;
  direction: string | null; status: string | null; confidence: number | null;
  quality_score: number | null; ai_win_probability: number | null;
  expiry_seconds: number | null; best_expiry: number | null; backup_expiry: number | null;
  created_at: string | null;
};

type Group = { key: string; count: number; wins: number; losses: number; winRate: number; avgConfidence: number; avgQuality: number; avgAi: number };

const n = (v: unknown) => Number.isFinite(Number(v)) ? Number(v) : 0;
const pct = (v: number) => v ? v.toFixed(1) + "%" : "—";
const groupBy = (rows: Signal[], keyFn: (r: Signal) => string): Group[] => {
  const m = new Map<string, Signal[]>();
  rows.forEach(r => { const k = keyFn(r) || "Unknown"; m.set(k, [...(m.get(k) || []), r]); });
  return [...m.entries()].map(([key, rs]: [string, Signal[]]) => {
    const wins = rs.filter(r => String(r.status).toUpperCase() === "WIN").length;
    const losses = rs.filter(r => String(r.status).toUpperCase() === "LOSS").length;
    const decided = wins + losses;
    return {
      key, count: rs.length, wins, losses,
      winRate: decided ? wins / decided * 100 : 0,
      avgConfidence: rs.reduce((a,r)=>a+n(r.confidence),0)/rs.length,
      avgQuality: rs.reduce((a,r)=>a+n(r.quality_score),0)/rs.length,
      avgAi: rs.reduce((a,r)=>a+n(r.ai_win_probability),0)/rs.length,
    };
  }).sort((a,b)=>b.count-a.count);
};

export function AdminSignalPerformancePanel() {
  const [days,setDays] = useState(30);
  const [rows,setRows] = useState<Signal[]>([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    const since = new Date(Date.now() - days*86400000).toISOString();
    const { data, error } = await supabase.from("trading_signals")
      .select("symbol,strategy_name,timeframe,direction,status,confidence,quality_score,ai_win_probability,expiry_seconds,best_expiry,backup_expiry,created_at")
      .gte("created_at", since).order("created_at", { ascending:false }).limit(5000);
    if (error) setError(error.message); else setRows((data || []) as unknown as Signal[]);
    setLoading(false);
  };
  useEffect(()=>{ load(); },[days]);

  const decided = rows.filter(r=>["WIN","LOSS"].includes(String(r.status).toUpperCase()));
  const wins = decided.filter(r=>String(r.status).toUpperCase()==="WIN").length;
  const losses = decided.length-wins;
  const overall = decided.length ? wins/decided.length*100 : 0;
  const avgConfidence = rows.length ? rows.reduce((a,r)=>a+n(r.confidence),0)/rows.length : 0;
  const avgQuality = rows.length ? rows.reduce((a,r)=>a+n(r.quality_score),0)/rows.length : 0;
  const symbols = useMemo(()=>groupBy(rows,r=>r.symbol||""),[rows]);
  const strategies = useMemo(()=>groupBy(rows,r=>r.strategy_name||""),[rows]);
  const timeframes = useMemo(()=>groupBy(rows,r=>r.timeframe||""),[rows]);
  const confidenceBands = useMemo(()=>[
    ["60–69",rows.filter(r=>n(r.confidence)>=60&&n(r.confidence)<70)],
    ["70–79",rows.filter(r=>n(r.confidence)>=70&&n(r.confidence)<80)],
    ["80–89",rows.filter(r=>n(r.confidence)>=80&&n(r.confidence)<90)],
    ["90+",rows.filter(r=>n(r.confidence)>=90)],
  ].map(([key,rs])=>({key,count:(rs as Signal[]).length,...(()=>{const d=(rs as Signal[]).filter(r=>["WIN","LOSS"].includes(String(r.status).toUpperCase()));const w=d.filter(r=>String(r.status).toUpperCase()==="WIN").length;return {winRate:d.length?w/d.length*100:0}})()})),[rows]);

  const Table = ({title,data}:{title:string;data:Group[]}) => <Card><CardHeader className="pb-3"><CardTitle className="text-sm">{title}</CardTitle></CardHeader><CardContent className="overflow-x-auto p-0"><table className="w-full text-xs"><thead className="bg-slate-50 border-y"><tr><th className="p-2 text-left">Name</th><th className="p-2">Signals</th><th className="p-2">W/L</th><th className="p-2">Win %</th><th className="p-2">Conf.</th><th className="p-2">Quality</th></tr></thead><tbody>{data.slice(0,12).map(x=><tr key={x.key} className="border-b"><td className="p-2 font-medium whitespace-nowrap">{x.key}</td><td className="p-2 text-center">{x.count}</td><td className="p-2 text-center">{x.wins}/{x.losses}</td><td className="p-2 text-center font-semibold">{x.wins+x.losses?pct(x.winRate):"Pending"}</td><td className="p-2 text-center">{x.avgConfidence.toFixed(0)}</td><td className="p-2 text-center">{x.avgQuality.toFixed(0)}</td></tr>)}{!data.length&&<tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No signal data in this period.</td></tr>}</tbody></table></CardContent></Card>;

  return <section id="signal-performance-panel" className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary"/>Signal Performance Center</h2><p className="text-sm text-muted-foreground">Performance by symbol, strategy, timeframe and confidence. No performance is estimated when outcomes are missing.</p></div><div className="flex gap-2"><div className="flex rounded-lg border bg-white p-1">{[7,30,90].map(x=><Button key={x} size="sm" variant={days===x?"default":"ghost"} onClick={()=>setDays(x)}>{x}d</Button>)}</div><Button size="icon" variant="outline" onClick={load}><RefreshCw className={loading?"h-4 w-4 animate-spin":"h-4 w-4"}/></Button></div></div>
    {error&&<Card className="border-red-200"><CardContent className="p-4 text-sm text-red-700">{error}</CardContent></Card>}
    <div className="grid grid-cols-2 xl:grid-cols-6 gap-3">
      {[
        ["Signals",rows.length,<Target className="h-4 w-4"/>],
        ["Decided",decided.length,<BarChart3 className="h-4 w-4"/>],
        ["Win Rate",decided.length?pct(overall):"Pending",<TrendingUp className="h-4 w-4"/>],
        ["Wins",wins,<TrendingUp className="h-4 w-4"/>],
        ["Losses",losses,<Target className="h-4 w-4"/>],
        ["Avg Confidence",rows.length?avgConfidence.toFixed(0):"—",<BarChart3 className="h-4 w-4"/>],
      ].map(([label,value,icon])=><Card key={label as string}><CardContent className="p-3 flex items-center justify-between"><div><p className="text-[10px] text-muted-foreground">{label}</p><p className="text-xl font-black">{value as any}</p></div>{icon}</CardContent></Card>)}
    </div>
    {rows.length>0 && <div className="grid xl:grid-cols-4 gap-3">
      <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Average quality score</p><p className="text-2xl font-black">{avgQuality.toFixed(0)}</p><p className="text-[10px] text-muted-foreground mt-1">Tracked from generated signals.</p></CardContent></Card>
      <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Outcome coverage</p><p className="text-2xl font-black">{pct(decided.length/rows.length*100)}</p><p className="text-[10px] text-muted-foreground mt-1">Signals with WIN/LOSS outcomes.</p></CardContent></Card>
      <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Best confidence band</p><p className="text-2xl font-black">{confidenceBands.filter(x=>x.count).sort((a,b)=>b.winRate-a.winRate)[0]?.key as string||"—"}</p></CardContent></Card>
      <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Optimization status</p><p className="text-2xl font-black">{decided.length<30?"Collecting":"Ready"}</p><p className="text-[10px] text-muted-foreground mt-1">30+ decided signals unlock stronger comparisons.</p></CardContent></Card>
    </div>}
    <div className="grid xl:grid-cols-3 gap-4"><Table title="By Symbol" data={symbols}/><Table title="By Strategy" data={strategies}/><Table title="By Timeframe" data={timeframes}/></div>
    <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Confidence calibration</CardTitle></CardHeader><CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">{confidenceBands.map(x=><div key={String(x.key)} className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">{String(x.key)}</p><p className="text-lg font-black">{x.count}</p><Badge variant="outline">{x.count?pct(x.winRate):"Pending"}</Badge></div>)}</CardContent></Card>
  </section>;
}
