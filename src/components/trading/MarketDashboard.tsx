import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp, TrendingDown, Minus, Activity, Sparkles, Clock,
  Newspaper, BarChart3, Shield, Target, Lightbulb, ArrowDown, ArrowUp,
  Crosshair, Zap, Pause,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { TradingChecklist } from "./market/TradingChecklist";
import { NewsImpactBanner } from "./market/NewsImpactBanner";
import { PatternAlerts } from "./market/PatternAlerts";
import { usePartnerLinks } from "@/hooks/useSiteSettings";
import { useSubscriptionGate } from "@/hooks/useSubscriptionGate";
import { UpgradePrompt } from "@/components/billing/UpgradePrompt";

interface Asset {
  id: string;
  symbol: string;
  asset_type: string;
}

interface Quote {
  asset_id: string;
  price: number;
  change_percent_24h: number | null;
}

interface Indicator {
  asset_id: string;
  rsi_14: number | null;
  trend: string | null;
}

interface AiSignal {
  asset_id: string;
  signal: string;
  confidence: number;
  ai_summary: string;
  entry_price: number | null;
  stop_loss: number | null;
  take_profit_1: number | null;
}

interface CardMetrics {
  asset_id: string;
  current_session: string | null;
  next_session: string | null;
  next_session_open_at: string | null;
  next_high_impact_event: string | null;
  next_high_impact_currency: string | null;
  next_high_impact_level: string | null;
  next_high_impact_time: string | null;
  day_low: number | null;
  day_high: number | null;
  current_4h_block: string | null;
  current_4h_high: number | null;
  current_4h_low: number | null;
  support_1: number | null;
  support_2: number | null;
  resistance_1: number | null;
  resistance_2: number | null;
  market_tip: string | null;
}

const ASSET_ICONS: Record<string, string> = {
  "XAU/USD": "🥇", "XAG/USD": "🥈", "BTC/USD": "₿",
  "GBP/USD": "£", "USD/JPY": "¥", "EUR/USD": "€", "AUD/USD": "🇦🇺",
  "ETH/USD": "⟠", "SOL/USD": "◎", "BNB/USD": "🔶", "XRP/USD": "✕", "DOGE/USD": "🐕",
};

// Binance symbol mapping — only supported crypto assets
const BINANCE_SYMBOL_MAP: Record<string, string> = {
  "BTC/USD": "BTCUSDT",
  "ETH/USD": "ETHUSDT",
  "SOL/USD": "SOLUSDT",
  "BNB/USD": "BNBUSDT",
  "XRP/USD": "XRPUSDT",
  "DOGE/USD": "DOGEUSDT",
};

const SIGNAL_COLORS: Record<string, string> = {
  buy: "bg-success/20 text-success border-success/40 shadow-success/10 shadow-sm",
  sell: "bg-destructive/20 text-destructive border-destructive/40 shadow-destructive/10 shadow-sm",
  hold: "bg-warning/20 text-warning border-warning/40",
  avoid: "bg-muted text-muted-foreground border-border",
};

const SIGNAL_CARD_GLOW: Record<string, string> = {
  buy: "border-success/30 shadow-[0_0_15px_-3px_hsl(var(--success)/0.15)]",
  sell: "border-destructive/30 shadow-[0_0_15px_-3px_hsl(var(--destructive)/0.15)]",
  hold: "border-warning/20",
  avoid: "",
};

const TREND_ICONS: Record<string, React.ReactNode> = {
  bullish: <TrendingUp className="h-4 w-4 text-success" />,
  bearish: <TrendingDown className="h-4 w-4 text-destructive" />,
  neutral: <Minus className="h-4 w-4 text-muted-foreground" />,
};

// === Market open/close detection (forex/metals close on weekends) ===
function isCryptoSymbol(symbol: string): boolean {
  const s = symbol.toUpperCase();
  return /BTC|ETH|SOL|BNB|XRP|DOGE|USDT|USDC|ADA|MATIC|LTC|DOT/.test(s);
}

function isForexOrMetalSymbol(symbol: string): boolean {
  if (isCryptoSymbol(symbol)) return false;
  const s = symbol.toUpperCase();
  return /XAU|XAG|EUR|GBP|USD|JPY|AUD|CAD|CHF|NZD/.test(s);
}

function isMarketClosedNow(symbol: string): boolean {
  if (!isForexOrMetalSymbol(symbol)) return false;
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun, 6=Sat
  const hour = now.getUTCHours();
  // Closed: Friday 22:00 UTC → Sunday 22:00 UTC
  if (day === 6) return true; // Saturday
  if (day === 0 && hour < 22) return true; // Sunday before 22:00 UTC
  if (day === 5 && hour >= 22) return true; // Friday after 22:00 UTC
  return false;
}

// === Hauza Scalping Signal (client-side, instant) ===
// Uses RSI(14) + trend + recent price action for quick M1/M5 scalp setups.
type HauzaScalp = {
  signal: "buy" | "sell" | "wait";
  confidence: number;
  entry: number | null;
  sl: number | null;
  tp: number | null;
  reason: string;
};

