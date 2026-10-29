import { describe, it, expect } from "vitest";
import { tierForPlanCode, tierIncludes, PLAN_CATALOG, membershipPlanLabel } from "@/config/planEntitlements";

describe("unified Botvio membership tiers", () => {
  it("sets Starter at $9", () => expect(PLAN_CATALOG.find(p => p.code === "starter")?.price).toBe(9));
  it("sets Basic at $19", () => expect(PLAN_CATALOG.find(p => p.code === "basic")?.price).toBe(19));
  it("sets VIP at $39", () => expect(PLAN_CATALOG.find(p => p.code === "vip")?.price).toBe(39));
  it("retains legacy subscriber tier mapping", () => {
    expect(membershipPlanLabel("standard")).toBe("Basic");
    expect(membershipPlanLabel("elite")).toBe("VIP");
  });
  it("maps Starter to Starter", () => expect(tierForPlanCode("starter")).toBe("starter"));
  it("maps Standard and All-Access to the same middle tier", () => {
    expect(tierForPlanCode("standard")).toBe("basic");
    expect(tierForPlanCode("all-access")).toBe("basic");
  });
  it("maps legacy Pro and Elite to VIP", () => {
    expect(tierForPlanCode("pro")).toBe("vip");
    expect(tierForPlanCode("elite")).toBe("vip");
  });
  it("does not treat affiliate roles as paid plans", () => expect(tierForPlanCode("affiliate_partner")).toBe("free"));
  it("VIP includes All-Access and Starter, but Starter does not include All-Access", () => {
    expect(tierIncludes("vip", "basic")).toBe(true);
    expect(tierIncludes("vip", "starter")).toBe(true);
    expect(tierIncludes("starter", "basic")).toBe(false);
  });
});