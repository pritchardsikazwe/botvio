import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, ExternalLink, ShieldCheck, TrendingUp, Zap, Clock3, MapPinned } from "lucide-react";
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
    summary: "A starting point to research synthetic indices, Boom & Crash, and Deriv's available markets and API tools.",
    fit: ["Synthetic indices", "Boom & Crash education", "API and automation research"],
    color: "border-red-500/40",
    cta: "Visit Deriv",
  },
  exness: {
    name: "Exness",
    url: "https://one.exness-track.com/a/ts1kvs1k",
    summary: "A starting point to research forex and CFD markets such as major currency pairs and gold, where available.",
    fit: ["Forex pairs", "Gold and CFDs", "MT4 / MT5 workflows"],
    color: "border-amber-500/40",
    cta: "Visit Exness",
  },
} as const;

type BrokerKey = keyof typeof BROKERS;
type TradingGoal = "synthetics" | "forex" | "unsure";

function getOrCreateTrackingId(storage: Storage, key: string) {
  try {
    const existing = storage.getItem(key);
    if (existing) return existing;
    const created = crypto.randomUUID();
    storage.setItem(key, created);
    return created;
  } catch {
    return crypto.randomUUID();
  }
}

function trackingIdentity() {
  return {
    visitor_id: getOrCreateTrackingId(window.localStorage, "botvio_visitor_id"),
    session_id: getOrCreateTrackingId(window.sessionStorage, "botvio_session_id"),
  };
}

function campaignContext() {
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get("utm_source") || "botvio",
    medium: params.get("utm_medium") || "affiliate",
    campaign: params.get("utm_campaign") || "broker-choice",
    content: params.get("utm_content"),
  };
}

function recordAffiliateClick(broker: BrokerKey) {
  const params = campaignContext();
  void (supabase as any).from("analytics_events").insert({
    ...trackingIdentity(),
    event_name: "affiliate_outbound_click",
    path: window.location.pathname,
    referrer: document.referrer || "",
    source: params.source,
    medium: params.medium,
    campaign: params.campaign,
    device_type: /Mobi/i.test(navigator.userAgent) ? "mobile" : "desktop",
    metadata: {
      broker,
      destination: BROKERS[broker].url,
      landing_path: window.location.pathname,
      utm_source: params.source,
      utm_medium: params.medium,
      utm_campaign: params.campaign,
      utm_content: params.content,
      market_intent: new URLSearchParams(window.location.search).get("market") || null,
      locale: window.location.pathname.startsWith("/ar/") ? "ar-AE" : "en",
    },
  }).then(({ error }: { error: unknown }) => {
    if (error) console.warn("Affiliate click event could not be saved", error);
  });
}

function recordMarketPreference(goal: TradingGoal) {
  const params = campaignContext();
  void (supabase as any).from("analytics_events").insert({
    ...trackingIdentity(),
    event_name: "broker_market_preference",
    path: window.location.pathname,
    referrer: document.referrer || "",
    source: params.source,
    medium: params.medium,
    campaign: params.campaign,
    device_type: /Mobi/i.test(navigator.userAgent) ? "mobile" : "desktop",
    metadata: {
      market_intent: goal,
      locale: window.location.pathname.startsWith("/ar/") ? "ar-AE" : "en",
    },
  }).then(({ error }: { error: unknown }) => {
    if (error) console.warn("Broker preference event could not be saved", error);
  });
}

