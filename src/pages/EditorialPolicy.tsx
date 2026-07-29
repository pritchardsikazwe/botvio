import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { Link } from "react-router-dom";

const EditorialPolicy = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="Editorial Policy – How Botvio Publishes Financial Content"
      description="How the Botvio Editorial Team researches, writes, reviews, sources and updates every article on financial education, market analysis and trading technology."
    />
    <Header />
    <main className="container mx-auto max-w-3xl px-4 py-12 prose prose-invert">
      <h1>Editorial Policy</h1>
      <p className="text-muted-foreground">
        Botvio publishes financial education, market analysis and trading
        technology research. This page describes how we produce that content
        and the standards we hold ourselves to.
      </p>

      <h2>Who writes for Botvio</h2>
      <p>
        Articles are produced by the <strong>Botvio Editorial Team</strong>, a
        group of contributors working on financial education, market
        commentary and trading technology. We do not fabricate author
        biographies or professional credentials. Where an article is
        contributed by an external writer, that contributor is named.
      </p>

      <h2>How we plan content</h2>
      <ul>
        <li>We prioritise cornerstone educational guides over volume.</li>
        <li>Topics are chosen by reader questions, market events, and gaps in existing coverage.</li>
        <li>Signals and commercial content are separated from educational content.</li>
      </ul>

      <h2>Research and sourcing</h2>
      <p>
        Where a claim depends on external data we cite the source (central
        bank, regulator, exchange, broker documentation, official statistical
        agency or academic paper). Time-sensitive analysis includes the data
        timestamp and the session/timezone it refers to. See our{" "}
        <Link to="/fact-checking" className="text-primary underline">
          Fact-Checking Policy
        </Link>{" "}
        for details.
      </p>

      <h2>Use of AI tools</h2>
      <p>
        Botvio uses AI tools to assist with drafting, summarisation and code
        for our own trading technology. AI-assisted drafts are reviewed by a
        human editor before publication. Full details are in our{" "}
        <Link to="/ai-content-policy" className="text-primary underline">
          AI Content Policy
        </Link>
        .
      </p>

      <h2>Review workflow</h2>
      <ol>
        <li>Draft (human or AI-assisted)</li>
        <li>Editor review for accuracy, tone and balance</li>
        <li>Fact-check against primary sources</li>
        <li>Financial-risk review – no guarantees, no unrealistic profit claims</li>
        <li>SEO and readability review</li>
        <li>Publish, with author, published date and last-updated date</li>
      </ol>

      <h2>What we will not publish</h2>
      <ul>
        <li>Guaranteed profit claims or "risk-free" trading language.</li>
        <li>Fabricated authors, testimonials, statistics or regulatory claims.</li>
        <li>Manipulated or cherry-picked signal performance.</li>
        <li>Personalised financial advice. We publish education and analysis, not advice.</li>
      </ul>

      <h2>Updates and corrections</h2>
      <p>
        Every article shows a last-updated date. When facts change we update
        the article and note significant changes. Errors are handled via our{" "}
        <Link to="/corrections" className="text-primary underline">
          Corrections Policy
        </Link>
        .
      </p>

      <h2>Independence</h2>
      <p>
        Some articles include affiliate links to brokers or tools. Affiliate
        relationships never determine editorial conclusions – see our{" "}
        <Link to="/affiliate-disclosure" className="text-primary underline">
          Affiliate Disclosure
        </Link>
        .
      </p>

      <h2>Contact the editors</h2>
      <p>
        Email <a href="mailto:info@botvio.live" className="text-primary underline">info@botvio.live</a>{" "}
        with feedback, corrections or source suggestions.
      </p>
    </main>
  </div>
);

export default EditorialPolicy;