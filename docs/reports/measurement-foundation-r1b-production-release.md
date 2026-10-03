# Perkasa Motors — Measurement Foundation R1B: Production Release Report

Production code commit: `87d0645` on `main` (base `73386ed`); no code changed during the final asynchronous verification. GTM container published as "Perkasa Motors Measurement Foundation R1" (Version 2). Status: **PASS — all externally verifiable gates verified; two paths are code-verified only (see U, AH, AJ).**

## A. Executive summary
GTM, GA4, Meta Pixel and Search Console are configured and live on perkasamotors.id. Consent Mode v2 (default denied) gates GA4 and Meta. `view_item` and `whatsapp_click` are verified end to end in production. In the final verification GA4 listed `whatsapp_click` and it was marked as a key event (confirmed after reload), Meta Events Manager showed PageView, Contact and View content active with no Lead or Purchase, ACCEPT→REJECT was verified in production, and responsive smoke QA passed at 1440, 768 and 390. `detail_reserved` and `catalogue_empty_state` remain code-verified because live data does not expose them.

## B. macOS environment
macOS (Darwin 25.6.0), Chrome driven by browser automation; Owner signed in only (Google, Meta, Netlify, Hostinger).

## C. Base/main SHA
Base `73386ed`. Main did not move during the work. Final `bdcec88` pushed by fast-forward.

## D. Assets discovered
Meta business portfolio "Perkasa Group" (1077754063409145) with ad account "Perkasa Motors" (3655740518078857) and Facebook page "Perkasa Motors Group". Netlify project `webperkasamotors` (custom domain perkasamotors.id). Hostinger DNS for the domain.

## E. Assets created/reused
Created: GTM account "Perkasa Motors" (6380342885) and container `GTM-5B2CG228` (265978212); GA4 account 410474557, property 557215091, stream 15991036236; Meta dataset "Perkasa Motors" 2546559625844473 (connected to the existing ad account); Search Console domain property. Reused: Meta portfolio, ad account, page.

## F. GTM configuration
Tags: `GA4 - Configuration / Google Tag` (Initialization), `GA4 - Event - view_item`, `GA4 - Event - whatsapp_click`, `Meta - Base` (All Pages + `perkasa_consent_update`, idempotent via `window.__pkInit`), `Meta - PageView (SPA)` (History Change), `Meta - ViewContent` (fires only when `vehicle_status === 'AVAILABLE'`), `Meta - Contact`. All Meta tags require `ad_storage`. Triggers: Custom Event view_item, Custom Event whatsapp_click, Custom Event perkasa_consent_update, History Change. 15 Data Layer Variables. Published as Version 2; the live `gtm.js` contains the GA4 and Meta IDs and no Lead/Purchase.

## G. GA4 property/stream
Property 557215091, stream 15991036236, Measurement ID `G-XLBH4NP844`; Asia/Jakarta, IDR. Enhanced measurement: page views, scrolls, outbound clicks on; site search, forms, video, file downloads off.

## H. Meta Dataset/Pixel
Dataset/Pixel `2546559625844473` ("Perkasa Motors").

## I. Search Console
Domain property `perkasamotors.id`, verified with one DNS TXT record added at Hostinger; no other DNS record changed.

## J. Consent integration
First-party consent (`perkasa_cookie_consent`, version 1). Default denied and stored-"accepted" replay are emitted by the same inline script that injects `gtm.js`; later changes push `consent update` and `perkasa_consent_update`.

## K. Loader architecture
`components/public/measurement-loader.tsx`, mounted only from `app/(public)/layout.tsx`. GTM is the only tag layer. Details: `docs/tracking/measurement-architecture.md`.

## L. Host/admin exclusion
Loader and script are gated to `perkasamotors.id`; localhost, previews and netlify.app produce no dataLayer activity; `/admin` has no consent bar or data-wa markup. (localhost and /admin verified in the earlier local pass; the netlify.app/preview gate is code-level, not separately exercised in production.)

## M. page_view architecture
GA4: Google tag plus Enhanced measurement history-based page views. Meta: `Meta - PageView (SPA)` on History Change. Verified: one Meta PageView per route change (4 PageViews across 4 route changes in the wrapped-`fbq` test).

## N. view_item
Verified live: AVAILABLE and SOLD detail pages push one `view_item` each with a clean payload (item_id, name, brand, category, variant, price, currency IDR, vehicle_status, vehicle_year).

## O. whatsapp_click
Verified live in production with payload audit; intent only, no Lead/Purchase events.

## P. Optional events
`select_item` and `vehicle_gallery_open` deferred.

## Q. GA4 key event
**PASS.** After GA4 processed the events, Admin → Events → Recent events listed `first_visit`, `page_view`, `scroll`, `session_start`, `user_engagement`, `view_item`, `whatsapp_click` for the `perkasamotors.id` stream. `whatsapp_click` was starred (confirmation toast shown) and the Key events tab, after a full reload, lists `whatsapp_click` (with stream data) plus Google's default `purchase` ("No stream data detected"). No custom event was created and no tag or trigger was changed. Only `whatsapp_click` was marked.

## R. Meta PageView
Verified by wrapping `fbq` on the published container: PageView on load and on each route change, only after consent.

## S. Meta ViewContent
Fired for AVAILABLE only (CAR-0001); not fired for the SOLD page.

## T. Meta Contact
Fired once per `whatsapp_click` with cta params and vehicle content; no phone number or WhatsApp text.

