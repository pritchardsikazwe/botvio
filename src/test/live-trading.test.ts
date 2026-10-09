import { describe, expect, it } from "vitest";
import { closedTradeResult, tradeFeedForSymbol } from "@/lib/liveTrading";
import { WELTRADE_INSTRUMENTS } from "@/config/weltradeInstruments";

describe("Home live trading", () => {
  it("routes every configured SyntX family to Weltrade SyntX, including broker suffixes", () => {
    for (const instrument of WELTRADE_INSTRUMENTS.filter((item) => item.category === "syntx")) {
      expect(tradeFeedForSymbol(`${instrument.mt5Symbol}.m`, "weltrade")).toBe("syntx");
    }
  });
  it("keeps Deriv synthetic and ordinary Weltrade markets separate", () => {
    expect(tradeFeedForSymbol("Volatility 100 Index", "deriv")).toBe("deriv");
    expect(tradeFeedForSymbol("R_75")).toBe("deriv");
    expect(tradeFeedForSymbol("XAUUSD", "weltrade")).toBe("weltrade");
  });
  it("never invents wins from an absent profit", () => {
    expect(closedTradeResult(null)).toBe("Closed");
    expect(closedTradeResult(Number.NaN)).toBe("Closed");
    expect(closedTradeResult(12)).toBe("Win");
    expect(closedTradeResult(-3)).toBe("Loss");
    expect(closedTradeResult(0)).toBe("Break-even");
  });
});