import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { SiteFooter } from "@/components/SiteFooter";
import { Link } from "react-router-dom";

const Methodology = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="Methodology — How Botvio Produces Signals, Analysis & Education"
      description="A transparent walkthrough of the data sources, tools, human review process and AI usage behind every signal, chart analysis and article on Botvio."
    />
    <Header />
    <main className="container mx-auto max-w-3xl px-4 py-12 prose prose-invert">
      <nav aria-label="Breadcrumb" className="not-prose text-xs text-muted-foreground mb-6">
        <Link to="/" className="hover:text-primary">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/trust" className="hover:text-primary">Trust Center</Link>
        <span className="mx-2">/</span>
        <span>Methodology</span>
      </nav>
      <h1>Methodology</h1>
      <p>
        This page describes exactly how Botvio produces the market analysis,
        trading signals and educational articles you read on this site. If any
        step changes materially, this page is updated with the date of change.
      </p>

      <h2>Where our market data comes from</h2>
      <p>
        Price and market data used across the site is sourced from regulated
        brokers and public data APIs including <strong>Deriv</strong> (via
        their official app API), <strong>Binance</strong> public market
        endpoints, <strong>Twelve Data</strong> and, where relevant,{" "}
        <strong>MetaTrader 5</strong> brokers connected via user-owned
        credentials. We do not fabricate quotes or backfill missing candles
        with synthetic values.
      </p>

      <h2>How we produce trading signals</h2>
      <p>
        Signals combine a rules-based technical engine (the internal Botvio AI
        Strategy) with a human review step before publication. The engine
        considers price structure, momentum, session context and confluence
        rules; a member of the signals team reviews the shortlist against the
        current fundamental backdrop before anything is posted. Every signal
        states its entry, stop-loss, take-profit and confidence band — a
        signal without those four numbers is a rumour, not a signal.
      </p>

      <h2>How we produce AI chart analysis</h2>
      <p>
        The AI chart analyser accepts a user-uploaded screenshot, sends it to
        a large multimodal model with a fixed system prompt that enforces a
        top-down (Weekly → Daily → 4H → 1H) reading, and returns a structured
        summary. It never invents price levels — it reads the levels you show
        it. The model is called via the Lovable AI Gateway. Users see the raw
        output on their result screen; nothing is hidden or post-edited.
      </p>

      <h2>How we write articles</h2>
      <p>
        Articles are drafted by the Botvio Editorial Team using research from
        regulator publications, exchange documentation, central bank releases
        and reputable financial media. AI tooling is used to speed up
        drafting; every article is then reviewed by a human editor for
        accuracy, tone and originality before publication. See our{" "}
        <Link to="/editorial-policy">editorial policy</Link>,{" "}
        <Link to="/fact-checking">fact-checking</Link> and{" "}
        <Link to="/ai-content-policy">AI content policy</Link> for the fuller
        version of this process.
      </p>

      <h2>What we deliberately do not do</h2>
      <ul>
        <li>We do not manage anyone's money. There is no PAMM, no pool, no fund.</li>
        <li>We do not guarantee returns and we do not publish "100% win-rate" claims.</li>
        <li>We do not sell insider information or leaked data.</li>
        <li>We do not remove articles quietly to hide errors — corrections are logged on our <Link to="/corrections">corrections</Link> page.</li>
        <li>We do not publish sponsored content without labelling it as sponsored, and we do not accept payment to change a broker review's rating.</li>
      </ul>

      <h2>Limitations you should know about</h2>
      <ul>
        <li>All analysis is opinion, not investment advice. It is based on the information available at the time of writing.</li>
        <li>Market conditions change quickly. A setup that was valid at 09:00 UTC may be invalidated by news at 12:30 UTC.</li>
        <li>Historical performance of any strategy — ours or otherwise — is not indicative of future results.</li>
        <li>Software has bugs. If you see something wrong, email <a href="mailto:info@botvio.live">info@botvio.live</a>.</li>
      </ul>

      <h2>Related</h2>
      <p className="text-sm text-muted-foreground">
        See our <Link to="/performance-transparency">performance transparency</Link> page for how we report signal outcomes.
      </p>
    </main>
    <SiteFooter />
  </div>
);

export default Methodology;