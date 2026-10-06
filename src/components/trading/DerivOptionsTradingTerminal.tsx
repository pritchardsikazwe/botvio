import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Activity, BarChart3, RefreshCw, Shield, Target } from "lucide-react";
import { AutoTradePanel } from "@/components/trading/AutoTradePanel";

const WS_URL = "wss://api.derivws.com/trading/v1/options/ws/public";
const MARKETS = [
  { symbol: "R_10", name: "Volatility 10" },
  { symbol: "R_25", name: "Volatility 25" },
  { symbol: "R_50", name: "Volatility 50" },
  { symbol: "R_75", name: "Volatility 75" },
  { symbol: "R_100", name: "Volatility 100" },
  { symbol: "1HZ10V", name: "Volatility 10 (1s)" },
  { symbol: "1HZ15V", name: "Volatility 15 (1s)" },
  { symbol: "1HZ25V", name: "Volatility 25 (1s)" },
  { symbol: "1HZ30V", name: "Volatility 30 (1s)" },
  { symbol: "1HZ50V", name: "Volatility 50 (1s)" },
  { symbol: "1HZ75V", name: "Volatility 75 (1s)" },
  { symbol: "1HZ90V", name: "Volatility 90 (1s)" },
  { symbol: "1HZ100V", name: "Volatility 100 (1s)" },
  { symbol: "BOOM300", name: "Boom 300" },
  { symbol: "BOOM500", name: "Boom 500" },
  { symbol: "BOOM600", name: "Boom 600" },
  { symbol: "BOOM900", name: "Boom 900" },
  { symbol: "BOOM1000", name: "Boom 1000" },
  { symbol: "CRASH300", name: "Crash 300" },
  { symbol: "CRASH500", name: "Crash 500" },
  { symbol: "CRASH600", name: "Crash 600" },
  { symbol: "CRASH900", name: "Crash 900" },
  { symbol: "CRASH1000", name: "Crash 1000" },
];
const fmt = (n: number) => Number.isFinite(n) ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : "—";

