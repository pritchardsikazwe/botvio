import { describe, expect, it } from "vitest";
import { studioCandles, studioOffset, studioSymbols, studioSymbolCandidates } from "./weltradeHistory";

describe("automatic Weltrade history", () => {
  it("resolves only actual broker symbol variants", () => {
    const symbols = studioSymbols({ data: { symbols: [{ Symbol: "GainX 400.m" }, { name: "FlipX 1" }] } });
    expect(studioSymbolCandidates("GainX 400", symbols)).toEqual(["GainX 400.m"]);
    expect(studioSymbolCandidates("PainX 999", symbols)).toEqual([]);
  });
  it("normalizes broker local dates and price fields without inventing candles", () => {
    const candles = studioCandles({ data: [{ Date: "2026-10-09T12:00:00", OpenPrice: 10, HighPrice: 12, LowPrice: 9, ClosePrice: 11 }] }, 7200);
    expect(candles[0]?.time).toBe(Date.parse("2026-10-09T10:00:00Z") / 1000);
    expect(candles[0]?.close).toBe(11);
    expect(studioCandles([])).toEqual([]);
    expect(studioCandles([{ time: 1000, open: 10, high: 8, low: 12, close: 11 }])).toEqual([]);
  });
  it("uses a current quote offset but never shifts by a stale quote's age", () => {
    const now = Date.parse("2026-10-09T10:00:00Z");
    expect(studioOffset({ time: "2026-10-09T12:00:00" }, now)).toBe(7200);
    expect(studioOffset({ time: "2026-10-01T12:00:00" }, now)).toBe(0);
  });
});