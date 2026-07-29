import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { SiteFooter } from "@/components/SiteFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  ShieldCheck, FileText, Search, AlertTriangle, Bot, DollarSign,
  GraduationCap, LineChart, Mail, BookOpen,
} from "lucide-react";

const items = [
  { to: "/about", icon: ShieldCheck, title: "About Botvio", desc: "Who we are, where we operate from and why we exist." },
  { to: "/methodology", icon: LineChart, title: "Methodology", desc: "How signals, AI chart analysis and articles are produced end-to-end." },
  { to: "/performance-transparency", icon: FileText, title: "Performance Transparency", desc: "How we report results, hypothetical vs live, and what we never claim." },
  { to: "/editorial-policy", icon: BookOpen, title: "Editorial Policy", desc: "Our writing, review and correction standards." },
  { to: "/fact-checking", icon: Search, title: "Fact-Checking", desc: "How claims are sourced and verified before publication." },
  { to: "/corrections", icon: AlertTriangle, title: "Corrections", desc: "Logged changes to previously published articles." },
  { to: "/ai-content-policy", icon: Bot, title: "AI Content Policy", desc: "Where and how AI tools are used at Botvio." },
  { to: "/affiliate-disclosure", icon: DollarSign, title: "Affiliate Disclosure", desc: "Which links pay us a commission and how we handle bias." },
  { to: "/disclaimer", icon: AlertTriangle, title: "Risk Disclosure", desc: "The trading and financial risks you should read before subscribing." },
  { to: "/learning-paths", icon: GraduationCap, title: "Free Learning Paths", desc: "Structured beginner, intermediate and advanced curriculums — free." },
  { to: "/contact", icon: Mail, title: "Contact", desc: "Real humans in Lusaka, Zambia. Email and WhatsApp." },
];

const Trust = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="Trust Center — Editorial, Methodology, Performance & Legal | Botvio"
      description="Every trust, transparency and legal document for Botvio in one place: editorial policy, methodology, performance transparency, corrections, AI usage and risk disclosure."
    />
    <Header />
    <main className="container mx-auto max-w-5xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-4">
        <Link to="/" className="hover:text-primary">Home</Link>
        <span className="mx-2">/</span>
        <span>Trust Center</span>
      </nav>
      <header className="mb-8 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">Trust Center</h1>
        <p className="text-muted-foreground leading-relaxed">
          One page linking every document that explains how Botvio operates —
          how we write, how we produce signals, how we handle mistakes, where
          affiliate revenue comes in and what we deliberately never claim. If
          you're doing due diligence on us before subscribing, start here.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <Link key={it.to} to={it.to} className="block group">
            <Card className="h-full transition-colors group-hover:border-primary/50">
              <CardContent className="p-5">
                <it.icon className="w-5 h-5 text-primary mb-3" />
                <h2 className="font-semibold text-foreground mb-1">{it.title}</h2>
                <p className="text-sm text-muted-foreground">{it.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
    <SiteFooter />
  </div>
);

export default Trust;