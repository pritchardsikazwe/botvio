import { describe, expect, it } from "vitest";
import { signalFeedWindow, SIGNAL_FEED_DAYS, SIGNAL_PAGE_SIZE } from "@/lib/recentSignals";

describe("bounded recent signals feed", () => {
  it("loads only the last five days", () => {
    expect(SIGNAL_FEED_DAYS).toBe(5);
    expect(signalFeedWindow(0, Date.parse("2026-10-30T07:15:00Z")).since).toBe("2026-10-25T07:15:00.000Z");
  });
  it("fetches 50 signals plus a single next-page sentinel", () => {
    expect(SIGNAL_PAGE_SIZE).toBe(50);
    expect(signalFeedWindow(0).from).toBe(0);
    expect(signalFeedWindow(0).to).toBe(50);
    expect(signalFeedWindow(1).from).toBe(50);
    expect(signalFeedWindow(1).to).toBe(100);
  });
});