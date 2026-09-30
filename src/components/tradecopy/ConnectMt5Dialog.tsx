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

type BrokerSuggestion = { label: string; value: string };

const BROKER_SUGGESTIONS: BrokerSuggestion[] = [
  { label: "HFM", value: "HFM" },
  { label: "Weltrade", value: "Weltrade" },
  { label: "Exness", value: "Exness" },
  { label: "IC Markets", value: "IC Markets" },
  { label: "XM", value: "XM" },
  { label: "Pepperstone", value: "Pepperstone" },
  { label: "FBS", value: "FBS" },
  { label: "RoboForex", value: "RoboForex" },
  { label: "Vantage", value: "Vantage" },
  { label: "FxPro", value: "FxPro" },
  { label: "Deriv", value: "Deriv" },
  { label: "Other", value: "Other" },
];

/** Password lives only in this form's local state and is cleared on submit. */
export function ConnectMt5Dialog({ role, robot, triggerLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [broker, setBroker] = useState<string>(() => localStorage.getItem("botvio_mt5_broker") || "");
  const [serverChoice, setServerChoice] = useState(() => localStorage.getItem("botvio_mt5_server") || "");
  const [brokerSearch, setBrokerSearch] = useState("");
  const [label, setLabel] = useState("");
  const act = useTradeCopyAction();

  const server = serverChoice.trim();

  const resetForm = () => {
    setLogin("");
    setPassword("");
    setBroker("");
    setServerChoice("");
    setLabel("");
  };

  useEffect(() => {
    if (broker) localStorage.setItem("botvio_mt5_broker", broker);
    if (serverChoice) localStorage.setItem("botvio_mt5_server", serverChoice);
  }, [broker, serverChoice]);

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
            <Input
              id="tc-broker"
              list="botvio-mt5-brokers"
              placeholder="e.g. HFM, Exness, Weltrade"
              required
              value={broker}
              onChange={(e) => setBroker(e.target.value)}
            />
            <datalist id="botvio-mt5-brokers">
              {BROKER_SUGGESTIONS.map((item) => <option key={item.value} value={item.value} />)}
            </datalist>
            <p className="text-xs text-muted-foreground">TradeCopy states that it supports thousands of broker servers. Enter the broker exactly as shown in your MT5 account.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tc-server">MT5 server</Label>
            <Input
              id="tc-server"
              placeholder="e.g. BrokerName-Live01"
              required
              value={serverChoice}
              onChange={(e) => setServerChoice(e.target.value)}
            />
            <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>Enter the exact MT5 server shown in your terminal. We do not guess server names.</span>
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
