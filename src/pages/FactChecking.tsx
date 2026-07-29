import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { Link } from "react-router-dom";

const FactChecking = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="Fact-Checking Policy – Botvio"
      description="How Botvio verifies the facts, data, sources and financial claims in every published article."
    />
    <Header />
    <main className="container mx-auto max-w-3xl px-4 py-12 prose prose-invert">
      <h1>Fact-Checking Policy</h1>
      <p className="text-muted-foreground">
        Botvio publishes financial content. Facts, figures and regulatory
        claims are verified before publication.
      </p>

      <h2>What we verify</h2>
      <ul>
        <li>Interest rates, inflation figures and other macro data.</li>
        <li>Broker regulatory status and licence numbers.</li>
        <li>Exchange, product and instrument specifications.</li>
        <li>Historical market data referenced in analysis.</li>
        <li>Quotes, statistics and third-party claims.</li>
      </ul>

      <h2>Preferred sources</h2>
      <ul>
        <li>Central banks and government agencies</li>
        <li>Financial regulators (FCA, CySEC, ASIC, FSCA, SEC and equivalents)</li>
        <li>Official broker and exchange documentation</li>
        <li>Official statistical offices</li>
        <li>Peer-reviewed academic research</li>
      </ul>

      <h2>What we avoid</h2>
      <ul>
        <li>Anonymous forum posts as a sole source.</li>
        <li>Affiliate marketing pages presented as independent research.</li>
        <li>Screenshots without an identifiable, verifiable origin.</li>
      </ul>

      <h2>Time-sensitive data</h2>
      <p>
        Market prices, spreads, promotions and regulatory details change.
        Where a claim depends on time-sensitive data we display the data
        timestamp and, where relevant, the timezone and session.
      </p>

      <h2>Flagging an error</h2>
      <p>
        Email <a href="mailto:info@botvio.live" className="text-primary underline">info@botvio.live</a>{" "}
        with the article URL and the source that contradicts our claim. We
        respond within a reasonable timeframe and correct verified errors per
        our{" "}
        <Link to="/corrections" className="text-primary underline">
          Corrections Policy
        </Link>
        .
      </p>
    </main>
  </div>
);

export default FactChecking;