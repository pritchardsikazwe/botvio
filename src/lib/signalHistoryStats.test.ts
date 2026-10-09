import { describe, expect, it } from "vitest";
import { calculateSignalHistoryStats } from "./signalHistoryStats";

describe("calculateSignalHistoryStats", () => {
  it("uses only WIN and LOSS in the win-rate denominator", () => {
    const stats = calculateSignalHistoryStats([
      { id: "1", result: "WIN", profit_pips: 12 },
      { id: "2", result: "LOSS", profit_pips: -5 },
      { id: "3", result: "EXPIRED", profit_pips: 100 },
      { id: "4", result: "PENDING", profit_pips: 50 },
    ]);
    expect(stats.settled).toBe(2);
    expect(stats.winRate).toBe(50);
    expect(stats.expired).toBe(1);
    expect(stats.unresolved).toBe(1);
    expect(stats.netPips).toBe(7);
  });

  it("returns null win rate when there are no settled outcomes", () => {
    const stats = calculateSignalHistoryStats([{ id: "1", result: "EXPIRED", profit_pips: null }]);
    expect(stats.winRate).toBeNull();
    expect(stats.netPips).toBe(0);
  });

  it("ignores missing and non-finite pips in settled outcomes and reports missing values", () => {
    const stats = calculateSignalHistoryStats([
      { id: "1", result: "WIN", profit_pips: 3 },
      { id: "2", result: "LOSS", profit_pips: null },
      { id: "3", result: "LOSS", profit_pips: Number.NaN },
    ]);
    expect(stats.netPips).toBe(3);
    expect(stats.pipsMissing).toBe(2);
  });

  it("deduplicates rows by id before calculating statistics", () => {
    const stats = calculateSignalHistoryStats([
      { id: "1", result: "WIN", profit_pips: 4 },
      { id: "1", result: "WIN", profit_pips: 4 },
      { id: "2", result: "LOSS", profit_pips: -2 },
    ]);
    expect(stats.total).toBe(2);
    expect(stats.wins).toBe(1);
    expect(stats.duplicateRowsRemoved).toBe(1);
    expect(stats.netPips).toBe(2);
  });

  it("counts unknown result labels as unresolved", () => {
    const stats = calculateSignalHistoryStats([{ id: "1", result: "MYSTERY", profit_pips: 900 }]);
    expect(stats.unresolved).toBe(1);
    expect(stats.settled).toBe(0);
    expect(stats.netPips).toBe(0);
  });
});