function computeHauzaScalp(
  price: number | null | undefined,
  rsi: number | null | undefined,
  trend: string | null | undefined,
  dayHigh: number | null | undefined,
  dayLow: number | null | undefined,
  symbol: string
): HauzaScalp {
  if (price == null || rsi == null) {
    return { signal: "wait", confidence: 0, entry: null, sl: null, tp: null, reason: "Awaiting live tick data" };
  }
  // ATR proxy from day range (~10% of range as scalp risk)
  const range = dayHigh != null && dayLow != null ? Math.abs(dayHigh - dayLow) : null;
  const isJpy = symbol.includes("JPY");
  const isMetal = symbol.includes("XAU") || symbol.includes("XAG");
  const fallbackPip = isMetal ? 1.5 : isJpy ? 0.08 : 0.0008;
  const risk = range != null ? Math.max(range * 0.12, fallbackPip) : fallbackPip;
  const decimals = isJpy ? 3 : isMetal ? 2 : 5;
  const round = (n: number) => +n.toFixed(decimals);

  const t = (trend || "").toLowerCase();
  const bullish = t === "bullish";
  const bearish = t === "bearish";

  // Hauza scalp logic — tight 1:1.8 R:R
  if (bullish && rsi > 45 && rsi < 70) {
    return {
      signal: "buy",
      confidence: Math.min(88, 62 + (rsi - 45) * 0.8),
      entry: round(price),
      sl: round(price - risk),
      tp: round(price + risk * 1.8),
      reason: "Hauza scalp: bullish trend + RSI momentum",
    };
  }
  if (bearish && rsi < 55 && rsi > 30) {
    return {
      signal: "sell",
      confidence: Math.min(88, 62 + (55 - rsi) * 0.8),
      entry: round(price),
      sl: round(price + risk),
      tp: round(price - risk * 1.8),
      reason: "Hauza scalp: bearish trend + RSI momentum",
    };
  }
  if (rsi <= 30) {
    return {
      signal: "buy",
      confidence: 70,
      entry: round(price),
      sl: round(price - risk * 0.8),
      tp: round(price + risk * 1.5),
      reason: "Hauza scalp: oversold bounce setup",
    };
  }
  if (rsi >= 70) {
    return {
      signal: "sell",
      confidence: 70,
      entry: round(price),
      sl: round(price + risk * 0.8),
      tp: round(price - risk * 1.5),
      reason: "Hauza scalp: overbought rejection setup",
    };
  }
  return { signal: "wait", confidence: 40, entry: null, sl: null, tp: null, reason: "Hauza scalp: range-bound — wait for breakout" };
}


function formatPrice(price: number | null, symbol: string): string {
  if (price == null) return "—";
  if (symbol.includes("JPY")) return price.toFixed(3);
  if (symbol.includes("BTC")) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (symbol.includes("XAU") || symbol.includes("XAG")) return price.toFixed(2);
  return price.toFixed(5);
}

function Countdown({ targetTime }: { targetTime: string }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(targetTime).getTime() - Date.now();
      if (diff <= 0) { setRemaining("Now"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(`${h}h ${String(m).padStart(2, "0")}m`);
    };
    update();
    const iv = setInterval(update, 60000);
    return () => clearInterval(iv);
  }, [targetTime]);

  return <span className="font-mono text-xs font-semibold text-primary">{remaining}</span>;
}

function SessionBlock({ metrics }: { metrics: CardMetrics }) {
  if (!metrics.current_session) return null;
  return (
    <div className="flex items-center justify-between text-xs bg-muted/30 rounded-lg px-3 py-2">
      <span className="text-foreground/70 flex items-center gap-1.5 font-medium">
        <Clock className="h-3.5 w-3.5 text-primary" /> Session
      </span>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-[10px] py-0 border-primary/50 text-primary font-bold bg-primary/10">
          {metrics.current_session}
        </Badge>
        {metrics.next_session && metrics.next_session_open_at && (
          <span className="text-foreground/60 text-[10px]">
            → {metrics.next_session} in <Countdown targetTime={metrics.next_session_open_at} />
          </span>
        )}
      </div>
    </div>
  );
}

function NewsBlock({ metrics }: { metrics: CardMetrics }) {
  if (!metrics.next_high_impact_event) return null;
  return (
    <div className="bg-destructive/10 border border-destructive/25 rounded-lg px-3 py-2">
      <div className="flex items-center gap-1.5 mb-1">
        <Newspaper className="h-3.5 w-3.5 text-destructive" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-destructive">
          Impact News
        </span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="truncate max-w-[60%] text-foreground font-medium">
          {metrics.next_high_impact_currency} — {metrics.next_high_impact_event}
        </span>
        {metrics.next_high_impact_time && (
          <span className="text-destructive font-bold text-[11px]">
            <Countdown targetTime={metrics.next_high_impact_time} />
          </span>
        )}
      </div>
    </div>
  );
}

function DayRangeBlock({ metrics, symbol }: { metrics: CardMetrics; symbol: string }) {
  if (metrics.day_low == null && metrics.day_high == null) return null;
  const range = metrics.day_high != null && metrics.day_low != null
    ? Math.abs(metrics.day_high - metrics.day_low) : null;

  return (
    <div className="grid grid-cols-3 gap-1.5 text-[11px]">
      <div className="bg-success/10 border border-success/20 rounded-lg px-2 py-1.5 text-center">
        <div className="text-foreground/50 flex items-center justify-center gap-0.5 text-[9px] font-semibold uppercase">
          <ArrowDown className="h-2.5 w-2.5 text-success" /> Low
        </div>
        <div className="font-bold text-success mt-0.5">{formatPrice(metrics.day_low ? Number(metrics.day_low) : null, symbol)}</div>
      </div>
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-2 py-1.5 text-center">
        <div className="text-foreground/50 flex items-center justify-center gap-0.5 text-[9px] font-semibold uppercase">
          <ArrowUp className="h-2.5 w-2.5 text-destructive" /> High
        </div>
        <div className="font-bold text-destructive mt-0.5">{formatPrice(metrics.day_high ? Number(metrics.day_high) : null, symbol)}</div>
      </div>
      <div className="bg-muted/50 border border-border/30 rounded-lg px-2 py-1.5 text-center">
        <div className="text-foreground/50 text-[9px] font-semibold uppercase">Range</div>
        <div className="font-bold text-foreground mt-0.5">{range != null ? formatPrice(range, symbol) : "—"}</div>
      </div>
    </div>
  );
}