export function DerivOptionsTradingTerminal() {
  const [quotes, setQuotes] = useState<Record<string, { price:number; previous:number; ticks:number[] }>>({});
  const [selected, setSelected] = useState("R_10");
  const [trades, setTrades] = useState<any[]>([]);
  const [loadingTrades, setLoadingTrades] = useState(true);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let closed = false;
    try {
      ws = new WebSocket(WS_URL);
      ws.onopen = () => { ws?.send(JSON.stringify({ active_symbols: "brief" })); MARKETS.forEach(m => ws?.send(JSON.stringify({ ticks: m.symbol, subscribe: 1 }))); };
      ws.onmessage = e => {
        try {
          const d = JSON.parse(e.data);
          if (d.msg_type !== "tick") return;
          const symbol = String(d.tick?.underlying_symbol || d.tick?.symbol || "");
          const price = Number(d.tick?.quote);
          if (!symbol || !Number.isFinite(price) || closed) return;
          setQuotes(prev => {
            const old = prev[symbol];
            return { ...prev, [symbol]: { price, previous: old?.price ?? price, ticks: [...(old?.ticks || []), price].slice(-28) } };
          });
        } catch {}
      };
    } catch {}
    return () => { closed = true; ws?.close(); };
  }, []);

  const loadTrades = async () => {
    setLoadingTrades(true);
    const { data } = await supabase
      .from("auto_trade_executions")
      .select("id,display_symbol,side,status,pnl_usd,created_at,confidence")
      .in("status", ["pending", "filled"])
      .order("created_at", { ascending: false })
      .limit(12);
    const mapped = (data || [])
      .filter((t:any) => MARKETS.some(m => m.name === t.display_symbol || m.symbol === t.display_symbol))
      .map((t:any) => ({
        id: t.id,
        symbol: t.display_symbol,
        side: t.side,
        stake: null,
        status: t.status,
        pnl: t.pnl_usd,
        opened_at: t.created_at,
      }));
    setTrades(mapped);
    setLoadingTrades(false);
  };
  useEffect(() => { loadTrades(); const id = window.setInterval(loadTrades, 10000); return () => window.clearInterval(id); }, []);

  const quote = quotes[selected] || { price: 0, previous: 0, ticks: [] };
  const market = MARKETS.find(m => m.symbol === selected) || MARKETS[0];
  const change = quote.previous ? ((quote.price - quote.previous) / quote.previous) * 100 : 0;
  const bias = useMemo(() => {
    if (quote.ticks.length < 5) return null;
    const a = quote.ticks.slice(-8);
    const up = a.filter((v,i) => i > 0 && v > a[i - 1]).length;
    return Math.round(up / (a.length - 1) * 100);
  }, [quote.ticks]);
  const totalPnl = trades.reduce((a,t) => a + Number(t.pnl || 0), 0);

  return <section className="rounded-2xl border border-white/10 bg-[#070b10] text-white overflow-hidden shadow-2xl">
    <div className="px-5 py-4 border-b border-white/10 bg-[#0a1017] flex flex-wrap justify-between gap-3">
      <div><div className="font-black text-lg">BOTVIO <span className="text-primary">Deriv Options</span></div><p className="text-xs text-slate-500">Live synthetic markets · strategy automation · verified running trades</p></div>
      <div className="flex gap-2 items-center"><Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">● LIVE</Badge><Button size="sm" variant="outline" className="border-white/10" onClick={loadTrades}><RefreshCw className="h-3.5 w-3.5 mr-1"/>Refresh</Button></div>
    </div>
    <div className="p-4 space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1 snap-x">{MARKETS.map(m => { const q = quotes[m.symbol]; const pct = q?.previous ? ((q.price-q.previous)/q.previous)*100 : 0; const up = pct >= 0; return <button key={m.symbol} onClick={()=>setSelected(m.symbol)} className={"text-left rounded-xl border p-3 min-w-[150px] snap-start " + (selected===m.symbol ? "border-primary bg-primary/10" : "border-white/10 bg-white/[.02]")}><div className="flex justify-between"><span className="text-xs font-semibold">{m.name}</span><span className={up?"text-emerald-400":"text-red-400"}>{up?"↑":"↓"}</span></div><div className="mt-1 text-base font-black">{q?fmt(q.price):"—"}</div><div className={up?"text-[11px] text-emerald-400":"text-[11px] text-red-400"}>{q?(up?"+":"")+pct.toFixed(3)+"%":"Connecting…"}</div><div className="text-[10px] text-slate-500 mt-1">{bias===null?"Waiting for ticks":"Bias "+bias+"%"}</div></button>; })}</div>

      <div className="grid xl:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-4">
          <Card className="bg-[#0b1119] border-white/10 text-white"><CardContent className="p-4">
            <div className="flex justify-between gap-3"><div><div className="text-xs text-slate-400">{market.name} · Deriv Synthetic Index</div><div className="text-3xl font-black mt-1">{fmt(quote.price)}</div><div className={change>=0?"text-sm text-emerald-400":"text-sm text-red-400"}>{change>=0?"+":""}{change.toFixed(3)}% · realtime</div></div><div className="flex gap-1">{["1m","5m","15m","1h"].map(x=><button key={x} className={"px-3 py-1.5 rounded-lg text-xs "+(x==="5m"?"bg-primary text-primary-foreground":"bg-white/5 text-slate-300")}>{x}</button>)}</div></div>
            <div className="mt-4 h-52 rounded-xl bg-black/20 border border-white/5 p-3 flex items-end gap-1">{(quote.ticks.length?quote.ticks:Array(28).fill(quote.price)).map((v,i)=>{const min=Math.min(...(quote.ticks.length?quote.ticks:[quote.price]));const max=Math.max(...(quote.ticks.length?quote.ticks:[quote.price]));const h=max===min?25:10+((v-min)/(max-min))*80;return <div key={i} className={"flex-1 rounded-t "+(i>0&&v>quote.ticks[i-1]?"bg-emerald-400":"bg-red-400")} style={{height:h+"%",opacity:.4+i/45}}/>;})}</div>
          </CardContent></Card>

          <Card className="bg-[#0b1119] border-white/10 text-white"><CardContent className="p-4">
            <div className="flex items-center justify-between mb-3"><div className="font-bold flex items-center gap-2"><Activity className="h-4 w-4 text-primary"/>Live Running Trades <Badge className="bg-emerald-500/15 text-emerald-400">{trades.length}</Badge></div><Button asChild size="sm" variant="outline" className="border-white/10"><Link to="/trades">View All Trades →</Link></Button></div>
            <div className="overflow-x-auto"><table className="w-full text-xs"><thead className="text-slate-500 border-b border-white/10"><tr><th className="py-2 text-left">Instrument</th><th className="text-left">Type</th><th>Stake</th><th>Open Time</th><th>P/L</th><th>Status</th></tr></thead><tbody>{trades.map(t=><tr key={t.id} className="border-b border-white/5"><td className="py-2 font-semibold">{MARKETS.find(m=>m.symbol===t.symbol)?.name||t.symbol}</td><td className={String(t.side).toUpperCase().includes("PUT")?"text-red-400":"text-emerald-400"}>{String(t.side).toUpperCase()}</td><td className="text-center">{"$"+Number(t.stake||0).toFixed(2)}</td><td className="text-center">{t.opened_at?new Date(t.opened_at).toLocaleTimeString():"—"}</td><td className={Number(t.pnl)>=0?"text-emerald-400":"text-red-400"}>{t.pnl==null?"—":(Number(t.pnl)>=0?"+":"")+"$"+Number(t.pnl).toFixed(2)}</td><td className="text-center"><Badge className="bg-emerald-500/15 text-emerald-400">Running</Badge></td></tr>)}</tbody></table>{!loadingTrades&&!trades.length&&<div className="py-8 text-center text-slate-500 text-sm">No verified running Deriv option trades right now.</div>}</div>
          </CardContent></Card>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-primary/20 bg-white/[.02] p-2">
            <AutoTradePanel
              scope="Deriv Options"
              availableAssets={MARKETS.map(m => ({ displaySymbol: m.symbol, label: m.name }))}
            />
          </div>
          <Card className="bg-[#0b1119] border-white/10 text-white"><CardContent className="p-4"><div className="font-bold flex items-center gap-2"><Shield className="h-4 w-4 text-red-400"/>Risk Controls</div><div className="grid grid-cols-2 gap-2 mt-3"><div className="rounded-lg border border-white/10 p-2"><span className="text-[10px] text-slate-500">Max trades</span><div className="font-bold">20</div></div><div className="rounded-lg border border-white/10 p-2"><span className="text-[10px] text-slate-500">Loss streak</span><div className="font-bold">3</div></div></div><div className="mt-3 text-xs text-slate-400 flex items-center gap-2"><Target className="h-3.5 w-3.5"/>Pause automation after 3 consecutive losses.</div></CardContent></Card>
          <Card className="bg-[#0b1119] border-white/10 text-white"><CardContent className="p-4"><div className="font-bold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary"/>Trade Analytics</div><div className="grid grid-cols-2 gap-2 mt-3"><div className="rounded-lg bg-emerald-500/10 p-2"><div className="text-[10px] text-slate-500">Running</div><div className="text-xl font-black">{trades.length}</div></div><div className="rounded-lg bg-white/5 p-2"><div className="text-[10px] text-slate-500">Open P/L</div><div className={totalPnl>=0?"text-xl font-black text-emerald-400":"text-xl font-black text-red-400"}>{totalPnl>=0?"+":""}{"$"}{totalPnl.toFixed(2)}</div></div></div></CardContent></Card>
        </div>
      </div>
    </div>
  </section>;
}
