export interface SignalHistoryStatsRow {
  id: string;
  result: string | null;
  profit_pips: number | null;
}

const SETTLED_RESULTS = new Set(["WIN", "LOSS"]);
const EXPIRED_RESULTS = new Set(["EXPIRED"]);
const UNRESOLVED_RESULTS = new Set(["OPEN", "ACTIVE", "PENDING", "UNRESOLVED"]);

function normalizeResult(result: string | null | undefined): string {
  return (result ?? "").trim().toUpperCase();
}

/**
 * Summarizes the rows fetched for the reporting window.
 * Only WIN/LOSS rows contribute to win rate and net pips.
 * This is reporting hygiene, not proof that settlement outcomes are correct.
 */
export function calculateSignalHistoryStats(input: SignalHistoryStatsRow[]) {
  const uniqueRows = [...new Map(input.map((row) => [row.id, row])).values()];
  const wins = uniqueRows.filter((row) => normalizeResult(row.result) === "WIN").length;
  const losses = uniqueRows.filter((row) => normalizeResult(row.result) === "LOSS").length;
  const expired = uniqueRows.filter((row) => EXPIRED_RESULTS.has(normalizeResult(row.result))).length;
  const unresolved = uniqueRows.filter((row) => {
    const result = normalizeResult(row.result);
    return UNRESOLVED_RESULTS.has(result) || (!SETTLED_RESULTS.has(result) && !EXPIRED_RESULTS.has(result));
  }).length;
  const settledRows = uniqueRows.filter((row) => SETTLED_RESULTS.has(normalizeResult(row.result)));
  const netPips = settledRows.reduce((sum, row) => {
    const pips = row.profit_pips;
    return typeof pips === "number" && Number.isFinite(pips) ? sum + pips : sum;
  }, 0);
  const pipsMissing = settledRows.filter((row) => typeof row.profit_pips !== "number" || !Number.isFinite(row.profit_pips)).length;
  const settled = wins + losses;

  return {
    total: uniqueRows.length,
    settled,
    wins,
    losses,
    expired,
    unresolved,
    winRate: settled > 0 ? (wins / settled) * 100 : null,
    netPips,
    pipsMissing,
    duplicateRowsRemoved: input.length - uniqueRows.length,
  };
}
