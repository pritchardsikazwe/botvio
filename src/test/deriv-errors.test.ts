import { describe, it, expect } from "vitest";
import { friendlyDerivError } from "@/lib/derivTradeErrors";
describe("friendlyDerivError", () => {
  it("explains unsupported instruments", () => {
    expect(friendlyDerivError(new Error("Trading is not offered for this asset."), "Jump 75")).toContain("doesn't offer this contract on Jump 75");
  });
  it("keeps unknown messages", () => {
    expect(friendlyDerivError(new Error("Something odd"))).toBe("Something odd");
  });
});
