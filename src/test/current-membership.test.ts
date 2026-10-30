import { describe, expect, it } from "vitest";
import { membershipDestinations, selectCurrentMembership, type MembershipRow, type MembershipPlan } from "@/lib/currentMembership";

const now = Date.parse("2026-10-30T07:15:00Z");
const row = (code: string, end: string | null, status = "active"): MembershipRow => ({
  id: code, status, current_period_start: "2026-10-30T06:45:18Z", current_period_end: end,
  pricing_plans: { code, name: code } as MembershipPlan,
});
describe("current membership", () => {
  it("keeps the reported Basic membership active until November 29", () => {
    expect(selectCurrentMembership([row("basic", "2026-11-29T21:59:59Z")], now)?.pricing_plans?.code).toBe("basic");
  });
  it("rejects expired subscriptions at the exact expiry", () => {
    expect(selectCurrentMembership([row("basic", "2026-10-30T07:15:00Z")], now)).toBeNull();
  });
  it("does not activate submitted or pending payments", () => {
    expect(selectCurrentMembership([row("vip", null, "pending_payment")], now)).toBeNull();
  });
  it("preserves the highest active legacy tier with duplicate rows", () => {
    expect(selectCurrentMembership([row("basic", null), row("elite", null)], now)?.pricing_plans?.code).toBe("elite");
  });
  it("shows included Basic access without any individual purchases", () => {
    expect(membershipDestinations("basic").map(item => item.href)).toEqual([
      "/signals", "/synthetic-hub", "/weltrade", "/markets", "/signals?tab=chart-analysis", "/bots",
    ]);
  });
  it("keeps Starter out of Basic-only destinations", () => {
    expect(membershipDestinations("starter").map(item => item.href)).toEqual(["/signals", "/synthetic-hub", "/weltrade"]);
  });
});