import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, MessageCircle, Send, Clock, Phone } from "lucide-react";

const channels = [
  {
    icon: Send,
    title: "Telegram",
    desc: "Join our community or message us directly for the fastest response.",
    link: "https://t.me/boaborea",
    label: "Open Telegram →",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Channel",
    desc: "Follow our WhatsApp channel for updates, signals, and announcements.",
    link: "https://whatsapp.com/channel/0029VbAfFXbIT6Kbng6ypX0V",
    label: "Join WhatsApp →",
  },
  {
    icon: Mail,
    title: "Email",
    desc: "Editorial feedback, corrections, partnerships or support enquiries.",
    link: "mailto:info@botvio.live",
    label: "info@botvio.live",
  },
  {
    icon: Phone,
    title: "Phone / WhatsApp",
    desc: "For account-related enquiries during business hours (CAT / UTC+2).",
    link: "https://wa.me/260966284085",
    label: "+260 966 284 085",
  },
];

const Contact = () => (
  <div className="min-h-screen bg-background">
    <SEOHead seoKey="contact"
      title="Contact Botvio – Get in Touch"
      description="Contact the Botvio team via Telegram, WhatsApp, or email. We're here to help with trading signals, account issues, partnerships, and more."
    />
    <Header />

    <main className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold sm:text-4xl">Contact Us</h1>
      <p className="mt-3 text-lg text-muted-foreground leading-relaxed">
        Have a question, suggestion, or partnership proposal? We'd love to hear
        from you. Choose your preferred channel below.
      </p>

      <div className="mt-8 grid gap-4">
        {channels.map((ch) => (
          <a
            key={ch.title}
            href={ch.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Card className="border-border bg-card hover:border-primary/50 transition-colors">
              <CardContent className="flex items-start gap-4 p-5">
                <ch.icon className="mt-1 h-6 w-6 shrink-0 text-primary" />
                <div>
                  <h2 className="font-semibold text-foreground">{ch.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{ch.desc}</p>
                  <span className="mt-2 inline-block text-sm font-medium text-primary">
                    {ch.label}
                  </span>
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>

      {/* Response time */}
      <div className="mt-8 flex items-center gap-2 rounded-xl border border-border bg-muted/30 p-4">
        <Clock className="h-5 w-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Typical response time:</strong>{" "}
          Within 1 business day on Telegram / WhatsApp, 1–2 business days via email.
        </p>
      </div>

      {/* Address / Legal */}
      <div className="mt-8 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Botvio</p>
        <p>Independent financial education, market analysis and trading technology.</p>
        <p className="mt-1">Operated online; we do not maintain a public walk-in office.</p>
        <p className="mt-1">
          For legal and editorial policies, see our{" "}
          <a href="/editorial-policy" className="text-primary underline">Editorial Policy</a>,{" "}
          <a href="/corrections" className="text-primary underline">Corrections Policy</a>,{" "}
          <a href="/terms" className="text-primary underline">Terms of Service</a>{" "}
          and{" "}
          <a href="/privacy" className="text-primary underline">Privacy Policy</a>.
        </p>
      </div>
    </main>
  </div>
);

export default Contact;
