import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { Link } from "react-router-dom";

const AffiliateDisclosure = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="Affiliate Disclosure – Botvio"
      description="How Botvio discloses affiliate relationships with brokers and third-party tools, and how those relationships do not determine our editorial conclusions."
    />
    <Header />
    <main className="container mx-auto max-w-3xl px-4 py-12 prose prose-invert">
      <h1>Affiliate Disclosure</h1>
      <p className="text-muted-foreground">
        Some pages on Botvio include affiliate links to brokers, exchanges or
        trading tools. This page explains what that means for you.
      </p>

      <h2>What an affiliate link is</h2>
      <p>
        When you click certain links on Botvio and open an account, deposit or
        subscribe with a third party, Botvio may receive a referral commission
        from that third party. The cost to you does not change.
      </p>

      <h2>Where these links appear</h2>
      <p>
        Broker reviews, comparison pages and articles that recommend a
        specific third-party product may contain affiliate links. Pages that
        contain affiliate links carry a visible "Affiliate Disclosure" badge.
      </p>

      <h2>How this affects our content</h2>
      <ul>
        <li>Affiliate relationships do not determine our editorial conclusions.</li>
        <li>We publish the risks, disadvantages and limitations of brokers we link to.</li>
        <li>We do not remove critical information because a company pays us.</li>
        <li>We do not accept payment to publish a specific rating or review outcome.</li>
      </ul>

      <h2>Independence checks</h2>
      <p>
        Broker reviews follow the same template regardless of whether an
        affiliate relationship exists: company overview, regulatory status,
        products, fees, deposit and withdrawal methods, support, country
        availability, advantages, disadvantages, risks, who it may suit and
        who should avoid it. See our{" "}
        <Link to="/editorial-policy" className="text-primary underline">
          Editorial Policy
        </Link>
        .
      </p>

      <h2>Trading risk still applies</h2>
      <p>
        Opening an account with any broker involves risk. Read our{" "}
        <Link to="/disclaimer" className="text-primary underline">
          Risk Disclosure
        </Link>{" "}
        before depositing capital.
      </p>

      <h2>Questions</h2>
      <p>
        Email <a href="mailto:info@botvio.live" className="text-primary underline">info@botvio.live</a>{" "}
        if you want to know whether a specific link is an affiliate link.
      </p>
    </main>
  </div>
);

export default AffiliateDisclosure;