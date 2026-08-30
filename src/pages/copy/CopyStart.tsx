import { useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldAlert, PlugZap, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useProviders, useTradingAccounts, useSubscribeToProvider } from "@/hooks/useBotvio";
import {
  useCopyStrategies,
  RISK_PRESETS,
  PLATFORM_LABEL,
  type RiskPresetKey,
} from "@/hooks/useCopyTrading";

/**
 * Follower setup: Connect account → set risk → start copying.
 * Uses the existing copy_subscriptions flow (admin approval unchanged).
 */
const CopyStart = () => {
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: providers } = useProviders();
  const { data: strategies } = useCopyStrategies();
  const { data: accounts } = useTradingAccounts();
  const subscribe = useSubscribeToProvider();

  const provider = providers?.find((p) => p.id === providerId);
  const strategy = (strategies ?? []).find((s) => s.provider_id === providerId);
  const platform = strategy?.platform ?? (provider?.primary_market === "mt5" ? "mt5" : "deriv");
  const isDeriv = platform === "deriv";

  const [preset, setPreset] = useState<RiskPresetKey>("conservative");
  const [accountId, setAccountId] = useState("");
  const [custom, setCustom] = useState(false);
  const [riskPerTrade, setRiskPerTrade] = useState("0.5");
  const [dailyLoss, setDailyLoss] = useState("3");
  const [drawdown, setDrawdown] = useState("8");
  const [maxTradeAmount, setMaxTradeAmount] = useState("1");
  const [stopOnProviderDd, setStopOnProviderDd] = useState(true);
  const [stopOnMyDailyLoss, setStopOnMyDailyLoss] = useState(true);

  const eligibleAccounts = useMemo(
    () => (accounts ?? []).filter((a) => (isDeriv ? a.broker === "deriv" : true)),
    [accounts, isDeriv],
  );

  const applyPreset = (key: RiskPresetKey) => {
    setPreset(key);
    setCustom(false);
    const p = RISK_PRESETS[key];
    setRiskPerTrade(String(p.riskPerTrade));
    setDailyLoss(String(p.dailyLoss));
    setDrawdown(String(p.drawdown));
  };

  const handleStart = async () => {
    if (!user) {
      toast.error("Please sign in to start copying");
      return;
    }
    const account = accountId || eligibleAccounts[0]?.id;
    if (!account) {
      toast.error(isDeriv ? "Connect your Deriv account first" : "Connect your MT5 account first");
      return;
    }
    const dd = Number(drawdown);
    if (!dd || dd <= 0 || dd > 90) {
      toast.error("Set a maximum drawdown between 1% and 90%");
      return;
    }

    try {
      await subscribe.mutateAsync({
        provider_id: providerId!,
        trading_account_id: account,
        copy_mode: "fixed",
        fixed_stake: Number(maxTradeAmount) || 1,
        max_drawdown_percent: dd,
        daily_loss_limit_usd: stopOnMyDailyLoss && Number(dailyLoss) ? Number(dailyLoss) : null,
        equity_floor_usd: null,
        baseline_equity_usd: null,
      });
      toast.success("Copy request submitted. Copying starts once it is approved.");
      navigate("/copy-trading/my");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not start copying");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={provider ? `Copy ${provider.display_name}` : "Start Copy Trading"}
        description="Connect your own trading account, choose your risk level and start copying a verified Botvio provider. Your credentials stay private to you."
      />
      <Header />

      <main className="container mx-auto max-w-2xl space-y-4 px-4 py-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/copy-trading">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Copy Trading
          </Link>
        </Button>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Copy {provider?.display_name ?? "provider"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-[10px]">
                {PLATFORM_LABEL[platform] ?? platform}
                {strategy?.broker_label ? ` • ${strategy.broker_label}` : ""}
              </Badge>
              {strategy?.name && (
                <Badge variant="outline" className="text-[10px]">{strategy.name}</Badge>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
              <div className="rounded bg-muted/40 p-2">
                <p className="text-sm font-bold">
                  {provider?.win_rate != null ? `${Number(provider.win_rate).toFixed(1)}%` : "—"}
                </p>
                <p className="text-muted-foreground">Win rate</p>
              </div>
              <div className="rounded bg-muted/40 p-2">
                <p className="text-sm font-bold">
                  ${Number(provider?.total_profit ?? 0).toFixed(2)}
                </p>
                <p className="text-muted-foreground">Net P/L</p>
              </div>
              <div className="rounded bg-muted/40 p-2">
                <p className="text-sm font-bold">
                  {strategy ? `${Number(strategy.max_drawdown_percent).toFixed(0)}%` : "—"}
                </p>
                <p className="text-muted-foreground">Drawdown cap</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Your account */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Your account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {eligibleAccounts.length === 0 ? (
              <Button variant="outline" className="w-full" asChild>
                <Link to="/connections">
                  <PlugZap className="mr-1.5 h-4 w-4" />
                  {isDeriv ? "Connect Deriv" : "Connect MT5 Account"}
                </Link>
              </Button>
            ) : (
              <>
                <Label className="text-xs">Copy into</Label>
                <Select value={accountId || eligibleAccounts[0].id} onValueChange={setAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your account" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleAccounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="flex items-center gap-1.5 text-[11px] text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Account connected and ready
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Risk */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Risk settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={custom ? "custom" : preset}
              onValueChange={(v) => (v === "custom" ? setCustom(true) : applyPreset(v as RiskPresetKey))}
              className="grid grid-cols-2 gap-2 sm:grid-cols-4"
            >
              {(["conservative", "balanced", "aggressive"] as RiskPresetKey[]).map((k) => (
                <label
                  key={k}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 p-2.5 text-xs capitalize"
                >
                  <RadioGroupItem value={k} id={`risk-${k}`} />
                  {k}
                </label>
              ))}
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 p-2.5 text-xs">
                <RadioGroupItem value="custom" id="risk-custom" />
                Custom
              </label>
            </RadioGroup>

            {isDeriv ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="maxTrade" className="text-xs">Maximum trade amount (USD)</Label>
                  <Input
                    id="maxTrade"
                    type="number"
                    min="0.35"
                    step="0.01"
                    value={maxTradeAmount}
                    onChange={(e) => setMaxTradeAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dailyLossUsd" className="text-xs">Maximum daily loss (USD)</Label>
                  <Input
                    id="dailyLossUsd"
                    type="number"
                    min="1"
                    step="1"
                    value={dailyLoss}
                    onChange={(e) => {
                      setDailyLoss(e.target.value);
                      setCustom(true);
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="riskTrade" className="text-xs">Risk per trade (%)</Label>
                  <Input
                    id="riskTrade"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={riskPerTrade}
                    onChange={(e) => {
                      setRiskPerTrade(e.target.value);
                      setCustom(true);
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dailyLossPct" className="text-xs">Max daily loss (USD)</Label>
                  <Input
                    id="dailyLossPct"
                    type="number"
                    min="1"
                    step="1"
                    value={dailyLoss}
                    onChange={(e) => {
                      setDailyLoss(e.target.value);
                      setCustom(true);
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ddPct" className="text-xs">Max drawdown (%)</Label>
                  <Input
                    id="ddPct"
                    type="number"
                    min="1"
                    max="90"
                    step="1"
                    value={drawdown}
                    onChange={(e) => {
                      setDrawdown(e.target.value);
                      setCustom(true);
                    }}
                  />
                </div>
              </div>
            )}

            {isDeriv && (
              <div className="space-y-1.5">
                <Label htmlFor="ddDeriv" className="text-xs">Max drawdown (%)</Label>
                <Input
                  id="ddDeriv"
                  type="number"
                  min="1"
                  max="90"
                  step="1"
                  value={drawdown}
                  onChange={(e) => {
                    setDrawdown(e.target.value);
                    setCustom(true);
                  }}
                />
              </div>
            )}

            <div className="space-y-2 rounded-lg border border-border/60 p-3">
              <p className="text-xs font-semibold">Protection</p>
              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={stopOnProviderDd}
                  onCheckedChange={(v) => setStopOnProviderDd(!!v)}
                />
                Stop copying if provider drawdown exceeds my limit
              </label>
              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={stopOnMyDailyLoss}
                  onCheckedChange={(v) => setStopOnMyDailyLoss(!!v)}
                />
                Stop copying if my daily loss exceeds my limit
              </label>
            </div>

            <Button className="w-full" onClick={handleStart} disabled={subscribe.isPending}>
              {subscribe.isPending ? "Submitting…" : "Start copying"}
            </Button>

            <p className="flex items-start gap-2 text-[11px] text-muted-foreground">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
              Copy trading involves risk. Past performance does not guarantee future results. Your
              trades execute in your own connected account — provider credentials are never shared.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CopyStart;
