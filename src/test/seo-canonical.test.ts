import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { BASE_URL } from "@/config/domain";

// Guards SEO: canonical/schema URLs must use https://botvio.live, never preview hosts.
function walk(dir: string, out: string[] = []): string[] {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|xml|txt|html)$/.test(f)) out.push(p);
  }
  return out;
}

describe("canonical origin", () => {
  it("is botvio.live", () => expect(BASE_URL).toBe("https://botvio.live"));
  it("no hardcoded lovable.app URLs in public pages or SEO files", () => {
    const files = [...walk("src/pages"), ...walk("src/components/seo"), "public/sitemap.xml", "public/robots.txt", "index.html"];
    const bad = files.filter((f) => /https:\/\/[a-z0-9-]*\.?lovable\.app/.test(readFileSync(f, "utf8")));
    expect(bad).toEqual([]);
  });
});
