import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { SiteFooter } from "@/components/SiteFooter";
import { Link } from "react-router-dom";

const PerformanceTransparency = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="Performance Transparency — How Botvio Reports Trading Results"
      description="How Botvio reports signal outcomes honestly: hypothetical vs live, why past performance is not future performance, and where to view our verified track record."
    />
    <Header />
    <main className="container mx-auto max-w-3xl px-4 py-12 prose prose-invert">
      <nav aria-label="Breadcrumb" className="not-prose text-xs text-muted-foreground mb-6">
        <Link to="/" className="hover:text-primary">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/trust" className="hover:text-primary">Trust Center</Link>
        <span className="mx-2">/</span>
        <span>Performance Transparency</span>
      </nav>
      <h1>Performance Transparency</h1>
      <p>
        This page explains how we talk about trading results on Botvio, so
        nothing you read here misleads you into an unrealistic view of what a
        signal service or educational platform can do.
      </p>

      <h2>Everything we publish is educational</h2>
      <p>
        Botvio is an education and analysis platform, not an investment
        adviser and not a fund manager. Signals, chart analyses and articles
        are provided for learning and market awareness. They do not
        constitute personal financial advice and are not a solicitation to
        buy or sell any instrument.
      </p>

      <h2>Hypothetical vs live results</h2>
      <p>Results we publish come from two sources, always labelled clearly:</p>
      <ul>
        <li>
          <strong>Live signals:</strong> setups posted in real time with the
          entry, stop-loss and take-profit visible before the market resolves
          them. The final outcome (win / loss / breakeven / expired) is
          recorded automatically and archived on our{" "}
          <Link to="/signals-history">signals history</Link> page.
        </li>
        <li>
          <strong>Hypothetical or back-tested results:</strong> shown when an
          article discusses a strategy applied to historical data. These are
          labelled "hypothetical" and carry the standard CFTC-style warning:
          they do not reflect actual trading and may over-state performance
          because they benefit from hindsight.
        </li>
      </ul>

      <h2>Why past performance is not future performance</h2>
      <p>
        Financial markets change regime, volatility and correlation
        constantly. A strategy that produced strong results in a trending
        market can lose money in a ranging one. Publishing a good month does
        not mean the next month will be good — and we will never present it
        that way. When you evaluate any signal service (including ours), ask
        for a full-period record, not just the highlights.
      </p>

      <h2>How we record signal outcomes</h2>
      <p>
        Every published signal is written into our database with a unique ID
        and a state that transitions from <code>RUNNING</code> to{" "}
        <code>CLOSED</code> when the market hits the take-profit, stop-loss
        or expires. Screenshots of executed setups are added to the{" "}
        <Link to="/signals-history">Signals Performance</Link> gallery.
        Deletions are logged; we do not silently remove losing signals from
        the record.
      </p>

      <h2>What we do not claim</h2>
      <ul>
        <li>We do not claim a "100% win rate" or "guaranteed profits" — no one legitimate does.</li>
        <li>We do not publish cherry-picked screenshots without the full-period statistics behind them.</li>
        <li>We do not backfill missing signals to make a bad week look better.</li>
        <li>We do not report account balances that we cannot verify from broker data.</li>
      </ul>

      <h2>Independent verification</h2>
      <p>
        Where practical, users can connect a MetaTrader 5 account via our
        read-only bridge to view their own executed trades in one dashboard —
        the raw broker data is the source of truth, not our commentary on top
        of it. See the <Link to="/methodology">methodology</Link> page for
        the technical details.
      </p>

      <h2>Risk disclosure</h2>
      <p>
        Trading forex, CFDs, synthetic indices, crypto and options involves
        substantial risk of loss and is not suitable for every investor. You
        can lose more than your initial deposit on leveraged products. Never
        trade with money you cannot afford to lose. See our full{" "}
        <Link to="/disclaimer">risk disclosure</Link> for the complete
        version.
      </p>

      <p className="text-sm text-muted-foreground">
        Questions or a specific number you'd like to see published? Email{" "}
        <a href="mailto:info@botvio.live">info@botvio.live</a>.
      </p>
    </main>
    <SiteFooter />
  </div>
);

export default PerformanceTransparency;