#!/usr/bin/env node
/**
 * Production SEO smoke test for Botvio.
 * Checks public crawl assets and a short list of high-value landing pages.
 * This is a health check, not a substitute for Google Search Console.
 */
const origin = (process.env.SEO_ORIGIN || "https://botvio.live").replace(/\/$/, "");
const paths = [
  "/", "/robots.txt", "/sitemap.xml", "/signals", "/signals-history",
  "/gold", "/synthetic-hub", "/copy-trading", "/brokers",
  "/brokers/pocket-option", "/how-to-automate-deriv-trading", "/blog", "/learn",
];
let failures = 0;
const results = [];
for (const path of paths) {
  try {
    const response = await fetch(new URL(path, origin), {
      redirect: "follow",
      headers: { "user-agent": "Botvio-SEO-SmokeTest/1.0" },
      signal: AbortSignal.timeout(15000),
    });
    const type = response.headers.get("content-type") || "";
    let body = "";
    if (type.includes("text") || path === "/robots.txt" || path.endsWith(".xml")) {
      body = await response.text();
    }
    const issues = [];
    if (!response.ok) issues.push(`HTTP ${response.status}`);
    if (path === "/" && response.ok) {
      if (!/<title>\s*[^<]{10,}<\/title>/i.test(body)) issues.push("missing/short title");
      if (!/<meta\s+name=["']description["']\s+content=["'][^"']{50,}/i.test(body)) issues.push("missing/short meta description");
      if (!/rel=["']canonical["']/i.test(body)) issues.push("missing canonical");
    }
    if (path === "/robots.txt" && response.ok && !body.includes("Sitemap:")) issues.push("missing sitemap declaration");
    if (path === "/sitemap.xml" && response.ok && !body.includes("<urlset")) issues.push("not a URL sitemap");
    if (issues.length) failures++;
    results.push({ path, status: response.status, issues });
  } catch (error) {
    failures++;
    results.push({ path, status: "ERROR", issues: [String(error?.message || error)] });
  }
}
console.log(JSON.stringify({ origin, checked: results.length, failures, results }, null, 2));
if (failures) process.exitCode = 1;
