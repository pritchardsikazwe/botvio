import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  PlugZap,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { PageBanner } from "@/components/layout/PageBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useMyProvider, useCreateProvider, useTradingAccounts } from "@/hooks/useBotvio";
import {
  useCreateCopyStrategy,
  marketsForPlatform,
  PLATFORM_LABEL,
  type CopyPlatform,
} from "@/hooks/useCopyTrading";

const PLATFORMS: { key: CopyPlatform; label: string; sub: string }[] = [
  { key: "deriv", label: "Deriv", sub: "Options, synthetics, multipliers" },
  { key: "mt5", label: "MT5", sub: "Forex, gold, indices" },
  { key: "binance", label: "Binance", sub: "Crypto spot & futures" },
];

const STYLES = ["Scalping", "Intraday", "Swing", "News", "Session-based"];

/**
 * Provider onboarding + strategy wizard.
 * Managed MT5 infrastructure is provisioned in the background — the provider
 * only sees "Connect MT5 Account".
 */
const BecomeProvider = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: myProvider } = useMyProvider();
  const { data: accounts } = useTradingAccounts();
  const createProvider = useCreateProvider();
  const createStrategy = useCreateCopyStrategy();

  const [step, setStep] = useState(0);
  const [platform, setPlatform] = useState<CopyPlatform>("deriv");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [style, setStyle] = useState("Intraday");
  const [broker, setBroker] = useState("");
  const [markets, setMarkets] = useState<string[]>([]);
  const [riskModel, setRiskModel] = useState("percentage");
  const [maxRisk, setMaxRisk] = useState("1");
  const [dailyLoss, setDailyLoss] = useState("5");
  const [drawdown, setDrawdown] = useState("10");
  const [stopOnDrawdown, setStopOnDrawdown] = useState(true);
  const [stopOnDailyLoss, setStopOnDailyLoss] = useState(true);
  const [respectSl, setRespectSl] = useState(true);
  const [emergencyStop, setEmergencyStop] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "private">("public");

  const connected = (accounts ?? []).some((a) =>
    platform === "deriv" ? a.broker === "deriv" : platform === "binance" ? a.broker === "binance" : true,
  );

  const toggleMarket = (m: string) =>
    setMarkets((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  const handleCreateProvider = async () => {
    if (!user) {
      toast.error("Please sign in first");
      return;
    }
    if (!displayName.trim()) {
      toast.error("Enter a provider name");
      return;
    }
    try {
      await createProvider.mutateAsync({ display_name: displayName.trim(), bio: bio.trim() });
      toast.success("Provider profile submitted for review");
      setStep(1);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not create provider profile");
    }
  };

  const handlePublish = async () => {
    if (!myProvider) {
      toast.error("Create your provider profile first");
      return;
    }
    if (!name.trim()) {
      toast.error("Give your strategy a name");
      return;
    }
    if (markets.length === 0) {
      toast.error("Select at least one market");
      return;
    }
    try {
      await createStrategy.mutateAsync({
        provider_id: myProvider.id,
        name: name.trim(),
        description: description.trim(),
        platform,
        broker_label: broker.trim() || null,
        trading_style: style,
        markets,
        risk_model: riskModel,
        max_risk_per_trade: Number(maxRisk) || 1,
        max_daily_loss_percent: Number(dailyLoss) || 5,
        max_drawdown_percent: Number(drawdown) || 10,
        stop_on_drawdown: stopOnDrawdown,
        stop_on_daily_loss: stopOnDailyLoss,
        respect_provider_sl: respectSl,
        emergency_stop: emergencyStop,
        visibility,
      });
      toast.success("Strategy published");
      navigate("/provider-dashboard");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not publish strategy");
    }
  };

  const steps = ["Account", "Details", "Markets", "Risk", "Protection", "Visibility"];
  const wizardStep = myProvider ? step : 0;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Become a Copy Trading Provider on Botvio"
        description="Connect your Deriv, MT5 or Binance account, publish a copy strategy with clear risk rules and grow followers on the Botvio copy trading marketplace."
      />
      <Header />

      <main className="container mx-auto max-w-3xl space-y-5 px-4 py-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/copy-trading">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Copy Trading
          </Link>
        </Button>

        <PageBanner
          title="Become a"
          accent="Provider"
          description="Connect a trading account, publish a strategy with clear risk rules, and let followers copy it into their own accounts."
          crumbs={[{ label: "Copy Trading", to: "/copy-trading" }, { label: "Become a provider" }]}
          features={[
            { icon: Sparkles, label: "Deriv & synthetics" },
            { icon: PlugZap, label: "MT5 forex & CFDs" },
            { icon: CheckCircle2, label: "Binance crypto" },
          ]}
        />

        {/* Step indicator */}
        <div className="flex flex-wrap gap-1.5">
          {steps.map((s, i) => (
            <Badge
              key={s}
              variant="outline"
              className={cn(
                "text-[10px]",
                i === wizardStep && "border-primary/40 bg-primary/10 text-primary",
              )}
            >
              {i + 1}. {s}
            </Badge>
          ))}
        </div>

        {/* Step 0 — trading account */}
        {!myProvider ? (
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Select your trading account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-3">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPlatform(p.key)}
                    className={cn(
                      "rounded-lg border p-3 text-left transition-colors",
                      platform === p.key
                        ? "border-primary/50 bg-primary/10"
                        : "border-border/60 hover:border-primary/30",
                    )}
                  >
                    <p className="text-sm font-semibold">{p.label}</p>
                    <p className="text-[11px] text-muted-foreground">{p.sub}</p>
                  </button>
                ))}
              </div>

              {connected ? (
                <div className="rounded-lg border border-success/30 bg-success/5 p-3 text-xs">
                  <p className="flex items-center gap-1.5 font-semibold text-success">
                    <span className="h-2 w-2 rounded-full bg-success" /> Account connected
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Platform: {PLATFORM_LABEL[platform]} · Status: Running
                  </p>
                </div>
              ) : (
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/connections">
                    <PlugZap className="mr-1.5 h-4 w-4" />
                    {platform === "mt5"
                      ? "Connect MT5 Account"
                      : platform === "binance"
                        ? "Connect Binance Account"
                        : "Connect Deriv Account"}
                  </Link>
                </Button>
              )}

              <div className="space-y-2">
                <Label htmlFor="pname" className="text-xs">Provider name</Label>
                <Input
                  id="pname"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Gold Master"
                />
                <Label htmlFor="pbio" className="text-xs">Short bio</Label>
                <Textarea
                  id="pbio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="How you trade, your session and your risk approach."
                  rows={3}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleCreateProvider}
                disabled={createProvider.isPending}
              >
                {createProvider.isPending ? "Submitting…" : "Continue"}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Create strategy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Step 1 — details */}
              {step <= 1 && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="sname" className="text-xs">Strategy name</Label>
                    <Input id="sname" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sdesc" className="text-xs">Description</Label>
                    <Textarea
                      id="sdesc"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Trading style</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {STYLES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStyle(s)}
                          className={cn(
                            "rounded-full border px-3 py-1 text-xs",
                            style === s
                              ? "border-primary/50 bg-primary/10 text-primary"
                              : "border-border/60",
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  {platform !== "deriv" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="broker" className="text-xs">Broker</Label>
                      <Input
                        id="broker"
                        value={broker}
                        onChange={(e) => setBroker(e.target.value)}
                        placeholder="e.g. Exness"
                      />
                    </div>
                  )}
                  <Button className="w-full" onClick={() => setStep(2)}>
                    Next: markets <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Step 2 — markets */}
              {step === 2 && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Select the markets this strategy trades on {PLATFORM_LABEL[platform]}.
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {marketsForPlatform(platform).map((m) => (
                      <label
                        key={m}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 p-2.5 text-xs"
                      >
                        <Checkbox
                          checked={markets.includes(m)}
                          onCheckedChange={() => toggleMarket(m)}
                        />
                        {m}
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button className="flex-1" onClick={() => setStep(3)}>
                      Next: risk model
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3 — risk */}
              {step === 3 && (
                <div className="space-y-3">
                  <Label className="text-xs">Risk model</Label>
                  <RadioGroup
                    value={riskModel}
                    onValueChange={setRiskModel}
                    className="grid gap-2 sm:grid-cols-3"
                  >
                    {[
                      { v: "percentage", l: "Percentage risk" },
                      { v: "fixed_lot", l: "Fixed lot" },
                      { v: "multiplier", l: "Multiplier" },
                    ].map((o) => (
                      <label
                        key={o.v}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 p-2.5 text-xs"
                      >
                        <RadioGroupItem value={o.v} id={`rm-${o.v}`} />
                        {o.l}
                      </label>
                    ))}
                  </RadioGroup>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="mr" className="text-xs">Max risk per trade (%)</Label>
                      <Input id="mr" type="number" min="0.1" step="0.1" value={maxRisk} onChange={(e) => setMaxRisk(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="dl" className="text-xs">Max daily loss (%)</Label>
                      <Input id="dl" type="number" min="1" step="1" value={dailyLoss} onChange={(e) => setDailyLoss(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="dd" className="text-xs">Max drawdown (%)</Label>
                      <Input id="dd" type="number" min="1" max="90" step="1" value={drawdown} onChange={(e) => setDrawdown(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
                    <Button className="flex-1" onClick={() => setStep(4)}>Next: protection</Button>
                  </div>
                </div>
              )}

              {/* Step 4 — protection */}
              {step === 4 && (
                <div className="space-y-3">
                  {[
                    { label: "Stop copying after maximum drawdown", v: stopOnDrawdown, set: setStopOnDrawdown },
                    { label: "Stop copying after daily loss", v: stopOnDailyLoss, set: setStopOnDailyLoss },
                    { label: "Respect provider stop loss", v: respectSl, set: setRespectSl },
                    { label: "Emergency stop enabled", v: emergencyStop, set: setEmergencyStop },
                  ].map((o) => (
                    <label
                      key={o.label}
                      className="flex cursor-pointer items-start gap-2 rounded-lg border border-border/60 p-3 text-xs"
                    >
                      <Checkbox checked={o.v} onCheckedChange={(val) => o.set(!!val)} />
                      {o.label}
                    </label>
                  ))}
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setStep(3)}>Back</Button>
                    <Button className="flex-1" onClick={() => setStep(5)}>Next: visibility</Button>
                  </div>
                </div>
              )}

              {/* Step 5 — visibility */}
              {step === 5 && (
                <div className="space-y-3">
                  <RadioGroup
                    value={visibility}
                    onValueChange={(v) => setVisibility(v as "public" | "private")}
                    className="grid gap-2 sm:grid-cols-2"
                  >
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 p-3 text-xs">
                      <RadioGroupItem value="public" id="vis-public" />
                      Public — listed in the marketplace
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 p-3 text-xs">
                      <RadioGroupItem value="private" id="vis-private" />
                      Private — invite only
                    </label>
                  </RadioGroup>
                  <Button className="w-full" onClick={handlePublish} disabled={createStrategy.isPending}>
                    {createStrategy.isPending ? "Publishing…" : "Publish strategy"}
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => setStep(4)}>Back</Button>
                </div>
              )}

              <p className="flex items-start gap-2 text-[11px] text-muted-foreground">
                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                Followers copy into their own accounts with their own risk limits. Never promise
                guaranteed profits — past performance does not guarantee future results.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default BecomeProvider;
