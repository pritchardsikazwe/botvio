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
const canonicalSitemap = read("public/sitemap.xml");
const redirects = read("public/_redirects");
const mainNav = read("src/components/nav/mainNav.ts");
const dubaiContentPaths = [
  "src/content/dubaiBlogPosts.ts",
  "src/content/dubaiBlogIndex.ts",
  "src/content/dubaiExpandedIndex.ts",
  "src/content/dubaiFinalPosts.ts",
  "src/content/dubaiGoldCopyPosts.ts",
  "src/content/dubaiExpandedPosts.ts",
  "src/content/dubaiGoldCopyPosts.ts",
  "src/content/dubaiArabicPosts.ts",
].filter(existsSync);
const dubaiContentSources = dubaiContentPaths.map((path) => read(path)).join("\n");
const dubaiPosts = read("src/content/dubaiBlogPosts.ts");
const localizedMarkets = read("src/content/localizedMarkets.ts");
const mainNav = read("src/components/nav/mainNav.ts");
const targetMarkets = [
  { slug: "saudi-arabia", url: "https://botvio.live/ar/markets/saudi-arabia", key: "SA" },
  { slug: "pakistan", url: "https://botvio.live/markets/pakistan", key: "PK" },
  { slug: "india", url: "https://botvio.live/markets/india", key: "IN" },
  { slug: "indonesia", url: "https://botvio.live/markets/indonesia", key: "ID" },
  { slug: "qatar", url: "https://botvio.live/ar/markets/qatar", key: "QA" },
  { slug: "switzerland", url: "https://botvio.live/markets/switzerland", key: "CH" },
  { slug: "switzerland-fr", url: "https://botvio.live/markets/switzerland-fr", key: "CH-FR" },
  { slug: "switzerland-it", url: "https://botvio.live/markets/switzerland-it", key: "CH-IT" },
];

check("StartTrading route is imported", /import StartTrading from ["']\.\/pages\/StartTrading["']/.test(routes));
check("StartTrading path is registered", /path=["']start-trading["'][\s\S]{0,100}<StartTrading\s*\/>/.test(routes));
check("Deriv affiliate URL is configured", page.includes("https://track.deriv.com/_a_gq1w0BG0D1hit6RV3zsGNd7ZgqdRLk/1/"));
check("Exness affiliate URL is configured", page.includes("https://one.exness-track.com/a/ts1kvs1k"));
check("Outbound click event is present", page.includes('event_name: "affiliate_outbound_click"'));
check("Market-intent event is present", page.includes('event_name: "broker_market_preference"'));
check("Stable visitor/session IDs are generated", page.includes("function trackingIdentity()") && page.includes("botvio_visitor_id") && page.includes("botvio_session_id"));
check("Both event types include required visitor/session IDs", (page.match(/\.\.\.trackingIdentity\(\)/g) || []).length >= 2);
check("Stable first-party visitor and session IDs are generated", page.includes("function trackingIdentity()") && page.includes("botvio_visitor_id") && page.includes("botvio_session_id"));
check("Both regional conversion events include visitor/session IDs", (page.match(/\.\.\.trackingIdentity\(\)/g) || []).length >= 2);
check("Campaign metadata is recorded", page.includes("utm_campaign") && page.includes("utm_content"));
check("UAE eligibility caution is visible", /Confirm directly with the broker|Confirm that the broker accepts residents/.test(page));
check("UAE sitemap is valid XML shape", sitemap.trim().startsWith("<?xml") && sitemap.includes("</urlset>"));
check("UAE sitemap contains broker page", sitemap.includes("https://botvio.live/start-trading"));
check("UAE sitemap includes existing gold, Deriv and synthetic pages", [
  "https://botvio.live/gold",
  "https://botvio.live/gold-trading-signals",
  "https://botvio.live/how-to-automate-deriv-trading",
  "https://botvio.live/synthetic-hub",
  "https://botvio.live/brokers/deriv",
  "https://botvio.live/brokers/pocket-option",
].every((url) => sitemap.includes(url)));
check("Canonical sitemap includes broker page", canonicalSitemap.includes("https://botvio.live/start-trading"));
check("All requested market pages have localized source records", targetMarkets.every(({ key, slug }) => localizedMarkets.includes(`  ${key}:`) || localizedMarkets.includes(`  "${key}":`)) && targetMarkets.every(({ slug }) => localizedMarkets.includes(`slug:"${slug}"`) || localizedMarkets.includes(`slug: "${slug}"`)));
check("All requested market pages are included in canonical sitemap", targetMarkets.every(({ url }) => canonicalSitemap.includes(`<loc>${url}</loc>`)));
check("International Markets navigation exposes all six countries", mainNav.includes('label: "International Markets"') && targetMarkets.every(({ slug }) => mainNav.includes(slug)));
check("Arabic hubs use one canonical Arabic URL", /const canonical = market\.lang === "ar"[\s\S]{0,120}https:\/\/botvio\.live\/ar\/markets\//.test(read("src/pages/LocalizedMarketPage.tsx")));
check("Swiss German, French and Italian hreflang alternates are linked", ["de-CH", "fr-CH", "it-CH"].every((code) => read("src/pages/LocalizedMarketPage.tsx").includes(`code: "${code}"`)));
check("Canonical sitemap has no duplicate URL entries", (() => { const urls = [...canonicalSitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]); return urls.length === new Set(urls).size; })());
check("Legacy /sitemap path redirects to sitemap.xml", /^\/sitemap\s+\/sitemap\.xml\s+301/m.test(redirects));
const sitemapBlogSlugs = [...sitemap.matchAll(/<loc>https:\/\/botvio\.live\/blog\/([^<]+)<\/loc>/g)].map((match) => match[1]);
check("UAE sitemap blog URLs resolve to known Dubai content sources", sitemapBlogSlugs.length > 0 && sitemapBlogSlugs.every((slug) => dubaiContentSources.includes(slug)));
check("robots.txt references UAE conversion sitemap", robots.includes("Sitemap: https://botvio.live/sitemap-uae-conversion.xml"));

const failed = checks.filter((x) => !x.passed);
console.log(`\nRegional growth source audit: ${checks.length - failed.length}/${checks.length} passed`);
if (failed.length) process.exitCode = 1;
