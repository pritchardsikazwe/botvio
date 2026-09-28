import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Botvio",
  url: "https://botvio.lovable.app",
  logo: "https://botvio.lovable.app/icon-512.png",
  description:
    "Independent financial education, market analysis and trading technology platform.",
  sameAs: [
    "https://youtube.com/@botvio",
    "https://www.facebook.com/botvio",
    "https://www.tiktok.com/@botviohq",
    "https://t.me/boaborea",
  ],
};

const About = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      seoKey="about"
      title="About Botvio – Financial Education & Market Analysis"
      description="Botvio is an independent financial education, market analysis and trading technology platform. Read about our purpose, editorial standards and what we are not."
      jsonLd={jsonLd}
    />
    <Header />

    <main className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold sm:text-4xl">About Botvio</h1>
      <p className="mt-3 text-lg text-muted-foreground leading-relaxed">
        Botvio is an independent financial education, market analysis and
        trading technology platform. We publish educational guides, market
        research and tools for traders learning how currencies, gold,
        cryptocurrencies and synthetic indices actually work.
      </p>

      <Separator className="my-8" />

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">What Botvio does</h2>
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground leading-relaxed">
          <li>Publishes financial education for beginner and intermediate traders.</li>
          <li>Produces market analysis and research on forex, gold, crypto and indices.</li>
          <li>Builds trading technology (AI chart analysis, signal engines, dashboards).</li>
          <li>Compares brokers and trading tools using a consistent editorial template.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">What Botvio is not</h2>
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground leading-relaxed">
          <li>Botvio is <strong>not a bank</strong>.</li>
          <li>Botvio is <strong>not a broker</strong> and does not hold customer funds.</li>
          <li>Botvio does <strong>not guarantee returns</strong> from any strategy, signal or tool.</li>
          <li>Botvio does <strong>not provide personalised financial advice</strong>. Content is educational and general.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">Our purpose</h2>
        <p className="text-muted-foreground leading-relaxed">
          Retail traders — particularly across Africa — often meet the
          markets through get-rich-quick promises and screenshots. Botvio
          exists to explain how these markets actually work: what leverage
          does to your account, why spreads matter, what a real risk plan
          looks like, and how to evaluate a broker or a strategy for
          yourself.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">Editorial standards</h2>
        <p className="text-muted-foreground leading-relaxed">
          Every article is produced under our published{" "}
          <Link to="/editorial-policy" className="text-primary underline">Editorial Policy</Link>,
          verified against our{" "}
          <Link to="/fact-checking" className="text-primary underline">Fact-Checking Policy</Link>,
          and updated per our{" "}
          <Link to="/corrections" className="text-primary underline">Corrections Policy</Link>.
          Use of AI tools is disclosed in our{" "}
          <Link to="/ai-content-policy" className="text-primary underline">AI Content Policy</Link>.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">Commercial relationships</h2>
        <p className="text-muted-foreground leading-relaxed">
          Some articles include affiliate links to brokers and tools. These
          relationships do not decide our editorial conclusions. Full details
          are on the{" "}
          <Link to="/affiliate-disclosure" className="text-primary underline">
            Affiliate Disclosure
          </Link>{" "}
          page.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">Risk philosophy</h2>
        <p className="text-muted-foreground leading-relaxed">
          Trading forex, CFDs, synthetic indices and cryptocurrencies can
          result in the loss of your entire deposit. Botvio publishes risk
          information alongside — not buried beneath — its educational
          content. See the full{" "}
          <Link to="/disclaimer" className="text-primary underline">
            Risk Disclosure
          </Link>
          .
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">Contact</h2>
        <p className="text-muted-foreground leading-relaxed">
          Email <a href="mailto:info@botvio.live" className="text-primary underline">info@botvio.live</a>{" "}
          for editorial feedback, corrections, partnerships or media enquiries.
          Full channels on the{" "}
          <Link to="/contact" className="text-primary underline">Contact page</Link>.
        </p>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link to="/learn">
          <Button size="lg">Explore Education</Button>
        </Link>
        <Link to="/market-analysis">
          <Button variant="outline" size="lg">Market Analysis</Button>
        </Link>
        <Link to="/blog">
          <Button variant="outline" size="lg">Read the Blog</Button>
        </Link>
      </div>
    </main>
  </div>
);

export default About;
