import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTradeCopyAccounts, useTradeCopyAction } from "@/hooks/useTradeCopy";
import { ConnectMt5Dialog } from "@/components/tradecopy/ConnectMt5Dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, ArrowRight, Bot, Check, CheckCircle2, CreditCard, LockKeyhole,
  MonitorSmartphone, Play, ShieldCheck, Sparkles, UserRound, Users, WalletCards
} from "lucide-react";

const STEPS = [
  { id: 1, title: "Account", icon: UserRound },
  { id: 2, title: "Source", icon: Sparkles },
  { id: 3, title: "Plan", icon: CreditCard },
  { id: 4, title: "MT5", icon: MonitorSmartphone },
  { id: 5, title: "Activate", icon: Play },
];

const ROBOT = "__botvio_robot__";

export default function CopyTradingOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [source, setSource] = useState(ROBOT);
  const [plan, setPlan] = useState("monthly");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [risk, setRisk] = useState("balanced");
  const [copySltp, setCopySltp] = useState(true);
  const [activated, setActivated] = useState(false);
  const act = useTradeCopyAction();
  const accounts = useTradeCopyAccounts("slave");

  const providers = useQuery({
    queryKey: ["tradecopy", "onboarding-providers", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("providers")
        .select("id,display_name,status")
        .eq("status", "approved")
        .order("display_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const selectedProvider = providers.data?.find((p) => p.id === source);
  const sourceName = source === ROBOT ? "Botvio Robot" : selectedProvider?.display_name ?? "Provider";
  const activeAccount = useMemo(
    () => accounts.data?.find((a) => a.id === selectedAccount) ?? accounts.data?.[0],
    [accounts.data, selectedAccount],
  );

  const chooseSource = (value: string) => {
    setSource(value);
    setStep(3);
  };

  const continuePayment = () => {
    // The existing billing flow remains the payment authority. This onboarding
    // step hands the customer to billing instead of creating a second payment system.
    navigate("/billing?returnTo=/copy-trading/onboarding");
  };

  const connectComplete = () => {
    const first = accounts.data?.[0];
    if (first) setSelectedAccount(first.id);
    setStep(5);
  };

  const activate = async () => {
    if (!activeAccount) return;
    try {
      await act.mutateAsync({
        action: "link",
        payload: {
          follower_account_id: activeAccount.id,
          copy_order_type: 1,
          ...(source === ROBOT ? { botvio_robot: true } : { provider_id: source }),
        },
      });
      setActivated(true);
    } catch {
      // The shared TradeCopy UI surfaces the exact backend error; keep this
      // wizard focused on the customer flow and let the toast handle details.
    }
  };

  const next = () => setStep((s) => Math.min(5, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link to="/copy-trading" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Copy Trading
          </Link>
          <Badge variant="outline" className="border-primary/30 text-primary">BOTVIO 2026 ONBOARDING</Badge>
        </div>

        <Card className="overflow-hidden border-primary/15 shadow-xl shadow-primary/5">
          <CardHeader className="border-b bg-gradient-to-r from-primary/10 via-background to-background pb-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-primary">
                  <Bot className="h-5 w-5" />
                  <span className="text-sm font-semibold tracking-wide">COPY TRADING SETUP</span>
                </div>
                <CardTitle className="text-3xl sm:text-4xl">Start copying in minutes</CardTitle>
                <CardDescription className="mt-2 max-w-2xl text-sm sm:text-base">
                  Choose one copy source, activate your plan, connect MT5 and start with controlled settings.
                </CardDescription>
              </div>
              <div className="w-full max-w-xs">
                <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                  <span>Setup progress</span><span>{step}/5</span>
                </div>
                <Progress value={step * 20} className="h-2" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="grid lg:grid-cols-[240px_1fr]">
              <aside className="border-b bg-muted/20 p-4 lg:border-b-0 lg:border-r lg:p-5">
                <div className="space-y-2">
                  {STEPS.map((item) => {
                    const Icon = item.icon;
                    const done = item.id < step || (item.id === 5 && activated);
                    const current = item.id === step;
                    return (
                      <button
                        key={item.id}
                        onClick={() => item.id <= step && setStep(item.id)}
                        className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-300 ${current ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-background"}`}
                      >
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${current ? "border-primary-foreground/30 bg-white/15" : done ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"}`}>
                          {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                        </span>
                        <span>
                          <span className="block text-xs text-current/70">STEP {item.id}</span>
                          <span className="text-sm font-semibold">{item.title}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-5 rounded-xl border border-primary/15 bg-primary/5 p-3 text-xs text-muted-foreground">
                  <ShieldCheck className="mb-2 h-4 w-4 text-primary" />
                  Your MT5 password is handled through the existing encrypted TradeCopy connection flow.
                </div>
              </aside>

              <main className="min-h-[540px] p-5 sm:p-8">
                {step === 1 && (
                  <div className="animate-in fade-in slide-in-from-right-3 duration-500">
                    <Badge variant="outline" className="mb-3">STEP 1</Badge>
                    <h2 className="text-2xl font-bold">Welcome to Botvio Copy Trading</h2>
                    <p className="mt-2 max-w-2xl text-muted-foreground">First create or sign in to your Botvio account. Your account will keep your subscription, MT5 connection and copy settings together.</p>
                    <div className="mt-8 grid gap-4 sm:grid-cols-3">
                      {[
                        ["Account", "One Botvio login"],
                        ["Security", "Encrypted MT5 credentials"],
                        ["Control", "Pause or stop copying"],
                      ].map(([title, text]) => (
                        <Card key={title} className="border-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                          <CardContent className="p-5">
                            <CheckCircle2 className="mb-3 h-5 w-5 text-primary" />
                            <div className="font-semibold">{title}</div>
                            <div className="mt-1 text-xs text-muted-foreground">{text}</div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <div className="mt-8 flex flex-wrap gap-3">
                      {user ? (
                        <Button size="lg" onClick={next}>Account ready <ArrowRight className="ml-2 h-4 w-4" /></Button>
                      ) : (
                        <Button size="lg" asChild><Link to="/auth">Create / Sign in <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                      )}
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="animate-in fade-in slide-in-from-right-3 duration-500">
                    <Badge variant="outline" className="mb-3">STEP 2</Badge>
                    <h2 className="text-2xl font-bold">Choose your copy source</h2>
                    <p className="mt-2 text-muted-foreground">One MT5 follower account has one active copy source at a time. You can switch later after stopping the current relationship.</p>
                    <div className="mt-7 grid gap-4 md:grid-cols-2">
                      <button onClick={() => chooseSource(ROBOT)} className={`group rounded-2xl border p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${source === ROBOT ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/40"}`}>
                        <div className="flex items-center justify-between">
                          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Bot className="h-6 w-6" /></span>
                          {source === ROBOT && <Badge>Selected</Badge>}
                        </div>
                        <h3 className="mt-5 text-xl font-bold">Botvio Robot</h3>
                        <p className="mt-2 text-sm text-muted-foreground">The official Botvio strategy source. Your MT5 account follows the Botvio Robot master.</p>
                        <div className="mt-5 flex flex-wrap gap-2 text-xs">
                          <Badge variant="secondary">Official source</Badge><Badge variant="secondary">Automated</Badge>
                        </div>
                      </button>

                      <div className="rounded-2xl border border-border p-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted"><Users className="h-6 w-6" /></div>
                        <h3 className="mt-5 text-xl font-bold">Approved Providers</h3>
                        <p className="mt-2 text-sm text-muted-foreground">Choose one independent provider and copy that provider's MT5 master.</p>
                        <div className="mt-5 space-y-2">
                          {providers.isLoading && <div className="animate-pulse rounded-lg bg-muted p-3 text-xs">Loading approved providers…</div>}
                          {providers.data?.map((provider) => (
                            <button key={provider.id} onClick={() => chooseSource(provider.id)} className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition-all ${source === provider.id ? "border-primary bg-primary/5" : "hover:border-primary/40"}`}>
                              <span><span className="block text-sm font-semibold">{provider.display_name}</span><span className="text-xs text-muted-foreground">Approved provider</span></span>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </button>
                          ))}
                          {!providers.isLoading && !providers.data?.length && <div className="rounded-xl bg-muted/40 p-4 text-xs text-muted-foreground">No approved providers are currently available. Botvio Robot is available now.</div>}
                        </div>
                      </div>
                    </div>
                    <div className="mt-7"><Button variant="ghost" onClick={back}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button></div>
                  </div>
                )}

                {step === 3 && (
                  <div className="animate-in fade-in slide-in-from-right-3 duration-500">
                    <Badge variant="outline" className="mb-3">STEP 3</Badge>
                    <h2 className="text-2xl font-bold">Activate your plan</h2>
                    <p className="mt-2 text-muted-foreground">Your selected source is <strong>{sourceName}</strong>. Payment continues through Botvio's existing billing system.</p>
                    <div className="mt-7 grid gap-4 md:grid-cols-2">
                      {[
                        ["monthly", "Monthly", "Flexible recurring access"],
                        ["annual", "Annual", "Annual subscription"],
                      ].map(([id, title, text]) => (
                        <button key={id} onClick={() => setPlan(id)} className={`rounded-2xl border p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${plan === id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border"}`}>
                          <div className="flex items-center justify-between"><span className="font-semibold">{title}</span>{plan === id && <CheckCircle2 className="h-5 w-5 text-primary" />}</div>
                          <p className="mt-2 text-xs text-muted-foreground">{text}</p>
                        </button>
                      ))}
                    </div>
                    <div className="mt-6 rounded-2xl border bg-muted/20 p-5">
                      <div className="flex items-center gap-3"><WalletCards className="h-5 w-5 text-primary" /><div><div className="font-semibold">Secure checkout</div><div className="text-xs text-muted-foreground">Complete payment in the existing Botvio billing page. No duplicate payment system is created here.</div></div></div>
                    </div>
                    <div className="mt-7 flex flex-wrap gap-3">
                      <Button size="lg" onClick={continuePayment}>Continue to secure payment <ArrowRight className="ml-2 h-4 w-4" /></Button>
                      <Button variant="ghost" onClick={back}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                    </div>
                    {paid && <p className="mt-3 text-xs text-emerald-600">Payment status detected for this onboarding session.</p>}
                  </div>
                )}

                {step === 4 && (
                  <div className="animate-in fade-in slide-in-from-right-3 duration-500">
                    <Badge variant="outline" className="mb-3">STEP 4</Badge>
                    <h2 className="text-2xl font-bold">Connect your MT5 account</h2>
                    <p className="mt-2 text-muted-foreground">Connect the account that will receive copied trades. New connections stay inactive until you explicitly activate copying.</p>
                    <div className="mt-7 rounded-2xl border border-primary/15 bg-primary/5 p-5">
                      <div className="flex items-start gap-3">
                        <LockKeyhole className="mt-0.5 h-5 w-5 text-primary" />
                        <div><div className="font-semibold">Secure MT5 connection</div><p className="mt-1 text-xs text-muted-foreground">Choose your broker and exact MT5 server. Do not guess the server name.</p></div>
                      </div>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <ConnectMt5Dialog role="slave" triggerLabel="Connect my MT5 account" />
                      {accounts.data?.length ? <Button variant="outline" onClick={connectComplete}>I have connected MT5 <ArrowRight className="ml-2 h-4 w-4" /></Button> : null}
                    </div>
                    <div className="mt-6 space-y-2">
                      {accounts.data?.map((account) => (
                        <button key={account.id} onClick={() => setSelectedAccount(account.id)} className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all ${selectedAccount === account.id ? "border-primary bg-primary/5" : "border-border"}`}>
                          <span><span className="block font-semibold">{account.label}</span><span className="text-xs text-muted-foreground">{account.login_id} · {account.server}</span></span>
                          {selectedAccount === account.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                        </button>
                      ))}
                    </div>
                    <div className="mt-7"><Button variant="ghost" onClick={back}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button></div>
                  </div>
                )}

                {step === 5 && (
                  <div className="animate-in fade-in slide-in-from-right-3 duration-500">
                    <Badge variant="outline" className="mb-3">STEP 5</Badge>
                    {activated ? (
                      <div className="py-8 text-center">
                        <div className="mx-auto flex h-20 w-20 animate-in zoom-in rounded-full bg-emerald-500/10 text-emerald-600"><CheckCircle2 className="m-auto h-10 w-10" /></div>
                        <h2 className="mt-6 text-3xl font-bold">Copy trading is active</h2>
                        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">Your MT5 account is linked to <strong>{sourceName}</strong>. You can pause or stop copying at any time.</p>
                        <div className="mx-auto mt-7 max-w-xl rounded-2xl border bg-muted/20 p-5 text-left">
                          <div className="flex justify-between text-sm"><span>MT5 account</span><strong>{activeAccount?.login_id}</strong></div>
                          <div className="mt-2 flex justify-between text-sm"><span>Copy source</span><strong>{sourceName}</strong></div>
                          <div className="mt-2 flex justify-between text-sm"><span>Risk mode</span><strong>{risk}</strong></div>
                        </div>
                        <Button className="mt-7" onClick={() => navigate("/copy-trading/my")}>Open copy dashboard <ArrowRight className="ml-2 h-4 w-4" /></Button>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-2xl font-bold">Configure and activate</h2>
                        <p className="mt-2 text-muted-foreground">Review the source and basic risk controls before starting. You can change detailed settings later.</p>
                        <div className="mt-7 grid gap-4 md:grid-cols-2">
                          <Card className="border-primary/20 bg-primary/5"><CardContent className="p-5"><div className="text-xs text-muted-foreground">COPY SOURCE</div><div className="mt-1 text-xl font-bold">{sourceName}</div><div className="mt-1 text-xs text-muted-foreground">{activeAccount ? `${activeAccount.login_id} · ${activeAccount.server}` : "Choose an MT5 account"}</div></CardContent></Card>
                          <Card><CardContent className="p-5"><div className="text-xs text-muted-foreground">RISK MODE</div><div className="mt-3 flex gap-2">{["conservative","balanced","aggressive"].map((item) => <button key={item} onClick={() => setRisk(item)} className={`rounded-lg border px-3 py-2 text-xs capitalize transition-all ${risk === item ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>{item}</button>)}</div><label className="mt-4 flex items-center gap-2 text-xs"><input type="checkbox" checked={copySltp} onChange={(e) => setCopySltp(e.target.checked)} /> Copy source SL/TP</label></Card>
                        </div>
                        <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0 text-amber-500" /><span>Copy trading involves risk. Start with a DEMO account while testing the connection and settings.</span></div>
                        <div className="mt-7 flex flex-wrap gap-3">
                          <Button size="lg" onClick={activate} disabled={!activeAccount || act.isPending}><Play className="mr-2 h-4 w-4" />Activate Copy Trading</Button>
                          <Button variant="ghost" onClick={back}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                        </div>
                        {!activeAccount && <p className="mt-3 text-xs text-destructive">Connect an MT5 follower account before activating.</p>}
                      </>
                    )}
                  </div>
                )}
              </main>
            </div>
          </CardContent>
        </Card>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><LockKeyhole className="h-3.5 w-3.5" />Encrypted credentials</span>
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" />DEMO-first activation</span>
          <span className="inline-flex items-center gap-1.5"><MonitorSmartphone className="h-3.5 w-3.5" />MT5 TradeCopy Cloud</span>
        </div>
      </div>
    </div>
  );
}
