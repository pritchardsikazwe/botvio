import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle } from "lucide-react";

const Disclaimer = () => (
  <div className="min-h-screen bg-background">
    <SEOHead seoKey="disclaimer"
      title="Disclaimer – Botvio Trading Risk Notice"
      description="Important risk disclaimer for Botvio users. Trading forex, gold, synthetic indices, and crypto involves substantial risk. Read before trading."
    />
    <Header />

    <main className="container mx-auto max-w-4xl px-4 py-12">
      <div className="flex items-center gap-3 mb-2">
        <AlertTriangle className="h-7 w-7 text-warning" />
        <h1 className="text-3xl font-bold">Disclaimer</h1>
      </div>
      <p className="text-muted-foreground mb-8">Last updated: April 2026</p>

      <Card className="border-border bg-card">
        <CardContent className="py-8 prose prose-slate dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. General Risk Warning</h2>
            <p className="text-muted-foreground">
              Trading foreign exchange (forex), gold (XAUUSD), synthetic indices, binary options,
              and cryptocurrencies on margin carries a high level of risk and may not be suitable
              for all investors. The high degree of leverage can work against you as well as for
              you. Before deciding to trade, you should carefully consider your investment
              objectives, level of experience, and risk appetite. There is a possibility that you
              could sustain a loss of some or all of your initial investment, and therefore you
              should not invest money that you cannot afford to lose.
            </p>
          </section>

          <Separator className="my-6" />

          <section className="mb-8 rounded-lg border border-warning/40 bg-warning/5 p-5">
            <h2 className="text-xl font-semibold mb-4 text-warning">
              Important — What Botvio Does NOT Do
            </h2>
            <p className="text-muted-foreground mb-3">
              Please read this carefully before using Botvio. To keep our service transparent and
              compliant, you must understand the following:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">We do NOT offer financial advice.</strong>
                {" "}Nothing on Botvio is a recommendation to buy, sell, or hold any instrument.
              </li>
              <li>
                <strong className="text-foreground">We do NOT offer account management.</strong>
                {" "}We will never trade on your behalf, ask for your broker login, or manage your funds.
              </li>
              <li>
                <strong className="text-foreground">We do NOT offer investments or savings products.</strong>
                {" "}Botvio does not accept deposits, pool funds, or promise returns of any kind.
              </li>
              <li>
                <strong className="text-foreground">You only pay for classes and AI tool access.</strong>
                {" "}Your subscription strictly covers educational content, training videos, and use
                of our AI chart analysis &amp; signal tools for <em>demo / analysis purposes</em>.
              </li>
              <li>
                <strong className="text-foreground">Always consult a licensed professional</strong>
                {" "}before going live with real money. Practice on a demo account first, and use
                Botvio's outputs as a learning aid — never as a guaranteed trade.
              </li>
            </ul>
          </section>

          <Separator className="my-6" />

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. No Financial Advice</h2>
            <p className="text-muted-foreground">
              The information and tools provided on Botvio — including AI-generated signals, chart
              analysis, strategy guides, blog articles, and educational content — are for
              informational and educational purposes only. Nothing on this platform constitutes
              financial, investment, tax, or legal advice. You should consult a qualified
              financial advisor before making any trading or investment decisions.
            </p>
          </section>

          <Separator className="my-6" />

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. No Guarantee of Results</h2>
            <p className="text-muted-foreground">
              Past performance is not indicative of future results. Trading signals, AI
              predictions, and historical data shown on Botvio do not guarantee future
              profitability. All trading involves uncertainty, and no algorithm, bot, or signal
              provider can eliminate market risk.
            </p>
          </section>

          <Separator className="my-6" />

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Third-Party Services</h2>
            <p className="text-muted-foreground">
              Botvio integrates with third-party brokers and exchanges including Deriv, Exness,
              Weltrade, and Binance. We are not affiliated with, endorsed by, or officially
              partnered with these companies unless explicitly stated. Broker selection and account
              management are the sole responsibility of the user. Botvio is not responsible for
              broker outages, execution delays, or any losses resulting from third-party services.
            </p>
          </section>

          <Separator className="my-6" />

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. AI & Automated Trading</h2>
            <p className="text-muted-foreground">
              AI-generated signals and automated trading bots operate based on algorithms and
              historical data. They can and do produce incorrect predictions. Users should always
              verify signals with their own analysis, use appropriate risk management (stop-losses,
              position sizing), and never trade with funds they cannot afford to lose.
            </p>
          </section>

          <Separator className="my-6" />

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Affiliate Disclosure</h2>
            <p className="text-muted-foreground">
              Botvio may earn affiliate commissions from broker sign-ups and third-party services
              linked on this platform. These partnerships do not influence our signal generation,
              content, or recommendations. We only partner with brokers we believe offer fair
              trading conditions.
            </p>
          </section>

          <Separator className="my-6" />

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              To the fullest extent permitted by applicable law, Botvio, its founders, team
              members, affiliates, and partners shall not be liable for any direct, indirect,
              incidental, consequential, or punitive damages arising from your use of this
              platform, including but not limited to trading losses, data loss, or service
              interruptions.
            </p>
          </section>

          <Separator className="my-6" />

          <section>
            <h2 className="text-xl font-semibold mb-4">8. Acknowledgment</h2>
            <p className="text-muted-foreground">
              By using Botvio, you acknowledge that you have read, understood, and agree to this
              disclaimer. You accept full responsibility for your trading decisions and understand
              that trading carries inherent financial risk.
            </p>
          </section>
        </CardContent>
      </Card>
    </main>
  </div>
);

export default Disclaimer;
