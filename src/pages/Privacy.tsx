import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead seoKey="privacy" title="Privacy Policy" description="Botvio's privacy policy explains how we collect, use, and protect your personal data including trading activity, broker connections, and account information. Learn about your data rights and our security practices." />
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: September 2026</p>
        
        <Card className="glass-card">
          <CardContent className="py-8 prose prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
              <p className="text-muted-foreground">
                Botvio ("we", "our", "the Platform") is committed to protecting your privacy. This Privacy 
                Policy explains how we collect, use, disclose, and safeguard your information when you use 
                our trading automation platform. Botvio is powered by Deriv API but is independently operated.
              </p>
            </section>

            <Separator className="my-6" />

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">2. Information We Collect</h2>
              
              <h3 className="text-lg font-medium mb-3">2.1 Account Information</h3>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                <li>Email address (required for account creation)</li>
                <li>Display name and profile information</li>
                <li>Country and language preferences</li>
                <li>Avatar images (optional)</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">2.2 Trading Account Data</h3>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                <li>Broker API tokens (encrypted at rest)</li>
                <li>Trading account identifiers</li>
                <li>Trade history and performance data</li>
                <li>Bot configurations and strategy settings</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">2.3 Device & Session Data</h3>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                <li>IP address (hashed for privacy)</li>
                <li>Device fingerprint (hashed for fraud prevention)</li>
                <li>Browser type and version</li>
                <li>Session timestamps and duration</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">2.4 Referral & Affiliate Data</h3>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                <li>Referral codes and links</li>
                <li>Click tracking data</li>
                <li>Attribution information</li>
                <li>Commission and payout records</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">2.5 Payment Information</h3>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Payment method preferences</li>
                <li>Transaction records</li>
                <li>Proof of payment uploads</li>
                <li>Payout method details (crypto addresses, mobile money numbers)</li>
              </ul>
            </section>

            <Separator className="my-6" />

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">3. Cookies & Local Storage</h2>
              <p className="text-muted-foreground mb-4">We use cookies and local storage for:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Authentication:</strong> Maintaining your login session</li>
                <li><strong>Preferences:</strong> Storing language and theme settings</li>
                <li><strong>Referrals:</strong> Tracking affiliate referral codes for attribution</li>
                <li><strong>Analytics:</strong> Understanding Platform usage patterns</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                You can control cookie settings in your browser, but disabling them may affect Platform functionality.
              </p>
            </section>

            <Separator className="my-6" />

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">4. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Account Management:</strong> Creating and maintaining your account</li>
                <li><strong>Trading Services:</strong> Executing trades, copy trading, and bot operations</li>
                <li><strong>Billing:</strong> Processing subscriptions and payments</li>
                <li><strong>Fraud Prevention:</strong> Detecting and preventing abuse and fraudulent activity</li>
                <li><strong>Analytics:</strong> Improving Platform features and user experience</li>
                <li><strong>Communication:</strong> Sending important notifications about your account</li>
                <li><strong>Legal Compliance:</strong> Meeting regulatory and legal obligations</li>
              </ul>
            </section>

            <Separator className="my-6" />

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">5. Information Sharing</h2>
              <p className="text-muted-foreground mb-4">We may share your information with:</p>
              
              <h3 className="text-lg font-medium mb-3">5.1 Service Providers</h3>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                <li>Deriv API for trade execution</li>
                <li>Payment processors for subscription billing</li>
                <li>Cloud hosting providers for data storage</li>
                <li>Analytics services for Platform improvement</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">5.2 Legal Requirements</h3>
              <p className="text-muted-foreground">
                We may disclose information when required by law, court order, or government request, 
                or to protect our rights, property, or safety.
              </p>
            </section>

            <Separator className="my-6" />

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">6. Data Security</h2>
              <p className="text-muted-foreground mb-4">We implement security measures including:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Encryption of sensitive data at rest and in transit</li>
                <li>API tokens are encrypted using industry-standard algorithms</li>
                <li>Row-level security ensuring tenant isolation</li>
                <li>Regular security audits and monitoring</li>
                <li>Secure authentication with session management</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                While we strive to protect your information, no system is 100% secure. We encourage you 
                to use strong passwords and keep your credentials confidential.
              </p>
            </section>

            <Separator className="my-6" />

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">7. Data Retention</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Account Data:</strong> Retained while your account is active</li>
                <li><strong>Trading History:</strong> Deleted with the account unless retention is required by applicable law or regulation</li>
                <li><strong>Audit Logs:</strong> Deleted with the account unless retention is required by applicable law or regulation</li>
                <li><strong>Payment Records:</strong> Retained only where required by applicable tax, financial, fraud-prevention, or other legal obligations</li>
              </ul>
            </section>

            <Separator className="my-6" />

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">8. Your Rights</h2>
              <p className="text-muted-foreground mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Delete your account through <a className="text-primary underline" href="/account/delete">Account Deletion</a> or request deletion through privacy@botvio.com</li>
                <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
                <li><strong>Objection:</strong> Object to certain processing activities</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                To exercise these rights, use <a className="text-primary underline" href="/account/delete">Account Deletion</a> for account closure, or contact us at <span className="text-primary">privacy@botvio.com</span>. 
                We will respond within 30 days.
              </p>
            </section>

            <Separator className="my-6" />

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">9. International Transfers</h2>
              <p className="text-muted-foreground">
                Your data may be transferred to and processed in countries outside your jurisdiction. 
                We ensure appropriate safeguards are in place for international data transfers, 
                including standard contractual clauses where applicable.
              </p>
            </section>

            <Separator className="my-6" />

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">10. Children's Privacy</h2>
              <p className="text-muted-foreground">
                Botvio is not intended for users under 18 years of age. We do not knowingly collect 
                information from children. If we become aware that a child has provided us with personal 
                information, we will delete it immediately.
              </p>
            </section>

            <Separator className="my-6" />

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">11. Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of significant 
                changes by posting a notice on the Platform or sending you an email. Your continued use 
                of the Platform after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <Separator className="my-6" />

            <section>
              <h2 className="text-xl font-semibold mb-4">12. Contact Us</h2>
              <p className="text-muted-foreground">
                For questions about this Privacy Policy or our data practices, contact us at: <br />
                <span className="text-primary">privacy@botvio.com</span>
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

export default Privacy;
