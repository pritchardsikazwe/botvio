import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

const ACCOUNT_RE = /^[A-Z]{2,5}\d{3,12}$/;

export default function DerivOtpTester() {
  const [accountId, setAccountId] = useState("");
  const [environment, setEnvironment] = useState<"real" | "demo">("real");
  const [loading, setLoading] = useState(false);
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = accountId.trim().toUpperCase();
    if (!ACCOUNT_RE.test(id)) {
      toast.error("Invalid account ID format (e.g. CR1234567 or VRTC1234567)");
      return;
    }
    setLoading(true);
    setWsUrl(null);
    setErrorDetails(null);
    try {
      const { data, error } = await supabase.functions.invoke("deriv-admin-otp", {
        body: { account_id: id, environment },
      });
      if (error) {
        setErrorDetails(error.message || "Request failed");
        toast.error("OTP request failed");
      } else if (data?.ws_url) {
        setWsUrl(data.ws_url);
        toast.success("Fresh WS URL generated");
      } else {
        setErrorDetails(JSON.stringify(data, null, 2));
        toast.error("No WS URL returned");
      }
    } catch (err) {
      setErrorDetails(String(err));
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!wsUrl) return;
    await navigator.clipboard.writeText(wsUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="container max-w-2xl py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Deriv OTP Tester</CardTitle>
          <CardDescription>
            Request a fresh WebSocket URL from the server using your admin PAT. OTPs are short-lived — use immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="account_id">Account ID</Label>
              <Input
                id="account_id"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="CR1234567 or VRTC1234567"
                maxLength={20}
                autoComplete="off"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Environment</Label>
              <RadioGroup
                value={environment}
                onValueChange={(v) => setEnvironment(v as "real" | "demo")}
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="real" id="env-real" />
                  <Label htmlFor="env-real" className="font-normal cursor-pointer">Real</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="demo" id="env-demo" />
                  <Label htmlFor="env-demo" className="font-normal cursor-pointer">Demo</Label>
                </div>
              </RadioGroup>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Requesting..." : "Request Fresh WS URL"}
            </Button>
          </form>

          {wsUrl && (
            <div className="mt-6 space-y-2">
              <Label>WebSocket URL</Label>
              <div className="flex gap-2">
                <Input readOnly value={wsUrl} className="font-mono text-xs" />
                <Button type="button" variant="outline" size="icon" onClick={copy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Connect immediately — OTP expires within seconds.
              </p>
            </div>
          )}

          {errorDetails && (
            <div className="mt-6 space-y-2">
              <Label className="text-destructive">Error</Label>
              <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-64 whitespace-pre-wrap break-all">
                {errorDetails}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}