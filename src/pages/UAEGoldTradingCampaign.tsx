import { ArrowRight, BookOpen, CalendarDays, Clock3, ExternalLink, ShieldCheck, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Button } from "@/components/ui/button";

const affiliateUrl = (import.meta.env.VITE_DERIV_AFFILIATE_URL as string | undefined)?.trim();

const benefits = [
  { icon: TrendingUp, title: "Gold trading education", text: "Learn about XAUUSD, trading sessions, volatility, position sizing and the risks of leveraged products." },
  { icon: Clock3, title: "Platform and market access", text: "Review MT5 and available products directly with Deriv. Availability and conditions depend on your country and account." },
  { icon: ShieldCheck, title: "Risk before reward", text: "Use a written plan, set a maximum loss and never trade with money you cannot afford to lose." },
];

export default function UAEGoldTradingCampaign() {
  return <div className="min-h-screen bg-background">
    <SEOHead title="UAE Gold Trading Guide & Deriv MT5 Information | Botvio" description="Explore Botvio's UAE gold-trading education hub: XAUUSD basics, MT5, risk management and information about Deriv's advertised UAE referral promotion. Check official eligibility and terms." canonicalUrlOverride="https://botvio.live/uae-gold-trading" />
    <Header />
    <main className="container mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <section className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-card to-background p-6 sm:p-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-background/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-amber-600"><TrendingUp className="h-4 w-4" /> Botvio · UAE Gold Trading</div>
        <h1 className="mt-5 max-w-4xl text-3xl font-extrabold tracking-tight sm:text-5xl">Build your gold-trading knowledge before you trade</h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">A practical starting point for UAE-based traders exploring gold markets, MetaTrader 5 and trading risk. Understand the product, check local eligibility and read the provider's current terms before opening an account.</p>
        <div className="mt-7 flex flex-wrap gap-3">
          {affiliateUrl ? <a href={affiliateUrl} target="_blank" rel="noopener noreferrer sponsored nofollow" onClick={() => { try { window.sessionStorage.setItem("botvio_uae_deriv_click_at", new Date().toISOString()); } catch {} }}><Button size="lg">Visit Deriv <ExternalLink className="ml-2 h-4 w-4" /></Button></a> : <Link to="/start-trading?utm_source=uae_gold_campaign&utm_medium=internal&utm_campaign=uae_gold"><Button size="lg">Explore trading options <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>}
          <Link to="/learn"><Button size="lg" variant="outline">Learn with Botvio <BookOpen className="ml-2 h-4 w-4" /></Button></Link>
        </div>
        <p className="mt-4 max-w-3xl text-xs leading-5 text-muted-foreground">Botvio is an independent educational platform. A link to a broker may be an affiliate link where configured. Broker products and services may not be available in every country.</p>
      </section>
      <section className="mt-7 grid gap-4 md:grid-cols-3">
        {benefits.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-2xl border border-border bg-card p-5 sm:p-6"><Icon className="h-6 w-6 text-amber-600" /><h2 className="mt-4 text-lg font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></article>)}
      </section>
      <section className="mt-7 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <article className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Promotion information</p>
          <h2 className="mt-2 text-2xl font-bold">Deriv's advertised UAE referral campaign</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">A partner email supplied to Botvio describes an additional $20 bonus for each qualifying UAE referral on top of regular commission. The advertised campaign period is 1 October–30 November 2026. The referred client must verify their account, place their first trade and satisfy the complete promotion requirements.</p>
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <h3 className="font-semibold">Other offers mentioned in the email</h3>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
              <li>25% promotional credit, up to $500, on an eligible first Deriv MT5 Gold deposit. The credit is described as non-withdrawable and subject to terms.</li>
              <li>A free Dubai Gold Workshop advertised for 21–22 November 2026 at Deriv's Dubai office. Confirm registration, eligibility and availability with Deriv.</li>
              <li>Derived Indices availability is subject to the products and conditions offered to each client.</li>
            </ul>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">These details are transcribed from a partner email and are not independently verified or a guarantee that an offer remains available. Read the official terms and confirm eligibility with Deriv before acting.</p>
        </article>
        <aside className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <CalendarDays className="h-6 w-6 text-primary" />
          <h2 className="mt-3 text-xl font-bold">Campaign dates</h2>
          <p className="mt-2 text-sm text-muted-foreground">1 October – 30 November 2026</p>
          <div className="my-5 border-t border-border" />
          <h3 className="font-semibold">Dubai Gold Workshop</h3>
          <p className="mt-1 text-sm text-muted-foreground">21–22 November 2026 · Registration and availability must be confirmed with Deriv.</p>
          <div className="mt-5"><Link to="/dubai"><Button variant="outline" className="w-full">Visit Dubai trading guide <ArrowRight className="ml-2 h-4 w-4" /></Button></Link></div>
        </aside>
      </section>
      <section className="mt-7 rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h2 className="text-2xl font-bold">A safer way to approach gold trading</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Understand leverage", "Losses can exceed expectations when markets move quickly; understand the product terms."],
            ["Plan each trade", "Define entry, invalidation level and maximum acceptable loss before entering."],
            ["Check the provider", "Verify current licensing, country eligibility, fees and withdrawal conditions directly."],
            ["Avoid promises", "No bot, signal or strategy can guarantee profits or a fixed daily return."],
          ].map(([title, text]) => <div key={title} className="rounded-xl bg-muted/40 p-4"><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div>)}
        </div>
      </section>
      <section className="mt-7 rounded-2xl border border-destructive/30 bg-destructive/5 p-5 sm:p-6">
        <h2 className="font-bold">Risk warning</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">CFDs and other leveraged derivative products are complex and carry a significant risk of loss. This page is educational and promotional information, not investment advice. Consider whether you understand the products and can afford the risk. Check local laws and product availability before registering or trading.</p>
      </section>
    </main>
  </div>;
}
