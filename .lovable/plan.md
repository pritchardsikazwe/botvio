# Botvio production polish

## Scope
- Keep the current project, backend, users, authentication, OAuth, domain, and trading behavior unchanged.
- Keep `OPEN_ACCESS=true` for normal public pages while retaining admin and sensitive account protections.

## Implementation
1. Reconcile footer, navigation, homepage, article, and fallback links with the routes that actually exist.
2. Improve shared production polish: useful error recovery, accessible focus and motion behavior, mobile navigation spacing, and overflow-safe content.
3. Apply small homepage consistency and accessibility fixes without redesigning its structure.
4. Preserve route-specific SEO behavior, Search Console verification, sitemap, robots, and PWA update/install behavior; repair only stale public links or metadata.
5. Exercise representative public pages at phone and desktop sizes, then fix visible blank screens, overflow, runtime errors, and broken destinations.
6. Run lint, type checks, tests, and the production build; fix only issues related to this work.

## Verification
- Confirm the homepage and representative markets, signals, trading hub, broker, learning, legal, and 404 pages render in the preview.
- Confirm admin routes remain protected and public routes remain viewable under open access.
- Confirm no backend, database, auth provider, OAuth, secret, or production-domain configuration changes were made.
