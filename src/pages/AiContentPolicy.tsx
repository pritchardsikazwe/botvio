import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { Link } from "react-router-dom";

const AiContentPolicy = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="AI Content Policy – Botvio"
      description="How Botvio uses AI tools for drafting, analysis and trading technology, and the human-review process every AI-assisted article goes through before publication."
    />
    <Header />
    <main className="container mx-auto max-w-3xl px-4 py-12 prose prose-invert">
      <h1>AI Content Policy</h1>
      <p className="text-muted-foreground">
        Botvio uses AI tools inside the product (chart analysis, signal
        engines, code) and, at times, to assist with drafting editorial
        content. This page explains where AI is used, where it is not, and
        what human review looks like.
      </p>

      <h2>Where AI is used in the product</h2>
      <ul>
        <li>Chart analysis tools that read uploaded chart images.</li>
        <li>Signal-scoring, spike-prediction and expiry-model engines.</li>
        <li>Assistive summarisation inside the trading dashboard.</li>
      </ul>
      <p>
        These features are described in more detail on the relevant product
        pages and always carry a risk notice. Model outputs are estimates and
        should not be treated as certainty.
      </p>

      <h2>Where AI is used in editorial content</h2>
      <ul>
        <li>Structuring outlines and drafts for educational articles.</li>
        <li>Summarising primary-source material into plain-English explanations.</li>
        <li>Translating articles between languages.</li>
      </ul>

      <h2>Human review before publication</h2>
      <p>
        AI-assisted drafts do not go live automatically. Every published
        article is reviewed by a human editor for accuracy, tone, balance,
        source quality and financial-risk language before publication, per
        our{" "}
        <Link to="/editorial-policy" className="text-primary underline">
          Editorial Policy
        </Link>
        .
      </p>

      <h2>What AI is never used for</h2>
      <ul>
        <li>Fabricating author biographies, testimonials or reviews.</li>
        <li>Inventing statistics, regulatory claims or performance figures.</li>
        <li>Producing personalised financial advice.</li>
        <li>Publishing high volumes of thin, near-duplicate pages.</li>
      </ul>

      <h2>Reader feedback</h2>
      <p>
        If you find an AI-assisted article that reads as inaccurate, generic
        or unhelpful, email <a href="mailto:info@botvio.live" className="text-primary underline">info@botvio.live</a>{" "}
        with the URL and we will review it.
      </p>
    </main>
  </div>
);

export default AiContentPolicy;