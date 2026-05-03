import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Rocket, Bomb, RefreshCw, Shuffle, Zap, BarChart3, ExternalLink } from "lucide-react";
import { SyntxBridgeChart } from "@/components/weltrade/SyntxBridgeChart";

const WELTRADE_LINK = "https://gowt.net/ib67505";

type SyntxCategory = "GainX" | "PainX" | "FlipX" | "SwitchX" | "FX";

interface SyntxInst {
  key: string;
  label: string;          // MT5 symbol
  category: SyntxCategory;
  bias: "buy" | "sell" | "both";
  blurb: string;
}

const SYNTX: SyntxInst[] = [
  // GainX (sell bias — boom-style)
  { key: "gainx-400", label: "GainX 400", category: "GainX", bias: "sell", blurb: "Frequent upward spikes — sell bias scalping." },
  { key: "gainx-600", label: "GainX 600", category: "GainX", bias: "sell", blurb: "Mid-range gainx — balanced spikes." },
  { key: "gainx-800", label: "GainX 800", category: "GainX", bias: "sell", blurb: "Slow-burn — larger moves between spikes." },
  // PainX (buy bias — crash-style)
  { key: "painx-400", label: "PainX 400", category: "PainX", bias: "buy", blurb: "Frequent downward spikes — buy bias scalping." },
  { key: "painx-600", label: "PainX 600", category: "PainX", bias: "buy", blurb: "Mid-range painx — balanced setups." },
  { key: "painx-800", label: "PainX 800", category: "PainX", bias: "buy", blurb: "Slow-burn crash — larger move setups." },
  // FlipX
  { key: "flipx-1", label: "FlipX 1", category: "FlipX", bias: "both", blurb: "Reversal-driven — fastest flip cadence." },
  { key: "flipx-2", label: "FlipX 2", category: "FlipX", bias: "both", blurb: "Quick flips with steady volatility." },
  { key: "flipx-3", label: "FlipX 3", category: "FlipX", bias: "both", blurb: "Balanced flip behaviour." },
  { key: "flipx-4", label: "FlipX 4", category: "FlipX", bias: "both", blurb: "Slower flips — cleaner structure." },
  { key: "flipx-5", label: "FlipX 5", category: "FlipX", bias: "both", blurb: "Slowest flips — wider swings." },
  // SwitchX
  { key: "switchx-600",  label: "SwitchX 600",  category: "SwitchX", bias: "both", blurb: "Phase switches every ~600 ticks." },
  { key: "switchx-1200", label: "SwitchX 1200", category: "SwitchX", bias: "both", blurb: "Mid-cycle phase switches." },
  { key: "switchx-1800", label: "SwitchX 1800", category: "SwitchX", bias: "both", blurb: "Slow phase rotations — trend setups." },
  // FX
  { key: "fx-20", label: "FX 20", category: "FX", bias: "both", blurb: "Low-noise FX index — clean structure." },
  { key: "fx-40", label: "FX 40", category: "FX", bias: "both", blurb: "Balanced FX volatility." },
  { key: "fx-80", label: "FX 80", category: "FX", bias: "both", blurb: "Higher volatility FX — aggressive setups." },
];

const CATEGORY_META: Record<SyntxCategory, { icon: typeof Rocket; tone: string }> = {
  GainX:   { icon: Rocket,   tone: "text-emerald-400 border-emerald-500/40" },
  PainX:   { icon: Bomb,     tone: "text-red-400 border-red-500/40" },
  FlipX:   { icon: RefreshCw,tone: "text-amber-400 border-amber-500/40" },
  SwitchX: { icon: Shuffle,  tone: "text-blue-400 border-blue-500/40" },
  FX:      { icon: Zap,      tone: "text-purple-400 border-purple-500/40" },
};

export function SyntxChartSection() {
  const [activeKey, setActiveKey] = useState<string>(SYNTX[0].key);
  const [filter, setFilter] = useState<SyntxCategory | "all">("all");

  const active = useMemo(() => SYNTX.find((s) => s.key === activeKey) ?? SYNTX[0], [activeKey]);
  const filtered = useMemo(
    () => (filter === "all" ? SYNTX : SYNTX.filter((s) => s.category === filter)),
    [filter],
  );

  return (
    <div className="space-y-6">
      {/* Active chart + info */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-1 bg-card border-border/50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold text-foreground">{active.label}</span>
              <Badge variant="outline" className={`text-[10px] ${CATEGORY_META[active.category].tone}`}>
                {active.category}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{active.blurb}</p>
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary uppercase">
              {active.bias === "buy" ? "Buy bias" : active.bias === "sell" ? "Sell bias" : "Both"}
            </Badge>
            <a href={WELTRADE_LINK} target="_blank" rel="noopener noreferrer" className="block">
              <Button variant="gold" className="w-full font-bold text-xs">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Trade on Weltrade
              </Button>
            </a>
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          <SyntxBridgeChart symbol={active.label} label={active.label} height={460} />
          <p className="text-[11px] text-muted-foreground mt-2 px-2">
            🔌 Live prices stream from your Weltrade MT5 terminal via the BOTVIO Bridge EA. Add this symbol to MT5 Market Watch to see the feed.
          </p>
        </div>
      </div>

      {/* Category filter */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList className="bg-card border border-border/50 h-10 flex-wrap">
          <TabsTrigger value="all" className="text-xs gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> All</TabsTrigger>
          <TabsTrigger value="GainX" className="text-xs gap-1.5"><Rocket className="h-3.5 w-3.5" /> GainX</TabsTrigger>
          <TabsTrigger value="PainX" className="text-xs gap-1.5"><Bomb className="h-3.5 w-3.5" /> PainX</TabsTrigger>
          <TabsTrigger value="FlipX" className="text-xs gap-1.5"><RefreshCw className="h-3.5 w-3.5" /> FlipX</TabsTrigger>
          <TabsTrigger value="SwitchX" className="text-xs gap-1.5"><Shuffle className="h-3.5 w-3.5" /> SwitchX</TabsTrigger>
          <TabsTrigger value="FX" className="text-xs gap-1.5"><Zap className="h-3.5 w-3.5" /> FX</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Instrument grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((inst) => {
          const meta = CATEGORY_META[inst.category];
          const CatIcon = meta.icon;
          const isActive = inst.key === active.key;
          return (
            <button
              key={inst.key}
              onClick={() => setActiveKey(inst.key)}
              className={`text-left rounded-xl border-2 p-3 transition-all ${
                isActive
                  ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                  : "border-border/50 bg-card hover:border-primary/40"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <CatIcon className={`h-4 w-4 ${meta.tone.split(" ")[0]} shrink-0`} />
                  <span className="text-xs font-bold text-foreground truncate">{inst.label}</span>
                </div>
                <Badge variant="outline" className={`text-[9px] ${meta.tone} font-mono shrink-0`}>
                  {inst.category}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground line-clamp-2">{inst.blurb}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <Badge variant="outline" className="text-[9px] border-emerald-500/40 text-emerald-400">
                  <Activity className="h-2.5 w-2.5 mr-0.5" /> Bridge Feed
                </Badge>
                <Badge variant="outline" className="text-[9px] border-primary/30 text-primary uppercase">
                  {inst.bias === "buy" ? "Buy" : inst.bias === "sell" ? "Sell" : "Both"}
                </Badge>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const SYNTX_INSTRUMENTS = SYNTX;
