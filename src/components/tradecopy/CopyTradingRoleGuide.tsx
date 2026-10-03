import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, CircleHelp, ShieldCheck, UserRound, Users, Bot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type GuideRole = "follower" | "provider" | "admin";

const guides: Record<GuideRole, {
  eyebrow: string;
  title: string;
  description: string;
  steps: { title: string; text: string }[];
  primary: { label: string; to: string };
  secondary?: { label: string; to: string };
}> = {
  follower: {
    eyebrow: "FIRST-TIME SETUP",
    title: "New to copy trading? Start here.",
    description: "You do not need to understand every trading connection. Botvio guides you through the safe order: choose a source, connect your own MT5 Demo account, set risk, test, then activate.",
    steps: [
      { title: "1. Choose a source", text: "Copy the official Botvio Robot or an approved Provider. You never need the provider's MT5 password." },
      { title: "2. Connect your MT5", text: "Connect the MT5 account that will receive copied trades. Keep Demo and Live accounts clearly separated." },
      { title: "3. Set your risk", text: "Choose multiplier or fixed lot, limits, SL/TP copying and emergency controls." },
      { title: "4. Test before Live", text: "Run the complete flow on Demo first. Only enable Live after you have verified the connection and risk settings." },
    ],
    primary: { label: "Start guided setup", to: "/copy-trading/onboarding" },
    secondary: { label: "Connect accounts", to: "/connections" },
  },
  provider: {
    eyebrow: "PROVIDER SETUP",
    title: "Publish your trades with a clear role.",
    description: "A Provider publishes trades from a dedicated MT5 master. Botvio keeps your provider account separate from your follower account and sends the profile for review before marketplace use.",
    steps: [
      { title: "1. Create your Provider profile", text: "Add your public name, description and strategy information." },
      { title: "2. Connect a dedicated MT5 master", text: "Use one MT5 login with one clear role. For testing, use a dedicated Demo master." },
      { title: "3. Complete the risk profile", text: "Define markets, risk model, daily loss and drawdown protections." },
      { title: "4. Wait for approval", text: "Provider status moves through review before the strategy is presented as an approved source for followers." },
    ],
    primary: { label: "Become a Provider", to: "/copy-trading/become-provider" },
    secondary: { label: "Open Provider dashboard", to: "/provider-dashboard" },
  },
  admin: {
    eyebrow: "ADMIN CONTROL",
    title: "Manage the whole copy-trading network.",
    description: "Admin controls platform sources, Provider approval, follower relationships, Botvio Robot, Demo/Live access, diagnostics and audit visibility. User trading credentials remain protected.",
    steps: [
      { title: "1. Review Providers", text: "Approve or manage provider profiles before they become trusted copy sources." },
      { title: "2. Monitor connections", text: "See Provider masters, Follower accounts, Botvio Robot and system feed status without exposing raw credentials." },
      { title: "3. Control Demo/Live", text: "Keep new connections Demo-first and gate Live activation until the required checks are complete." },
      { title: "4. Monitor and intervene", text: "Use copy status, diagnostics, audit information and emergency controls to protect the platform." },
    ],
    primary: { label: "Open Admin Control", to: "/admin/copy-trading" },
    secondary: { label: "Open connections", to: "/connections" },
  },
};

export function CopyTradingRoleGuide({ role }: { role: GuideRole }) {
  const guide = guides[role];
  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CircleHelp className="h-5 w-5 text-primary" />
            <Badge variant="outline" className="border-primary/30 text-primary">{guide.eyebrow}</Badge>
          </div>
          <Badge variant="secondary">DEMO-FIRST</Badge>
        </div>
        <CardTitle className="text-xl sm:text-2xl">{guide.title}</CardTitle>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{guide.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {guide.steps.map((step) => (
            <div key={step.title} className="rounded-xl border border-border/60 bg-background/70 p-4">
              <CheckCircle2 className="mb-2 h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">{step.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{step.text}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to={guide.primary.to}>{guide.primary.label}<ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
          {guide.secondary && (
            <Button asChild variant="outline">
              <Link to={guide.secondary.to}>{guide.secondary.label}</Link>
            </Button>
          )}
        </div>
        <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>Botvio shows connection status and controls, but does not expose another user's raw MT5 password, API secret or access token.</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function RoleEntryCards() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Card className="glass-card">
        <CardContent className="p-4">
          <UserRound className="h-5 w-5 text-primary" />
          <p className="mt-2 text-sm font-semibold">I want to copy trades</p>
          <p className="mt-1 text-xs text-muted-foreground">Choose Botvio Robot or an approved Provider and use your own MT5 account.</p>
          <Button asChild variant="outline" size="sm" className="mt-3 w-full"><Link to="/copy-trading/onboarding">Follower setup</Link></Button>
        </CardContent>
      </Card>
      <Card className="glass-card">
        <CardContent className="p-4">
          <Users className="h-5 w-5 text-primary" />
          <p className="mt-2 text-sm font-semibold">I want to be a Provider</p>
          <p className="mt-1 text-xs text-muted-foreground">Publish a strategy from a dedicated master account for followers.</p>
          <Button asChild variant="outline" size="sm" className="mt-3 w-full"><Link to="/copy-trading/become-provider">Provider setup</Link></Button>
        </CardContent>
      </Card>
      <Card className="glass-card">
        <CardContent className="p-4">
          <Bot className="h-5 w-5 text-primary" />
          <p className="mt-2 text-sm font-semibold">Botvio Robot</p>
          <p className="mt-1 text-xs text-muted-foreground">The official Botvio source is controlled separately from normal Providers.</p>
          <Button asChild variant="outline" size="sm" className="mt-3 w-full"><Link to="/botvio-robot">View Robot</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
