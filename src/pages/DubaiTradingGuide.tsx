import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, ShieldCheck, Clock3, Languages, MapPinned } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Button } from "@/components/ui/button";
import { AffiliateAccountGuide } from "@/components/affiliate/AffiliateAccountGuide";

const topics = [
  ["synthetic-indices-dubai-guide","Synthetic Indices in Dubai: Complete UAE Beginner's Guide","Start with how synthetic markets work, what makes them different from traditional markets, and the main risks."],
  ["how-to-trade-synthetic-indices-dubai","How to Trade Synthetic Indices in Dubai","A practical framework for account setup, market selection, charts, risk controls and journaling."],
  ["deriv-synthetic-indices-uae","Deriv Synthetic Indices UAE: What Dubai Traders Need to Know","A factual guide to Derived Indices, UAE availability, platform choices and responsible research."],
  ["synthetic-indices-vs-forex-dubai","Synthetic Indices vs Forex in Dubai","Compare market structure, availability, session timing and risk without assuming one market suits everyone."],
  ["synthetic-indices-trading-hours-dubai","Synthetic Indices Trading Hours in Dubai","Convert 24/7 synthetic-market availability and major forex sessions into Dubai time."],
  ["volatility-75-dubai-guide","Volatility 75 Trading in Dubai: Complete Guide","Understand V75 terminology, chart structure, risk sizing and why historical patterns are not guarantees."],
  ["v75-scalping-dubai","V75 Scalping Strategy for Dubai Traders","A rules-based educational framework for short-term V75 analysis, entries, exits and risk."],
  ["deriv-mt5-dubai-guide","How to Set Up Deriv MT5 in Dubai","A step-by-step guide to MT5 setup, account selection, charts and risk controls."],
  ["forex-trading-dubai-guide","Forex Trading in Dubai: Beginner's Guide","Learn the basics of majors, sessions, spreads, leverage and a practical trading routine."],
  ["gold-trading-dubai-guide","Gold XAUUSD Trading in Dubai: Beginner's Guide","A Dubai-time guide to XAUUSD sessions, volatility, macro events and risk management."],
];

export default function DubaiTradingGuide() {
  return <div className="min-h-screen bg-background"><SEOHead title="Dubai Trading Guide — Synthetic Indices, Forex, Gold & MT5 | Botvio" description="Botvio's Dubai and UAE trading research hub: synthetic indices, Deriv, MT5, forex, gold, risk management and Arabic-ready educational content." jsonLd={{"@context":"https://schema.org","@type":"CollectionPage","name":"Dubai Trading Guide","url":"https://botvio.live/dubai","inLanguage":["en","ar"]}} /><Header /><main className="container mx-auto px-4 py-8">
    <section className="rounded-3xl border border-border bg-card p-6 sm:p-10">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary"><MapPinned className="h-4 w-4" /> Dubai & UAE research hub</div>
      <h1 className="mt-3 max-w-4xl text-3xl font-extrabold tracking-tight sm:text-5xl">Trading in Dubai: Synthetic Indices, Forex, Gold & MT5</h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">A dedicated UAE research hub for traders who want practical explanations, Dubai-time examples, broker-source verification, risk education and transparent affiliate disclosures.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border p-4"><Clock3 className="h-5 w-5 text-primary" /><h2 className="mt-2 font-semibold">Dubai time</h2><p className="mt-1 text-sm text-muted-foreground">GST (UTC+4) is used when session timing matters.</p></div>
        <div className="rounded-2xl border border-border p-4"><Languages className="h-5 w-5 text-primary" /><h2 className="mt-2 font-semibold">English + Arabic ready</h2><p className="mt-1 text-sm text-muted-foreground">The content structure supports localized Arabic/RTL pages rather than keyword-stuffed translations.</p></div>
        <div className="rounded-2xl border border-border p-4"><ShieldCheck className="h-5 w-5 text-primary" /><h2 className="mt-2 font-semibold">Research first</h2><p className="mt-1 text-sm text-muted-foreground">No guaranteed profits, fabricated performance figures or hidden affiliate relationships.</p></div>
      </div>
    </section>
    <section className="mt-10"><div className="mb-5 flex items-end justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Dubai content cluster</p><h2 className="text-2xl font-bold">Start with the UAE guides</h2></div><BookOpen className="h-5 w-5 text-primary" /></div>
      <div className="grid gap-4 md:grid-cols-2">{topics.map(([slug,title,desc]) => <article key={slug} className="rounded-2xl border border-border bg-card p-5"><h3 className="text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{desc}</p><Link to={`/blog/${slug}`} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">Read guide <ArrowRight className="h-4 w-4" /></Link></article>)}</div>
    </section>
    <section className="mt-10 rounded-2xl border border-border bg-card p-6"><h2 className="text-xl font-bold">How to use this hub</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Start with the beginner guide, then move to a market-specific page, platform setup and risk management. Broker availability and regulatory conditions can change, so use current provider documentation for account decisions.</p><div className="mt-4 flex flex-wrap gap-2"><Link to="/learn"><Button variant="outline">Botvio Academy</Button></Link><Link to="/blog/category/risk-management"><Button variant="outline">Risk management</Button></Link><Link to="/blog/category/deriv"><Button variant="outline">Deriv research</Button></Link></div><section className="mt-8 grid gap-4 sm:grid-cols-2"><Link to="/synthetic-indices" className="rounded-2xl border bg-card p-5 hover:border-primary/40"><h2 className="text-lg font-bold">Synthetic Indices Research Hub</h2><p className="mt-2 text-sm text-muted-foreground">Browse Volatility, Boom, Crash and Step Index research.</p></Link><Link to="/dubai/tools" className="rounded-2xl border bg-card p-5 hover:border-primary/40"><h2 className="text-lg font-bold">Dubai Trading Tools</h2><p className="mt-2 text-sm text-muted-foreground">Use risk and session-planning tools before trading.</p></Link></section><section className="mt-8"><AffiliateAccountGuide broker="deriv" affiliateUrl="https://track.deriv.com/_a_gq1w0BG0D1hit6RV3zsGNd7ZgqdRLk/1/" /></section>
    </main></div>;
}
