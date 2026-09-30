import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link2, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useTradeCopyAction } from "@/hooks/useTradeCopy";

interface Props { role: "master" | "slave"; robot?: boolean; triggerLabel: string }

/** Password lives only in this form's local state and is cleared on submit. */
export function ConnectMt5Dialog({ role, robot, triggerLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [server, setServer] = useState("");
  const [label, setLabel] = useState("");
  const act = useTradeCopyAction();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pw = password;
    setPassword("");
    try {
      await act.mutateAsync({
        action: role === "master" ? "connect_master" : "connect_follower",
        payload: { login, password: pw, server, label: label || undefined, botvio_robot: robot === true },
      });
      toast.success(role === "master" ? "Master account connected in DEMO mode (inactive)" : "Follower account saved in DEMO mode");
      setOpen(false); setLogin(""); setServer(""); setLabel("");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Link2 className="mr-2 h-4 w-4" />{triggerLabel}</Button></DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{triggerLabel}</DialogTitle>
          <DialogDescription>New connections start in DEMO mode and inactive. Nothing is copied until you start it.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5"><Label htmlFor="tc-login">MT5 login</Label><Input id="tc-login" inputMode="numeric" required value={login} onChange={(e) => setLogin(e.target.value.replace(/\D/g, ""))} /></div>
          <div className="space-y-1.5"><Label htmlFor="tc-pass">MT5 password</Label><Input id="tc-pass" type="password" autoComplete="off" required minLength={4} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="tc-server">Broker server</Label><Input id="tc-server" placeholder="e.g. Exness-MT5Trial" required value={server} onChange={(e) => setServer(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="tc-label">Nickname (optional)</Label><Input id="tc-label" value={label} onChange={(e) => setLabel(e.target.value)} /></div>
          <p className="flex items-start gap-2 rounded-lg bg-muted/40 p-2 text-xs text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Your password is encrypted on our server and is never shown again.</p>
          <DialogFooter><Button type="submit" disabled={act.isPending} className="w-full">{act.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Connect</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
