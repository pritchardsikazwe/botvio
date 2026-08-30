import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Botvio trading calculators.
 * Pure client-side maths on user-entered values — no market data is invented
 * and nothing here touches the trading engines or broker APIs.
 */

const num = (v: string) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const fmt = (n: number, digits = 2) =>
  Number.isFinite(n) && n !== 0 ? n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits }) : "--";

const Field = ({
  label,
  value,
  onChange,
  suffix,
  step = "any",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  step?: string;
  placeholder?: string;
}) => (
  <div className="space-y-1.5">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    <div className="relative">
      <Input
        type="number"
        inputMode="decimal"
        step={step}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="pr-12 font-mono"
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-muted-foreground">
          {suffix}
        </span>
      )}
    </div>
  </div>
);

const Result = ({ rows }: { rows: { label: string; value: string; accent?: boolean }[] }) => (
  <dl className="mt-4 divide-y divide-border/60 rounded-xl border border-border/60 bg-background/40">
    {rows.map((r) => (
      <div key={r.label} className="flex items-baseline justify-between gap-3 px-3.5 py-2.5">
        <dt className="text-xs text-muted-foreground">{r.label}</dt>
        <dd className={`font-mono text-sm font-semibold tabular-nums ${r.accent ? "text-primary" : "text-foreground"}`}>
          {r.value}
        </dd>
      </div>
    ))}
  </dl>
);

/** Standard pip value per lot for a quote-currency = account-currency pair. */
const PIP_SIZES: Record<string, number> = {
  "Forex (5-digit, e.g. EUR/USD)": 0.0001,
  "JPY pairs (3-digit)": 0.01,
  "Gold XAU/USD": 0.01,
  "Indices / CFDs (1 point)": 1,
};

export const PositionSizeCalculator = () => {
  const [balance, setBalance] = useState("1000");
  const [risk, setRisk] = useState("1");
  const [stop, setStop] = useState("30");
  const [pipValue, setPipValue] = useState("10");

  const riskAmount = (num(balance) * num(risk)) / 100;
  const lots = num(stop) > 0 && num(pipValue) > 0 ? riskAmount / (num(stop) * num(pipValue)) : 0;

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Account balance" value={balance} onChange={setBalance} suffix="USD" />
        <Field label="Risk per trade" value={risk} onChange={setRisk} suffix="%" />
        <Field label="Stop loss distance" value={stop} onChange={setStop} suffix="pips" />
        <Field label="Pip value per 1.00 lot" value={pipValue} onChange={setPipValue} suffix="USD" />
      </div>
      <Result
        rows={[
          { label: "Risk amount", value: `${fmt(riskAmount)} USD` },
          { label: "Position size", value: `${fmt(lots, 2)} lots`, accent: true },
          { label: "Mini lots", value: fmt(lots * 10, 2) },
          { label: "Micro lots", value: fmt(lots * 100, 2) },
        ]}
      />
    </div>
  );
};

