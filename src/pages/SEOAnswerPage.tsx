import { Link, useLocation } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";
import { seoPages, countrySEOPages } from "@/content/seoPages";
import { seoTrafficPages } from "@/content/seoTrafficPages";
import { DerivAffiliateButton } from "@/components/trading/DerivAffiliateButton";

const SEOAnswerPage = () => {
  const location = useLocation();
  const slug = location.pathname.replace(/^\//, "");
  const page = seoPages[slug] || seoTrafficPages[slug] || null;
  const countryPage = countrySEOPages[slug] || null;

  if (!page && !countryPage) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Page not found</h1>
          <Link to="/"><Button>Go Home</Button></Link>
        </main>
      </div>
    );
  }

  if (countryPage) {
    const faqJsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: countryPage.faqs.map(f => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    };

    return (
      <div className="min-h-screen bg-muted/30">
        <SEOHead title={countryPage.metaTitle} description={countryPage.metaDescription} jsonLd={faqJsonLd} />
        <Header />
        <AffiliateBanner />
        <article className="mx-auto w-full max-w-3xl px-4 py-10 pb-16">
          <Badge className="bg-primary text-primary-foreground mb-3">{countryPage.country}</Badge>
          <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl mb-6">{countryPage.h1}</h1>
          <ProseContent html={countryPage.content} />
          <FAQSection faqs={countryPage.faqs} />
          <CTAFooter />
          <RiskDisclaimer />
        </article>
      </div>
    );
  }

  // SEO answer page
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Botvio",
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        description: "Botvio is an AI-powered automated trading bot for Deriv synthetic indices including Boom & Crash, Volatility indices, and digit contracts.",
      },
      {
        "@type": "FAQPage",
        mainEntity: page!.faqs.map(f => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <SEOHead title={page!.metaTitle} description={page!.metaDescription} jsonLd={faqJsonLd} />
      <Header />
      <AffiliateBanner />
      <article className="mx-auto w-full max-w-3xl px-4 py-10 pb-16">
        <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl mb-8">{page!.h1}</h1>

        {page!.sections.map((s, i) => (
          <section key={i} className="mb-10">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{s.heading}</h2>
            <ProseContent html={s.content} />
          </section>
        ))}

        <FAQSection faqs={page!.faqs} />

        {page!.keywords && (
          <div className="mt-8 flex flex-wrap gap-2">
            {page!.keywords.map(k => (
              <Badge key={k} variant="outline" className="text-xs">{k}</Badge>
            ))}
          </div>
        )}

        <CTAFooter />
        <RiskDisclaimer />
      </article>
    </div>
  );
};

const AffiliateBanner = () => (
  <div className="bg-gradient-to-r from-emerald-500/10 via-primary/10 to-warning/10 border-b border-border/30">
    <div className="container mx-auto px-4 py-2.5 flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-warning" />
        <span className="text-sm font-medium">Start trading with Deriv — Free demo account</span>
      </div>
      <DerivAffiliateButton size="sm" label="Open Free Account →" />
    </div>
  </div>
);

const ProseContent = ({ html }: { html: string }) => (
  <div
    className="prose prose-slate dark:prose-invert max-w-none
      prose-headings:text-foreground prose-h2:text-2xl prose-h3:mt-6
      prose-p:leading-relaxed prose-p:text-muted-foreground
      prose-a:text-primary prose-strong:text-foreground
      prose-li:text-muted-foreground prose-li:marker:text-primary
      prose-blockquote:border-l-primary"
    dangerouslySetInnerHTML={{ __html: html }}
  />
);

const FAQSection = ({ faqs }: { faqs: { q: string; a: string }[] }) => (
  <section className="mt-12">
    <h2 className="text-2xl font-semibold text-foreground mb-6">Frequently Asked Questions</h2>
    <div className="space-y-4">
      {faqs.map((f, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold text-foreground mb-2">{f.q}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
        </div>
      ))}
    </div>
  </section>
);

const CTAFooter = () => (
  <div className="mt-12 rounded-2xl border border-border bg-card p-6 shadow-sm">
    <h3 className="text-xl font-semibold text-foreground">Ready to try Botvio?</h3>
    <p className="mt-2 text-muted-foreground">Explore AI strategies for synthetic indices, digits, and MT5 copy trading.</p>
    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
      <DerivAffiliateButton size="lg" label="Create Free Deriv Account" />
      <Link to="/"><Button size="lg" variant="outline">Try Botvio Free</Button></Link>
      <Link to="/strategies"><Button size="lg" variant="outline">View AI Strategies</Button></Link>
    </div>
  </div>
);

const RiskDisclaimer = () => (
  <p className="mt-6 text-xs text-muted-foreground">
    ⚠️ <strong>Risk Disclaimer:</strong> Trading involves significant risk. Capital can be lost. There are no guaranteed returns. Trade responsibly and only with funds you can afford to lose.
  </p>
);

export default SEOAnswerPage;
