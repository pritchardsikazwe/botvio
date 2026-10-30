# Current tasks
- [ ] Package signed full Botvio Google Play APK/AAB using existing ai.botvio.live upload key; exclude binary-options trading and non-store payments, verify signatures and explain remaining Play Console requirements.
- [x] Add real Deriv tick view, charted RSI and clear strategy confirmation diagnostics; 12 strategy tests pass, signed-in tick/candle/expiry controls and phone layout verified without runtime errors or orders. NO TRADE and disabled automation safeguards retained.
- [x] Handle rejected TradeCopy credentials without a page-level 502; deployed tradecopy-api, passed 25 tests and verified the real rejection inside the signed-in dashboard without runtime errors; no trades.
- [x] Implement uploaded 3-minute Precision / 5-minute Trend Confirmation Rise/Fall rules, four-instrument scanner, candle/timeframe controls and structure overlays; live public candles verified on desktop/phone, 10 tests pass, existing contracts preserved.
- [ ] Activate new strategy automation (blocked: connected-demo execution and server-enforced atomic risk acceptance unavailable). Settings and stop UI added but deliberately disabled; existing cloud multiplier automation stays separate. No orders sent.
- [x] Verify the reported Basic member's active access through November 29; shared membership status and included dashboard destinations verified signed-in on desktop/phone.
- [x] Limit Signals to five days and 50-row pages; date indexes and cached paid-access RLS check eliminate observed statement timeouts. Member feed/search returned successfully; 23 regression tests pass.
- [x] Verify and repair Weltrade app Account/sign-in navigation without broadening trading access; phone browser checks and four navigation tests pass.
- [ ] Restore TradeCopy authentication (blocked: provider rejects saved key; renewed TradeCopy API Studio key required through secure replacement form). Upstream error exposure removed; no order sent.
- [x] Package separate Weltrade AI Signals Android app with signed APK/AAB and its own private signing key; verify package identity, SDK and bundle signature.
- [ ] Complete Weltrade Play Store launch (blocked: website association needs publication, Google Play app-signing fingerprint and financial/billing compliance review; device test unavailable).
- [x] Replace Marketplace product sales with existing membership choices; verified three saved prices and Basic payment/sign-in screen; preserve existing purchases.
- [x] Connect user and admin membership selections to saved customer-visible Starter, Basic and VIP plans; preserve legacy subscribers; nine tier/price tests and visible user selection links verified.
- [ ] Verify admin membership assignment and readback in a signed-in session (blocked: injected session signs out; requesting user has no matching account for session refresh).
- [ ] Enforce 35 distinct trial signal unlocks daily, preserve paid access, and freeze five real M15 homepage category picks until 06:00 Lusaka; test boundaries and unlock flow.

- [x] Enhance Admin Users with mobile entries, explicit WhatsApp/country labels, shared contact presentation and Update list action; sample contact browser check and three validation tests pass.

- [x] Repair admin contact visibility and refresh; recover 24 supplied countries; verify WhatsApp validation/save failure tests and browser signup rejection.
- [ ] Verify admin contact display and successful profile-save readback in a signed-in session (blocked: requesting user's preview account unavailable; requires preview sign-in).

- [x] Address security findings: stream participant access is server-only; public AI signal writes revoked; database privilege readback verified. Public market signals/history and SEO metadata remain intentional; no privacy-sensitive settings columns found.
- [ ] Request safety-only publishing with broker entry gates retained after 86 passing tests and clean preview build; deployment completion not yet verified. Existing cloud copying may continue; full risk-engine acceptance still blocked.

- [x] Audit Copy Trading Risk Engine and public TradeCopy capabilities; preserve current execution architecture and feed.
- [x] Add staged fail-closed entry protections, remove stop-stripping/upward lots, test pure risk/strategy calculations, improve emergency readback and add honest Risk Centre observations; no deployment.
- [ ] Complete persistent atomic risk, strategy execution and broker follower acceptance (blocked: TradeCopy pre-entry admission/account contract capabilities undocumented; no authenticated DEMO follower evidence). No protected/live claim; specified branch unavailable in managed sandbox.

- [x] Match the Botvio user dashboard to the dark overview reference; active membership/access shown and desktop/phone appearance checked without page overflow; execution controls unchanged.
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
- [x] Fix legacy Admin dashboard "Profiles: Bad Request" — verified working in preview as super_admin; live site was stale, publish required.
