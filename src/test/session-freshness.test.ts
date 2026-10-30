import { expect, it } from "vitest";
import { sessionPredatesReset } from "@/lib/sessionFreshness";
const token = (iso: string) => `header.${btoa(JSON.stringify({ iat: Date.parse(iso) / 1000 }))}.signature`;
it("does not sign out a freshly issued session because account sign-in history is old", () => {
  expect(sessionPredatesReset("2026-08-05T19:09:45Z", token("2026-10-30T07:15:00Z"))).toBe(false);
});
it("still resets sessions issued before the existing cutoff", () => {
  expect(sessionPredatesReset("2026-08-05T19:09:45Z", token("2026-10-25T07:15:00Z"))).toBe(true);
});