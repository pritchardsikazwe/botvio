import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link2, Loader2, ShieldCheck, Info } from "lucide-react";
import { toast } from "sonner";
import { useTradeCopyAction } from "@/hooks/useTradeCopy";

interface Props { role: "master" | "slave"; robot?: boolean; triggerLabel: string }

type ServerOption = { label: string; value: string; environment: "Live" | "Demo" };

const BROKER_SERVERS: Record<string, ServerOption[]> = {
  HFM: [
    { label: "HFMarketsGlobal-Live1", value: "HFMarketsGlobal-Live1", environment: "Live" },
    { label: "HFMarketsGlobal-Demo", value: "HFMarketsGlobal-Demo", environment: "Demo" },
    { label: "HFMarketsGlobal-Live3", value: "HFMarketsGlobal-Live3", environment: "Live" },
    { label: "HFMarketsGlobal-Demo3", value: "HFMarketsGlobal-Demo3", environment: "Demo" },
    { label: "HFMarketsGlobal-Live4", value: "HFMarketsGlobal-Live4", environment: "Live" },
    { label: "HFMarketsGlobal-Demo4", value: "HFMarketsGlobal-Demo4", environment: "Demo" },
    { label: "HFMarketsGlobal-Live5", value: "HFMarketsGlobal-Live5", environment: "Live" },
    { label: "HFMarketsGlobal-Live7", value: "HFMarketsGlobal-Live7", environment: "Live" },
    { label: "HFMarketsGlobal-Live8", value: "HFMarketsGlobal-Live8", environment: "Live" },
    { label: "HFMarketsGlobal-Live9", value: "HFMarketsGlobal-Live9", environment: "Live" },
    { label: "HFMarketsGlobal-Live10", value: "HFMarketsGlobal-Live10", environment: "Live" },
    { label: "HFMarketsGlobal-Live11", value: "HFMarketsGlobal-Live11", environment: "Live" },
    { label: "HFMarketsGlobal-Live12", value: "HFMarketsGlobal-Live12", environment: "Live" },
    { label: "HFMarketsGlobal-Live13", value: "HFMarketsGlobal-Live13", environment: "Live" },
    { label: "HFMarketsGlobal-Live14", value: "HFMarketsGlobal-Live14", environment: "Live" },
    { label: "HFMarketsGlobal-Live15", value: "HFMarketsGlobal-Live15", environment: "Live" },
    { label: "HFMarketsGlobal-Live16", value: "HFMarketsGlobal-Live16", environment: "Live" },
    { label: "HFMarketsGlobal-Live17", value: "HFMarketsGlobal-Live17", environment: "Live" },
    { label: "HFMarketsGlobal-Live18", value: "HFMarketsGlobal-Live18", environment: "Live" },
    { label: "HFMarketsGlobal-Live19", value: "HFMarketsGlobal-Live19", environment: "Live" },
    { label: "HFMarketsGlobal-Live20", value: "HFMarketsGlobal-Live20", environment: "Live" },
  ],
  Deriv: [
    { label: "Deriv-Demo", value: "Deriv-Demo", environment: "Demo" },
    { label: "DerivSVG-Server", value: "DerivSVG-Server", environment: "Live" },
    { label: "DerivSVG-Server-02", value: "DerivSVG-Server-02", environment: "Live" },
  ],
};

const BROKER_OPTIONS = [
  "HFM",
  "Weltrade",
  "Exness",
  "IC Markets",
  "XM",
  "Pepperstone",
  "FBS",
  "RoboForex",
  "Vantage",
  "FxPro",
  "Deriv",
  "Other",
];

/** Password lives only in this form's local state and is cleared on submit. */
export function ConnectMt5Dialog({ role, robot, triggerLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [broker, setBroker] = useState<string>("");
  const [serverChoice, setServerChoice] = useState("");
  const [label, setLabel] = useState("");
  const act = useTradeCopyAction();

  const server = serverChoice.trim();
  const serverOptions = BROKER_SERVERS[broker] || [];

  const resetForm = () => {
    setLogin("");
    setPassword("");
    setBroker("");
    setServerChoice("");
    setLabel("");
  };

  const handleBrokerChange = (value: string) => {
    setBroker(value);
    setServerChoice("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!server) {
      toast.error("Select your MT5 server first");
      return;
    }

    const pw = password;
    setPassword("");
    try {
      await act.mutateAsync({
        action: role === "master" ? "connect_master" : "connect_follower",
        payload: {
          login,
          password: pw,
          broker,
          server,
          label: label || undefined,
          botvio_robot: robot === true,
        },
      });
      toast.success(role === "master" ? "Master account connected in DEMO mode (inactive)" : "Follower account saved in DEMO mode");
      setOpen(false);
      resetForm();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Link2 className="mr-2 h-4 w-4" />{triggerLabel}</Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{triggerLabel}</DialogTitle>
          <DialogDescription>
            Add your MT5 account in three steps. New connections start in DEMO mode and inactive.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="tc-login">MT5 login</Label>
              <Input
                id="tc-login"
                inputMode="numeric"
                placeholder="Account number"
                required
                value={login}
                onChange={(e) => setLogin(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tc-pass">MT5 password</Label>
              <Input
                id="tc-pass"
                type="password"
                autoComplete="off"
                placeholder="Trader password"
                required
                minLength={4}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tc-broker">MT5 broker</Label>
            <Select value={broker} onValueChange={handleBrokerChange} required>
              <SelectTrigger id="tc-broker">
                <SelectValue placeholder="Select your broker" />
              </SelectTrigger>
              <SelectContent>
                {BROKER_OPTIONS.map((item) => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Choose your broker first. BOTVIO will show verified server names where available.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tc-server">MT5 server</Label>
            {serverOptions.length > 0 ? (
              <>
                <Select value={serverChoice} onValueChange={setServerChoice} required>
                  <SelectTrigger id="tc-server">
                    <SelectValue placeholder="Select your MT5 server" />
                  </SelectTrigger>
                  <SelectContent>
                    {serverOptions.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        <span className="flex items-center gap-2">
                          <span>{item.label}</span>
                          <span className="text-xs text-muted-foreground">({item.environment})</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Select the server name shown in your MT5 account. These server names are maintained from verified broker documentation.</p>
              </>
            ) : (
              <>
                <Input
                  id="tc-server"
                  placeholder="Enter exact server shown in MT5"
                  required
                  value={serverChoice}
                  onChange={(e) => setServerChoice(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">BOTVIO does not yet have a verified server directory for this broker, so enter the exact MT5 server shown in your terminal.</p>
              </>
            )}
            <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>Do not guess a server name. Your MT5 account's assigned server must match.</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tc-label">Nickname <span className="text-muted-foreground">(optional)</span></Label>
            <Input id="tc-label" placeholder={role === "master" ? "e.g. Main provider account" : "e.g. My trading account"} value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>

          <p className="flex items-start gap-2 rounded-lg bg-muted/40 p-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            Your password is encrypted on our server and is never shown again.
          </p>

          <DialogFooter>
            <Button type="submit" disabled={act.isPending || !login || !password || !server} className="w-full">
              {act.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Connect MT5 Account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
