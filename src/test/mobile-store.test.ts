import { describe, expect, it, vi } from "vitest";
vi.mock("@capacitor/core",()=>({Capacitor:{isNativePlatform:()=>true}}));
import { isRestrictedOnStore } from "@/lib/mobile";
describe("Google Play route restrictions",()=>{
  it("blocks the current Deriv binary trading terminal",()=>{
    vi.stubEnv("VITE_STORE_BUILD","true");
    expect(isRestrictedOnStore("/deriv/options")).toBe(true);
    vi.unstubAllEnvs();
  });
  it("blocks web subscription checkout in the Play edition",()=>{
    vi.stubEnv("VITE_STORE_BUILD","true");
    expect(isRestrictedOnStore("/payment")).toBe(true);
    expect(isRestrictedOnStore("/choose-plan")).toBe(true);
    vi.unstubAllEnvs();
  });
  it("keeps the website binary terminal unchanged",()=>{
    vi.stubEnv("VITE_STORE_BUILD","false");
    expect(isRestrictedOnStore("/deriv/options")).toBe(false);
    vi.unstubAllEnvs();
  });
});