import { ChartUpload } from "@/components/signals/ChartUpload";

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

export const HomeChartAnalyzer = () => <ChartUpload />;

export default HomeChartAnalyzer;
