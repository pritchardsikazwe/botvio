import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link2, Loader2, ShieldCheck, Info, Search } from "lucide-react";
import { toast } from "sonner";
import { useTradeCopyAction } from "@/hooks/useTradeCopy";

interface Props { role: "master" | "slave"; robot?: boolean; triggerLabel: string }

type ServerOption = {
  broker: string;
  label: string;
  value: string;
};

/**
 * Popular MT5 server names. Broker accounts can be assigned to different
 * servers, so the form keeps a small "Other server" escape hatch instead of
 * forcing users to type a server for every connection.
 */
const SERVER_OPTIONS: ServerOption[] = [
  // HFM
  { broker: "HFM", label: "HFM — Global Live 1", value: "HFMarketsGlobal-Live1" },
  { broker: "HFM", label: "HFM — Global Demo", value: "HFMarketsGlobal-Demo" },
  { broker: "HFM", label: "HFM — Global Live 3", value: "HFMarketsGlobal-Live3" },
  { broker: "HFM", label: "HFM — Global Demo 3", value: "HFMarketsGlobal-Demo3" },
  { broker: "HFM", label: "HFM — Global Live 4", value: "HFMarketsGlobal-Live4" },
  { broker: "HFM", label: "HFM — Global Demo 4", value: "HFMarketsGlobal-Demo4" },
  { broker: "HFM", label: "HFM — Global Live 5", value: "HFMarketsGlobal-Live5" },
  { broker: "HFM", label: "HFM — Global Live 7", value: "HFMarketsGlobal-Live7" },
  { broker: "HFM", label: "HFM — Global Live 8", value: "HFMarketsGlobal-Live8" },
  { broker: "HFM", label: "HFM — Global Live 9", value: "HFMarketsGlobal-Live9" },
  // Weltrade
  { broker: "Weltrade", label: "Weltrade — Live", value: "Weltrade-Live" },
  { broker: "Weltrade", label: "Weltrade — Demo", value: "Weltrade-Demo" },
  // Exness
  { broker: "Exness", label: "Exness — Real 1", value: "Exness-MT5Real" },
  { broker: "Exness", label: "Exness — Real 2", value: "Exness-MT5Real2" },
  { broker: "Exness", label: "Exness — Real 3", value: "Exness-MT5Real3" },
  { broker: "Exness", label: "Exness — Trial", value: "Exness-MT5Trial" },
  { broker: "Exness", label: "Exness — Trial 2", value: "Exness-MT5Trial2" },
  // IC Markets
  { broker: "IC Markets", label: "IC Markets — Live 01", value: "ICMarketsSC-MT5" },
  { broker: "IC Markets", label: "IC Markets — Live 02", value: "ICMarketsSC-MT5-2" },
  { broker: "IC Markets", label: "IC Markets — Live 04", value: "ICMarketsSC-MT5-4" },
  { broker: "IC Markets", label: "IC Markets — Demo", value: "ICMarketsSC-Demo" },
  // XM
  { broker: "XM", label: "XM — MT5 Live 1", value: "XMGlobal-MT5" },
  { broker: "XM", label: "XM — MT5 Live 2", value: "XMGlobal-MT5 2" },
  { broker: "XM", label: "XM — MT5 Demo", value: "XMGlobal-MT5 Demo" },
  // Pepperstone
  { broker: "Pepperstone", label: "Pepperstone — Live", value: "Pepperstone-MT5-Live01" },
  { broker: "Pepperstone", label: "Pepperstone — Live 02", value: "Pepperstone-MT5-Live02" },
  { broker: "Pepperstone", label: "Pepperstone — Demo", value: "Pepperstone-Demo" },
  // FBS
  { broker: "FBS", label: "FBS — Real", value: "FBS-Real" },
  { broker: "FBS", label: "FBS — Demo", value: "FBS-Demo" },
  // RoboForex
  { broker: "RoboForex", label: "RoboForex — Pro", value: "RoboForex-Pro" },
  { broker: "RoboForex", label: "RoboForex — ECN", value: "RoboForex-ECN" },
  { broker: "RoboForex", label: "RoboForex — Demo", value: "RoboForex-Demo" },
  // Vantage
  { broker: "Vantage", label: "Vantage — Live", value: "VantageInternational-Live" },
  { broker: "Vantage", label: "Vantage — Demo", value: "VantageInternational-Demo" },
  // FxPro
  { broker: "FxPro", label: "FxPro — MT5 Live", value: "FxPro.com-MT5" },
  { broker: "FxPro", label: "FxPro — MT5 Demo", value: "FxPro.com-MT5 Demo" },
  // Deriv
  { broker: "Deriv", label: "Deriv — Standard", value: "Deriv-Server" },
  { broker: "Deriv", label: "Deriv — Synthetic", value: "Deriv-Server-02" },
  { broker: "Deriv", label: "Deriv — Demo", value: "Deriv-Demo" },
  // OctaFX
  { broker: "OctaFX", label: "OctaFX — Real", value: "OctaFX-Real" },
  { broker: "OctaFX", label: "OctaFX — Demo", value: "OctaFX-Demo" },
];

