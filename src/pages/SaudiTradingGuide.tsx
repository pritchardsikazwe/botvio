import { Link } from "react-router-dom";
import { BookOpen, ShieldCheck, Clock3 } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Button } from "@/components/ui/button";
import { SAUDI_INDEX } from "@/content/saudiPosts";

const canonical="https://botvio.live/markets/saudi-arabia";
export default function SaudiTradingGuide(){
 return <div className="min-h-screen bg-background">
  <SEOHead title="Trading in Saudi Arabia: Forex, Synthetic Indices, Deriv, MT5 & Gold | BOTVIO" description="Saudi-focused trading education covering synthetic indices, forex, Deriv, MT5, gold XAUUSD, risk management and Saudi market context." canonicalUrlOverride={canonical} alternateLocales={[{code:"en",href:canonical},{code:"ar-SA",href:"https://botvio.live/ar/saudi-arabia"}]} jsonLd={{"@context":"https://schema.org","@type":"CollectionPage",name:"Trading in Saudi Arabia",description:"Saudi-focused trading education",url:canonical,inLanguage:"en"}} />
  <Header/>
  <main className="container mx-auto px-4 py-8">
   <section className="rounded-3xl border border-border bg-card p-6 sm:p-10">
    <p className="text-xs font-semibold text-primary">Saudi Arabia · المملكة العربية السعودية</p>
    <h1 className="mt-3 max-w-5xl text-3xl font-extrabold sm:text-5xl">Trading in Saudi Arabia: Forex, Synthetic Indices, Deriv, MT5 & Gold</h1>
    <p className="mt-5 max-w-4xl text-lg leading-8 text-muted-foreground">A Saudi-focused research hub with Arabic localization, Riyadh-time context, synthetic indices education, MT5 guides, forex and XAUUSD research, and practical risk-management material.</p>
    <div className="mt-7 grid gap-4 md:grid-cols-3">
     <div className="rounded-2xl border p-5"><BookOpen className="h-5 w-5 text-primary"/><h2 className="mt-3 font-bold">Native Saudi research</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">20 English research topics with matching Arabic versions.</p></div>
     <div className="rounded-2xl border p-5"><Clock3 className="h-5 w-5 text-primary"/><h2 className="mt-3 font-bold">Riyadh time</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Session and journaling guidance uses Saudi Arabia's UTC+3 local context.</p></div>
     <div className="rounded-2xl border p-5"><ShieldCheck className="h-5 w-5 text-primary"/><h2 className="mt-3 font-bold">Risk-first</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Educational content avoids guaranteed-profit and “best broker” claims.</p></div>
    </div>
   </section>
   <section className="mt-10">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-bold">Saudi trading research</h2><p className="mt-2 text-sm text-muted-foreground">English guides with Arabic counterparts.</p></div><Link to="/ar/saudi-arabia"><Button variant="outline">العربية</Button></Link></div>
    <div className="mt-5 grid gap-4 md:grid-cols-2">
     {SAUDI_INDEX.map(([slug,title,excerpt])=><article key={slug} className="rounded-2xl border bg-card p-5"><h3 className="text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-7 text-muted-foreground">{excerpt}</p><Link to={"/blog/"+slug} className="mt-4 inline-block text-sm font-semibold text-primary">Read guide →</Link></article>)}
    </div>
   </section>
   <p className="mt-8 rounded-2xl border border-border/60 bg-card/50 p-5 text-sm leading-7 text-muted-foreground">Educational content only. Product availability, regulation, fees and account conditions can change. Verify current information with the relevant provider and Saudi authorities before making financial decisions.</p>
  </main>
 </div>
}