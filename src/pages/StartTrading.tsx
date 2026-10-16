import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, ExternalLink, ShieldCheck, TrendingUp, Zap } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const BROKERS = {
  deriv: {
    name: "Deriv",
    url: "https://track.deriv.com/_a_gq1w0BG0D1hit6RV3zsGNd7ZgqdRLk/1/",
    summary: "For synthetic indices, Boom & Crash, Deriv markets and API-based automation.",
    fit: ["Synthetic indices", "Boom & Crash", "API and automation"],
    color: "border-red-500/40",
    cta: "Continue to Deriv",
  },
  exness: {
    name: "Exness",
    url: "https://one.exness-track.com/a/ts1kvs1k",
    summary: "For traders focused on forex and CFD markets such as major currency pairs and gold.",
    fit: ["Forex pairs", "Gold and CFDs", "MT4 / MT5 workflows"],
    color: "border-amber-500/40",
    cta: "Continue to Exness",
  },
} as const;

type BrokerKey = keyof typeof BROKERS;

function recordAffiliateClick(broker: BrokerKey) {
  const params = new URLSearchParams(window.location.search);
  void (supabase as any).from("analytics_events").insert({
    event_name: "affiliate_outbound_click",
    path: window.location.pathname,
    referrer: document.referrer || "",
    source: params.get("utm_source") || "botvio",
    medium: params.get("utm_medium") || "affiliate",
    campaign: params.get("utm_campaign") || "broker-choice",
    device_type: /Mobi/i.test(navigator.userAgent) ? "mobile" : "desktop",
    metadata: {
      broker,
      destination: BROKERS[broker].url,
      landing_path: window.location.pathname,
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
    },
  }).then(({ error }: { error: unknown }) => {
    if (error) console.warn("Affiliate click event could not be saved", error);
  });
}

const StartTrading = () => {
  const [goal, setGoal] = useState<"synthetics" | "forex" | "unsure">("unsure");
  const recommended: BrokerKey = goal === "forex" ? "exness" : "deriv";
  const ordered: BrokerKey[] = goal === "unsure" ? ["deriv", "exness"] : [recommended, recommended === "deriv" ? "exness" : "deriv"];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Choose a Trading Broker: Deriv or Exness"
        description="Compare Deriv and Exness for synthetic indices, forex and gold trading. Choose a platform that fits your market, learn the risks and try a demo before funding an account."
      />
      <Header />
      <main className="container mx-auto max-w-5xl px-4 py-8 md:py-12 space-y-10">
        <section className="mx-auto max-w-3xl text-center space-y-4">
          <Badge variant="outline" className="mx-auto">Botvio broker guide</Badge>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">Find the broker that fits your trading</h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Start with the markets you want to trade. Compare the options, review the risks, then continue to the broker’s official onboarding.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/synthetic-hub"><Button variant="outline">Explore synthetic indices</Button></Link>
            <Link to="/gold"><Button variant="outline">Explore gold markets</Button></Link>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-center">What do you want to trade?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {([
              ["synthetics", "Synthetic indices", "Boom, Crash, Volatility and other synthetic markets"],
              ["forex", "Forex and gold", "Currency pairs, XAUUSD and CFDs"],
              ["unsure", "Help me compare", "See both choices before deciding"],
            ] as const).map(([value, label, description]) => (
              <button
                key={value}
                type="button"
                onClick={() => setGoal(value)}
                aria-pressed={goal === value}
                className={`rounded-xl border p-4 text-left transition-colors ${goal === value ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border hover:border-primary/50"}`}
              >
                <span className="block font-semibold">{label}</span>
                <span className="block text-sm text-muted-foreground mt-1">{description}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {ordered.map((key, index) => {
            const broker = BROKERS[key];
            const isRecommended = goal !== "unsure" && index === 0;
            return (
              <Card key={key} className={`h-full ${broker.color} ${isRecommended ? "ring-1 ring-primary" : ""}`}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-2xl">{broker.name}</CardTitle>
                    {isRecommended && <Badge>Based on your selection</Badge>}
                  </div>
                  <CardDescription className="text-sm leading-relaxed">{broker.summary}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <ul className="space-y-2">
                    {broker.fit.map((fit) => <li key={fit} className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-primary shrink-0" />{fit}</li>)}
                  </ul>
                  <Button
                    className="w-full"
                    onClick={() => {
                      recordAffiliateClick(key);
                      window.open(broker.url, "_blank", "noopener,noreferrer");
                    }}
                  >
                    {broker.cta}<ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                  <p className="text-xs text-muted-foreground">You’ll leave Botvio to continue on the broker’s website. Availability, fees, instruments and account requirements depend on your country and account type.</p>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border p-4 space-y-2"><Zap className="h-5 w-5 text-primary" /><h3 className="font-semibold">Choose by market</h3><p className="text-sm text-muted-foreground">Deriv is a natural starting point for its synthetic indices; Exness may suit forex and CFD-focused traders.</p></div>
          <div className="rounded-xl border p-4 space-y-2"><ShieldCheck className="h-5 w-5 text-primary" /><h3 className="font-semibold">Verify your region</h3><p className="text-sm text-muted-foreground">Check the legal entity, product restrictions, fees and local availability before registering.</p></div>
          <div className="rounded-xl border p-4 space-y-2"><TrendingUp className="h-5 w-5 text-primary" /><h3 className="font-semibold">Practice first</h3><p className="text-sm text-muted-foreground">Use a demo account and a written risk plan before depositing or enabling automation.</p></div>
        </section>

        <section className="rounded-xl border bg-muted/20 p-5 md:p-6 space-y-3">
          <h2 className="text-lg font-bold">How Botvio may earn</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Botvio may receive a referral commission if you open an account through one of these links. This does not change the broker’s trading risks, and it should not be treated as a guarantee that a broker is right for you.
          </p>
          <Link to="/affiliate-disclosure" className="inline-flex items-center text-sm font-medium text-primary hover:underline">Read our affiliate disclosure <ArrowRight className="ml-1 h-4 w-4" /></Link>
          <p className="text-xs text-muted-foreground">Trading leveraged products and derivatives involves substantial risk of loss. You may lose some or all of your capital. Nothing on Botvio is a promise of profit or personal financial advice.</p>
        </section>
      </main>
    </div>
  );
};

export default StartTrading;
