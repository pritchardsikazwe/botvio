import { describe, it, expect } from "vitest";
import { commissionFor, bonusesEarned, canRequestPayout, referralsToNextBonus } from "@/lib/referEarn";

describe("refer and earn rules", () => {
  it("pays 15% of each subscription payment", () => {
    expect(commissionFor(39)).toBe(5.85);
    expect(commissionFor(19)).toBe(2.85);
  });
  it("adds $10 for every 10 paying referrals", () => {
    expect(bonusesEarned(9)).toBe(0);
    expect(bonusesEarned(10)).toBe(10);
    expect(bonusesEarned(21)).toBe(20);
    expect(referralsToNextBonus(7)).toBe(3);
  });
  it("requires at least $5 to pay out", () => {
    expect(canRequestPayout(4.99)).toBe(false);
    expect(canRequestPayout(5)).toBe(true);
  });
});
