# Botvio production UX audit and Weltrade update

## Scope
- Keep the current app structure, visual language, open-access preview, protected sensitive actions, backend, authentication, and public domain unchanged.

## Work
1. Exercise representative public pages at narrow-phone and desktop widths, prioritizing click interception, overflow, obscured controls, route failures, and weak loading/empty/error states.
2. Fix only confirmed issues in shared navigation/layout and affected page presentation, preserving all features and information architecture.
3. Re-verify every rendered Signals and Trading target, including headers, cards, menus, dashboard actions, and mobile bottom navigation.
4. Rebuild the Weltrade Signals tab around existing database signals and normalized market data: useful filters, explicit lifecycle states, freshness, resilient states, clickable chart focus, and no invented values.
5. Update Weltrade account information from the supplied official sources; qualify claims, avoid rankings or guarantees, add a mobile-safe comparison, source links, verification CTA, and risk messaging.
6. Strengthen the existing chart interfaces using capabilities already present in the chart/data layer: mobile-safe toolbars, supported timeframes and view modes, real price/freshness, crosshair, real indicators, signal markers, entry/SL/TP levels, and proper unavailable states.
7. Validate representative routes, accessibility basics, lint, type checks, tests, production build, and preview logs.

## Technical notes
- Use existing semantic design tokens and shared controls.
- No database, backend connection, authentication, OAuth, admin-protection, domain, or trading-logic changes.
