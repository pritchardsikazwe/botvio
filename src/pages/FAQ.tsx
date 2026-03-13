import { Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Bot, Signal, Users, BarChart3 } from "lucide-react";

const faqs = [
  { q: "What is Botvio?", a: "Botvio is an AI-powered trading bot platform for Deriv synthetic indices. Botvio automates trading using advanced signal engines like EMA crossovers, Markov transition analysis, and spike detection. Botvio supports 8 trading modes including Digits, Rise/Fall, Boom/Crash, Multipliers, and more." },
  { q: "Is Botvio free?", a: "Botvio offers a free starter plan that includes basic trading features. Premium plans unlock additional bot instances, advanced strategies, and priority execution." },
  { q: "Is Botvio safe to use?", a: "Yes. Botvio encrypts all broker tokens server-side with AES-256 encryption. Your Deriv credentials never touch your browser. Botvio uses OAuth 2.0 for account connection and implements Row-Level Security on all data." },
  { q: "How do I connect my Deriv account to Botvio?", a: "Click 'Connect Deriv' in Botvio and you'll be redirected to Deriv's official OAuth page. Authorize Botvio, and your account is securely connected. Botvio never sees your Deriv password." },
  { q: "Can Botvio withdraw my money?", a: "No. Botvio only has trade and read permissions. Botvio cannot withdraw funds, change your password, or modify your Deriv account settings." },
  { q: "What instruments does Botvio trade?", a: "Botvio trades Deriv synthetic indices including Volatility 10-100, Boom 1000/500, Crash 1000/500, Step Index, and Jump indices." },
  { q: "Does Botvio guarantee profits?", a: "No. No trading system guarantees profits. Botvio uses statistical models that identify high-probability setups, but markets are inherently unpredictable. Always trade responsibly." },
  { q: "How does Botvio's Auto Mode work?", a: "When Auto Mode is enabled, Botvio automatically executes trades when signals reach 70+ confidence. Botvio respects your risk limits and stake settings at all times." },
  { q: "Can I use Botvio on mobile?", a: "Yes. Botvio is a web-based platform that works on any device with a modern browser. Botvio is fully responsive and optimized for mobile trading." },
  { q: "What is the Botvio AI Strategy?", a: "Botvio AI Strategy is Botvio's core strategy suite. It includes specialized engines for each trading mode: EMA crossovers for Rise/Fall, digit pattern analysis for Digits, AI spike detection for Boom/Crash, and more." },
  { q: "How do I change my stake amount?", a: "Set your stake in Botvio's trading panel. Your stake stays fixed until you manually change it — Botvio never auto-adjusts your stake without permission." },
  { q: "Does Botvio work when my computer is off?", a: "Yes. Botvio's bot worker runs on the server 24/7. Once Auto Mode is enabled, Botvio continues trading even when your device is offline." },
  { q: "What payment methods does Botvio accept?", a: "Botvio accepts cryptocurrency (Bitcoin, USDT TRC20/ERC20) and mobile money (Airtel, MTN) for premium plans." },
  { q: "Can I use Botvio in my country?", a: "Botvio is available in most countries where Deriv operates. Check our country-specific pages for local information." },
  { q: "How do I become a signal provider on Botvio?", a: "Apply through Botvio's Provider Dashboard. Once approved, you can share signals with the community and earn from subscribers." },
];

const FAQ = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(f => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="FAQ – Botvio AI Trading Bot Questions Answered"
        description="Get answers to common questions about Botvio AI trading bot. Learn about safety, pricing, supported trading modes, Deriv integration, Hauza Sniper strategies, and how to automate your trades."
        jsonLd={jsonLd}
      />
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-3xl space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-extrabold tracking-tight">Frequently Asked Questions</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">Everything you need to know about Botvio — from safety and pricing to strategies and automation.</p>
        </div>

        <Accordion type="multiple" className="space-y-2">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg px-4">
              <AccordionTrigger className="text-left font-medium">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Internal links section */}
        <section className="pt-6 border-t border-border">
          <h2 className="text-xl font-bold mb-4">Explore Botvio</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link to="/bots">
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center gap-3 py-4">
                  <Bot className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Trading Bots</p>
                    <p className="text-xs text-muted-foreground">Deploy AI strategies on Deriv</p>
                  </div>
                  <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
            <Link to="/signals">
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center gap-3 py-4">
                  <Signal className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Live Signals</p>
                    <p className="text-xs text-muted-foreground">Free forex & gold signals</p>
                  </div>
                  <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
            <Link to="/providers">
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center gap-3 py-4">
                  <Users className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Copy Trading</p>
                    <p className="text-xs text-muted-foreground">Follow top traders automatically</p>
                  </div>
                  <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
            <Link to="/chart/XAUUSD">
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center gap-3 py-4">
                  <BarChart3 className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="font-medium text-sm">AI Chart Analysis</p>
                    <p className="text-xs text-muted-foreground">Upload any chart for AI analysis</p>
                  </div>
                  <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default FAQ;
