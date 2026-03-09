import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Terms of Service" description="Read Botvio's terms of service covering account usage, trading bot disclaimers, signal accuracy, copy trading rules, intellectual property rights, and user responsibilities for our AI-powered trading platform." />
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 2025</p>
        
        <Card className="glass-card">
          <CardContent className="py-8 prose prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing and using Botvio ("the Platform"), you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use the Platform. Botvio is powered by Deriv API 
                but is not affiliated with, endorsed by, or sponsored by Deriv.
              </p>
            </section>

            <Separator className="my-6" />

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-destructive">2. Trading Risk Disclaimer</h2>
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
                <p className="font-semibold text-destructive mb-2">⚠️ HIGH RISK WARNING</p>
                <p className="text-sm text-muted-foreground">
                  Trading binary options, CFDs, synthetic indices, and forex involves significant risk of loss. 
                  You may lose all of your invested capital. These products are not suitable for all investors. 
                  Only trade with money you can afford to lose entirely.
                </p>
              </div>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Copy trading carries additional risks including slippage, execution delays, and partial fills.</li>
                <li>Past performance of any provider or strategy is not indicative of future results.</li>
                <li>Automated trading bots may malfunction, experience downtime, or make unprofitable trades.</li>
                <li>Market conditions can change rapidly and without warning.</li>
              </ul>
            </section>

            <Separator className="my-6" />

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">3. No Investment Advice</h2>
              <p className="text-muted-foreground mb-4">
                Botvio does not provide investment, financial, legal, or tax advice. All content, signals, 
                strategies, and tools provided are for educational and informational purposes only. You should 
                consult with a qualified financial advisor before making any trading decisions.
              </p>
              <p className="text-muted-foreground">
                Any signals, analysis, or recommendations should not be construed as investment advice. 
                Trading decisions are made solely at your own risk and discretion.
              </p>
            </section>

            <Separator className="my-6" />

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">4. User Responsibilities</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>You are solely responsible for compliance with all applicable local laws and regulations.</li>
                <li>You must be at least 18 years old to use the Platform.</li>
                <li>You are responsible for maintaining the security of your account credentials.</li>
                <li>You must not share your API keys or allow unauthorized access to your trading accounts.</li>
                <li>You are responsible for all activity that occurs under your account.</li>
              </ul>
            </section>

            <Separator className="my-6" />

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">5. Signal Providers</h2>
              <p className="text-muted-foreground mb-4">
                Signal providers on Botvio are independent third parties, not employees or agents of Botvio. 
                The Platform does not verify, endorse, or guarantee the accuracy, reliability, or profitability 
                of any provider's signals or strategies.
              </p>
              <p className="text-muted-foreground">
                Providers are responsible for their own trading decisions and the accuracy of information they share. 
                Botvio is not liable for any losses resulting from following provider signals.
              </p>
            </section>

            <Separator className="my-6" />

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">6. Copy Trading Risks</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Copied trades may be executed at different prices due to market conditions and latency.</li>
                <li>Slippage and execution delays can result in different outcomes than the provider's trades.</li>
                <li>Partial fills may occur if your account balance is insufficient.</li>
                <li>Provider performance history may not reflect your actual results.</li>
                <li>You can stop copying at any time, but open positions will remain until closed.</li>
              </ul>
            </section>

            <Separator className="my-6" />

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">7. Subscription & Billing</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Subscriptions are billed according to the plan selected (15 days for Pro, 30 days for VIP).</li>
                <li>Payments are processed manually and require admin approval for offline methods.</li>
                <li>Free trials are limited to one 2-day VIP trial per user account.</li>
                <li>Refunds are provided at our sole discretion and are not guaranteed.</li>
                <li>We reserve the right to modify pricing and features at any time.</li>
              </ul>
            </section>

            <Separator className="my-6" />

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">8. Prohibited Use</h2>
              <p className="text-muted-foreground mb-4">You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Use the Platform for any unlawful purpose or to violate any laws.</li>
                <li>Attempt to gain unauthorized access to any systems or accounts.</li>
                <li>Manipulate or abuse the affiliate program or referral system.</li>
                <li>Create multiple accounts to exploit trials or promotions.</li>
                <li>Share or resell your subscription access to third parties.</li>
                <li>Use bots or automation to abuse Platform features.</li>
              </ul>
            </section>

            <Separator className="my-6" />

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">9. Limitation of Liability</h2>
              <p className="text-muted-foreground mb-4">
                To the maximum extent permitted by law, Botvio and its operators shall not be liable for any 
                direct, indirect, incidental, consequential, or punitive damages arising from:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Trading losses or missed opportunities.</li>
                <li>Technical failures, downtime, or service interruptions.</li>
                <li>Actions of signal providers or other users.</li>
                <li>Unauthorized access to your account.</li>
                <li>Any reliance on information provided through the Platform.</li>
              </ul>
            </section>

            <Separator className="my-6" />

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">10. Indemnification</h2>
              <p className="text-muted-foreground">
                You agree to indemnify and hold harmless Botvio, its operators, affiliates, and partners from 
                any claims, damages, losses, or expenses arising from your use of the Platform, violation of 
                these Terms, or infringement of any third-party rights.
              </p>
            </section>

            <Separator className="my-6" />

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">11. Termination</h2>
              <p className="text-muted-foreground">
                We reserve the right to suspend or terminate your account at any time, with or without notice, 
                for any reason including violation of these Terms. Upon termination, you will lose access to 
                your account and any remaining subscription time will not be refunded.
              </p>
            </section>

            <Separator className="my-6" />

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">12. Third-Party Services</h2>
              <p className="text-muted-foreground">
                Botvio integrates with third-party services including Deriv API for trading execution. 
                These services are subject to their own terms and conditions. Botvio is not responsible 
                for the availability, accuracy, or reliability of third-party services.
              </p>
              <p className="text-muted-foreground mt-4">
                <strong>Deriv Trademark Notice:</strong> Deriv and its products are trademarks of 
                Deriv Holdings (Guernsey) Limited. Botvio is an independent platform and is not 
                affiliated with or endorsed by Deriv.
              </p>
            </section>

            <Separator className="my-6" />

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">13. Disputes</h2>
              <p className="text-muted-foreground">
                Any disputes arising from these Terms shall be resolved through negotiation in good faith. 
                If resolution cannot be reached, disputes may be submitted to binding arbitration in 
                accordance with applicable laws.
              </p>
            </section>

            <Separator className="my-6" />

            <section>
              <h2 className="text-xl font-semibold mb-4">14. Contact</h2>
              <p className="text-muted-foreground">
                For questions about these Terms, please contact us at: <br />
                <span className="text-primary">support@botvio.com</span>
              </p>
            </section>
          </CardContent>
        </Card>

        {/* Footer disclaimer */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>
            <strong>Botvio</strong> — Powered by Deriv API | Not affiliated with Deriv
          </p>
        </div>
      </main>
    </div>
  );
};

export default Terms;
