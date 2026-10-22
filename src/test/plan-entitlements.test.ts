import { describe, it, expect } from "vitest";
import { tierForPlanCode, tierIncludes } from "@/config/planEntitlements";

describe("unified plan tiers", () => {
  it("existing Standard subscribers keep Basic access", () => expect(tierForPlanCode("standard")).toBe("basic"));
  it("legacy Pro and Elite map to VIP", () => {
    expect(tierForPlanCode("pro")).toBe("vip");
    expect(tierForPlanCode("elite")).toBe("vip");
  });
  it("affiliate partner is not a subscription tier", () => expect(tierForPlanCode("affiliate_partner")).toBe("free"));
  it("VIP includes Basic and Starter; Starter does not include Basic", () => {
    expect(tierIncludes("vip", "basic")).toBe(true);
    expect(tierIncludes("starter", "basic")).toBe(false);
  });
});
