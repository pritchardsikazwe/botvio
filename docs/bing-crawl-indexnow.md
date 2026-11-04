# Botvio crawl diagnostics and Bing IndexNow rollout

## What this change does
- Adds a read-only crawl diagnostics command for production or staging.
- Checks robots.txt sitemap declarations, sitemap reachability and format, URL counts, duplicates, host consistency, and a small sample of public HTML pages.
- Produces warnings for issues that need rendered-page or Search Console validation.

Run:
```sh
npm run seo:crawl-check
SEO_ORIGIN=https://staging.example.com npm run seo:crawl-check
```

## Bing Webmaster Tools follow-up
1. In Bing Webmaster Tools, verify the site and open **URL Submission / IndexNow**.
2. Generate an IndexNow key in Bing's interface or use a securely generated key. Do not commit a private key or put credentials in client-side code.
3. Host the matching key file at the exact public key URL Bing specifies (usually `https://botvio.live/<key>.txt`) and verify it returns HTTP 200 with the key as plain text.
4. Submit only canonical, public URLs that return HTTP 200. Include updated and removed URLs when relevant. Do not submit dashboard, account, authentication, API, query-parameter, or private pages.
5. Keep submissions rate-limited and deduplicated. IndexNow is a notification protocol, not a guarantee of indexing or ranking.
6. Confirm the key and submissions in Bing Webmaster Tools. Do not treat a successful HTTP response as proof of indexing.

## Important cautions
- The current robots.txt references several sitemap files. This diagnostics script checks each declared sitemap URL, but cannot establish that every listed page is useful, canonical, or indexable.
- A large sitemap alone does not prove that it caused Bing's crawl-capacity recommendation. Inspect Bing Crawl Information, server logs, response codes, crawl rate, and URL parameter patterns before reducing or expanding crawl access.
- Keep private route disallows intact. Do not use robots.txt as access control.
- The Bing report's duplicate title/description counts need URL-level export and template mapping. Avoid mass-generating SEO metadata until the route source and rendered page content are audited.
- Botvio uses client-side React routing. Search engines may render route metadata later; validate with Bing URL Inspection / Google URL Inspection, and consider prerendering/SSR for high-value landing pages if the initial HTML is generic.