function H4Block({ metrics, symbol }: { metrics: CardMetrics; symbol: string }) {
  if (!metrics.current_4h_block) return null;
  return (
    <div className="flex items-center justify-between text-xs bg-muted/30 rounded-lg px-3 py-2">
      <span className="text-foreground/70 flex items-center gap-1.5 font-medium">
        <BarChart3 className="h-3.5 w-3.5 text-primary" /> 4H Block
      </span>
      <div className="flex items-center gap-2 text-[10px]">
        <Badge variant="outline" className="py-0 text-[10px] font-bold bg-primary/10 border-primary/30 text-primary">{metrics.current_4h_block}</Badge>
        {metrics.current_4h_high != null && (
          <span className="text-foreground/60">
            H: <span className="text-foreground font-mono font-bold">{formatPrice(Number(metrics.current_4h_high), symbol)}</span>
            {" "}L: <span className="text-foreground font-mono font-bold">{formatPrice(Number(metrics.current_4h_low), symbol)}</span>
          </span>
        )}
      </div>
    </div>
  );
}

function LevelsBlock({ metrics, symbol }: { metrics: CardMetrics; symbol: string }) {
  const hasLevels = metrics.support_1 != null || metrics.resistance_1 != null;
  if (!hasLevels) return null;

  return (
    <div className="space-y-1.5 bg-muted/20 rounded-lg px-3 py-2 border border-border/30">
      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-foreground/60">
        <Shield className="h-3.5 w-3.5 text-primary" /> Key Levels
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
        <div className="flex justify-between">
          <span className="text-success font-bold">S1</span>
          <span className="font-mono font-semibold text-foreground">{formatPrice(metrics.support_1 ? Number(metrics.support_1) : null, symbol)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-destructive font-bold">R1</span>
          <span className="font-mono font-semibold text-foreground">{formatPrice(metrics.resistance_1 ? Number(metrics.resistance_1) : null, symbol)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-success/60 font-bold">S2</span>
          <span className="font-mono font-semibold text-foreground/70">{formatPrice(metrics.support_2 ? Number(metrics.support_2) : null, symbol)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-destructive/60 font-bold">R2</span>
          <span className="font-mono font-semibold text-foreground/70">{formatPrice(metrics.resistance_2 ? Number(metrics.resistance_2) : null, symbol)}</span>
        </div>
      </div>
    </div>
  );
}

function TipBlock({ tip, breakoutPrice, symbol }: { tip: string | null; breakoutPrice?: number | null; symbol?: string }) {
  if (!tip) return null;
  const isBreakout = tip.toLowerCase().includes("breakout");
  return (
    <div className={`border rounded-lg px-3 py-2 ${isBreakout ? "bg-warning/10 border-warning/30" : "bg-primary/8 border-primary/25"}`}>
      <div className="flex items-start gap-2">
        <Lightbulb className={`h-4 w-4 mt-0.5 shrink-0 ${isBreakout ? "text-warning" : "text-primary"}`} />
        <div className="flex-1">
          <p className="text-[11px] text-foreground leading-relaxed font-medium">{tip}</p>
          {isBreakout && breakoutPrice != null && symbol && (
            <div className="flex items-center gap-1.5 mt-1 bg-warning/10 rounded px-2 py-1">
              <Target className="h-3 w-3 text-warning" />
              <span className="text-[10px] font-bold text-warning">Breakout Level:</span>
              <span className="text-[11px] font-mono font-extrabold text-foreground">{formatPrice(breakoutPrice, symbol)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Map asset symbols to relevant Botvio AI strategies
const BOTVIO_STRATEGIES: { id: string; label: string; emoji: string; route: string }[] = [
  { id: "digit-contracts", label: "Digits", emoji: "🔢", route: "/trade/style/digit-contracts" },
  { id: "rise-fall-scalping", label: "Rise/Fall", emoji: "📈", route: "/trade/style/rise-fall-scalping" },
  { id: "boom-crash", label: "Boom/Crash", emoji: "💥", route: "/trade/style/boom-crash" },
  { id: "multipliers", label: "Multipliers", emoji: "✖️", route: "/trade/style/multipliers" },
  { id: "accumulators", label: "Accumulators", emoji: "📊", route: "/trade/style/accumulators" },
  { id: "turbo", label: "Turbo", emoji: "⚡", route: "/trade/style/turbo" },
  { id: "ticks", label: "Ticks", emoji: "⏱️", route: "/trade/style/ticks" },
  { id: "synthetic-indices", label: "Synthetics", emoji: "🤖", route: "/trade/style/synthetic-indices" },
];

function getStrategiesForAsset(assetType: string, symbol: string) {
  const type = assetType.toLowerCase();
  const sym = symbol.toUpperCase();
  // Forex & commodities: Rise/Fall, Multipliers
  if (type === "forex" || type === "commodity" || type === "metal") {
    return BOTVIO_STRATEGIES.filter(s => ["rise-fall-scalping", "multipliers", "synthetic-indices"].includes(s.id));
  }
  // Crypto: Rise/Fall, Multipliers
  if (type === "crypto") {
    return BOTVIO_STRATEGIES.filter(s => ["rise-fall-scalping", "multipliers"].includes(s.id));
  }
  // Boom/Crash symbols
  if (sym.includes("BOOM") || sym.includes("CRASH")) {
    return BOTVIO_STRATEGIES.filter(s => ["boom-crash", "rise-fall-scalping"].includes(s.id));
  }
  // Synthetic / volatility indices
  if (type === "synthetic" || sym.startsWith("R_") || sym.includes("HZ")) {
    return BOTVIO_STRATEGIES.filter(s => ["digit-contracts", "rise-fall-scalping", "accumulators", "turbo", "ticks", "multipliers"].includes(s.id));
  }
  // Default: show core modes
  return BOTVIO_STRATEGIES.filter(s => ["rise-fall-scalping", "multipliers", "synthetic-indices"].includes(s.id));
}

function BotvioStrategiesBlock({ assetType, symbol }: { assetType: string; symbol: string }) {
  const navigate = useNavigate();
  const strategies = getStrategiesForAsset(assetType, symbol);
  if (!strategies.length) return null;

  return (
    <div className="space-y-1.5 bg-accent/30 rounded-lg px-3 py-2 border border-accent/50">
      <div className="flex items-center gap-1.5">
        <Crosshair className="h-3.5 w-3.5 text-primary" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
          Botvio AI Strategies
        </span>
        <Zap className="h-3 w-3 text-warning" />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {strategies.map((s) => (
          <button
            key={s.id}
            onClick={() => navigate(s.route)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold
              bg-primary/10 border border-primary/25 text-primary hover:bg-primary/20
              hover:border-primary/50 transition-all cursor-pointer"
          >
            <span>{s.emoji}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const BOTVIO_BTN_CONFIG: Record<string, {
  bg: string; border: string; text: string; glow: string; icon: typeof TrendingUp; pulse: string; label: string;
}> = {
  buy: {
    bg: "from-emerald-500/20 via-emerald-500/10 to-transparent",
    border: "border-success/50", text: "text-success", glow: "shadow-[0_0_25px_hsl(var(--success)/0.25)]",
    icon: TrendingUp, pulse: "animate-[pulse_1.5s_ease-in-out_infinite]", label: "BUY",
  },
  sell: {
    bg: "from-red-500/20 via-red-500/10 to-transparent",
    border: "border-destructive/50", text: "text-destructive", glow: "shadow-[0_0_25px_hsl(var(--destructive)/0.25)]",
    icon: TrendingDown, pulse: "animate-[pulse_1.5s_ease-in-out_infinite]", label: "SELL",
  },
  hold: {
    bg: "from-blue-500/20 via-blue-500/10 to-transparent",
    border: "border-blue-500/50", text: "text-blue-400", glow: "",
    icon: Shield, pulse: "", label: "HOLD",
  },
  wait: {
    bg: "from-amber-500/20 via-amber-500/10 to-transparent",
    border: "border-warning/50", text: "text-warning", glow: "",
    icon: Pause, pulse: "", label: "WAIT",
  },
  avoid: {
    bg: "from-gray-500/10 to-transparent",
    border: "border-border", text: "text-muted-foreground", glow: "",
    icon: Pause, pulse: "", label: "WAIT",
  },
};

function BotvioSignalButton({ sig, symbol, navigate }: { sig: AiSignal | undefined; symbol: string; navigate: ReturnType<typeof useNavigate> }) {
  const signalKey = sig?.signal?.toLowerCase() || "wait";
  const config = BOTVIO_BTN_CONFIG[signalKey] || BOTVIO_BTN_CONFIG.wait;
  const Icon = config.icon;
  const isActive = signalKey === "buy" || signalKey === "sell";
  const chartSlug = symbol.replace("/", "");

  return (
    <button
      onClick={() => navigate(`/chart/${chartSlug}`)}
      className={`w-full relative overflow-hidden rounded-xl bg-gradient-to-r ${config.bg} ${config.border} border-2 ${config.glow} transition-all duration-300 hover:scale-[1.02] cursor-pointer group`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.04),transparent_70%)]" />
      <div className="relative px-4 py-3 flex items-center justify-between gap-3">
        {/* Left: Icon + Signal */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.bg} border ${config.border} flex items-center justify-center ${config.pulse}`}>
            <Icon className={`h-5 w-5 ${config.text}`} />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <Crosshair className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Botvio Signal</span>
            </div>
            <span className={`text-lg font-black tracking-tight ${config.text}`}>
              {config.label} {isActive ? symbol.replace("/", "") : ""}
            </span>
          </div>
        </div>

        {/* Right: Entry/SL or Wait message */}
        <div className="text-right shrink-0">
          {isActive && sig ? (
            <div className="space-y-0.5">
              {sig.entry_price && (
                <div className="text-[10px]">
                  <span className="text-muted-foreground">Entry </span>
                  <span className="font-mono font-bold text-foreground">{formatPrice(Number(sig.entry_price), symbol)}</span>
                </div>
              )}
              {sig.stop_loss && (
                <div className="text-[10px]">
                  <span className="text-muted-foreground">SL </span>
                  <span className="font-mono font-bold text-destructive">{formatPrice(Number(sig.stop_loss), symbol)}</span>
                </div>
              )}
              {sig.take_profit_1 && (
                <div className="text-[10px]">
                  <span className="text-muted-foreground">TP </span>
                  <span className="font-mono font-bold text-success">{formatPrice(Number(sig.take_profit_1), symbol)}</span>
                </div>
              )}
            </div>
          ) : (
            <span className="text-[10px] text-muted-foreground">Wait for setup<br />confirmation</span>
          )}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

const HOME_PREFERRED_ORDER = ["XAU/USD", "XAG/USD", "BTC/USD", "GBP/USD", "EUR/USD", "USD/JPY"];

export function MarketDashboard({ maxCards, maxBinanceCards, homeMode }: { maxCards?: number; maxBinanceCards?: number; homeMode?: boolean } = {}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isBasicOrAbove, isLoading: gateLoading } = useSubscriptionGate();
  const { data: assets, isLoading: assetsLoading } = useQuery({
    queryKey: ["market-assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("id, symbol, asset_type, base_currency, quote_currency")
        .eq("is_active", true)
        .order("symbol");
      if (error) throw error;
      return data as Asset[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const assetIds = assets?.map((a) => a.id) || [];

  const { data: partnerLinks } = usePartnerLinks();
  const exnessLink = useMemo(() => {
    const link = partnerLinks?.find((l: any) => l.key === "exness" || l.label?.toLowerCase().includes("exness"));
    return link?.url || null;
  }, [partnerLinks]);
  const binanceLink = useMemo(() => {
    const link = partnerLinks?.find((l: any) => l.key === "binance" || l.label?.toLowerCase().includes("binance"));
    return link?.url || null;
  }, [partnerLinks]);

  const { data: quotes } = useQuery({
    queryKey: ["market-quotes", assetIds],
    queryFn: async () => {
      if (!assetIds.length) return [];
      const results: Quote[] = [];
      for (const assetId of assetIds) {
        const { data } = await supabase
          .from("market_quotes")
          .select("asset_id, price, change_percent_24h, fetched_at")
          .eq("asset_id", assetId)
          .order("fetched_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data) results.push(data as Quote);
      }
      return results;
    },
    enabled: assetIds.length > 0,
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });

  const { data: indicators } = useQuery({
    queryKey: ["market-indicators", assetIds],
    queryFn: async () => {
      if (!assetIds.length) return [];
      const results: Indicator[] = [];
      for (const assetId of assetIds) {
        const { data } = await supabase
          .from("market_indicators")
          .select("asset_id, rsi_14, trend")
          .eq("asset_id", assetId)
          .eq("timeframe", "1h")
          .order("candle_time", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data) results.push(data as Indicator);
      }
      return results;
    },
    enabled: assetIds.length > 0,
    staleTime: 60 * 1000,
  });

  const { data: signals } = useQuery({
    queryKey: ["ai-signals", assetIds],
    queryFn: async () => {
      if (!assetIds.length) return [];
      const results: AiSignal[] = [];
      for (const assetId of assetIds) {
        const { data } = await supabase
          .from("ai_signals")
          .select("asset_id, signal, confidence, entry_price, stop_loss, take_profit_1, ai_summary, created_at")
          .eq("asset_id", assetId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data) results.push(data as AiSignal);
      }
      return results;
    },
    enabled: assetIds.length > 0,
    staleTime: 60 * 1000,
  });

  const { data: cardMetrics } = useQuery({
    queryKey: ["card-metrics", assetIds],
    queryFn: async () => {
      if (!assetIds.length) return [];
      const results: CardMetrics[] = [];
      for (const assetId of assetIds) {
        const { data } = await supabase
          .from("market_card_metrics")
          .select("*")
          .eq("asset_id", assetId)
          .order("snapshot_time", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data) results.push(data as CardMetrics);
      }
      return results;
    },
    enabled: assetIds.length > 0,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  // Realtime subscriptions — invalidate queries when new data arrives
  useEffect(() => {
    const channel = supabase
      .channel("market-dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "market_quotes" }, () => {
        queryClient.invalidateQueries({ queryKey: ["market-quotes"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "market_card_metrics" }, () => {
        queryClient.invalidateQueries({ queryKey: ["card-metrics"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "ai_signals" }, () => {
        queryClient.invalidateQueries({ queryKey: ["ai-signals"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "market_indicators" }, () => {
        queryClient.invalidateQueries({ queryKey: ["market-indicators"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const quoteMap = new Map(quotes?.map((q) => [q.asset_id, q]) || []);
  const indicatorMap = new Map(indicators?.map((i) => [i.asset_id, i]) || []);
  const signalMap = new Map(signals?.map((s) => [s.asset_id, s]) || []);
  const metricsMap = new Map(cardMetrics?.map((m) => [m.asset_id, m]) || []);

  // Collect all news events for the top banner
  const allNewsEvents = useMemo(() => {
    if (!cardMetrics?.length) return [];
    return cardMetrics
      .filter((m) => m.next_high_impact_event && m.next_high_impact_time)
      .map((m) => ({
        event: m.next_high_impact_event!,
        currency: m.next_high_impact_currency || "",
        level: m.next_high_impact_level || "high",
        time: m.next_high_impact_time!,
      }))
      // Deduplicate by event+time
      .filter((e, i, arr) => arr.findIndex((x) => x.event === e.event && x.time === e.time) === i);
  }, [cardMetrics]);

  // Build pattern alerts from AI signals
  const patternAlerts = useMemo(() => {
    if (!signals?.length || !assets?.length) return [];
    const assetMap = new Map(assets.map((a) => [a.id, a]));
    return signals
      .filter((s) => s.ai_summary && (s.signal === "buy" || s.signal === "sell"))
      .map((s) => {
        const asset = assetMap.get(s.asset_id);
        // Extract pattern hint from summary
        const summary = s.ai_summary.toLowerCase();
        let pattern = "Signal Active";
        let timeframe = "1H";
        if (summary.includes("breakout")) pattern = "Breakout";
        else if (summary.includes("rejection")) pattern = "Rejection";
        else if (summary.includes("bounce")) pattern = "Bounce";
        else if (summary.includes("divergence")) pattern = "Divergence";
        else if (summary.includes("crossover")) pattern = "EMA Crossover";
        else if (summary.includes("reversal")) pattern = "Reversal";
        if (summary.includes("4h") || summary.includes("4-hour")) timeframe = "4H";
        else if (summary.includes("daily")) timeframe = "Daily";
        else if (summary.includes("15m") || summary.includes("15 min")) timeframe = "15M";
        else if (summary.includes("1h") || summary.includes("1-hour")) timeframe = "1H";

        return {
          symbol: asset?.symbol || "",
          pattern,
          timeframe,
          direction: s.signal === "buy" ? "bullish" as const : "bearish" as const,
          suggestedEntry: s.entry_price,
          suggestedSL: s.stop_loss,
        };
      })
      .filter((p) => p.symbol);
  }, [signals, assets]);

  if (assetsLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Live Market Intelligence</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-96 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!assets?.length) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">Live Market Intelligence</h2>
      </div>

      {/* Pre-Trade Checklist */}
      <TradingChecklist />

      {/* News Impact Banner (top-level, not per-card) */}
      <NewsImpactBanner newsEvents={allNewsEvents} />

      {/* Pattern Alerts */}
      <PatternAlerts patterns={patternAlerts} />

      {/* Asset Cards */}
      {(() => {
        // Separate crypto (Binance-supported) from non-crypto
        const nonBinanceAssets = assets.filter(a => !BINANCE_SYMBOL_MAP[a.symbol]);
        const binanceAssets = assets.filter(a => !!BINANCE_SYMBOL_MAP[a.symbol]);
        const limitedNonBinance = maxCards != null ? nonBinanceAssets.slice(0, maxCards) : nonBinanceAssets;
        const limitedBinance = maxBinanceCards != null ? binanceAssets.slice(0, maxBinanceCards) : binanceAssets;
        const renderCard = (asset: Asset) => {
          const quote = quoteMap.get(asset.id);
          const ind = indicatorMap.get(asset.id);
          const sig = signalMap.get(asset.id);
          const metrics = metricsMap.get(asset.id);
          const marketClosed = isMarketClosedNow(asset.symbol);

          // Hauza scalping fallback — instant client-side signal when AI is missing or 'wait'
          const aiActive = sig && (sig.signal === "buy" || sig.signal === "sell");
          const hauzaScalp = useMemo(
            () => computeHauzaScalp(
              quote?.price,
              ind?.rsi_14 != null ? Number(ind.rsi_14) : null,
              ind?.trend,
              metrics?.day_high != null ? Number(metrics.day_high) : null,
              metrics?.day_low != null ? Number(metrics.day_low) : null,
              asset.symbol
            ),
            [quote?.price, ind?.rsi_14, ind?.trend, metrics?.day_high, metrics?.day_low, asset.symbol]
          );

          // If market is closed, force signal to wait. Otherwise prefer AI signal, else Hauza scalp.
          const effectiveSig: AiSignal | undefined = marketClosed
            ? undefined
            : aiActive
              ? sig
              : hauzaScalp.signal !== "wait"
                ? {
                    asset_id: asset.id,
                    signal: hauzaScalp.signal,
                    confidence: hauzaScalp.confidence,
                    ai_summary: hauzaScalp.reason,
                    entry_price: hauzaScalp.entry,
                    stop_loss: hauzaScalp.sl,
                    take_profit_1: hauzaScalp.tp,
                  }
                : sig;
          const glowClass = effectiveSig ? (SIGNAL_CARD_GLOW[effectiveSig.signal] || "") : "";

          return (
            <Card
              key={asset.id}
              className={`bg-card hover:border-primary/50 transition-all overflow-hidden rounded-xl ${glowClass} ${marketClosed ? "opacity-90" : ""}`}
            >
              <CardHeader className="pb-2 px-4 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{ASSET_ICONS[asset.symbol] || "📊"}</span>
                    <div>
                      <CardTitle className="text-base font-bold text-foreground">{asset.symbol}</CardTitle>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                        {asset.asset_type}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {marketClosed ? (
                      <Badge className="text-[10px] uppercase font-extrabold px-2 bg-muted text-muted-foreground border-border">
                        <Pause className="h-3 w-3 mr-1" /> Closed
                      </Badge>
                    ) : (
                      <>
                        {ind?.trend && (
                          <span className="flex items-center gap-1 text-[11px] font-bold capitalize">
                            {TREND_ICONS[ind.trend || "neutral"]}
                            <span className={ind.trend === "bullish" ? "text-success" : ind.trend === "bearish" ? "text-destructive" : "text-muted-foreground"}>
                              {ind.trend}
                            </span>
                          </span>
                        )}
                        {effectiveSig && (
                          <Badge className={`text-[10px] uppercase font-extrabold px-2 ${SIGNAL_COLORS[effectiveSig.signal] || ""}`}>
                            {effectiveSig.signal}
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-2.5 pt-0 px-4 pb-4">
                {/* Market Closed Banner */}
                {marketClosed && (
                  <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2">
                    <Pause className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-[11px] font-bold text-warning uppercase tracking-wider">Market Closed — Weekend</p>
                      <p className="text-[10px] text-foreground/70 leading-relaxed mt-0.5">
                        Forex & metals reopen Sunday 22:00 UTC. Signals resume when liquidity returns.
                      </p>
                    </div>
                  </div>
                )}

                {/* Price + Confidence */}
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-extrabold tabular-nums text-foreground">
                      {quote ? formatPrice(quote.price, asset.symbol) : "—"}
                    </span>
                    {quote?.change_percent_24h != null && (
                      <span className={`ml-2 text-sm font-bold ${
                        quote.change_percent_24h >= 0 ? "text-success" : "text-destructive"
                      }`}>
                        {quote.change_percent_24h >= 0 ? "+" : ""}
                        {quote.change_percent_24h.toFixed(2)}%
                      </span>
                    )}
                  </div>
                  {effectiveSig && !marketClosed && (
                    <span className="text-xs text-foreground/60 font-semibold">
                      {Math.round(effectiveSig.confidence)}% conf
                    </span>
                  )}
                </div>

                {/* RSI */}
                {ind?.rsi_14 != null && (
                  <div className="flex items-center justify-between text-xs bg-muted/30 rounded-lg px-3 py-1.5">
                    <span className="text-foreground/60 font-medium">RSI (14)</span>
                    <span className={`font-mono font-bold ${
                      Number(ind.rsi_14) > 70 ? "text-destructive" : Number(ind.rsi_14) < 30 ? "text-success" : "text-foreground"
                    }`}>
                      {Number(ind.rsi_14).toFixed(1)}
                      {Number(ind.rsi_14) > 70 && <span className="text-[9px] ml-1 text-destructive/70">Overbought</span>}
                      {Number(ind.rsi_14) < 30 && <span className="text-[9px] ml-1 text-success/70">Oversold</span>}
                    </span>
                  </div>
                )}

                {/* Session */}
                {metrics && <SessionBlock metrics={metrics} />}

                {/* 4H Block */}
                {metrics && <H4Block metrics={metrics} symbol={asset.symbol} />}

                {/* Day Range */}
                {metrics && <DayRangeBlock metrics={metrics} symbol={asset.symbol} />}

                {/* Key Levels */}
                {metrics && <LevelsBlock metrics={metrics} symbol={asset.symbol} />}

                {/* Botvio Signal Button — Hauza scalp or AI signal (suppressed when closed) */}
                {!marketClosed && <BotvioSignalButton sig={effectiveSig} symbol={asset.symbol} navigate={navigate} />}

                {effectiveSig && !marketClosed && (effectiveSig.signal === "buy" || effectiveSig.signal === "sell") && (
                  <div className="border-t border-border/40 pt-2 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Crosshair className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        {aiActive ? "AI Signal" : "Hauza Scalp"}
                      </span>
                      {!aiActive && (
                        <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-primary/40 text-primary">
                          M1 / M5
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                      <div className="bg-primary/10 border border-primary/20 rounded-lg px-2 py-1.5 text-center">
                        <div className="text-foreground/50 text-[9px] font-semibold uppercase">Entry</div>
                        <div className="font-bold text-foreground">{effectiveSig.entry_price ? formatPrice(Number(effectiveSig.entry_price), asset.symbol) : "—"}</div>
                      </div>
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-2 py-1.5 text-center">
                        <div className="text-foreground/50 text-[9px] font-semibold uppercase">SL</div>
                        <div className="font-bold text-destructive">{effectiveSig.stop_loss ? formatPrice(Number(effectiveSig.stop_loss), asset.symbol) : "—"}</div>
                      </div>
                      <div className="bg-success/10 border border-success/20 rounded-lg px-2 py-1.5 text-center">
                        <div className="text-foreground/50 text-[9px] font-semibold uppercase">TP1</div>
                        <div className="font-bold text-success">{effectiveSig.take_profit_1 ? formatPrice(Number(effectiveSig.take_profit_1), asset.symbol) : "—"}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tip */}
                {metrics && !marketClosed && <TipBlock tip={metrics.market_tip} breakoutPrice={metrics.resistance_1 != null ? Number(metrics.resistance_1) : null} symbol={asset.symbol} />}

                {/* AI Summary */}
                {effectiveSig?.ai_summary && !marketClosed && (
                  <p className="text-[11px] text-foreground/60 line-clamp-2 border-t border-border/30 pt-2 leading-relaxed">
                    {effectiveSig.ai_summary}
                  </p>
                )}

                {/* Exness CTA — forex/metals only */}
                {exnessLink && !BINANCE_SYMBOL_MAP[asset.symbol] && (
                  <a
                    href={exnessLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 text-[11px] font-bold py-2 rounded-lg bg-accent/10 border border-accent/30 text-accent-foreground hover:bg-accent/20 transition-all"
                  >
                    🏦 Open Forex Account — Best Broker
                  </a>
                )}

                {/* Binance CTA — crypto only */}
                {BINANCE_SYMBOL_MAP[asset.symbol] && (
                  <a
                    href={binanceLink || `https://www.binance.com/en/trade/${BINANCE_SYMBOL_MAP[asset.symbol]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 text-[11px] font-bold py-2 rounded-lg bg-[hsl(45,100%,51%)]/10 border border-[hsl(45,100%,51%)]/30 text-[hsl(45,100%,41%)] hover:bg-[hsl(45,100%,51%)]/20 transition-all"
                  >
                    🔶 Trade {BINANCE_SYMBOL_MAP[asset.symbol]} on Binance — Best Exchange
                  </a>
                )}

                {/* Bottom Buttons */}
                {(() => {
                  const binancePair = BINANCE_SYMBOL_MAP[asset.symbol];
                  const hasBinance = !!binancePair;
                  const binanceUrl = binanceLink
                    ? `${binanceLink}`
                    : `https://www.binance.com/en/trade/${binancePair}`;

                  return (
                    <div className={`grid gap-1.5 pt-1 border-t border-border/30 ${hasBinance ? "grid-cols-4" : "grid-cols-3"}`}>
                      <button
                        onClick={() => navigate(`/chart/${asset.symbol.replace("/", "")}`)}
                        className="text-[10px] font-bold py-1.5 rounded-lg bg-primary/10 border border-primary/25 text-primary hover:bg-primary/20 transition-all"
                      >
                        📈 Chart
                      </button>
                      <button
                        className="text-[10px] font-bold py-1.5 rounded-lg bg-muted/50 border border-border/30 text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                      >
                        🔔 Alert
                      </button>
                      <button
                        onClick={() => {
                          const lines: string[] = [];
                          lines.push(`📊 *${asset.symbol}*${sig ? ` — *${sig.signal.toUpperCase()}*` : ""}`);
                          if (quote) {
                            lines.push(`💰 Price: ${formatPrice(quote.price, asset.symbol)}${quote.change_percent_24h != null ? ` (${quote.change_percent_24h >= 0 ? "+" : ""}${quote.change_percent_24h.toFixed(2)}%)` : ""}`);
                          }
                          if (ind?.trend) lines.push(`📈 Trend: ${ind.trend.charAt(0).toUpperCase() + ind.trend.slice(1)}`);
                          if (ind?.rsi_14 != null) lines.push(`⚡ RSI: ${Number(ind.rsi_14).toFixed(1)}${Number(ind.rsi_14) > 70 ? " (Overbought)" : Number(ind.rsi_14) < 30 ? " (Oversold)" : ""}`);
                          if (sig?.confidence) lines.push(`🎯 Confidence: ${Math.round(sig.confidence)}%`);
                          if (sig?.entry_price) lines.push(`🟢 Entry: ${formatPrice(Number(sig.entry_price), asset.symbol)}`);
                          if (sig?.stop_loss) lines.push(`🔴 SL: ${formatPrice(Number(sig.stop_loss), asset.symbol)}`);
                          if (sig?.take_profit_1) lines.push(`🟢 TP1: ${formatPrice(Number(sig.take_profit_1), asset.symbol)}`);
                          
                          if (metrics?.support_1 || metrics?.resistance_1) {
                            lines.push(`📐 S1: ${metrics.support_1 ? formatPrice(Number(metrics.support_1), asset.symbol) : "—"} | R1: ${metrics.resistance_1 ? formatPrice(Number(metrics.resistance_1), asset.symbol) : "—"}`);
                          }
                          if (sig?.ai_summary) lines.push(`\n💡 ${sig.ai_summary.slice(0, 150)}`);
                          lines.push(`\n🔗 View chart: https://botvio.live/chart/${asset.symbol.replace("/", "")}`);
                          lines.push(`\n🖼️ https://botvio.live/botvio-logo.png`);
                          lines.push(`_Powered by Botvio — AI Trading Signals_`);
                          const text = encodeURIComponent(lines.join("\n"));
                          window.open(`https://wa.me/?text=${text}`, "_blank");
                        }}
                        className="text-[10px] font-bold py-1.5 rounded-lg bg-success/10 border border-success/25 text-success hover:bg-success/20 transition-all"
                      >
                        💬 Share
                      </button>
                      {hasBinance && (
                        <a
                          href={binanceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1 text-[10px] font-bold py-1.5 rounded-lg bg-[hsl(45,100%,51%)]/10 border border-[hsl(45,100%,51%)]/30 text-[hsl(45,100%,41%)] hover:bg-[hsl(45,100%,51%)]/20 transition-all"
                        >
                          🔶 Binance
                        </a>
                      )}
                    </div>
                  );
                })()}

                {/* Empty state */}
                {!quote && !sig && !metrics && (
                  <div className="text-center py-4">
                    <Target className="h-8 w-8 text-muted-foreground/30 mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Awaiting market data</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        };

        // Home mode: show specific ordered subset (merged, no sections)
        if (homeMode) {
          const orderedAssets = HOME_PREFERRED_ORDER
            .map(sym => assets.find(a => a.symbol === sym))
            .filter(Boolean) as Asset[];
          const freePreview = isBasicOrAbove ? orderedAssets : orderedAssets.slice(0, 6);
          return (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {freePreview.map(renderCard)}
              </div>
              {!isBasicOrAbove && !gateLoading && (
                <UpgradePrompt feature="Live Market Intelligence" requiredPlan="Basic" className="mt-4" />
              )}
            </>
          );
        }

        if (!isBasicOrAbove && !gateLoading) {
          const preview = limitedNonBinance.slice(0, 2);
          return (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {preview.map(renderCard)}
              </div>
              <UpgradePrompt feature="Full Market Intelligence" requiredPlan="Basic" className="mt-4" />
            </>
          );
        }

        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {limitedNonBinance.map(renderCard)}
            </div>
            {limitedBinance.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🔶</span>
                  <h3 className="text-lg font-bold text-foreground">Binance Markets</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {limitedBinance.map(renderCard)}
                </div>
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
}
