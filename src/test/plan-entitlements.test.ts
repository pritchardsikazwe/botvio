import { describe, it, expect } from "vitest";
import { tierForPlanCode, tierIncludes } from "@/config/planEntitlements";

describe("unified Botvio membership tiers", () => {
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