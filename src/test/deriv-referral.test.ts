import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { brokerReviews } from "@/data/brokerReviews";
import { AFFILIATE_LINKS } from "@/content/seoTrafficPages";

function filesIn(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? filesIn(path) : [path];
  });
}

describe("Deriv referral destination", () => {
  it("uses the owner's current referral for broker reviews and shared content", () => {
    expect(brokerReviews.deriv.affiliateUrl).toBe("https://t.deriv.link?t=Y8BMQZGW5HAE");
    expect(AFFILIATE_LINKS.deriv).toBe("https://t.deriv.link?t=Y8BMQZGW5HAE");
  });

  it("keeps every app and email referral on the same destination", () => {
    const urls = [...filesIn("src"), ...filesIn("supabase/functions")]
      .filter((path) => /\.(tsx?|json|html)$/.test(path))
      .flatMap((path) => readFileSync(path, "utf8").match(/https:\/\/(?:track\.deriv\.com|t\.deriv\.link)[^"'<>\s`]*/g) ?? []);
    expect(urls.length).toBeGreaterThan(0);
    expect([...new Set(urls)]).toEqual(["https://t.deriv.link?t=Y8BMQZGW5HAE"]);
  });
});