const StartTrading = () => {
  const [goal, setGoal] = useState<TradingGoal>(() => {
    const market = new URLSearchParams(window.location.search).get("market");
    if (market === "forex" || market === "gold" || market === "xauusd") return "forex";
    if (market === "synthetics" || market === "deriv") return "synthetics";
    return "unsure";
  });
  const recommended: BrokerKey = goal === "forex" ? "exness" : "deriv";
  const ordered: BrokerKey[] = goal === "unsure" ? ["deriv", "exness"] : [recommended, recommended === "deriv" ? "exness" : "deriv"];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Dubai & UAE Trading Guide: Compare Deriv and Exness"
        description="An educational guide for Dubai and UAE readers comparing Deriv synthetic indices with Exness forex and gold markets. Check local eligibility, fees and risks before choosing a broker."
        canonicalUrlOverride="https://botvio.live/start-trading"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Dubai & UAE Trading Guide: Compare Deriv and Exness",
          url: "https://botvio.live/start-trading",
          inLanguage: "en",
          about: ["forex trading education", "gold trading education", "synthetic indices", "broker comparison"],
          isPartOf: { "@type": "WebSite", name: "Botvio", url: "https://botvio.live" },
        }}
      />
      <Header />
      <main className="container mx-auto max-w-5xl px-4 py-8 md:py-12 space-y-10">
        <section className="mx-auto max-w-3xl text-center space-y-4">
          <Badge variant="outline" className="mx-auto">Botvio broker guide · Dubai & UAE</Badge>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">Compare trading platforms by the market you want to study</h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            An educational comparison for readers researching gold (XAUUSD), forex, MT5 and synthetic indices. Compare the product fit first, then independently verify regional availability and the legal entity before opening an account.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/dubai"><Button variant="outline"><MapPinned className="mr-2 h-4 w-4" />Dubai trading guide</Button></Link>
            <Link to="/gold"><Button variant="outline">Explore gold markets</Button></Link>
            <Link to="/synthetic-hub"><Button variant="outline">Explore synthetic indices</Button></Link>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border p-4 space-y-2"><Clock3 className="h-5 w-5 text-primary" /><h2 className="font-semibold">Use Dubai time</h2><p className="text-sm text-muted-foreground">UAE Gulf Standard Time is UTC+4. Check market hours and scheduled economic releases in your local time.</p></div>
          <div className="rounded-xl border p-4 space-y-2"><ShieldCheck className="h-5 w-5 text-primary" /><h2 className="font-semibold">Check UAE eligibility</h2><p className="text-sm text-muted-foreground">Broker availability, product permissions and applicable regulation can vary by residence and contracting entity.</p></div>
          <div className="rounded-xl border p-4 space-y-2"><TrendingUp className="h-5 w-5 text-primary" /><h2 className="font-semibold">Demo before funding</h2><p className="text-sm text-muted-foreground">Practice first, review fees and leverage, and never treat signals or automation as guaranteed returns.</p></div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-center">What do you want to research?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {([
              ["synthetics", "Synthetic indices", "Boom, Crash, Volatility and other synthetic markets"],
              ["forex", "Forex and gold", "Currency pairs, XAUUSD and CFDs"],
              ["unsure", "Compare both", "Review both choices before deciding"],
            ] as const).map(([value, label, description]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setGoal(value);
                  recordMarketPreference(value);
                }}
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
                    {isRecommended && <Badge>Matches your market interest</Badge>}
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
                  <p className="text-xs text-muted-foreground">This is an affiliate link. You will leave Botvio for the broker website. Confirm that the broker accepts residents of your country and that the specific product is permitted for your account before registering.</p>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="rounded-xl border bg-muted/20 p-5 md:p-6 space-y-3">
          <h2 className="text-lg font-bold">Questions to check before choosing</h2>
          <div className="space-y-3 text-sm">
            <div><h3 className="font-semibold">Can UAE residents open an account?</h3><p className="text-muted-foreground">Confirm directly with the broker using its current UAE onboarding terms and the exact legal entity that would hold your account. Do not rely on an affiliate page alone.</p></div>
            <div><h3 className="font-semibold">Are gold and synthetic products the same?</h3><p className="text-muted-foreground">No. XAUUSD is a gold-linked market instrument offered under specific account terms; synthetic indices are a different product category with distinct pricing and risks.</p></div>
            <div><h3 className="font-semibold">How does Botvio earn?</h3><p className="text-muted-foreground">Botvio may receive a referral commission if you visit a broker through these links. That commercial relationship does not mean the broker is suitable for you.</p></div>
          </div>
          <Link to="/affiliate-disclosure" className="inline-flex items-center text-sm font-medium text-primary hover:underline">Read our affiliate disclosure <ArrowRight className="ml-1 h-4 w-4" /></Link>
          <p className="text-xs text-muted-foreground">Leveraged trading and derivatives involve substantial risk of loss. You may lose some or all of your capital. This page is educational information, not personal financial advice or a promise of profit.</p>
        </section>
      </main>
    </div>
  );
};

export default StartTrading;
