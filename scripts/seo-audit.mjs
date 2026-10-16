#!/usr/bin/env node
/**
 * Lightweight production SEO smoke test for Botvio.
 * Run with: npm run seo:audit
 *
 * Uses Node's built-in fetch only. This tests the public origin and intentionally
 * warns when a deep URL serves only the generic SPA shell; route-specific
 * Helmet tags are client-rendered, so that warning is useful evidence for
 * deciding whether prerendering/SSR is needed.
 */

const ORIGIN = (process.env.SEO_AUDIT_ORIGIN || "https://botvio.live").replace(/\/$/, "");
const TARGET_PATHS = [
  "/",
  "/brokers",
  "/brokers/pocket-option",
  "/gold-trading-signals",
  "/gold",
  "/signals",
  "/synthetic-hub",
  "/blog",
  "/install",
];

let failures = 0;
let warnings = 0;

function pass(message) {
  console.log(`PASS  ${message}`);
}
function warn(message) {
  warnings += 1;
  console.warn(`WARN  ${message}`);
}
function fail(message) {
  failures += 1;
  console.error(`FAIL  ${message}`);
}

async function get(path) {
  const response = await fetch(`${ORIGIN}${path}`, {
    redirect: "follow",
    headers: { "user-agent": "Botvio-SEO-Audit/1.0" },
    signal: AbortSignal.timeout(15000),
  });
  return { response, body: await response.text() };
}

function metaContent(html, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${escaped}["'][^>]+content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${escaped}["']`, "i"));
  return match?.[1] || match?.[2] || "";
}

function canonicalHref(html) {
  return html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1]
    || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i)?.[1]
    || "";
}

async function main() {
  console.log(`Botvio SEO smoke audit: ${ORIGIN}`);
  let robots = "";
  let sitemap = "";

  try {
    const { response, body } = await get("/robots.txt");
    if (!response.ok) fail(`robots.txt returned HTTP ${response.status}`);
    else {
      robots = body;
      if (/Sitemap:\s*https:\/\/botvio\.live\/sitemap\.xml/i.test(body)) pass("robots.txt references the canonical sitemap");
      else fail("robots.txt does not reference https://botvio.live/sitemap.xml");
      if (/User-agent:\s*Googlebot[\s\S]*?Disallow:\s*\/install(?:\s|$)/i.test(body)) {
        fail("Googlebot is blocked from /install");
      } else if (/User-agent:\s*\*[\s\S]*?Disallow:\s*\/install(?:\s|$)/i.test(body)) {
        fail("Wildcard crawler policy blocks /install");
      } else pass("robots.txt does not explicitly block /install");
    }
  } catch (error) {
    fail(`robots.txt request failed: ${error.message}`);
  }

  try {
    const { response, body } = await get("/sitemap.xml");
    if (!response.ok) fail(`sitemap.xml returned HTTP ${response.status}`);
    else {
      sitemap = body;
      const locations = [...body.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map(m => m[1].trim());
      const duplicates = locations.filter((url, i) => locations.indexOf(url) !== i);
      const offHost = locations.filter(url => {
        try { return new URL(url).origin !== "https://botvio.live"; } catch { return true; }
      });
      if (!locations.length) fail("sitemap.xml contains no <loc> entries");
      else pass(`sitemap.xml is reachable and contains ${locations.length} URL entries`);
      if (duplicates.length) warn(`sitemap.xml has ${new Set(duplicates).size} duplicate URL(s)`);
      else pass("sitemap.xml contains no duplicate URLs");
      if (offHost.length) warn(`sitemap.xml contains ${offHost.length} URL(s) outside https://botvio.live`);
      else pass("sitemap URLs use the canonical host");
      for (const required of ["/", "/brokers/pocket-option", "/gold-trading-signals", "/install"]) {
        if (locations.includes(`${ORIGIN}${required}`)) pass(`sitemap includes ${required}`);
        else warn(`sitemap does not include ${required}`);
      }
    }
  } catch (error) {
    fail(`sitemap request failed: ${error.message}`);
  }

  for (const path of TARGET_PATHS) {
    try {
      const { response, body } = await get(path);
      if (!response.ok) {
        fail(`${path} returned HTTP ${response.status} (final URL: ${response.url})`);
        continue;
      }
      if (!/<!doctype html|<html/i.test(body)) {
        fail(`${path} did not return HTML`);
        continue;
      }
      pass(`${path} returned HTTP ${response.status}`);
      const title = body.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || "";
      const canonical = canonicalHref(body);
      if (!title) warn(`${path} has no title in the initial HTML response`);
      if (path !== "/" && canonical === `${ORIGIN}/`) {
        warn(`${path} returns the homepage canonical in initial HTML; verify Google-rendered URL Inspection and consider prerendering/SSR`);
      } else if (path !== "/" && canonical && canonical.replace(/\/$/, "") !== `${ORIGIN}${path}`.replace(/\/$/, "")) {
        warn(`${path} has unexpected initial-HTML canonical: ${canonical}`);
      }
      if (path !== "/" && title && /Botvio – AI Forex Signals, Gold Trading & Automated Bots/i.test(title)) {
        warn(`${path} has the generic homepage title in initial HTML; verify Google-rendered title and consider prerendering/SSR`);
      }
    } catch (error) {
      fail(`${path} request failed: ${error.message}`);
    }
  }

  console.log("\nSummary: ${failures} failure(s), ${warnings} warning(s).");
  if (failures) process.exitCode = 1;
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
