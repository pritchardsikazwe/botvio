import fs from "fs";
import { blogContent } from "../src/content/blogPosts";
import { binanceBlogPosts } from "../src/content/binanceBlogPosts";
import { countryData } from "../src/content/countryData";

const BASE = "https://botvio.live";
const xml = fs.readFileSync("public/sitemap.xml", "utf8");
const existingUrls = new Set<string>();
for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) existingUrls.add(m[1]);

// Preserve original order of existing URLs (extract grouped sections)
const headerMatch = xml.match(/^[\s\S]*?<urlset[^>]*>\n/);
const header = headerMatch ? headerMatch[0] : `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

// New: full blog list (static) + future generated topic slugs
const blogSlugs = new Set<string>([...Object.keys(blogContent), ...Object.keys(binanceBlogPosts)]);
const countrySlugs = new Set<string>(Object.keys(countryData));


function url(loc: string, opts: { changefreq?: string; priority?: string; lastmod?: string } = {}) {
  const parts = [`  <url>`, `    <loc>${loc}</loc>`];
  if (opts.lastmod) parts.push(`    <lastmod>${opts.lastmod}</lastmod>`);
  if (opts.changefreq) parts.push(`    <changefreq>${opts.changefreq}</changefreq>`);
  if (opts.priority) parts.push(`    <priority>${opts.priority}</priority>`);
  parts.push(`  </url>`);
  return parts.join("\n");
}

// Keep existing as-is by extracting the original body and appending new entries
const bodyMatch = xml.match(/<urlset[^>]*>\n([\s\S]*?)<\/urlset>/);
let existingBody = bodyMatch ? bodyMatch[1].trimEnd() : "";

const newEntries: string[] = [];

// Add missing blog posts
const blogSection: string[] = [];
for (const slug of [...blogSlugs].sort()) {
  const loc = `${BASE}/blog/${slug}`;
  if (!existingUrls.has(loc)) blogSection.push(url(loc, { changefreq: "weekly", priority: "0.7" }));
}
if (blogSection.length) {
  newEntries.push(`\n  <!-- ═══ Blog Posts (auto-added) ═══ -->\n${blogSection.join("\n")}`);
}

// Add missing country pages
const countrySection: string[] = [];
for (const slug of [...countrySlugs].sort()) {
  const loc = `${BASE}/${slug}`;
  if (!existingUrls.has(loc)) countrySection.push(url(loc, { changefreq: "weekly", priority: "0.7" }));
}
if (countrySection.length) {
  newEntries.push(`\n  <!-- ═══ Country Landing Pages (auto-added) ═══ -->\n${countrySection.join("\n")}`);
}

const out = `${header}${existingBody}\n${newEntries.join("\n")}\n</urlset>\n`;
fs.writeFileSync("public/sitemap.xml", out);
console.log("blog added:", blogSection.length, "country added:", countrySection.length);
console.log("total urls now:", (out.match(/<loc>/g) || []).length);
