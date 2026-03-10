import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Info
} from "lucide-react";
import { SocialShareButtons } from "@/components/social/SocialShareButtons";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { AuthModal } from "@/components/auth/AuthModal";

const SYMBOLS = [
  { value: "EURUSD", label: "EUR/USD" },
  { value: "GBPUSD", label: "GBP/USD" },
  { value: "USDJPY", label: "USD/JPY" },
  { value: "XAUUSD", label: "Gold (XAU/USD)" },
  { value: "NAS100", label: "NASDAQ 100" },
  { value: "BTCUSD", label: "Bitcoin/USD" },
  { value: "Volatility_75_Index", label: "V75 Index" },
  { value: "R_100", label: "Volatility 100" },
  { value: "BOOM1000", label: "Boom 1000" },
  { value: "CRASH1000", label: "Crash 1000" },
];

const TIMEFRAMES = [
  { value: "M1", label: "1 Minute" },
  { value: "M5", label: "5 Minutes" },
  { value: "M15", label: "15 Minutes" },
  { value: "H1", label: "1 Hour" },
  { value: "H4", label: "4 Hours" },
  { value: "D1", label: "Daily" },
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

  // Fetch analysis history (only for logged in users)
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
    structured: any,
    sym: string,
    tf: string,
    chartImageUrl: string,
  ) => {
    if (!user) return;
    try {
      const direction = structured.recommendation === "SELL" ? "SELL" : "BUY";
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      // Use detected instrument name from AI, falling back to user-selected symbol
      const instrumentName = structured.instrument || sym || "Unknown";

      // Build a clean reason focusing on Entry/TP/SL
      const parts: string[] = [`AI Signal: ${direction} ${instrumentName}`];
      if (structured.entry_price) parts.push(`Entry: ${structured.entry_price}`);
      if (structured.take_profit) parts.push(`TP1: ${structured.take_profit}`);
      if (structured.take_profit_2) parts.push(`TP2: ${structured.take_profit_2}`);
      if (structured.take_profit_3) parts.push(`TP3: ${structured.take_profit_3}`);
      if (structured.stop_loss) parts.push(`SL: ${structured.stop_loss}`);

      const { error } = await supabase
        .from("trading_signals")
        .insert({
          symbol: instrumentName,
          direction,
          entry_price: structured.entry_price ? parseFloat(structured.entry_price) : 0,
          stop_loss: structured.stop_loss ? parseFloat(structured.stop_loss) : null,
          take_profit: structured.take_profit ? parseFloat(structured.take_profit) : null,
          timeframe: tf || structured.timeframe || "M5",
          category: "forex",
          confidence: structured.confidence ? parseInt(structured.confidence) : null,
          reason: parts.join(" | "),
          is_manual: true,
          posted_by: user.id,
          status: "ACTIVE",
          strategy_name: "AI Chart Analysis",
          expires_at: expiresAt,
        });

      if (error) {
        console.error("Auto-post signal error:", error);
        toast.error("Analysis complete but failed to auto-post signal");
      } else {
        toast.success(`Signal for ${instrumentName} auto-posted to Signals page!`);
      }
    } catch (err: any) {
      console.error("Auto-post signal exception:", err);
    }
  }, [user]);

  // Track guest uploads via localStorage
  const getGuestUploadCount = (): number => {
    try {
      const data = JSON.parse(localStorage.getItem("botvio_guest_uploads") || '{"count":0,"reset":""}');
      const today = new Date().toISOString().slice(0, 10);
      if (data.reset !== today) return 0;
      return data.count || 0;
    } catch { return 0; }
  };

  const incrementGuestUploadCount = () => {
    const today = new Date().toISOString().slice(0, 10);
    const current = getGuestUploadCount();
    localStorage.setItem("botvio_guest_uploads", JSON.stringify({ count: current + 1, reset: today }));
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error("Please select a chart image");
      return;
    }

    try {
      setIsUploading(true);

      const userId = user?.id || "guest";
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("charts")
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("charts")
        .getPublicUrl(uploadData.path);

      const imageUrl = urlData.publicUrl;

      setIsUploading(false);
      setIsAnalyzing(true);

      // Call analysis edge function with analysis type
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
        "analyze-chart",
        {
          body: {
            imageUrl,
            symbol,
            timeframe,
            analysisType,
          },
        }
      );

      if (analysisError) throw analysisError;

      if (analysisData.error) {
        if (analysisData.error_code === "daily_limit" || analysisData.redirect) {
          toast.error("Daily limit reached! Subscribe to Premium Signals for unlimited AI analysis.");
          navigate("/billing");
          return;
        }
        toast.error(analysisData.error);
        return;
      }

      setAnalysisResult(analysisData.analysis);
      setStructuredResult(analysisData.structured);
      toast.success("Chart analyzed successfully!");

      // Track guest upload count
      if (!user) {
        incrementGuestUploadCount();
        const remaining = 10 - getGuestUploadCount();
        if (remaining > 0) {
          toast.info(`${remaining} free analyses remaining`);
        }
      }

      // Auto-post as signal if user is admin/super_admin/signal_manager
      if ((isAdmin || isSuperAdmin || isSignalManager) && analysisData.structured) {
        await autoPostSignal(analysisData.structured, symbol, timeframe, imageUrl);
      }
    } catch (error: any) {
      console.error("Analysis error:", error);
      // Check if the error message indicates daily limit
      const msg = error?.message || "";
      if (msg.includes("daily limit") || msg.includes("Daily limit") || msg.includes("403")) {
        toast.error("Daily limit reached! Subscribe to Premium Signals for unlimited AI analysis.");
        navigate("/billing");
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const viewHistoricalAnalysis = (analysis: any) => {
    setAnalysisResult(analysis.ai_response);
    setStructuredResult(analysis.analysis_result);
    setPreviewUrl(analysis.image_url);
    setSymbol(analysis.symbol || "");
    setTimeframe(analysis.timeframe || "");
    setActiveTab("upload");
  };

  return (
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
          ) : (
            <Badge variant="outline" className="text-xs text-success border-success/30">
              Free — Unlimited
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tabs for Upload vs History */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              New Analysis
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
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

            {/* Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                transition-all duration-200 hover:border-primary/50 hover:bg-primary/5
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
                  <img
                    src={previewUrl}
                    alt="Chart preview"
                    className="max-h-64 mx-auto rounded-lg shadow-lg"
                  />
                  <p className="text-sm text-muted-foreground">Click to change image</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Drop your chart image here</p>
                    <p className="text-sm text-muted-foreground">or click to browse (max 5MB)</p>
                  </div>
                </div>
              )}
            </div>

            {/* Tip */}
            <div className="flex items-start gap-2 rounded-lg bg-yellow-500/15 border border-yellow-500/40 p-3">
              <Info className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
              <p className="text-sm text-yellow-400">
                <span className="font-semibold text-yellow-300">Tip:</span> Make sure the instrument symbol (e.g. XAUUSD, EURUSD) is visible on your chart before uploading — this helps the AI identify the correct market.
              </p>
            </div>


            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleAnalyze}
                disabled={!selectedFile || isUploading || isAnalyzing}
                className="flex-1"
                variant="gold"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analyze Chart
                  </>
                )}
              </Button>
              {selectedFile && (
                <Button variant="outline" onClick={resetForm}>
                  Clear
                </Button>
              )}
            </div>

            {/* Analysis Result */}
            {analysisResult && (
              <div className="space-y-4 pt-4 border-t border-border/50">
                {/* Quick Stats */}
                {structuredResult && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className={`
                      p-3 rounded-lg border text-center
                      ${structuredResult.trend === "BULLISH" 
                        ? "bg-success/10 border-success/30 text-success" 
                        : structuredResult.trend === "BEARISH"
                        ? "bg-destructive/10 border-destructive/30 text-destructive"
                        : "bg-muted/30 border-muted"}
                    `}>
                      {structuredResult.trend === "BULLISH" ? (
                        <TrendingUp className="h-5 w-5 mx-auto mb-1" />
                      ) : structuredResult.trend === "BEARISH" ? (
                        <TrendingDown className="h-5 w-5 mx-auto mb-1" />
                      ) : (
                        <AlertCircle className="h-5 w-5 mx-auto mb-1" />
                      )}
                      <p className="text-xs font-medium">{structuredResult.trend || "Analyzing..."}</p>
                    </div>
                    <div className={`
                      p-3 rounded-lg border text-center
                      ${structuredResult.recommendation === "BUY" 
                        ? "bg-success/10 border-success/30 text-success" 
                        : structuredResult.recommendation === "SELL"
                        ? "bg-destructive/10 border-destructive/30 text-destructive"
                        : "bg-warning/10 border-warning/30 text-warning"}
                    `}>
                      <Target className="h-5 w-5 mx-auto mb-1" />
                      <p className="text-xs font-medium">{structuredResult.recommendation || "HOLD"}</p>
                    </div>
                    <div className="p-3 rounded-lg border bg-primary/10 border-primary/30 text-center">
                      <Shield className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <p className="text-xs font-medium text-primary">
                        {structuredResult.risk_level || "Medium"} Risk
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border bg-secondary text-center">
                      <BarChart3 className="h-5 w-5 mx-auto mb-1" />
                      <p className="text-xs font-medium">
                        {structuredResult.confidence || "75"}% Confidence
                      </p>
                    </div>
                  </div>
                )}

                {/* Key Levels */}
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

                {/* Full Analysis */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      AI Analysis Report
                    </Label>
                    <SocialShareButtons 
                      title={`Chart Analysis - ${structuredResult?.trend?.toUpperCase() || "TRADING"} Signal`}
                      description={`**Instrument**: ${symbol || "Chart"}\n${structuredResult?.recommendation ? `${structuredResult.recommendation.toUpperCase()} signal with ${structuredResult.confidence || 75}% confidence` : analysisResult?.slice(0, 150) || ""}`}
                      imageUrl={previewUrl || undefined}
                    />
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border/50 max-h-80 overflow-y-auto">
                    <div className="prose prose-sm prose-invert max-w-none">
                      <pre className="whitespace-pre-wrap text-sm font-sans text-foreground/90">
                        {analysisResult}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* No limit message removed - unlimited uploads for all users */}
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
                      <img
                        src={analysis.image_url}
                        alt="Chart"
                        className="w-16 h-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {analysis.symbol || "Chart Analysis"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(analysis.created_at).toLocaleDateString()}
                        {analysis.timeframe && <span>• {analysis.timeframe}</span>}
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      View
                    </Badge>
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

      {/* Auth Modal */}
      <AuthModal 
        open={showAuthModal} 
        onOpenChange={setShowAuthModal} 
      />
    </Card>
  );
};
