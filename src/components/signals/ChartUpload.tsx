import { useState, useRef, useCallback } from "react";

import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Upload, 
  Image as ImageIcon, 
  Sparkles, 
  Crown,
  Loader2,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Target,
  Shield,
  BarChart3,
  History,
  Clock,
  Info,
  Lock,
  Zap,
  Lightbulb,
  Star,
  Infinity
} from "lucide-react";
import { SocialShareButtons } from "@/components/social/SocialShareButtons";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { AuthModal } from "@/components/auth/AuthModal";
import { useChartUsageGate, getGuestUploadCount, incrementGuestUploadCount, GUEST_DAILY_LIMIT, isDeviceLockedToOtherEmail, lockDeviceToEmail } from "@/hooks/useChartAnalysis";

const CHART_BROKERS = [
  { value: "exness", label: "Exness" },
  { value: "deriv", label: "Deriv" },
  { value: "weltrade", label: "Weltrade" },
  { value: "pocket-option", label: "Pocket Option" },
  
  { value: "iq-option", label: "IQ Option" },
];

const ANALYSIS_TYPES = [
  { value: "full", label: "Full Analysis", description: "Complete technical breakdown" },
  { value: "quick", label: "Quick Scan", description: "Key levels & direction" },
  { value: "entry", label: "Entry Points", description: "Optimal entry & exit" },
  { value: "support_resistance", label: "S/R Levels", description: "Support & Resistance" },
];

interface ChartUploadProps {
  isPremium?: boolean;
}

