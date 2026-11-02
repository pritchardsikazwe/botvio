# Botvio analytics deployment notes

## What the application records

After a visitor accepts analytics cookies, the app records first-party events in the Supabase `analytics_events` table:

- `page_view`: one event for the initial route and each React Router navigation.
- `page_time`: time spent on each route, recorded when the visitor navigates away or closes the page.
- `authenticated_session`: an authenticated visit, linked to the user only after consent.
- `broker_page_view`, `ai_analysis_open`, `signal_view`, and `market_open`: feature-level engagement events.
- Existing signup, login, logout and other application events use the same consent-aware event helper.

Visitor IDs persist for up to one year. Session IDs are held in session storage and rotate after 30 minutes of inactivity.

## Required production configuration

1. Set `VITE_GA_ID` to the Botvio GA4 measurement ID in the production build environment if GA4 is used.
2. Set `VITE_GTM_ID` only if a GTM container is actually used. Avoid loading both GA4 directly and a second GA4 configuration tag in GTM, or events may be duplicated.
3. In GA4 Admin → Data streams → Botvio web stream → Enhanced measurement → Page views → Show advanced settings, turn off **Page changes based on browser history events**. The app sends one manual GA4 `page_view` for each React Router navigation. Leaving automatic history pageviews on will double count SPA navigations.
4. If GTM is used, configure a GA4 event tag or equivalent to receive the `botvio_virtual_page_view` data-layer event. Do not also configure a second history-change pageview tag.
5. Verify in GA4 DebugView and Realtime that one `page_view` appears for the first page and one for each route transition.
6. Verify that the Supabase `analytics_events` table accepts anonymous inserts under its existing RLS policies. If inserts are denied, apply a narrowly scoped INSERT policy that allows only the required public analytics columns and validates event names/lengths. Do not expose SELECT, UPDATE or DELETE to anonymous users.
7. Confirm the production build contains the correct GA4/GTM environment values. Vite environment variables are embedded at build time.

## Privacy and consent

GA4, GTM, AdSense and first-party analytics are deferred until the visitor accepts analytics cookies. Rejecting the banner does not create an analytics visitor ID or send tracking events. Essential application functionality continues to work.

This in-app consent choice is not a substitute for a Google-certified consent management platform where Google/AdSense policies or local law require one. Review the privacy notice and regional consent requirements before enabling personalized advertising.