export const PipCalculator = () => {
  const [instrument, setInstrument] = useState(Object.keys(PIP_SIZES)[0]);
  const [lots, setLots] = useState("1");
  const [contract, setContract] = useState("100000");
  const [pips, setPips] = useState("10");

  const pipSize = PIP_SIZES[instrument];
  const perPip = pipSize * num(contract) * num(lots);
  const total = perPip * num(pips);

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs text-muted-foreground">Instrument type</Label>
          <Select value={instrument} onValueChange={setInstrument}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.keys(PIP_SIZES).map((k) => (
                <SelectItem key={k} value={k}>{k}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Field label="Contract size (1.00 lot)" value={contract} onChange={setContract} suffix="units" />
        <Field label="Lots" value={lots} onChange={setLots} suffix="lots" />
        <Field label="Move" value={pips} onChange={setPips} suffix="pips" />
      </div>
      <Result
        rows={[
          { label: "Pip / point size", value: String(pipSize) },
          { label: "Value per pip", value: `${fmt(perPip)} quote ccy`, accent: true },
          { label: `Value of ${num(pips) || 0} pips`, value: `${fmt(total)} quote ccy` },
        ]}
      />
    </div>
  );
};

export const ProfitCalculator = () => {
  const [entry, setEntry] = useState("2400");
  const [exit, setExit] = useState("2415");
  const [lots, setLots] = useState("1");
  const [contract, setContract] = useState("100");
  const [side, setSide] = useState<"buy" | "sell">("buy");

  const move = side === "buy" ? num(exit) - num(entry) : num(entry) - num(exit);
  const pnl = move * num(contract) * num(lots);
  const pct = num(entry) > 0 ? (move / num(entry)) * 100 : 0;

  return (
    <div>
      <div className="mb-3 flex gap-2">
        {(["buy", "sell"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSide(s)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
              side === s
                ? s === "buy"
                  ? "border-success/50 bg-success/15 text-success"
                  : "border-destructive/50 bg-destructive/15 text-destructive"
                : "border-border/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Entry price" value={entry} onChange={setEntry} />
        <Field label="Exit price" value={exit} onChange={setExit} />
        <Field label="Lots" value={lots} onChange={setLots} suffix="lots" />
        <Field label="Contract size (1.00 lot)" value={contract} onChange={setContract} suffix="units" />
      </div>
      <Result
        rows={[
          { label: "Price move", value: fmt(move, 4) },
          { label: "Move %", value: `${fmt(pct, 2)} %` },
          { label: "Profit / loss", value: `${fmt(pnl)} quote ccy`, accent: true },
        ]}
      />
    </div>
  );
};

export const MarginCalculator = () => {
  const [price, setPrice] = useState("1.1000");
  const [lots, setLots] = useState("1");
  const [contract, setContract] = useState("100000");
  const [leverage, setLeverage] = useState("500");

  const notional = num(price) * num(contract) * num(lots);
  const margin = num(leverage) > 0 ? notional / num(leverage) : 0;

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Market price" value={price} onChange={setPrice} />
        <Field label="Lots" value={lots} onChange={setLots} suffix="lots" />
        <Field label="Contract size (1.00 lot)" value={contract} onChange={setContract} suffix="units" />
        <Field label="Leverage" value={leverage} onChange={setLeverage} suffix=": 1" />
      </div>
      <Result
        rows={[
          { label: "Notional exposure", value: fmt(notional) },
          { label: "Required margin", value: fmt(margin), accent: true },
        ]}
      />
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        Brokers apply their own margin tiers, symbol-specific leverage and stop-out levels. Always confirm the figure in
        your broker terminal before sizing a position.
      </p>
    </div>
  );
};

export const RiskRewardCalculator = () => {
  const [entry, setEntry] = useState("2400");
  const [sl, setSl] = useState("2390");
  const [tp, setTp] = useState("2430");
  const [winRate, setWinRate] = useState("50");

  const riskDist = Math.abs(num(entry) - num(sl));
  const rewardDist = Math.abs(num(tp) - num(entry));
  const rr = riskDist > 0 ? rewardDist / riskDist : 0;
  const p = num(winRate) / 100;
  const expectancy = p * rr - (1 - p);
  const breakEvenWr = rr > 0 ? (1 / (1 + rr)) * 100 : 0;

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Entry" value={entry} onChange={setEntry} />
        <Field label="Stop loss" value={sl} onChange={setSl} />
        <Field label="Take profit" value={tp} onChange={setTp} />
        <Field label="Assumed win rate" value={winRate} onChange={setWinRate} suffix="%" />
      </div>
      <Result
        rows={[
          { label: "Risk distance", value: fmt(riskDist, 4) },
          { label: "Reward distance", value: fmt(rewardDist, 4) },
          { label: "Risk / reward", value: rr > 0 ? `1 : ${fmt(rr, 2)}` : "--", accent: true },
          { label: "Break-even win rate", value: `${fmt(breakEvenWr, 1)} %` },
          { label: "Expectancy (R per trade)", value: fmt(expectancy, 2) },
        ]}
      />
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        Win rate is your own assumption — Botvio does not publish or guarantee win rates.
      </p>
    </div>
  );
};

export const CompoundingPlanner = () => {
  const [start, setStart] = useState("500");
  const [gain, setGain] = useState("2");
  const [periods, setPeriods] = useState("50");

  const rows = useMemo(() => {
    const g = num(gain) / 100;
    const n = Math.min(Math.max(Math.round(num(periods)), 0), 1000);
    const end = num(start) * Math.pow(1 + g, n);
    return { end, growth: num(start) > 0 ? ((end - num(start)) / num(start)) * 100 : 0, n };
  }, [start, gain, periods]);

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Starting equity" value={start} onChange={setStart} suffix="USD" />
        <Field label="Gain per period" value={gain} onChange={setGain} suffix="%" />
        <Field label="Periods" value={periods} onChange={setPeriods} suffix="×" />
      </div>
      <Result
        rows={[
          { label: `Equity after ${rows.n} periods`, value: `${fmt(rows.end)} USD`, accent: true },
          { label: "Total growth", value: `${fmt(rows.growth, 1)} %` },
        ]}
      />
      <div className="mt-3 flex items-start gap-2">
        <Badge variant="outline" className="mt-0.5 shrink-0 text-[10px] uppercase">Illustration</Badge>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Compounding maths only. Real results include losing periods, spread, swaps and drawdown — this is not a
          projection of Botvio performance.
        </p>
      </div>
    </div>
  );
};

export const DrawdownRecoveryCalculator = () => {
  const [dd, setDd] = useState("20");
  const [gainPerTrade, setGainPerTrade] = useState("2");

  const d = Math.min(Math.max(num(dd), 0), 99.9) / 100;
  const needed = d > 0 ? (d / (1 - d)) * 100 : 0;
  const g = num(gainPerTrade) / 100;
  const trades = g > 0 && d > 0 ? Math.log(1 / (1 - d)) / Math.log(1 + g) : 0;

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Current drawdown" value={dd} onChange={setDd} suffix="%" />
        <Field label="Average gain per trade" value={gainPerTrade} onChange={setGainPerTrade} suffix="%" />
      </div>
      <Result
        rows={[
          { label: "Gain needed to recover", value: `${fmt(needed, 2)} %`, accent: true },
          { label: "Winning trades required", value: trades > 0 ? fmt(trades, 1) : "--" },
        ]}
      />
    </div>
  );
};
