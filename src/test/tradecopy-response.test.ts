import { describe, expect, it } from "vitest";
import { TradeCopyError } from "../../supabase/functions/_shared/tradecopy/core";
import { tradeCopyFailure } from "../../supabase/functions/_shared/tradecopy/response";

describe("TradeCopy service failure responses", () => {
  it("reports provider key rejection as a failed result rather than a page-level 502", () => {
    expect(tradeCopyFailure(new TradeCopyError("Key rejected", "auth", 502)))
      .toEqual({ status: 200, body: { ok: false, error: "Key rejected", code: "auth" } });
  });
  it("preserves forbidden account access", () => {
    expect(tradeCopyFailure(new TradeCopyError("Not your account", "auth", 403)).status).toBe(403);
  });
  it("never exposes unexpected exception details", () => {
    const result = tradeCopyFailure(new Error("password=private-test-value"));
    expect(JSON.stringify(result)).not.toContain("private-test-value");
    expect(result.body.ok).toBe(false);
  });
});