export const ChartUpload = ({ isPremium = false }: ChartUploadProps) => {
  const navigate = useNavigate();
  const { user, isAdmin, isSuperAdmin, isSignalManager } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [symbol, setSymbol] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [analysisType, setAnalysisType] = useState("full");
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [structuredResult, setStructuredResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("upload");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedBrokers, setSelectedBrokers] = useState<string[]>(["exness", "deriv", "weltrade"]);

  const usageGate = useChartUsageGate();

  // Fetch analysis history
  const { data: analysisHistory } = useQuery({
    queryKey: ["chart-history", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("chart_analyses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setAnalysisResult(null);
    setStructuredResult(null);
  };

  const autoPostSignal = useCallback(async (
    structured: any, sym: string, tf: string, chartImageUrl: string, brokers: string[],
  ) => {
    if (!user) return;
    try {
      const direction = structured.recommendation === "SELL" ? "SELL" : "BUY";
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const instrumentName = structured.instrument || sym || "Unknown";
      const parts: string[] = [`AI Signal: ${direction} ${instrumentName}`];
      if (structured.entry_price) parts.push(`Entry: ${structured.entry_price}`);
      if (structured.take_profit) parts.push(`TP1: ${structured.take_profit}`);
      if (structured.take_profit_2) parts.push(`TP2: ${structured.take_profit_2}`);
      if (structured.take_profit_3) parts.push(`TP3: ${structured.take_profit_3}`);
      if (structured.stop_loss) parts.push(`SL: ${structured.stop_loss}`);
      const { error } = await supabase.from("trading_signals").insert({
        symbol: instrumentName, direction,
        entry_price: structured.entry_price ? parseFloat(structured.entry_price) : 0,
        stop_loss: structured.stop_loss ? parseFloat(structured.stop_loss) : null,
        take_profit: structured.take_profit ? parseFloat(structured.take_profit) : null,
        timeframe: tf || structured.timeframe || "M5",
        category: "forex",
        broker: brokers.length > 0 ? brokers : null,
        confidence: structured.confidence ? parseInt(structured.confidence) : null,
        reason: parts.join(" | "),
        is_manual: true, posted_by: user.id, status: "ACTIVE",
        strategy_name: "AI Chart Analysis", expires_at: expiresAt,
      });
      if (error) {
        toast.error("Analysis complete but failed to auto-post signal");
      } else {
        toast.success(`Signal for ${instrumentName} auto-posted to ${brokers.join(", ")}!`);
      }
    } catch (err: any) {
      console.error("Auto-post signal exception:", err);
    }
  }, [user]);

  const checkLimits = (): boolean => {
    // Guests / visitors
    if (!user) {
      const guestCount = getGuestUploadCount();
      if (guestCount >= GUEST_DAILY_LIMIT) {
        setShowAuthModal(true);
        toast.error(`Daily limit of ${GUEST_DAILY_LIMIT} free analysis reached. Sign up to continue!`);
        return false;
      }
      return true;
    }
    // Enforce one email per device
    if (user.email && isDeviceLockedToOtherEmail(user.email)) {
      toast.error("This device is already linked to another account. One account per device allowed.");
      return false;
    }
    // Lock device to this email on first use
    if (user.email) lockDeviceToEmail(user.email);
    // Admins bypass
    if (isAdmin || isSuperAdmin || isSignalManager) return true;
    // Plan-based limits
    if (usageGate.limitReached) {
      setShowUpgradeModal(true);
      return false;
    }
    return true;
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error("Please select a chart image");
      return;
    }
    if (!checkLimits()) return;

    try {
      setIsUploading(true);
      const userId = user?.id || "guest";
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("charts").upload(fileName, selectedFile);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("charts").getPublicUrl(uploadData.path);
      const imageUrl = urlData.publicUrl;

      setIsUploading(false);
      setIsAnalyzing(true);

      const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
        "analyze-chart", { body: { imageUrl, symbol, timeframe, analysisType } }
      );
      if (analysisError) throw analysisError;

      if (analysisData.error) {
        if (analysisData.error_code === "daily_limit" || analysisData.redirect) {
          setShowUpgradeModal(true);
          return;
        }
        toast.error(analysisData.error);
        return;
      }

      setAnalysisResult(analysisData.analysis);
      setStructuredResult(analysisData.structured);
      toast.success("Chart analyzed successfully!");

      if (!user) {
        incrementGuestUploadCount();
        const remaining = GUEST_DAILY_LIMIT - getGuestUploadCount();
        if (remaining > 0) toast.info(`${remaining} free analyses remaining today`);
      }

      if ((isAdmin || isSuperAdmin || isSignalManager) && analysisData.structured) {
        await autoPostSignal(analysisData.structured, symbol, timeframe, imageUrl, selectedBrokers);
      }
    } catch (error: any) {
      const msg = error?.message || "";
      if (msg.includes("daily limit") || msg.includes("Daily limit") || msg.includes("403")) {
        setShowUpgradeModal(true);
        return;
      }
      toast.error(msg || "Failed to analyze chart");
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setSymbol("");
    setTimeframe("");
    setAnalysisType("full");
    setAnalysisResult(null);
    setStructuredResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const viewHistoricalAnalysis = (analysis: any) => {
    setAnalysisResult(analysis.ai_response);
    setStructuredResult(analysis.analysis_result);
    setPreviewUrl(analysis.image_url);
    setSymbol(analysis.symbol || "");
    setTimeframe(analysis.timeframe || "");
    setActiveTab("upload");
  };

  // Usage display helpers
  const usagePercent = usageGate.isUnlimited
    ? 0
    : usageGate.maxUploads > 0
    ? Math.min(100, (usageGate.usageCount / usageGate.maxUploads) * 100)
    : 0;

  const guestCount = !user ? getGuestUploadCount() : 0;
  const guestPercent = !user ? (guestCount / GUEST_DAILY_LIMIT) * 100 : 0;

  const UPGRADE_PLANS = [
    { code: "basic", name: "Basic", icon: Zap, uploads: "50 charts / 7 days", color: "text-blue-400", price: "$10/mo" },
    { code: "standard", name: "Standard", icon: Star, uploads: "100 charts / month", color: "text-purple-400", price: "$49/3mo" },
    { code: "vip", name: "VIP", icon: Crown, uploads: "Unlimited charts", color: "text-amber-400", price: "$99/lifetime" },
  ];

  return (
    <>
      <Card className="glass-card border-primary/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-warning/20 border border-primary/30">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  AI Chart Analysis
                  {isPremium && (
                    <Badge className="bg-gradient-to-r from-warning to-amber-500 text-white">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Upload your chart and get AI-powered trading insights
                </CardDescription>
              </div>
            </div>
            {(isAdmin || isSuperAdmin || isSignalManager) ? (
              <Badge variant="outline" className="text-xs text-primary border-primary/30">
                Auto-posts signals
              </Badge>
            ) : usageGate.isUnlimited ? (
              <Badge variant="outline" className="text-xs text-amber-400 border-amber-400/30">
                <Infinity className="h-3 w-3 mr-1" /> Unlimited
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                {user ? `${usageGate.remaining}/${usageGate.maxUploads} left` : `${GUEST_DAILY_LIMIT - guestCount}/${GUEST_DAILY_LIMIT} free`}
              </Badge>
            )}
          </div>

          {/* Usage Progress Bar */}
          {!isAdmin && !isSuperAdmin && !isSignalManager && (
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {user
                    ? `${usageGate.planName} Plan — ${usageGate.isUnlimited ? "Unlimited" : `${usageGate.usageCount}/${usageGate.maxUploads} uploads used`}`
                    : `Guest — ${guestCount}/${GUEST_DAILY_LIMIT} daily uploads used`
                  }
                </span>
                <span>{user ? usageGate.periodLabel : "per day"}</span>
              </div>
              {!usageGate.isUnlimited && (
                <Progress
                  value={user ? usagePercent : guestPercent}
                  className="h-2"
                />
              )}
              {(user ? usageGate.limitReached : guestCount >= GUEST_DAILY_LIMIT) && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <Lock className="h-3 w-3" />
                  Upload limit reached — {user ? "upgrade your plan" : "sign up"} for more
                </p>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" /> New Analysis
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" /> History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4 mt-4">
              {/* Analysis Type Selection */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {ANALYSIS_TYPES.map((type) => (
                  <Button
                    key={type.value}
                    variant={analysisType === type.value ? "default" : "outline"}
                    size="sm"
                    className="h-auto py-2 flex flex-col items-start"
                    onClick={() => setAnalysisType(type.value)}
                  >
                    <span className="font-medium">{type.label}</span>
                    <span className="text-xs text-muted-foreground">{type.description}</span>
                  </Button>
                ))}
              </div>

              {/* Broker Selection — Admin/Signal Manager only */}
              {(isAdmin || isSuperAdmin || isSignalManager) && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Post signal to brokers
                  </Label>
                  <div className="flex flex-wrap gap-3">
                    {CHART_BROKERS.map(b => (
                      <div key={b.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`chart-broker-${b.value}`}
                          checked={selectedBrokers.includes(b.value)}
                          onCheckedChange={() =>
                            setSelectedBrokers(prev =>
                              prev.includes(b.value)
                                ? prev.filter(x => x !== b.value)
                                : [...prev, b.value]
                            )
                          }
                        />
                        <label htmlFor={`chart-broker-${b.value}`} className="text-sm leading-none cursor-pointer">
                          {b.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Area */}
              <div
                onClick={() => {
                  if ((user ? usageGate.limitReached : guestCount >= GUEST_DAILY_LIMIT) && !isAdmin && !isSuperAdmin && !isSignalManager) {
                    if (!user) setShowAuthModal(true);
                    else setShowUpgradeModal(true);
                    return;
                  }
                  fileInputRef.current?.click();
                }}
                className={`
                  border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                  transition-all duration-200 hover:border-primary/50 hover:bg-primary/5
                  ${(user ? usageGate.limitReached : guestCount >= GUEST_DAILY_LIMIT) && !isAdmin && !isSuperAdmin ? "opacity-60" : ""}
                  ${previewUrl ? "border-primary/50" : "border-muted-foreground/30"}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {previewUrl ? (
                  <div className="space-y-3">
                    <img src={previewUrl} alt="Chart preview" className="max-h-64 mx-auto rounded-lg shadow-lg" />
                    <p className="text-sm text-muted-foreground">Click to change image</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                      {(user ? usageGate.limitReached : guestCount >= GUEST_DAILY_LIMIT) && !isAdmin && !isSuperAdmin ? (
                        <Lock className="h-8 w-8 text-destructive" />
                      ) : (
                        <Upload className="h-8 w-8 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {(user ? usageGate.limitReached : guestCount >= GUEST_DAILY_LIMIT) && !isAdmin && !isSuperAdmin
                          ? "Upload limit reached"
                          : "Drop your chart image here"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(user ? usageGate.limitReached : guestCount >= GUEST_DAILY_LIMIT) && !isAdmin && !isSuperAdmin
                          ? user ? "Upgrade to continue analyzing charts" : "Sign up for more free analyses"
                          : "or click to browse (max 5MB)"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* BOTVIO AI Signal Guidelines */}
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                <h4 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                  ⚠️ BOTVIO AI – SIGNAL GUIDELINES
                </h4>

                <div className="flex items-start gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-2.5">
                  <Info className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-foreground leading-relaxed">
                    <span className="font-bold text-yellow-400">📌 Chart Setup:</span> Make sure the instrument symbol is clearly visible on your chart before uploading or sharing any signal.
                  </p>
                </div>

                <div className="flex items-start gap-2 rounded-lg bg-blue-500/10 border border-blue-500/30 p-2.5">
                  <BarChart3 className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                  <div className="text-xs text-foreground leading-relaxed">
                    <span className="font-bold text-blue-400">📊 Timeframe Strategy:</span>
                    <ul className="mt-1 ml-1 space-y-0.5 text-muted-foreground">
                      <li>✅ Use <span className="font-semibold text-foreground">H4</span> to identify overall trend & key levels</li>
                      <li>✅ Switch to <span className="font-semibold text-foreground">M15 / M5</span> to refine entries & exits</li>
                    </ul>
                    <p className="mt-1 text-[10px] text-primary italic">👉 Higher accuracy and better timing guaranteed.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-lg bg-warning/10 border border-warning/30 p-2.5">
                  <Shield className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                  <div className="text-xs text-foreground leading-relaxed">
                    <span className="font-bold text-warning">⚖️ Risk Management:</span>
                    <ul className="mt-1 ml-1 space-y-0.5 text-muted-foreground">
                      <li>⚠️ Some signals may have wide SL & TP levels</li>
                      <li>📉 Adjust lot size accordingly for small accounts</li>
                      <li>🛡️ Maintain proper risk: <span className="font-semibold text-foreground">1–3% per trade</span></li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-lg bg-primary/10 border border-primary/30 p-2.5">
                  <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-foreground leading-relaxed italic">
                    <span className="font-bold text-primary not-italic">💡 Pro Tip:</span> "Higher timeframe gives direction, lower timeframe gives precision."
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleAnalyze}
                  disabled={!selectedFile || isUploading || isAnalyzing}
                  className="flex-1 text-base font-semibold bg-black text-white hover:bg-black/90 border-none"
                  variant="outline"
                >
                  {isUploading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</>
                  ) : isAnalyzing ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing with AI...</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" />Analyze Chart</>
                  )}
                </Button>
                {selectedFile && (
                  <Button variant="outline" onClick={resetForm}>Clear</Button>
                )}
              </div>

              {/* Analysis Result */}
              {analysisResult && (
                <div className="space-y-4 pt-4 border-t border-border/50">
                  {structuredResult && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className={`p-3 rounded-lg border text-center ${
                        structuredResult.trend === "BULLISH" ? "bg-success/10 border-success/30 text-success" 
                        : structuredResult.trend === "BEARISH" ? "bg-destructive/10 border-destructive/30 text-destructive"
                        : "bg-muted/30 border-muted"
                      }`}>
                        {structuredResult.trend === "BULLISH" ? <TrendingUp className="h-5 w-5 mx-auto mb-1" />
                          : structuredResult.trend === "BEARISH" ? <TrendingDown className="h-5 w-5 mx-auto mb-1" />
                          : <AlertCircle className="h-5 w-5 mx-auto mb-1" />}
                        <p className="text-xs font-medium">{structuredResult.trend || "Analyzing..."}</p>
                      </div>
                      <div className={`p-3 rounded-lg border text-center ${
                        structuredResult.recommendation === "BUY" ? "bg-success/10 border-success/30 text-success"
                        : structuredResult.recommendation === "SELL" ? "bg-destructive/10 border-destructive/30 text-destructive"
                        : "bg-warning/10 border-warning/30 text-warning"
                      }`}>
                        <Target className="h-5 w-5 mx-auto mb-1" />
                        <p className="text-xs font-medium">{structuredResult.recommendation || "HOLD"}</p>
                      </div>
                      <div className="p-3 rounded-lg border bg-primary/10 border-primary/30 text-center">
                        <Shield className="h-5 w-5 mx-auto mb-1 text-primary" />
                        <p className="text-xs font-medium text-primary">{structuredResult.risk_level || "Medium"} Risk</p>
                      </div>
                      <div className="p-3 rounded-lg border bg-secondary text-center">
                        <BarChart3 className="h-5 w-5 mx-auto mb-1" />
                        <p className="text-xs font-medium">{structuredResult.confidence || "75"}% Confidence</p>
                      </div>
                    </div>
                  )}

                  {structuredResult?.entry_price && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                        <p className="text-xs text-muted-foreground">Entry</p>
                        <p className="font-mono font-bold text-primary">{structuredResult.entry_price}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                        <p className="text-xs text-muted-foreground">Take Profit</p>
                        <p className="font-mono font-bold text-success">{structuredResult.take_profit || "TBD"}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                        <p className="text-xs text-muted-foreground">Stop Loss</p>
                        <p className="font-mono font-bold text-destructive">{structuredResult.stop_loss || "TBD"}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" /> AI Analysis Report
                      </Label>
                      <SocialShareButtons 
                        title={`Chart Analysis - ${structuredResult?.trend?.toUpperCase() || "TRADING"} Signal`}
                        description={`**Instrument**: ${symbol || "Chart"}\n${structuredResult?.recommendation ? `${structuredResult.recommendation.toUpperCase()} signal with ${structuredResult.confidence || 75}% confidence` : analysisResult?.slice(0, 150) || ""}`}
                        imageUrl={previewUrl || undefined}
                      />
                    </div>
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50 max-h-80 overflow-y-auto">
                      <div className="prose prose-sm prose-invert max-w-none">
                        <pre className="whitespace-pre-wrap text-sm font-sans text-foreground/90">{analysisResult}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              {analysisHistory && analysisHistory.length > 0 ? (
                <div className="space-y-3">
                  {analysisHistory.map((analysis: any) => (
                    <div
                      key={analysis.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => viewHistoricalAnalysis(analysis)}
                    >
                      {analysis.image_url && (
                        <img src={analysis.image_url} alt="Chart" className="w-16 h-12 object-cover rounded" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{analysis.symbol || "Chart Analysis"}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(analysis.created_at).toLocaleDateString()}
                          {analysis.timeframe && <span>• {analysis.timeframe}</span>}
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0">View</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No analysis history yet</p>
                  <p className="text-sm">Upload your first chart to get started</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>

        <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      </Card>

      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Lock className="h-5 w-5 text-destructive" />
              Chart Analysis Limit Reached
            </DialogTitle>
            <DialogDescription>
              You've used all {usageGate.maxUploads} chart uploads for this period ({usageGate.periodLabel}). 
              Upgrade your plan to unlock more AI analyses.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {UPGRADE_PLANS.map((plan) => (
              <div
                key={plan.code}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:border-primary/50 hover:bg-primary/5 ${
                  plan.code === "vip" ? "border-amber-500/40 bg-amber-500/5" : "border-border"
                }`}
              >
                <div className={`p-2 rounded-lg bg-muted/50 ${plan.color}`}>
                  <plan.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold">{plan.name}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    {plan.code === "vip" ? <Infinity className="h-3 w-3" /> : <BarChart3 className="h-3 w-3" />}
                    {plan.uploads}
                  </p>
                </div>
                <span className="text-sm font-semibold text-primary">{plan.price}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowUpgradeModal(false)} className="flex-1">
              Maybe Later
            </Button>
            <Button
              variant="gold"
              className="flex-1"
              onClick={() => { setShowUpgradeModal(false); navigate("/billing"); }}
            >
              <Crown className="h-4 w-4 mr-2" /> Upgrade Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
