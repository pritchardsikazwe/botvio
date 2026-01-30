import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  CheckCircle,
  TrendingUp,
  TrendingDown,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

const SYMBOLS = [
  { value: "EURUSD", label: "EUR/USD" },
  { value: "GBPUSD", label: "GBP/USD" },
  { value: "USDJPY", label: "USD/JPY" },
  { value: "XAUUSD", label: "Gold (XAU/USD)" },
  { value: "NAS100", label: "NASDAQ 100" },
  { value: "BTCUSD", label: "Bitcoin/USD" },
  { value: "Volatility_75_Index", label: "V75 Index" },
];

const TIMEFRAMES = [
  { value: "M1", label: "1 Minute" },
  { value: "M5", label: "5 Minutes" },
  { value: "M15", label: "15 Minutes" },
  { value: "H1", label: "1 Hour" },
  { value: "H4", label: "4 Hours" },
  { value: "D1", label: "Daily" },
];

interface ChartUploadProps {
  isPremium?: boolean;
}

export const ChartUpload = ({ isPremium = false }: ChartUploadProps) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [symbol, setSymbol] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [structuredResult, setStructuredResult] = useState<any>(null);

  // Check daily usage for non-premium users
  const { data: dailyUsage } = useQuery({
    queryKey: ["chart-usage", user?.id],
    queryFn: async () => {
      if (!user || isPremium) return { count: 0, canUpload: true };
      
      const today = new Date().toISOString().split("T")[0];
      const { count } = await supabase
        .from("chart_analyses")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", `${today}T00:00:00Z`);

      return { count: count || 0, canUpload: (count || 0) < 1 };
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

  const handleAnalyze = async () => {
    if (!user) {
      toast.error("Please sign in to analyze charts");
      return;
    }

    if (!selectedFile) {
      toast.error("Please select a chart image");
      return;
    }

    if (!isPremium && !dailyUsage?.canUpload) {
      toast.error("You've reached your daily limit. Upgrade to Premium for unlimited analyses!");
      return;
    }

    try {
      setIsUploading(true);

      // Upload image to storage
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

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

      // Call analysis edge function
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
        "analyze-chart",
        {
          body: {
            imageUrl,
            symbol,
            timeframe,
            userId: user.id,
          },
        }
      );

      if (analysisError) throw analysisError;

      if (analysisData.error) {
        if (analysisData.error === "Daily limit reached") {
          toast.error(analysisData.message);
        } else {
          toast.error(analysisData.error);
        }
        return;
      }

      setAnalysisResult(analysisData.analysis);
      setStructuredResult(analysisData.structured);
      toast.success("Chart analyzed successfully!");
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast.error(error.message || "Failed to analyze chart");
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
    setAnalysisResult(null);
    setStructuredResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
          {!isPremium && (
            <Badge variant="outline" className="text-xs">
              {dailyUsage?.canUpload ? "1 free analysis today" : "Limit reached"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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

        {/* Symbol and Timeframe Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Symbol (optional)</Label>
            <Select value={symbol} onValueChange={setSymbol}>
              <SelectTrigger>
                <SelectValue placeholder="Select symbol" />
              </SelectTrigger>
              <SelectContent>
                {SYMBOLS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Timeframe (optional)</Label>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger>
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                {TIMEFRAMES.map((tf) => (
                  <SelectItem key={tf.value} value={tf.value}>
                    {tf.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleAnalyze}
            disabled={!selectedFile || isUploading || isAnalyzing || (!isPremium && !dailyUsage?.canUpload)}
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
              <div className="grid grid-cols-3 gap-3">
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
                  <p className="text-xs font-medium">{structuredResult.trend}</p>
                </div>
                <div className={`
                  p-3 rounded-lg border text-center
                  ${structuredResult.recommendation === "BUY" 
                    ? "bg-success/10 border-success/30 text-success" 
                    : structuredResult.recommendation === "SELL"
                    ? "bg-destructive/10 border-destructive/30 text-destructive"
                    : "bg-warning/10 border-warning/30 text-warning"}
                `}>
                  <CheckCircle className="h-5 w-5 mx-auto mb-1" />
                  <p className="text-xs font-medium">{structuredResult.recommendation}</p>
                </div>
                <div className="p-3 rounded-lg border bg-primary/10 border-primary/30 text-center">
                  <Sparkles className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-xs font-medium text-primary">AI Analyzed</p>
                </div>
              </div>
            )}

            {/* Full Analysis */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                AI Analysis Report
              </Label>
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

        {/* Premium Upsell for Free Users */}
        {!isPremium && !dailyUsage?.canUpload && (
          <div className="p-4 rounded-lg bg-gradient-to-r from-warning/10 to-amber-500/10 border border-warning/30">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-warning" />
              <div>
                <p className="font-semibold text-warning">Upgrade to Premium</p>
                <p className="text-sm text-muted-foreground">
                  Get unlimited chart analyses, priority AI processing, and more!
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