## U. Full WhatsApp CTA matrix
| Location | Status |
|---|---|
| header | verified live |
| mobile_menu | verified live (menu opened via DOM; viewport not resized) |
| hero | verified live (`hero_slide_index` present) |
| vehicle_card | verified live (`home_available`, `related`) |
| catalogue_empty_state | CODE VERIFIED (`vehicle-catalogue.tsx`, `app/(public)/page.tsx`) — live catalogue does not expose it; not manufactured |
| payment_section | verified live |
| detail_inline | verified live |
| detail_sticky | verified live |
| detail_reserved | CODE VERIFIED (`vehicle-detail.tsx`) — no RESERVED unit exists; not manufactured |
| footer | verified live |

## V. Consent QA
Verified in production: NO CHOICE (no `fbq`, no `fbevents.js`); REJECT (consent update denied, no `fbq`); ACCEPT (`fbq` defined, Meta - Base fires once); REJECT→ACCEPT (Meta loads); persisted choice restored after reload. Bugs found and fixed during QA: gtag array vs `arguments`; consent default emitted too late; blocked All Pages tag not re-run after acceptance (`perkasa_consent_update`). ACCEPT→REJECT verified in production in the final pass: while accepted, a WhatsApp click produced one `fbq('track','Contact')`; after choosing "Tolak" (stored status `rejected`), route changes, a `view_item` and a WhatsApp click still reached the dataLayer but produced **zero** `fbq` calls. Note: GTM caches `gtm.js` briefly, so a tab opened right after publishing can run the previous container for a short time.

## W. Tag Assistant QA
Connected to production in preview mode. Confirmed tags fired: GA4 Google tag, GA4 view_item, GA4 whatsapp_click, Meta Base, Meta PageView (SPA), Meta ViewContent, Meta Contact; no tag unexpectedly fired in NO CHOICE.

## X. GA4 DebugView QA
DebugView showed `whatsapp_click`, `page_view`, `view_item`, `first_visit`, `session_start`, `user_engagement` from production; realtime showed an active user in Indonesia.

## Y. Meta Test Events QA
**PASS.** The Test events live feed did not display in this session, so Events Manager receipt was verified from the dataset Overview instead: PageView (21, Active), Contact (7, Active), View content (6, Active), all via the Meta pixel; no other events (no Lead, no Purchase) are listed. View content shows parameters (value, currency and others). Events Manager does not break View content down by vehicle status; AVAILABLE-only is established by the client-side `fbq` log (ViewContent for AVAILABLE, none for the SOLD page) and the GTM trigger guard `vehicle_status === 'AVAILABLE'`.

## Z. Search Console verification
Verified via DNS TXT.

## AA. Sitemap submission
Submitted as `https://perkasamotors.id/sitemap.xml` (the relative path was rejected).

## AB. PII/payload audit
Audited dataLayer pushes and `fbq` calls: no plate number, phone number, WhatsApp text, staff or auth identity. The `/privacy` page states that WhatsApp clicks are intent only.

## AC. Responsive QA
**PASS at 1440, 768 and 390 (smoke).** The automation browser window cannot change its viewport, so each width was tested with a same-origin iframe of that exact width on a local production build of `87d0645` (`next start`, localhost, tracking host-gated off). Not a real-device or production-host test; the code is identical to production. Results for home and a vehicle detail page: no horizontal overflow at any width; consent banner visible and pinned to the bottom. At 390 (and 360) the mobile sticky CTA is hidden while the decision area is visible, fixed to the bottom once it scrolls away, docked above the footer, hidden at the page bottom, and sits directly above the open consent banner with no overlap. At 768 and above the sticky CTA is intentionally not shown (`md:hidden`). Hero, vehicle card, payment and footer WhatsApp CTAs are present in the layouts. No visual screenshot review was performed.

## AD. Security audit
`npm audit --omit=dev`: 0 vulnerabilities. `npm audit`: 6 existing highs in the dev tooling chain; not fixed, per instruction. No `npm audit fix`, no Next/eslint-config-next downgrade.

## AE. Git / merge
Commits: f6d90a6, 17bd81b, 5e6390e, 9be9268, b287af8, bdcec88. Fast-forward pushes only; no rebase/squash/force push. Main was unchanged at the final divergence check. lint, `tsc --noEmit` and `next build` pass on `bdcec88`.

## AF. Netlify deploy
Project `webperkasamotors`, branch main. `b287af8` showed Published; the `bdcec88` deploy is confirmed by the new `/privacy` copy being served from perkasamotors.id.

## AG. Production QA
See M–Y for evidence. `/privacy` now says the services are active after consent and that Google Consent Mode may send cookieless signals when consent is denied; the cookieless claim is supported by a `g/collect` request seen with no choice, but cookie contents could not be read by the tool.

## AH. Deferred items
`select_item`, `vehicle_gallery_open`; GA4 internal-traffic filter (needs office IPs). `detail_reserved` and `catalogue_empty_state` stay code-verified until the live data exposes them.

## AI. Future R2 / OS measurement
CRM-side events (`conversation_started`, `lead_created`, `qualified_lead`, `site_visit`, `booking_created`, `vehicle_sold`) belong to the future Perkasa OS, not the browser.

## AJ. Final verdict
**PASS.** Container published; consent gating (NO CHOICE, REJECT, ACCEPT, REJECT→ACCEPT, ACCEPT→REJECT) and the core events verified in production; GA4 key event set and confirmed; Meta Events Manager received only PageView, Contact and ViewContent; responsive smoke QA passed. Caveats: responsive QA used iframe viewports on a local build; ViewContent AVAILABLE-only is proven client-side rather than by an Events Manager breakdown; two CTA paths are code-verified by design.
