import { Link } from "react-router-dom";
import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Shield,
  Clock,
  Wallet,
  Layers,
  Headphones,
  Sparkles,
} from "lucide-react";
import { BrokerReview as BrokerReviewData, brokerReviews } from "@/data/brokerReviews";

interface Props {
  slug: string;
}

function jsonLd(data: BrokerReviewData) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: `${data.name} Review — ${data.tagline}`,
        author: { "@type": "Organization", name: "Botvio Editorial Team" },
        publisher: {
          "@type": "Organization",
          name: "Botvio",
          url: "https://botvio.live",
        },
        inLanguage: "en-US",
        datePublished: "2026-01-15",
        dateModified: "2026-07-01",
        mainEntityOfPage: `https://botvio.live/brokers/${data.slug}`,
      },
      {
        "@type": "FAQPage",
        mainEntity: data.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://botvio.live/" },
          { "@type": "ListItem", position: 2, name: "Brokers", item: "https://botvio.live/brokers" },
          { "@type": "ListItem", position: 3, name: data.name, item: `https://botvio.live/brokers/${data.slug}` },
        ],
      },
    ],
  };
}

export default function BrokerReview({ slug }: Props) {
  const data = brokerReviews[slug];
  if (!data) return null;
  const others = Object.values(brokerReviews).filter((b) => b.slug !== data.slug).slice(0, 6);
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${data.name} Review 2026 — ${data.tagline}`}
        description={`Independent ${data.name} review by Botvio: regulation, spreads, platforms, deposits, withdrawals, pros, cons and who it's best for. Updated for 2026.`}
      />
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(data)) }}
      />
      <main className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Breadcrumb */}
        <nav className="text-xs text-muted-foreground mb-4" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1">
            <li><Link to="/" className="hover:text-primary">Home</Link></li>
            <li>/</li>
            <li><Link to="/brokers" className="hover:text-primary">Brokers</Link></li>
            <li>/</li>
            <li className="text-foreground font-semibold">{data.name} Review</li>
          </ol>
        </nav>

        {/* Hero */}
        <section
          className="rounded-2xl p-6 md:p-8 mb-6 border"
          style={{
            background: `linear-gradient(135deg, ${data.brand}22, transparent)`,
            borderColor: `${data.brand}55`,
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="min-w-0">
              <Badge className="mb-2" variant="outline">Independent editorial review · Updated 2026</Badge>
              <h1 className="text-2xl md:text-4xl font-extrabold text-foreground leading-tight">
                {data.logoEmoji} {data.name} Review — {data.tagline}
              </h1>
              <p className="text-sm md:text-base text-muted-foreground mt-3 max-w-2xl leading-relaxed">
                A detailed, hands-on review of {data.name}: what the broker does
                well, where it falls short, and the exact traders it's best for.
                Written by the Botvio Editorial Team.
              </p>
            </div>
            {data.affiliateUrl && (
              <div className="shrink-0 flex flex-col gap-2">
                <a href={data.affiliateUrl} target="_blank" rel="sponsored noopener noreferrer">
                  <Button size="lg" className="font-bold gap-2 w-full">
                    <ExternalLink className="h-4 w-4" /> Open {data.name} account
                  </Button>
                </a>
                <p className="text-[11px] text-muted-foreground text-center">
                  Affiliate link — see disclosure
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Quick facts */}
        <section aria-labelledby="quick-facts" className="mb-8">
          <h2 id="quick-facts" className="sr-only">Quick facts</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Shield, label: "Regulation", value: data.regulation[0] },
              { icon: Wallet, label: "Min deposit", value: data.minDeposit },
              { icon: Layers, label: "Spreads from", value: data.spreadsFrom },
              { icon: Sparkles, label: "Max leverage", value: data.leverage },
            ].map((f) => (
              <Card key={f.label}>
                <CardContent className="p-4">
                  <f.icon className="h-4 w-4 text-primary mb-1.5" />
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{f.label}</p>
                  <p className="text-sm font-extrabold text-foreground mt-0.5">{f.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* TOC */}
        <aside className="mb-8 rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2">On this page</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 text-sm">
            {[
              ["Overview", "overview"],
              ["Regulation & safety", "regulation"],
              ["Trading conditions", "conditions"],
              ["Platforms", "platforms"],
              ["Deposits & withdrawals", "funding"],
              ["Instruments", "instruments"],
              ["Customer support", "support"],
              ["Pros & cons", "pros"],
              ["Who it's best for", "best-for"],
              ["Comparison table", "compare"],
              ["FAQs", "faqs"],
              ["Final verdict", "verdict"],
            ].map(([label, id]) => (
              <li key={id}>
                <a href={`#${id}`} className="text-muted-foreground hover:text-primary flex items-center gap-1">
                  <ArrowRight className="h-3 w-3" /> {label}
                </a>
              </li>
            ))}
          </ul>
        </aside>

        {/* Sections */}
        <article className="prose prose-invert max-w-none space-y-8">
          <section id="overview">
            <h2 className="text-xl md:text-2xl font-extrabold text-foreground mb-3">Overview</h2>
            <div className="text-sm md:text-base text-muted-foreground leading-relaxed [&_p]:mb-3 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1"
              dangerouslySetInnerHTML={{ __html: data.sections.overview }} />
          </section>

          <section id="regulation">
            <h2 className="text-xl md:text-2xl font-extrabold text-foreground mb-3">Regulation & safety</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {data.regulation.map((r) => (
                <Badge key={r} variant="outline"><Shield className="h-3 w-3 mr-1" /> {r}</Badge>
              ))}
            </div>
            <div className="text-sm md:text-base text-muted-foreground leading-relaxed [&_p]:mb-3 [&_strong]:text-foreground"
              dangerouslySetInnerHTML={{ __html: data.sections.regulationDetail }} />
          </section>

          <section id="conditions">
            <h2 className="text-xl md:text-2xl font-extrabold text-foreground mb-3">Trading conditions</h2>
            <div className="grid gap-3 sm:grid-cols-3 mb-4">
              <Card><CardContent className="p-3"><p className="text-[11px] uppercase text-muted-foreground">Spreads from</p><p className="text-sm font-bold text-foreground">{data.spreadsFrom}</p></CardContent></Card>
              <Card><CardContent className="p-3"><p className="text-[11px] uppercase text-muted-foreground">Commission</p><p className="text-sm font-bold text-foreground">{data.commission}</p></CardContent></Card>
              <Card><CardContent className="p-3"><p className="text-[11px] uppercase text-muted-foreground">Leverage</p><p className="text-sm font-bold text-foreground">{data.leverage}</p></CardContent></Card>
            </div>
            <div className="text-sm md:text-base text-muted-foreground leading-relaxed [&_p]:mb-3 [&_strong]:text-foreground"
              dangerouslySetInnerHTML={{ __html: data.sections.tradingConditions }} />
          </section>

          <section id="platforms">
            <h2 className="text-xl md:text-2xl font-extrabold text-foreground mb-3">Platforms</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {data.platforms.map((p) => (
                <Badge key={p} variant="outline">{p}</Badge>
              ))}
            </div>
            <div className="text-sm md:text-base text-muted-foreground leading-relaxed [&_p]:mb-3 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1"
              dangerouslySetInnerHTML={{ __html: data.sections.platformsDetail }} />
          </section>

          <section id="funding">
            <h2 className="text-xl md:text-2xl font-extrabold text-foreground mb-3">Deposits, withdrawals & bonuses</h2>
            <div className="grid gap-3 md:grid-cols-3 mb-3">
              <Card><CardContent className="p-4"><Wallet className="h-4 w-4 text-primary mb-1.5" /><p className="text-[11px] uppercase text-muted-foreground">Deposit</p><p className="text-sm text-foreground mt-1 leading-relaxed">{data.deposit}</p></CardContent></Card>
              <Card><CardContent className="p-4"><Clock className="h-4 w-4 text-primary mb-1.5" /><p className="text-[11px] uppercase text-muted-foreground">Withdrawal</p><p className="text-sm text-foreground mt-1 leading-relaxed">{data.withdrawal}</p></CardContent></Card>
              <Card><CardContent className="p-4"><Sparkles className="h-4 w-4 text-primary mb-1.5" /><p className="text-[11px] uppercase text-muted-foreground">Bonuses</p><p className="text-sm text-foreground mt-1 leading-relaxed">{data.bonuses}</p></CardContent></Card>
            </div>
            <div className="text-sm md:text-base text-muted-foreground leading-relaxed [&_p]:mb-3 [&_strong]:text-foreground"
              dangerouslySetInnerHTML={{ __html: data.sections.accountFunding }} />
          </section>

          <section id="instruments">
            <h2 className="text-xl md:text-2xl font-extrabold text-foreground mb-3">Tradable instruments</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {data.instruments.map((i) => (
                <Badge key={i} variant="outline">{i}</Badge>
              ))}
            </div>
            <div className="text-sm md:text-base text-muted-foreground leading-relaxed [&_p]:mb-3 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1"
              dangerouslySetInnerHTML={{ __html: data.sections.instrumentsDetail }} />
          </section>

          <section id="support">
            <h2 className="text-xl md:text-2xl font-extrabold text-foreground mb-3">Customer support</h2>
            <div className="flex items-center gap-2 mb-3 text-sm text-foreground">
              <Headphones className="h-4 w-4 text-primary" /> {data.support}
            </div>
            <div className="text-sm md:text-base text-muted-foreground leading-relaxed [&_p]:mb-3 [&_strong]:text-foreground"
              dangerouslySetInnerHTML={{ __html: data.sections.supportDetail }} />
          </section>

          <section id="pros">
            <h2 className="text-xl md:text-2xl font-extrabold text-foreground mb-3">Pros & cons</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <Card className="border-success/30">
                <CardContent className="p-4">
                  <h3 className="text-sm font-extrabold text-success mb-2 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Pros</h3>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {data.pros.map((p, i) => <li key={i} className="flex gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" /> <span>{p}</span></li>)}
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-destructive/30">
                <CardContent className="p-4">
                  <h3 className="text-sm font-extrabold text-destructive mb-2 flex items-center gap-1"><XCircle className="h-4 w-4" /> Cons</h3>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {data.cons.map((c, i) => <li key={i} className="flex gap-2"><XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" /> <span>{c}</span></li>)}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          <section id="best-for">
            <h2 className="text-xl md:text-2xl font-extrabold text-foreground mb-3">Who {data.name} is best for</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {data.bestFor.map((b) => (
                <Badge key={b} className="bg-primary/10 text-primary border-primary/30">{b}</Badge>
              ))}
            </div>
            <div className="text-sm md:text-base text-muted-foreground leading-relaxed [&_p]:mb-3 [&_strong]:text-foreground"
              dangerouslySetInnerHTML={{ __html: data.sections.bestForDetail }} />
          </section>

          <section id="compare">
            <h2 className="text-xl md:text-2xl font-extrabold text-foreground mb-3">Comparison table</h2>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left p-3 font-bold">Broker</th>
                    <th className="text-left p-3 font-bold">Min deposit</th>
                    <th className="text-left p-3 font-bold">Spreads from</th>
                    <th className="text-left p-3 font-bold">Leverage</th>
                    <th className="text-left p-3 font-bold">Best for</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-primary/5">
                    <td className="p-3 font-extrabold text-foreground">{data.name}</td>
                    <td className="p-3">{data.minDeposit}</td>
                    <td className="p-3">{data.spreadsFrom}</td>
                    <td className="p-3">{data.leverage}</td>
                    <td className="p-3">{data.bestFor[0]}</td>
                  </tr>
                  {others.map((b) => (
                    <tr key={b.slug} className="border-t border-border">
                      <td className="p-3 font-bold text-foreground">
                        <Link to={`/brokers/${b.slug}`} className="hover:text-primary">{b.name}</Link>
                      </td>
                      <td className="p-3 text-muted-foreground">{b.minDeposit}</td>
                      <td className="p-3 text-muted-foreground">{b.spreadsFrom}</td>
                      <td className="p-3 text-muted-foreground">{b.leverage}</td>
                      <td className="p-3 text-muted-foreground">{b.bestFor[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="faqs">
            <h2 className="text-xl md:text-2xl font-extrabold text-foreground mb-3">FAQs</h2>
            <Accordion type="single" collapsible className="w-full">
              {data.faqs.map((f, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-sm font-bold text-left">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          <section id="verdict">
            <h2 className="text-xl md:text-2xl font-extrabold text-foreground mb-3">Final verdict</h2>
            <div className="text-sm md:text-base text-muted-foreground leading-relaxed [&_p]:mb-3 [&_strong]:text-foreground"
              dangerouslySetInnerHTML={{ __html: data.sections.verdict }} />
            {data.affiliateUrl && (
              <div className="mt-6 rounded-lg border border-primary/30 bg-primary/5 p-5">
                <p className="text-sm font-bold text-foreground mb-2">Ready to open a {data.name} account?</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Botvio may earn a commission if you open an account through this link. It does not change our editorial view — see our <Link to="/affiliate-disclosure" className="underline hover:text-primary">affiliate disclosure</Link>.
                </p>
                <a href={data.affiliateUrl} target="_blank" rel="sponsored noopener noreferrer">
                  <Button size="lg" className="font-bold gap-2">
                    <ExternalLink className="h-4 w-4" /> Open {data.name} account
                  </Button>
                </a>
              </div>
            )}
          </section>
        </article>

        {/* Related brokers */}
        <section className="mt-10 pt-6 border-t border-border">
          <h2 className="text-lg font-extrabold text-foreground mb-3">Compare other brokers</h2>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {others.map((b) => (
              <Link key={b.slug} to={`/brokers/${b.slug}`}>
                <Card className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-3">
                    <p className="text-sm font-bold text-foreground">{b.logoEmoji} {b.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{b.tagline}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Back */}
        <div className="mt-10">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}