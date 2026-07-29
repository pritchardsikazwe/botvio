import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";

const Corrections = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="Corrections Policy – Botvio"
      description="How Botvio handles errors, corrections and material updates to published articles and market analysis."
    />
    <Header />
    <main className="container mx-auto max-w-3xl px-4 py-12 prose prose-invert">
      <h1>Corrections Policy</h1>
      <p className="text-muted-foreground">
        We correct errors when we find them and when readers point them out.
        This page explains how.
      </p>

      <h2>Types of change</h2>
      <ul>
        <li><strong>Typo / minor edit</strong> — grammar, formatting, link fixes. Handled silently.</li>
        <li><strong>Update</strong> — new information added because facts changed (rates, broker terms, prices). The article's "Last updated" date is bumped.</li>
        <li><strong>Correction</strong> — a factual error is fixed. The article shows a correction note describing what changed and when.</li>
        <li><strong>Retraction</strong> — an article is withdrawn because its central claim was wrong. The page is replaced with a retraction notice; the URL is preserved so external links do not break.</li>
      </ul>

      <h2>How to request a correction</h2>
      <ol>
        <li>Email <a href="mailto:info@botvio.live" className="text-primary underline">info@botvio.live</a> with the article URL, the claim you dispute and the source that contradicts it.</li>
        <li>We review against a primary source.</li>
        <li>If the correction is warranted we update the article and add a correction note.</li>
        <li>If the claim is accurate we reply with the source we used.</li>
      </ol>

      <h2>What we will not do</h2>
      <ul>
        <li>Quietly delete negative but accurate broker information.</li>
        <li>Alter historical signal or performance records to change the outcome.</li>
        <li>Backdate updates to hide an editorial change.</li>
      </ul>
    </main>
  </div>
);

export default Corrections;