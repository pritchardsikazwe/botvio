# Current tasks

- [ ] Match the Botvio user dashboard to the supplied dark overview reference; preserve account/auth/trading behavior and verify the appearance.
- [x] Add responsive AI Signals & Market Analysis and Copy Trading to MT5 sections to the existing public landing page; preserve all access rules and verify links/build.

- [x] Deploy repairs to the existing five-minute Weltrade maker: prioritize GainX/PainX/FlipX, validate sessions, match broker symbols/time, use closed candles and correct timeframe metadata; preserve Home and MT5 routes.
- [ ] Confirm scheduled Weltrade publication and MT5 orders (blocked: 09:25 run returned no broker symbols; Weltrade provider copying remains inactive). No successful signal or trade claimed.

- [x] Fix Home Live Trading Weltrade classification, actual MT5 running/results feed, and honest loading/error states; verify guest display and family/result tests without changing execution.
- [ ] Verify Home running positions and closed results with a signed-in registered Weltrade TradeCopy account (blocked: no connected account session available in this preview).

- [x] Restore the existing full AI chart upload on Home, preserve H4 → M15/M5 guidance, and verify screen controls.

- [x] Fix every visible Signals navigation/card control to open the intended existing signals route.
- [x] Fix every visible Trader/Trading navigation/card control to open the intended existing trading route.
- [x] Check desktop and mobile click targets for overlays, stacking, and pointer-event blockers.
- [x] Verify affected routes render without runtime errors or 404s.
- [ ] Audit representative public pages at narrow-phone and desktop sizes for clickability, overflow, obstruction, accessibility, and intentional states.
- [ ] Fix verified shared header, footer, mobile navigation, card, table, chart, and fallback UX issues without redesigning the information architecture.
- [ ] Update the Weltrade page from the supplied official sources with qualified account conditions, mobile comparison UI, verification CTA, and risk disclosure.
- [ ] Re-test Signals, Trading, and Weltrade navigation and rendered pages on mobile and desktop.
- [ ] Run lint, type checks, tests, production build, and inspect preview health.
- [ ] Add a filterable, status-aware Weltrade Signals section using only existing signal fields, with chart/detail links and resilient states.
- [ ] Upgrade shared market charts with supported symbol/timeframe/view controls, real-data indicators and signal overlays, plus mobile-safe loading/unavailable states.
- [ ] QA Weltrade, signals/history, trading, gold, bitcoin, FX, and chart pages at phone and desktop widths.
- [ ] Build a mobile-first SyntX Strategy Matrix covering all 13 requested families with official-source behaviour, compatible analysis, and specific risks.
- [ ] Classify each configured SyntX instrument by family before signal analysis and expose only family-compatible strategy modes.
- [ ] Add family/regime/spike/break/progression chart markers only when observable real candle data supports them; otherwise show Data unavailable.
- [ ] Keep ordinary Forex/Gold/Crypto/Stocks analysis separate from SyntX-specific logic and QA SyntX pages/charts.
- [ ] Implement and test the approved family-aware SyntX experience now without backend or authentication changes.
- [x] Save Weltrade chart SyntX signals (with WIN/LOSS results) to the Signals tab.
- [x] Four-role MT5 architecture: DATA FEED, DIRECT EXECUTION, PROVIDER MASTER, BOTVIO ROBOT MASTER (schema, direct-execution function, idempotency, live gates).
- [x] User MT5 card: Send Botvio Signals / Copy a Provider / Copy Botvio Robot, direct-signal status.
- [x] Admin MT5 control center: summary cards, role filters, badges, actions, detail drawer.
- [x] Verify DATA FEED and direct execution never call TradeCopy link.