const CUSTOM_SERVER = "__custom_server__";

const BROKERS = [...new Set(SERVER_OPTIONS.map((s) => s.broker)), "Other"] as string[];

/** Password lives only in this form's local state and is cleared on submit. */
export function ConnectMt5Dialog({ role, robot, triggerLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [broker, setBroker] = useState<string>(() => localStorage.getItem("botvio_mt5_broker") || "");
  const [serverChoice, setServerChoice] = useState(() => localStorage.getItem("botvio_mt5_server") || "");
  const [serverSearch, setServerSearch] = useState("");
  const [customServer, setCustomServer] = useState("");
  const [label, setLabel] = useState("");
  const act = useTradeCopyAction();

  const availableServers = useMemo(() => SERVER_OPTIONS.filter((x) => x.broker === broker && `${x.label} ${x.value}`.toLowerCase().includes(serverSearch.toLowerCase())), [broker, serverSearch]);

  const server = serverChoice === CUSTOM_SERVER ? customServer.trim() : serverChoice;

  const resetForm = () => {
    setLogin("");
    setPassword("");
    setBroker("");
    setServerChoice("");
    setCustomServer("");
    setLabel("");
  };

  useEffect(() => {
    if (broker) localStorage.setItem("botvio_mt5_broker", broker);
    if (serverChoice && serverChoice !== CUSTOM_SERVER) localStorage.setItem("botvio_mt5_server", serverChoice);
  }, [broker, serverChoice]);

  const handleBrokerChange = (value: string) => {
    setBroker(value);
    setServerChoice("");
    setCustomServer("");
    setServerSearch("");
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
            <Label>MT5 broker</Label>
            <Select value={broker} onValueChange={handleBrokerChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select your broker" />
              </SelectTrigger>
              <SelectContent>
                {BROKERS.map((name) => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {broker !== "Other" && (
            <div className="space-y-1.5">
              <Label>MT5 server</Label>
              <Select
                value={serverChoice}
                onValueChange={setServerChoice}
                disabled={!broker}
              >
                <SelectTrigger>
                  <SelectValue placeholder={broker ? "Select your MT5 server" : "Select broker first"} />
                </SelectTrigger>
                <SelectContent>
                  {availableServers.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                  <SelectItem value={CUSTOM_SERVER}>Other server…</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {broker === "Other" || serverChoice === CUSTOM_SERVER ? (
            <div className="space-y-1.5">
              <Label htmlFor="tc-custom-server">MT5 server name</Label>
              <Input
                id="tc-custom-server"
                placeholder="Select the exact server shown in MT5"
                required
                value={customServer}
                onChange={(e) => setCustomServer(e.target.value)}
              />
            </div>
          ) : null}

          {broker && broker !== "Other" && serverChoice && serverChoice !== CUSTOM_SERVER && (
            <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>Use the exact server assigned to this MT5 account. The server is selected for you; no typing is required.</span>
            </div>
          )}

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
