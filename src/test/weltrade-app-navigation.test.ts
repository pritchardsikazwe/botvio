import { describe, expect, it } from "vitest";
import { isWeltradeAllowedPath, weltradeAppRedirect } from "@/lib/weltradeAppMode";

describe("Weltrade app navigation", () => {
  it("sends the legacy account URL to the existing settings screen", () => {
    expect(weltradeAppRedirect("/profile", "")).toBe("/settings");
  });
  it("preserves the signals destination when a guest needs to sign in", () => {
    expect(weltradeAppRedirect("/", "?authRequired=1&next=%2Fweltrade%2Fsignals")).toBe("/auth?next=%2Fweltrade%2Fsignals");
  });
  it("keeps legacy signup destinations within the Weltrade app", () => {
    expect(weltradeAppRedirect("/", "?authRequired=1&next=/dashboard")).toBe("/auth?next=%2Fweltrade");
    expect(weltradeAppRedirect("/", "?authRequired=1&next=//outside.example")).toBe("/auth?next=%2Fweltrade");
  });
  it("allows account, authentication and membership checkout screens", () => {
    for (const path of ["/settings", "/auth", "/signup", "/choose-plan", "/payment", "/marketplace"]) {
      expect(isWeltradeAllowedPath(path)).toBe(true);
      expect(weltradeAppRedirect(path, "")).toBeNull();
    }
    expect(weltradeAppRedirect("/gold", "")).toBe("/weltrade");
  });
});