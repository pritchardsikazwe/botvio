# Botvio SEO implementation and operating checklist

Canonical site: https://botvio.live  
Branch: `seo-audit-implementation`

## Changes in this branch

- Removed the crawler block on `/install`. It is a public install guide with its own SEO title and description, and Search Console has shown search clicks for it.
- Added `public/_redirects` with an SPA fallback so direct visits to client-side routes resolve through `index.html` on hosts that honor Cloudflare Pages-style redirects. Existing static files (including robots.txt and sitemaps) should still be served as files.
- Added `npm run seo:audit`, a no-dependency production smoke audit for robots.txt, sitemap.xml and key Botvio routes. It reports HTTP errors, sitemap duplicates/off-host URLs and whether deep-route metadata appears in the initial HTML.

## Run the live audit

```bash
npm install
npm run seo:audit
```

Optional target origin:

```bash
SEO_AUDIT_ORIGIN=https://your-preview-host.example npm run seo:audit
```

The audit checks the public production host by default. It does not submit URLs to Google, change Search Console settings, or claim that a URL is indexed.

## Search Console follow-up (requires property access)

1. In Search results, export Queries and Pages for the last 28 complete days and the preceding 28-day period.
2. Sort Pages by impressions, then find high-impression pages with low CTR. Review their matching queries before changing titles or descriptions.
3. In Page indexing, inspect reasons for excluded URLs. Don't blanket-submit all excluded pages; determine whether each URL is intended to be indexed.
4. Inspect `/`, `/brokers/pocket-option`, `/gold-trading-signals`, `/gold`, `/signals`, `/synthetic-hub`, `/blog` and `/install`. Compare user-declared and Google-selected canonicals.
5. Check the sitemap's last read, discovered URLs and errors. Submit `https://botvio.live/sitemap.xml` if it is not already submitted.
6. After a production deploy, use URL Inspection's live test on changed public pages and request indexing selectively.

## Content and conversion improvements

- Preserve the established Pocket Option URL. Update its title, introduction and content only after reviewing the actual queries that drive clicks.
- Strengthen original Gold/XAUUSD educational content and add contextual internal links to/from relevant guides.
- Link relevant guides to topic hubs for Gold, brokers, synthetic indices, copy trading and app installation.
- Keep financial-risk disclosures visible and verify performance claims against documented data. Do not add unsupported win-rate, profit or accuracy claims.
- Measure account registrations and completed onboarding alongside organic clicks using the existing analytics integration.

## Important limitation: SPA metadata and deployment

The app uses React Helmet for route-specific metadata. A static SPA shell may initially return the homepage title and canonical before JavaScript runs. The audit flags that condition as a warning rather than assuming Google cannot render it. Verify with Search Console URL Inspection's rendered HTML. If important landing pages still lack route-specific metadata in rendered output, implement tested prerendering/SSR for public SEO routes in a separate change; don't deploy an untested rendering rewrite alongside routine metadata fixes.

## Deployment and verification

This branch does not merge itself or deploy production. Review the pull request, ensure the connected hosting pipeline deploys this branch after approval/merge, then run the audit against `https://botvio.live`. DNS/hosting configuration and Google Search Console sitemap submission remain external steps.
