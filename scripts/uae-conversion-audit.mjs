#!/usr/bin/env node
/**
 * Local/source smoke checks for the UAE broker-conversion implementation.
 * Run: node scripts/uae-conversion-audit.mjs
 * This checks source/config consistency only; it does not prove production deploy,
 * Search Console indexing, database writes, broker registrations, or compliance.
 */
import { readFileSync, existsSync } from "node:fs";

const read = (path) => {
  if (!existsSync(path)) throw new Error(`Missing required file: ${path}`);
  return readFileSync(path, "utf8");
};
const checks = [];
function check(label, condition) {
  checks.push({ label, passed: Boolean(condition) });
  console.log(`${condition ? "PASS" : "FAIL"}  ${label}`);
}
const page = read("src/pages/StartTrading.tsx");
const routes = read("src/AppRoutes.tsx");
const robots = read("public/robots.txt");
const sitemap = read("public/sitemap-uae-conversion.xml");

check("StartTrading route is imported", /import StartTrading from ["']\.\/pages\/StartTrading["']/.test(routes));
check("StartTrading path is registered", /path=["']start-trading["'][\s\S]{0,100}<StartTrading\s*\/>/.test(routes));
check("Deriv affiliate URL is configured", page.includes("https://track.deriv.com/_a_gq1w0BG0D1hit6RV3zsGNd7ZgqdRLk/1/"));
check("Exness affiliate URL is configured", page.includes("https://one.exness-track.com/a/ts1kvs1k"));
check("Outbound click event is present", page.includes('event_name: "affiliate_outbound_click"'));
check("Market-intent event is present", page.includes('event_name: "broker_market_preference"'));
check("Campaign metadata is recorded", page.includes("utm_campaign") && page.includes("utm_content"));
check("UAE eligibility caution is visible", /Confirm directly with the broker|Confirm that the broker accepts residents/.test(page));
check("UAE sitemap is valid XML shape", sitemap.trim().startsWith("<?xml") && sitemap.includes("</urlset>"));
check("UAE sitemap contains broker page", sitemap.includes("https://botvio.live/start-trading"));
check("robots.txt references UAE conversion sitemap", robots.includes("Sitemap: https://botvio.live/sitemap-uae-conversion.xml"));

const failed = checks.filter((x) => !x.passed);
console.log(`\nUAE conversion source audit: ${checks.length - failed.length}/${checks.length} passed`);
if (failed.length) process.exitCode = 1;
