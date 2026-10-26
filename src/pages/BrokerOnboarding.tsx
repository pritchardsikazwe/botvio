import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, ExternalLink, ShieldCheck, Clock3, LockKeyhole, GraduationCap, ChartNoAxesCombined, Users, RefreshCw } from "lucide-react";
import { Header } from "@/components/trading/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const BROKERS = {
  exness: {
    name: "Exness",
    market: "Forex & Gold",
    url: "https://one.toexness.com/a/ts1kvs1k",
    description: "Research forex, gold (XAUUSD), and available MT4/MT5 workflows.",
    accent: "border-amber-500/50",
  },
  deriv: {
    name: "Deriv",
    market: "Synthetic Indices",
    url: "https://t.deriv.link?t=Y8BMQZGW5HAE",
    description: "Explore synthetic indices, Boom & Crash, and Deriv API tools.",
    accent: "border-rose-500/50",
  },
} as const;

type BrokerKey = keyof typeof BROKERS;
type AccountChoice = "new" | "existing" | null;

function recordOnboardingEvent(eventName: string, broker: BrokerKey, extra: Record<string, unknown> = {}) {
  const params = new URLSearchParams(window.location.search);
  void (supabase as any).from("analytics_events").insert({
    event_name: eventName,
    path: window.location.pathname,
    referrer: document.referrer || "",
    source: params.get("utm_source") || "botvio",
    medium: params.get("utm_medium") || "onboarding",
    campaign: params.get("utm_campaign") || "broker-onboarding",
    device_type: /Mobi/i.test(navigator.userAgent) ? "mobile" : "desktop",
    metadata: { broker, ...extra },
  }).then(({ error }: { error: unknown }) => {
    if (error) console.warn("Broker onboarding event could not be saved", error);
  });
}

