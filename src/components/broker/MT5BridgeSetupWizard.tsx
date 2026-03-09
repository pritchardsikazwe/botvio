import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Download, Copy, CheckCircle2, Circle, Loader2,
  Monitor, Wifi, WifiOff, RefreshCw, ArrowRight,
  ExternalLink, AlertTriangle, Zap
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface WizardStep {
  id: number;
  title: string;
  description: string;
  status: "pending" | "active" | "completed" | "error";
}

const MT5BridgeSetupWizard = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [eaDownloaded, setEaDownloaded] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<"idle" | "success" | "fail">("idle");
  const [autoDetecting, setAutoDetecting] = useState(false);

  const terminalUid = `BOTVIO_${user?.id?.slice(0, 8).toUpperCase()}`;

  const steps: WizardStep[] = [
    { id: 0, title: "Download EA", description: "Get the BOTVIO Bridge EA file", status: currentStep > 0 ? "completed" : currentStep === 0 ? "active" : "pending" },
    { id: 1, title: "Install EA", description: "Copy to MT5 Experts folder", status: currentStep > 1 ? "completed" : currentStep === 1 ? "active" : "pending" },
    { id: 2, title: "Configure EA", description: "Enter your Terminal UID", status: currentStep > 2 ? "completed" : currentStep === 2 ? "active" : "pending" },
    { id: 3, title: "Verify Connection", description: "Test the bridge link", status: currentStep > 3 ? "completed" : currentStep === 3 ? "active" : "pending" },
  ];

  // Fetch connected MT5 accounts
  const { data: mt5Accounts, refetch: refetchMt5 } = useQuery({
    queryKey: ["mt5-bridge-accounts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("trading_accounts")
        .select("*")
        .eq("user_id", user.id)
        .eq("broker", "mt5")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: autoDetecting ? 5000 : false,
  });

  // Auto-detect: when a new account appears while detecting
  useEffect(() => {
    if (autoDetecting && mt5Accounts && mt5Accounts.length > 0) {
      const latestAccount = mt5Accounts[0];
      if (latestAccount.connection_status === "connected") {
        setAutoDetecting(false);
        setTestResult("success");
        setCurrentStep(4);
        toast.success("🎉 MT5 Terminal connected successfully!", {
          description: `${latestAccount.label} is now online`,
        });
      }
    }
  }, [mt5Accounts, autoDetecting]);

  const copyTerminalUid = () => {
    navigator.clipboard.writeText(terminalUid);
    toast.success("Terminal UID copied to clipboard!");
  };

  const handleDownload = () => {
    setEaDownloaded(true);
    toast.success("EA download started!");
    setTimeout(() => setCurrentStep(1), 500);
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult("idle");

    try {
      // Check if any MT5 account with this terminal UID exists and is connected
      const { data, error } = await supabase
        .from("trading_accounts")
        .select("id, connection_status, label, updated_at")
        .eq("user_id", user?.id)
        .eq("broker", "mt5")
        .order("updated_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0 && data[0].connection_status === "connected") {
        // Check if heartbeat is recent (within last 5 minutes)
        const lastUpdate = new Date(data[0].updated_at);
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        if (lastUpdate > fiveMinAgo) {
          setTestResult("success");
          setCurrentStep(4);
          toast.success("Connection verified! EA is online.");
        } else {
          setTestResult("fail");
          toast.error("EA was connected but appears offline. Restart the EA.");
        }
      } else {
        setTestResult("fail");
        toast.error("No active MT5 connection found. Make sure the EA is running.");
      }
    } catch (err: any) {
      console.error("Test connection error:", err);
      setTestResult("fail");
      toast.error("Connection test failed: " + err.message);
    } finally {
      setIsTesting(false);
    }
  };

  const startAutoDetect = () => {
    setAutoDetecting(true);
    toast.info("Listening for EA connection...", {
      description: "Start the EA on your MT5 terminal now",
    });
    // Auto-stop after 2 minutes
    setTimeout(() => {
      setAutoDetecting((prev) => {
        if (prev) {
          toast.error("Auto-detect timed out. Please try the manual test.");
          return false;
        }
        return prev;
      });
    }, 120000);
  };

  const progressPercent = (currentStep / 4) * 100;

  const connectedCount = mt5Accounts?.filter(
    (a: any) => a.connection_status === "connected"
  ).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card className="glass-card border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Monitor className="h-5 w-5 text-primary" />
                MT5 Bridge Setup
              </CardTitle>
              <CardDescription>
                Connect your MetaTrader 5 terminal in 4 easy steps
              </CardDescription>
            </div>
            {connectedCount > 0 && (
              <Badge variant="default" className="bg-green-600">
                <Wifi className="h-3 w-3 mr-1" />
                {connectedCount} Online
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercent} className="h-2" />
          <div className="flex justify-between mt-3">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-1.5 text-xs">
                {step.status === "completed" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : step.status === "active" ? (
                  <Circle className="h-4 w-4 text-primary fill-primary" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={step.status === "active" ? "text-primary font-medium" : "text-muted-foreground"}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Download */}
      {currentStep === 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Step 1: Download the BOTVIO EA</CardTitle>
            <CardDescription>
              Download the Expert Advisor file to install on your MetaTrader 5
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription className="text-sm">
                The BOTVIO Bridge EA connects your MT5 terminal to the platform for
                copy trading, signal execution, and portfolio monitoring.
              </AlertDescription>
            </Alert>
            <Button onClick={handleDownload} asChild className="w-full">
              <a href="/BOTVIO_BridgeEA.mq5" download>
                <Download className="mr-2 h-4 w-4" />
                Download BOTVIO_BridgeEA.mq5
              </a>
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              You'll need to compile this in MetaEditor or use the pre-compiled .ex5 version
            </p>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Install */}
      {currentStep === 1 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Step 2: Install the EA</CardTitle>
            <CardDescription>
              Copy the EA file to your MT5 terminal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3 items-start">
                <Badge variant="outline" className="shrink-0 mt-0.5">1</Badge>
                <span>Open MetaTrader 5 and go to <strong>File → Open Data Folder</strong></span>
              </li>
              <li className="flex gap-3 items-start">
                <Badge variant="outline" className="shrink-0 mt-0.5">2</Badge>
                <span>Navigate to <code className="bg-muted px-1 rounded">MQL5 → Experts</code></span>
              </li>
              <li className="flex gap-3 items-start">
                <Badge variant="outline" className="shrink-0 mt-0.5">3</Badge>
                <span>Paste the downloaded <strong>BOTVIO_BridgeEA</strong> file there</span>
              </li>
              <li className="flex gap-3 items-start">
                <Badge variant="outline" className="shrink-0 mt-0.5">4</Badge>
                <span>Restart MetaTrader 5 (or right-click Navigator → Refresh)</span>
              </li>
              <li className="flex gap-3 items-start">
                <Badge variant="outline" className="shrink-0 mt-0.5">5</Badge>
                <span>Go to <strong>Tools → Options → Expert Advisors</strong> and enable:</span>
              </li>
            </ol>
            <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-xs">
              <p>✅ Allow algorithmic trading</p>
              <p>✅ Allow WebRequest for listed URL</p>
              <p className="pl-4 text-muted-foreground">
                Add: <code>https://tqqkzeblmjapgbnsbtgw.supabase.co</code>
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCurrentStep(0)} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setCurrentStep(2)} className="flex-1">
                I've installed it <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Configure */}
      {currentStep === 2 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Step 3: Configure the EA</CardTitle>
            <CardDescription>
              Attach the EA to any chart and enter your credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Your Terminal UID</Label>
              <div className="flex gap-2">
                <Input
                  value={terminalUid}
                  readOnly
                  className="font-mono text-sm bg-muted/30"
                />
                <Button variant="outline" size="icon" onClick={copyTerminalUid}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Paste this into the EA's "Terminal UID" input field
              </p>
            </div>

            <Alert className="border-amber-500/30 bg-amber-500/5">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-xs">
                Drag the EA from Navigator onto any chart. In the EA settings dialog, 
                paste your Terminal UID and make sure "Allow Auto Trading" is checked.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setCurrentStep(3)} className="flex-1">
                EA is running <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Verify */}
      {currentStep === 3 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Step 4: Verify Connection</CardTitle>
            <CardDescription>
              Check if your MT5 terminal is communicating with the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Manual Test */}
              <Button
                onClick={testConnection}
                disabled={isTesting}
                variant={testResult === "success" ? "default" : "outline"}
                className="h-auto py-4 flex flex-col gap-2"
              >
                {isTesting ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : testResult === "success" ? (
                  <CheckCircle2 className="h-6 w-6 text-green-400" />
                ) : testResult === "fail" ? (
                  <WifiOff className="h-6 w-6 text-red-400" />
                ) : (
                  <RefreshCw className="h-6 w-6" />
                )}
                <span className="text-xs">
                  {isTesting ? "Testing..." : testResult === "success" ? "Connected!" : "Test Now"}
                </span>
              </Button>

              {/* Auto-Detect */}
              <Button
                onClick={startAutoDetect}
                disabled={autoDetecting}
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2"
              >
                {autoDetecting ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                  <Zap className="h-6 w-6" />
                )}
                <span className="text-xs">
                  {autoDetecting ? "Listening..." : "Auto-Detect"}
                </span>
              </Button>
            </div>

            {autoDetecting && (
              <Alert className="border-primary/30 bg-primary/5">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <AlertDescription className="text-xs">
                  Waiting for your EA to send its first heartbeat... 
                  Start the EA on MT5 now. This will auto-detect within seconds.
                </AlertDescription>
              </Alert>
            )}

            {testResult === "fail" && (
              <Alert variant="destructive">
                <AlertDescription className="text-xs space-y-1">
                  <p><strong>Connection not found.</strong> Check these:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li>EA is attached to a chart and Auto Trading is ON</li>
                    <li>Terminal UID matches exactly</li>
                    <li>WebRequest URL is added to allowed list</li>
                    <li>Internet connection is active on MT5 machine</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <Button variant="outline" onClick={() => setCurrentStep(2)} className="w-full">
              Back to Configuration
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Success State */}
      {currentStep === 4 && (
        <Card className="glass-card border-green-500/30">
          <CardContent className="py-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Bridge Connected!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your MT5 terminal is now linked to the platform
              </p>
            </div>
            <Button variant="outline" onClick={() => { setCurrentStep(0); setTestResult("idle"); }}>
              Connect Another Terminal
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Connected Terminals List */}
      {mt5Accounts && mt5Accounts.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Connected Terminals</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => refetchMt5()}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mt5Accounts.map((acc: any) => {
                const isOnline = acc.connection_status === "connected";
                const lastSeen = new Date(acc.updated_at);
                const minutesAgo = Math.floor((Date.now() - lastSeen.getTime()) / 60000);

                return (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`} />
                      <div>
                        <p className="font-medium text-sm">{acc.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {acc.login_id} • Last seen {minutesAgo < 1 ? "just now" : `${minutesAgo}m ago`}
                        </p>
                      </div>
                    </div>
                    <Badge variant={isOnline ? "default" : "secondary"} className={isOnline ? "bg-green-600" : ""}>
                      {isOnline ? (
                        <><Wifi className="h-3 w-3 mr-1" /> Online</>
                      ) : (
                        <><WifiOff className="h-3 w-3 mr-1" /> Offline</>
                      )}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MT5BridgeSetupWizard;
