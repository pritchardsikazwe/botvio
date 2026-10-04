import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export type SignalPerformance = {
  total: number;
  wins: number;
  losses: number;
  winRate: number;
  profitFactor: number;
  expectancyR: number;
  recentLosses: number;
};

export type PerformanceIndex = Map<string, SignalPerformance>;

const keyOf = (symbol: string, timeframe: string, strategy?: string) =>
  [symbol, timeframe, strategy ?? "*"].map((x) => String(x ?? "").toLowerCase()).join("|");

function add(map: Map<string, { rows: any[] }>, key: string, row: any) {
  const bucket = map.get(key) ?? { rows: [] };
  bucket.rows.push(row);
  map.set(key, bucket);
}

function summarize(rows: any[]): SignalPerformance {
  const settled = rows.filter((r) => ["win", "loss"].includes(String(r.outcome ?? "").toLowerCase()));
  const wins = settled.filter((r) => String(r.outcome).toLowerCase() === "win").length;
  const losses = settled.length - wins;
  let grossWinR = 0;
  let grossLossR = 0;
  for (const r of settled) {
    const entry = Number(r.entry_price);
    const sl = Number(r.stop_loss);
    const tp = Number(r.take_profit);
    const risk = Math.abs(entry - sl);
    if (!Number.isFinite(risk) || risk <= 0) continue;
    const reward = Math.abs(tp - entry);
    if (String(r.outcome).toLowerCase() === "win") grossWinR += reward / risk;
    else grossLossR += 1;
  }
  const ordered = [...settled].sort((a, b) => new Date(b.outcome_updated_at ?? b.created_at).getTime() - new Date(a.outcome_updated_at ?? a.created_at).getTime());
  let recentLosses = 0;
  for (const r of ordered) {
    if (String(r.outcome).toLowerCase() !== "loss") break;
    recentLosses++;
  }
  return {
    total: settled.length,
    wins,
    losses,
    winRate: settled.length ? (wins / settled.length) * 100 : 0,
    profitFactor: grossLossR > 0 ? grossWinR / grossLossR : grossWinR > 0 ? 99 : 0,
    expectancyR: settled.length ? (grossWinR - grossLossR) / settled.length : 0,
    recentLosses,
  };
}

export async function loadPerformanceIndex(db: SupabaseClient, limit = 5000): Promise<PerformanceIndex> {
  const { data, error } = await db
    .from("trading_signals")
    .select("symbol,timeframe,strategy_name,outcome,entry_price,stop_loss,take_profit,created_at,outcome_updated_at")
    .in("outcome", ["WIN", "LOSS", "win", "loss"])
    .order("outcome_updated_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`performance query failed: ${error.message}`);

  const buckets = new Map<string, { rows: any[] }>();
  for (const row of data ?? []) {
    add(buckets, keyOf(row.symbol, row.timeframe, row.strategy_name), row);
    add(buckets, keyOf(row.symbol, row.timeframe, "*"), row);
    add(buckets, keyOf(row.symbol, "*", "*"), row);
  }

  const index: PerformanceIndex = new Map();
  for (const [key, bucket] of buckets) index.set(key, summarize(bucket.rows));
  return index;
}

export function getPerformance(index: PerformanceIndex, symbol: string, timeframe: string, strategy?: string): SignalPerformance {
  return index.get(keyOf(symbol, timeframe, strategy))
    ?? index.get(keyOf(symbol, timeframe, "*"))
    ?? index.get(keyOf(symbol, "*", "*"))
    ?? { total: 0, wins: 0, losses: 0, winRate: 0, profitFactor: 0, expectancyR: 0, recentLosses: 0 };
}

/**
 * Gate new signals using completed historical outcomes.
 * We deliberately require a meaningful sample before suppressing an asset.
 * This optimises for expectancy/profit factor, not raw win rate alone.
 */
export function performanceGate(index: PerformanceIndex, symbol: string, timeframe: string, strategy?: string) {
  const p = getPerformance(index, symbol, timeframe, strategy);
  if (p.total < 20) return { allowed: true, scoreBoost: 0, pauseMinutes: 0, reason: "insufficient sample" as const, performance: p };

  if (p.recentLosses >= 3) {
    return { allowed: false, scoreBoost: 8, pauseMinutes: 30, reason: "3 consecutive losses" as const, performance: p };
  }
  if (p.total >= 30 && p.profitFactor < 0.85 && p.expectancyR <= 0) {
    return { allowed: false, scoreBoost: 8, pauseMinutes: 60, reason: "negative expectancy / weak profit factor" as const, performance: p };
  }
  if (p.winRate < 40 && p.expectancyR <= 0) {
    return { allowed: false, scoreBoost: 7, pauseMinutes: 60, reason: "low win rate with negative expectancy" as const, performance: p };
  }

  let scoreBoost = 0;
  if (p.winRate < 48 || p.profitFactor < 1) scoreBoost += 5;
  if (p.winRate >= 55 && p.profitFactor >= 1.2 && p.expectancyR > 0) scoreBoost -= 2;
  return { allowed: true, scoreBoost, pauseMinutes: 0, reason: "performance eligible" as const, performance: p };
}
