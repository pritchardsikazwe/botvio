#!/usr/bin/env node
/**
 * Bing/Google crawl diagnostics for Botvio.
 * Run: npm run seo:crawl-check
 * Optional: SEO_ORIGIN=https://staging.example.com npm run seo:crawl-check
 * This checks publicly reachable crawl assets; it does not alter robots or indexing.
 */
const origin = (process.env.SEO_ORIGIN || "https://botvio.live").replace(/\/$/, "");
const ua = "BotvioCrawlDiagnostics/1.0";
const fail = [];
const warn = [];
const pass = [];
const get = async (path) => {
  const response = await fetch(new URL(path, origin), {
    headers: { "user-agent": ua },
    redirect: "follow",
    signal: AbortSignal.timeout(20000),
  });
  return { response, body: await response.text() };
};
const locs = (xml) => [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map(m => m[1].trim());

async function main() {
  console.log(`Botvio crawl diagnostics: ${origin}`);
  let robots = "";
  try {
    const { response, body } = await get("/robots.txt");
    robots = body;
    if (!response.ok) fail.push(`robots.txt HTTP ${response.status}`);
    else {
      pass.push("robots.txt is reachable");
      if (!/^Sitemap:\s*https:\/\/botvio\.live\/sitemap\.xml\s*$/im.test(body)) fail.push("robots.txt does not declare the canonical sitemap.xml");
      const sitemapLines = [...body.matchAll(/^Sitemap:\s*(\S+)/gim)].map(m => m[1]);
      if (!sitemapLines.length) fail.push("robots.txt declares no sitemap URLs");
      else pass.push(`robots.txt declares ${sitemapLines.length} sitemap URL(s)`);
      if (/User-agent:\s*Bingbot[\s\S]*?Disallow:\s*\/\s*(?:\r?\n|$)/i.test(body)) fail.push("Bingbot appears to be blocked from the site root");
    }
  } catch (e) { fail.push(`robots.txt request failed: ${e.message}`); }

  const sitemapPaths = [...robots.matchAll(/^Sitemap:\s*https?:\/\/[^/]+(\/\S*)/gim)].map(m => m[1] || "/");
  const allUrls = [];
  for (const path of [...new Set(sitemapPaths)]) {
    try {
      const { response, body } = await get(path);
      if (!response.ok) { fail.push(`Sitemap ${path} HTTP ${response.status}`); continue; }
      if (!/<(?:urlset|sitemapindex)\b/i.test(body)) { fail.push(`Sitemap ${path} is not recognizable XML sitemap content`); continue; }
      const entries = locs(body);
      if (/<sitemapindex\b/i.test(body)) {
        warn.push(`${path} is a sitemap index; nested sitemap URLs need a follow-up check`);
      } else {
        allUrls.push(...entries);
        pass.push(`${path}: ${entries.length} URL entries`);
        if (entries.length > 50000) fail.push(`${path} exceeds the 50,000 URL sitemap limit`);
        if (new Set(entries).size !== entries.length) warn.push(`${path} contains duplicate <loc> values`);
      }
    } catch (e) { fail.push(`Sitemap ${path} request failed: ${e.message}`); }
  }
  const duplicateAcrossSitemaps = allUrls.filter((url, i) => allUrls.indexOf(url) !== i);
  if (duplicateAcrossSitemaps.length) warn.push(`${new Set(duplicateAcrossSitemaps).size} URL(s) appear in more than one sitemap`);
  else if (allUrls.length) pass.push("No cross-sitemap duplicate URL entries detected");
  const offOrigin = allUrls.filter(url => {
    try { return new URL(url).origin !== origin; } catch { return true; }
  });
  if (offOrigin.length) warn.push(`${offOrigin.length} sitemap URL(s) are invalid or outside ${origin}`);

  for (const path of ["/", "/gold", "/synthetic-hub", "/signals", "/brokers/pocket-option", "/blog"]) {
    try {
      const { response, body } = await get(path);
      if (!response.ok) { fail.push(`${path} HTTP ${response.status}`); continue; }
      if (!/<html\b/i.test(body)) { fail.push(`${path} did not return HTML`); continue; }
      const title = body.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || "";
      const desc = body.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)?.[1] || "";
      if (!title) warn.push(`${path} has no title in server-delivered HTML (check rendered HTML)`);
      if (!desc) warn.push(`${path} has no meta description in server-delivered HTML (check rendered HTML)`);
      if (/noindex/i.test(body.match(/<meta[^>]+name=["']robots["'][^>]*>/i)?.[0] || "")) warn.push(`${path} has a noindex directive in initial HTML`);
      pass.push(`${path} HTTP ${response.status}`);
    } catch (e) { fail.push(`${path} request failed: ${e.message}`); }
  }
  console.log("\nPASS"); pass.forEach(x => console.log("  " + x));
  console.log("\nWARN"); warn.forEach(x => console.log("  " + x));
  console.log("\nFAIL"); fail.forEach(x => console.log("  " + x));
  console.log(`\nSummary: ${pass.length} passed, ${warn.length} warning(s), ${fail.length} failure(s).`);
  if (fail.length) process.exitCode = 1;
}
main().catch(e => { console.error(e); process.exitCode = 1; });
