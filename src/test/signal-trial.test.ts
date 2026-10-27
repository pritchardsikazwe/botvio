import { describe, expect, it } from "vitest";
import { canUnlockTrialSignal, signalDayStart, nextSignalMorning, TRIAL_SIGNAL_DAILY_LIMIT } from "@/lib/signalTrial";

describe("trial signals", () => {
  it("allows the 35th distinct unlock but refuses the 36th", () => {
    expect(TRIAL_SIGNAL_DAILY_LIMIT).toBe(35);
    expect(canUnlockTrialSignal(34, false)).toBe(true);
    expect(canUnlockTrialSignal(35, false)).toBe(false);
  });
  it("does not count reopening and preserves paid access", () => {
    expect(canUnlockTrialSignal(35, true)).toBe(true);
    expect(canUnlockTrialSignal(35, false, true)).toBe(true);
  });
  it("keeps the same daily batch until 06:00 Lusaka", () => {
    expect(signalDayStart(new Date("2026-10-28T03:59:59Z")).toISOString()).toBe("2026-10-27T04:00:00.000Z");
    expect(signalDayStart(new Date("2026-10-28T04:00:00Z")).toISOString()).toBe("2026-10-28T04:00:00.000Z");
    expect(nextSignalMorning(new Date("2026-10-27T12:00:00Z")).toISOString()).toBe("2026-10-28T04:00:00.000Z");
  });
});