import { describe, expect, it } from "vitest";
import { normalizeWhatsApp, requireSavedProfile } from "@/lib/profileContact";

describe("required WhatsApp contact", () => {
  it("requires a number and country calling code", () => {
    expect(normalizeWhatsApp("")).toBeNull();
    expect(normalizeWhatsApp("0971234567")).toBeNull();
    expect(normalizeWhatsApp("+260 97 1234567")).toBe("+260971234567");
  });
  it("does not acknowledge a refused save", () => {
    expect(() => requireSavedProfile({ data: null, error: { message: "Permission denied" } })).toThrow("Permission denied");
  });
  it("does not acknowledge a save that updated no profile", () => {
    expect(() => requireSavedProfile({ data: null, error: null })).toThrow("could not be saved");
    expect(requireSavedProfile({ data: { whatsapp_number: "+260971234567", country: "ZM" }, error: null })).toEqual({ whatsapp_number: "+260971234567", country: "ZM" });
  });
});