export default function BrokerOnboarding() {
  const [broker, setBroker] = useState<BrokerKey>("exness");
  const [accountChoice, setAccountChoice] = useState<AccountChoice>(null);
  const [status, setStatus] = useState<"not_started" | "link_clicked" | "review_requested">("not_started");

  const selectedBroker = BROKERS[broker];

  const openPartnerLink = () => {
    recordOnboardingEvent("affiliate_outbound_click", broker, {
      onboarding_step: "new_account",
      attribution_status: "not_verified",
    });
    recordOnboardingEvent("broker_onboarding_started", broker, { account_type: "new" });
    setStatus("link_clicked");
    window.open(selectedBroker.url, "_blank", "noopener,noreferrer");
  };

  const requestExistingAccountReview = () => {
    recordOnboardingEvent("existing_broker_account_review_requested", broker, {
      onboarding_step: "existing_account",
      attribution_status: "not_verified",
    });
    setStatus("review_requested");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-5xl space-y-8 px-4 py-8 md:py-12">
        <div className="mx-auto max-w-3xl space-y-3 text-center">
          <Badge variant="outline">Botvio onboarding · Step 2 of 8</Badge>
          <h1 className="text-3xl font-black tracking-tight md:text-5xl">Unlock your free Botvio tools</h1>
          <p className="text-muted-foreground md:text-lg">
            Complete the broker-partner onboarding for the market you want to explore. You can open a new account through Botvio's partner link or check the eligibility of an existing account.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1"><GraduationCap className="h-4 w-4" /> Learning guides</span>
            <span className="inline-flex items-center gap-1"><ChartNoAxesCombined className="h-4 w-4" /> Trading tools</span>
            <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" /> Community</span>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2" aria-label="Choose trading path">
          {(Object.keys(BROKERS) as BrokerKey[]).map((key) => {
            const item = BROKERS[key];
            const active = broker === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => { setBroker(key); setAccountChoice(null); setStatus("not_started"); }}
                className={`rounded-2xl border-2 p-5 text-left transition-all ${active ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/50"}`}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-xl font-bold">{item.name}</span>
                  {active && <CheckCircle2 className="h-5 w-5 text-primary" />}
                </div>
                <p className="font-semibold">{item.market}</p>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                <p className="mt-4 text-xs text-muted-foreground">Partner attribution is subject to {item.name}'s current rules and regional availability.</p>
              </button>
            );
          })}
        </section>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl">How do you want to continue with {selectedBroker.name}?</CardTitle>
            <CardDescription>Choose the option that accurately describes your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => { setAccountChoice("new"); setStatus("not_started"); }} aria-pressed={accountChoice === "new"} className={`rounded-xl border p-4 text-left ${accountChoice === "new" ? "border-primary bg-primary/5" : "border-border"}`}>
                <span className="block font-semibold">I'm new to {selectedBroker.name}</span>
                <span className="mt-1 block text-sm text-muted-foreground">Open an account through the official Botvio partner link.</span>
              </button>
              <button type="button" onClick={() => { setAccountChoice("existing"); setStatus("not_started"); }} aria-pressed={accountChoice === "existing"} className={`rounded-xl border p-4 text-left ${accountChoice === "existing" ? "border-primary bg-primary/5" : "border-border"}`}>
                <span className="block font-semibold">I already have an account</span>
                <span className="mt-1 block text-sm text-muted-foreground">Check whether your existing account can qualify for attribution.</span>
              </button>
            </div>

            {accountChoice === "new" && (
              <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
                <h3 className="font-semibold">Open your {selectedBroker.name} account</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Continue on the official broker website using Botvio's partner link.</li>
                  <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Complete the broker's own registration and verification process.</li>
                  <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Return to Botvio to check the next onboarding step.</li>
                </ul>
                <Button className="w-full" onClick={openPartnerLink}>Open {selectedBroker.name} account <ExternalLink className="ml-2 h-4 w-4" /></Button>
                {status === "link_clicked" && <p role="status" className="text-sm text-muted-foreground">Partner link opened. This click is recorded for campaign analytics only; it does not confirm registration or unlock tools.</p>}
              </div>
            )}

            {accountChoice === "existing" && (
              <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
                <h3 className="font-semibold">Check your existing account's eligibility</h3>
                <p className="text-sm text-muted-foreground">
                  Existing accounts can only be attributed when {selectedBroker.name}'s partner rules and approved verification process allow it. Botvio cannot promise retroactive reassignment.
                </p>
                <Button variant="outline" className="w-full" onClick={requestExistingAccountReview}><RefreshCw className="mr-2 h-4 w-4" />Start eligibility review</Button>
                {status === "review_requested" && (
                  <div role="status" className="rounded-lg border p-3 text-sm">
                    <p className="font-semibold">Eligibility review requested</p>
                    <p className="mt-1 text-muted-foreground">No account has been verified or linked yet. Contact the broker's official partner support if they must confirm or change attribution. Botvio will unlock eligible free tools only after trusted confirmation is available.</p>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
              <p className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" /> Honest verification</p>
              <p className="mt-1 text-muted-foreground">Botvio does not ask for your broker password. A link click or self-reported account is not proof of partner attribution. Never deposit or place a live trade solely to unlock software unless the broker's official terms explicitly require it and you understand the risk.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-primary/20">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="flex items-center gap-2 font-semibold"><LockKeyhole className="h-4 w-4 text-primary" /> Free tools require verified partner onboarding</p>
              <p className="text-sm text-muted-foreground">Verification is not yet automated in this onboarding screen. Tool access must not be marked verified until a trusted broker confirmation or authorized review is integrated.</p>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground"><Clock3 className="h-4 w-4" /> Verification pending</div>
          </CardContent>
        </Card>

        <div className="flex flex-col justify-between gap-3 sm:flex-row">
          <Button variant="outline" asChild><Link to="/signup">Back to signup</Link></Button>
          <Button variant="ghost" asChild><Link to="/affiliate-disclosure">Affiliate disclosure <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </div>
      </main>
    </div>
  );
}
