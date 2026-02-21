import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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
  { q: "What is the Hauza Sniper strategy?", a: "Hauza Sniper is Botvio's core strategy suite. It includes specialized engines for each trading mode: EMA crossovers for Rise/Fall, Markov analysis for Digits, spike detection for Boom/Crash, and more." },
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
      <SEOHead title="FAQ" description="Frequently asked questions about Botvio AI trading bot. Learn about safety, pricing, trading modes, and how to get started." jsonLd={jsonLd} />
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-3xl space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-extrabold tracking-tight">Frequently Asked Questions</h1>
          <p className="text-muted-foreground">Everything you need to know about Botvio.</p>
        </div>
        <Accordion type="multiple" className="space-y-2">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg px-4">
              <AccordionTrigger className="text-left font-medium">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </main>
    </div>
  );
};

export default FAQ;
