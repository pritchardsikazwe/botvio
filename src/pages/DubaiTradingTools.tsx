import { useMemo, useState } from "react";
import { Calculator, Clock3, ShieldCheck } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { AffiliateAccountGuide } from "@/components/affiliate/AffiliateAccountGuide";
import { Button } from "@/components/ui/button";

const DERIV_SIGNUP="https://track.deriv.com/_a_gq1w0BG0D1hit6RV3zsGNd7ZgqdRLk/1/";

export default function DubaiTradingTools(){
  const [balance,setBalance]=useState("1000");
  const [risk,setRisk]=useState("1");
  const [stop,setStop]=useState("20");
  const [entry,setEntry]=useState("100");
  const [target,setTarget]=useState("140");
  const [session,setSession]=useState("London");
  const riskAmount=useMemo(()=>Number(balance||0)*Number(risk||0)/100,[balance,risk]);
  const rr=useMemo(()=>{const s=Math.abs(Number(entry)-Number(stop)); return s?Math.abs(Number(target)-Number(entry))/s:0},[entry,stop,target]);
  const sessions={Asia:"04:00–13:00",London:"11:00–20:00",NewYork:"16:00–01:00","London/New York overlap":"16:00–20:00"} as const;
  return <div className="min-h-screen bg-background"><SEOHead title="Dubai Trading Tools — Risk Calculator & Market Sessions | BOTVIO" description="Free Dubai-time trading tools for risk sizing, risk-reward planning and major forex session timing. Educational only."/><Header/><main className="container mx-auto px-4 py-8">
    <section className="rounded-3xl border bg-card p-6 sm:p-10"><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Dubai trading tools</p><h1 className="mt-2 text-3xl font-black sm:text-5xl">Practical tools for Dubai-time trading research</h1><p className="mt-4 max-w-3xl text-muted-foreground">Use these calculators to plan risk before you trade. They do not predict prices, guarantee outcomes or replace the broker's current trading conditions.</p></section>
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border bg-card p-6"><div className="flex items-center gap-2"><Calculator className="h-5 w-5 text-primary"/><h2 className="text-xl font-bold">Risk-per-trade calculator</h2></div><div className="mt-5 grid gap-4 sm:grid-cols-3">
        <label className="text-sm">Balance<input value={balance} onChange={e=>setBalance(e.target.value)} type="number" className="mt-1 w-full rounded-xl border bg-background p-3"/></label>
        <label className="text-sm">Risk %<input value={risk} onChange={e=>setRisk(e.target.value)} type="number" className="mt-1 w-full rounded-xl border bg-background p-3"/></label>
        <label className="text-sm">Stop distance<input value={stop} onChange={e=>setStop(e.target.value)} type="number" className="mt-1 w-full rounded-xl border bg-background p-3"/></label>
      </div><div className="mt-5 rounded-xl bg-primary/10 p-4"><p className="text-xs uppercase tracking-wider text-muted-foreground">Planned maximum loss</p><p className="mt-1 text-2xl font-black">{riskAmount.toFixed(2)} account units</p><p className="mt-1 text-xs text-muted-foreground">Position size still depends on the instrument, contract specification and broker conditions.</p></div></section>
      <section className="rounded-2xl border bg-card p-6"><div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary"/><h2 className="text-xl font-bold">Risk / reward planner</h2></div><div className="mt-5 grid gap-4 sm:grid-cols-3">
        <label className="text-sm">Entry<input value={entry} onChange={e=>setEntry(e.target.value)} type="number" className="mt-1 w-full rounded-xl border bg-background p-3"/></label>
        <label className="text-sm">Stop<input value={stop} onChange={e=>setStop(e.target.value)} type="number" className="mt-1 w-full rounded-xl border bg-background p-3"/></label>
        <label className="text-sm">Target<input value={target} onChange={e=>setTarget(e.target.value)} type="number" className="mt-1 w-full rounded-xl border bg-background p-3"/></label>
      </div><div className="mt-5 rounded-xl bg-primary/10 p-4"><p className="text-xs uppercase tracking-wider text-muted-foreground">Planned ratio</p><p className="mt-1 text-2xl font-black">{Number.isFinite(rr)?rr.toFixed(2):"0.00"} : 1</p></div></section>
    </div>
    <section className="mt-6 rounded-2xl border bg-card p-6"><div className="flex items-center gap-2"><Clock3 className="h-5 w-5 text-primary"/><h2 className="text-xl font-bold">Major session times in Dubai</h2></div><div className="mt-4 flex flex-wrap gap-2">{Object.keys(sessions).map(s=><Button key={s} variant={session===s?"default":"outline"} onClick={()=>setSession(s)}>{s}</Button>)}</div><p className="mt-4 text-2xl font-black">Dubai time: {sessions[session as keyof typeof sessions]}</p><p className="mt-2 text-sm text-muted-foreground">Session hours can shift in UTC-relative terms when other markets observe daylight-saving changes. Check current schedules before planning around a session.</p></section>
    <section className="mt-8"><AffiliateAccountGuide broker="deriv" affiliateUrl={DERIV_SIGNUP}/></section>
    <p className="mt-6 text-xs leading-5 text-muted-foreground">Risk warning: trading derivatives can result in substantial or total loss. These tools are educational calculations only. Review the current broker terms, instrument specifications and applicable restrictions before trading.</p>
  </main></div>
}