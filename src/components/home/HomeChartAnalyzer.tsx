import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { readFunctionError } from "@/lib/chartAnalysisError";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, Loader2, Sparkles, RefreshCw, ArrowUpRight } from "lucide-react";

type Structured = {
  instrument?: string | null;
  trend?: string | null;
  recommendation?: string | null;
  entry_price?: string | null;
  stop_loss?: string | null;
  take_profit?: string | null;
  confidence?: string | null;
  timeframe?: string | null;
  raw_analysis?: string | null;
};

export type ChartInterpretation = {
  instrument: string;
  timeframe: string;
  trend: string;
  bias: string;
  structure: string;
  support: string;
  resistance: string;
  entryZone: string;
  risk: string;
  score: number;
};

const firstMatch = (text: string, patterns: RegExp[]): string | null => {
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) return m[1].trim().replace(/[*_`]/g, "").slice(0, 80);
  }
  return null;
};

export const interpretAnalysis = (text: string, s: Structured): ChartInterpretation => {
  const body = text || s.raw_analysis || "";
  const trend = (s.trend || "RANGING").toUpperCase();
  const bias = (s.recommendation || "WAIT").toUpperCase();
  const rawScore = s.confidence ? parseInt(s.confidence, 10) : NaN;
  const score = Number.isFinite(rawScore) ? Math.max(0, Math.min(100, rawScore)) : trend === "RANGING" ? 50 : 65;

  const support =
    firstMatch(body, [/support[^\n:]*[:\-]\s*([^\n]+)/i, /support (?:at|near|around)\s+([0-9][^\n,.]*)/i]) || "Not detected";
  const resistance =
    firstMatch(body, [/resistance[^\n:]*[:\-]\s*([^\n]+)/i, /resistance (?:at|near|around)\s+([0-9][^\n,.]*)/i]) || "Not detected";
  const structure =
    firstMatch(body, [/market structure[^\n:]*[:\-]\s*([^\n]+)/i, /structure[^\n:]*[:\-]\s*([^\n]+)/i]) ||
    (trend === "BULLISH" ? "Higher highs / higher lows" : trend === "BEARISH" ? "Lower highs / lower lows" : "Range-bound");

  const entryZone = s.entry_price
    ? `${s.entry_price}${s.take_profit ? ` → TP ${s.take_profit}` : ""}`
    : firstMatch(body, [/entry[^\n:]*[:\-]\s*([^\n]+)/i]) || "Wait for confirmation";

  const risk =
    (s.stop_loss ? `Stop loss ${s.stop_loss} · risk max 1–2% per trade` : null) ||
    firstMatch(body, [/risk[^\n:]*[:\-]\s*([^\n]+)/i]) ||
    "Use a defined stop and risk max 1–2% per trade";

  return {
    instrument: s.instrument || "Detected chart",
    timeframe: s.timeframe || "—",
    trend,
    bias,
    structure,
    support,
    resistance,
    entryZone,
    risk,
    score,
  };
};

export const HomeChartAnalyzer = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<"idle" | "uploading" | "analyzing">("idle");
  const [result, setResult] = useState<ChartInterpretation | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  const reset = () => {
    setPreview(null);
    setResult(null);
    setSummary(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const run = async (file: File) => {
    if (!file.type.startsWith("image/")) return toast.error("Please select an image file");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be less than 5MB");

    setPreview(URL.createObjectURL(file));
    setResult(null);
    setSummary(null);

    try {
      setBusy("uploading");
      const { data: session } = await supabase.auth.getUser();
      const owner = session?.user?.id || "guest";
      const ext = file.name.split(".").pop() || "png";
      const path = `${owner}/${Date.now()}.${ext}`;

      const { data: up, error: upErr } = await supabase.storage.from("charts").upload(path, file);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("charts").getPublicUrl(up.path);

      setBusy("analyzing");
      const { data, error } = await supabase.functions.invoke("analyze-chart", {
        body: { imageUrl: urlData.publicUrl, analysisType: "full" },
      });
      if (error) {
        const parsed = await readFunctionError(error);
        throw new Error(parsed.message);
      }
      if (data?.error) throw new Error(data.error);

      const structured: Structured = data.structured || {};
      setResult(interpretAnalysis(data.analysis || "", structured));
      setSummary((data.analysis || "").replace(/[#*`]/g, "").trim().slice(0, 420));
      toast.success("Chart analyzed");
    } catch (e: any) {
      toast.error(e?.message || "Could not analyze that chart. Please try again.");
    } finally {
      setBusy("idle");
    }
  };

  const loading = busy !== "idle";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      {/* upload panel */}
      <div className="relative overflow-hidden rounded-xl border border-border/60 bg-background/60 p-3">
        <label
          htmlFor="home-chart-upload"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) void run(f);
          }}
          className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-primary/40 bg-card/40 p-4 text-center transition-colors hover:border-primary"
        >
          {preview ? (
            <img src={preview} alt="Uploaded trading chart preview" className="max-h-56 w-full rounded-md object-contain" />
          ) : (
            <>
              <Upload className="h-6 w-6 text-primary" />
              <span className="text-sm font-semibold text-foreground">Drop your chart screenshot here</span>
              <span className="text-[10px] text-muted-foreground">Max 5MB · JPG, PNG · analysis in seconds</span>
            </>
          )}
        </label>
        <input
          ref={inputRef}
          id="home-chart-upload"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void run(f);
          }}
        />
        <div className="mt-3 flex items-center gap-2">
          <Button className="font-bold" disabled={loading} onClick={() => inputRef.current?.click()}>
            {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
            {busy === "uploading" ? "Uploading…" : busy === "analyzing" ? "Analyzing…" : "Upload & Analyze"}
          </Button>
          {preview && !loading && (
            <Button variant="outline" size="sm" onClick={reset}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> New chart
            </Button>
          )}
        </div>
      </div>

      {/* result panel */}
      <div className="rounded-xl border border-border/60 bg-background/60 p-4">
        <p className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          AI Analysis Result <ArrowUpRight className="h-3 w-3 text-primary" />
        </p>

        {!result ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Upload a chart to get trend direction, market structure, support and resistance, an entry zone, risk guidance
            and an analysis score. Educational analysis only — not financial advice.
          </p>
        ) : (
          <>
            <p className="mt-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {result.instrument} • {result.timeframe}
              </span>
              <Badge
                className={
                  result.trend === "BULLISH"
                    ? "bg-success/20 text-success hover:bg-success/20"
                    : result.trend === "BEARISH"
                    ? "bg-destructive/20 text-destructive hover:bg-destructive/20"
                    : "bg-muted text-muted-foreground hover:bg-muted"
                }
              >
                {result.trend}
              </Badge>
            </p>
            <dl className="mt-3 space-y-2 text-[11px]">
              {[
                ["Trend Direction", result.trend],
                ["Market Structure", result.structure],
                ["Support", result.support],
                ["Resistance", result.resistance],
                ["Entry Zone", result.entryZone],
                ["Bias", result.bias],
                ["Risk Guidance", result.risk],
              ].map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-3 border-b border-border/30 pb-1.5">
                  <dt className="shrink-0 text-muted-foreground">{k}</dt>
                  <dd className="text-right font-semibold text-foreground">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-3 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Analysis Score</span>
              <span className="font-bold text-foreground">{result.score}/100</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${result.score >= 60 ? "bg-success" : "bg-warning"}`}
                style={{ width: `${result.score}%` }}
              />
            </div>
            {summary && <p className="mt-3 line-clamp-6 text-[11px] leading-relaxed text-muted-foreground">{summary}</p>}
            <Button asChild variant="outline" size="sm" className="mt-3 w-full">
              <Link to="/chart">Open full AI chart analysis</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default HomeChartAnalyzer;
