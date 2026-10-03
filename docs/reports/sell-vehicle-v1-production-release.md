# Perkasa Motors — Jual Kendaraan V1: Production Release Report

Route `/sell` is live on https://perkasamotors.id. Deployed code commit: `196e765` (feature commit `91313de`, double-submit guard `196e765`). Verdict: **PASS** (caveats in S/T).

## A. Executive summary
A frontend-only "Jual Kendaraan" page. The visitor fills in vehicle data, it is validated locally, a WhatsApp message is generated, and WhatsApp opens for the existing official number. Nothing is posted to any Perkasa system (no API route, database, storage or upload). The navigation gained "Jual Kendaraan". Tracking reuses the R1 `whatsapp_click` event with new values only (`sell_form`, `sell_vehicle`); no form value reaches Google or Meta.

## B. Base/main SHA
Base `origin/main` = `215102c52f4e5a0e0581abd79e111cb5aa68e596`. Main did not move before either merge (fast-forward only; no rebase, squash or force push). Final main = `196e765ca3a66a5008d438458817fa2b434eebcb` (this report is committed after it).

## C. Files changed
New: `app/(public)/sell/page.tsx`, `components/public/sell-vehicle-form.tsx`, `lib/utils/sell-vehicle.ts`. Edited: `lib/data/public-nav.ts` (nav), `lib/measurement/events.ts` (types + `inferPageType`), `app/sitemap.ts`, `docs/tracking/event-taxonomy.md`. No change to GTM, GA4, Meta, consent, the loader, or the host guard.

## D. Page structure
Hero (eyebrow, "Mau Jual Mobil atau Motor?", description), the offer form card, the factual disclaimer below the form, then "Cara Kerjanya" (five steps, copy as specified). Existing header, footer and consent banner. Same typography, spacing, button and input styles as the rest of the site.

## E. Form fields
Required: Jenis Kendaraan (Mobil/Motor radio), Merek, Model / Tipe, Tahun, Kilometer, Pajak STNK Berlaku Sampai (month + year selects), Pajak 5 Tahunan / Plat Berlaku Sampai (month + year selects), Harga yang Diharapkan. Optional: Catatan Kondisi Unit (textarea, 500 characters). No photo upload, no file input, no seller name or phone.

## F. Validation rules
Single source `validateSellVehicle` (`lib/utils/sell-vehicle.ts`), used by the UI and by the submit handler. Merek ≤ 40 and Model ≤ 60 characters, non-empty after trim. Tahun: 4 digits, 1980 to current year + 1 (client clock, so it never goes stale). Kilometer: digits only, 0 to 1.000.000. Tax and plate: month and year both chosen, year from current year − 3 to + 7. Harga: digits only, Rp500.000 to Rp10.000.000.000. Catatan ≤ 500 characters. These numeric bounds are my choices for "reasonable" and are easy to change. The CTA is a real `disabled` button until valid; the submit handler re-validates, so Enter or a dispatched submit cannot bypass it. Errors appear after a field is blurred (or on a forced submit) and are linked with `aria-describedby`.

## G. WhatsApp message behavior
Exactly the locked structure (verified by unit test and on production). Free text is trimmed and whitespace/newlines collapsed to one line. Kilometer `42.000 km`, price `Rp185.000.000`, months in Indonesian (`Januari 2027`). Destination is the same `website_settings.whatsapp` number used by every other CTA (`wa.me/6285111307044`, identical to the header CTA). The greeting uses the site company name ("Perkasa Motors"). Opened with `window.open(url, "_blank", "noopener,noreferrer")`; WhatsApp redirected to `api.whatsapp.com/send` with the correctly encoded message. A 1-second guard prevents two tabs on a fast double click.

## H. Optional notes behavior
Empty or whitespace-only: the `Catatan Kondisi Unit` line is omitted. Filled: the line appears once.

## I. Navigation changes
`Jual Kendaraan` added after the catalogue links (order: Beli Mobil, Beli Motor, Jual Kendaraan, then CMS extras such as Artikel when shown). Verified in the desktop header, the mobile menu and the footer (the footer shares the same helper, so it is consistent with the existing footer styling). It is inserted by code in `withCoreLinks`, not written to the CMS.

## J. SEO changes
Title "Jual Mobil & Motor — Perkasa Motors" (site title template), description as suggested, canonical `https://perkasamotors.id/sell`, `/sell` added to the sitemap (verified live).

## K. Tracking changes
`CtaLocation` += `sell_form`, `CtaContext` += `sell_vehicle`, `PageType` += `sell_vehicle` (`/sell`). On a valid submit the handler calls the existing `trackWhatsAppClick` once (deduped) and then opens WhatsApp. The CTA is intentionally a `<button>` plus `window.open`, not an `<a href>`: the wa.me URL contains the visitor's entries, so it is never placed in a link that automatic outbound-click measurement (GA4 Enhanced measurement "outbound clicks" is on) could read. This is a deliberate departure from the site's anchor pattern, for privacy. Page view uses the existing automatic `page_view`; no manual one. No new GTM variable or tag: the existing `whatsapp_click` tags already forward `cta_location`, `cta_context` and `page_type`. Documented in `docs/tracking/event-taxonomy.md`.

## L. Privacy payload audit
Production, consent accepted, form filled with distinctive values: one `whatsapp_click` with only `cta_location=sell_form`, `cta_context=sell_vehicle`, `page_type=sell_vehicle`; Meta `Contact` with only `cta_location` and `cta_context`; no event while typing. Scanning the dataLayer, `fbq` calls and the GA4/Meta/GTM request URLs for the entered values, the message text, `wa.me`/`api.whatsapp.com` and the price found none (the only substring match was `cta_context=`). GA4 sent `page_view` and `whatsapp_click` only, with no `click` outbound event. Meta sent `PageView` and `Contact` only; no Lead, Purchase or SubmitApplication, and no automatic button-click event was observed. Limit: request bodies are not readable with this tool, so the check covers request URLs, `fbq` and the dataLayer.

## M. Responsive QA
The browser window cannot change viewport, so each width was tested with a same-origin iframe of that exact width on a local production build of the same code (tracking is host-gated off there): 1440, 1024, 768, 430, 390, 360 and 320. No horizontal overflow at any width after one fix (the CTA label forced a 1px overflow at 360; it now wraps), all form controls within the viewport and at least 44px tall, CTA visible, disabled state clearly dimmed, the CTA never covered by the consent banner, navigation usable. The mobile sticky vehicle CTA does not exist on this page. I looked at one desktop screenshot only, not every width.

## N. Accessibility QA
Real `<label for>` on every text control, `fieldset`/`legend` for the radio group and the two date pairs, native `<select>` and radios (visible focus ring via `peer-focus-visible`), `aria-invalid` plus `aria-describedby` for errors and helper text, disabled CTA with an explanatory hint, error text colour `accent-deep` on white. Verified structurally and programmatically. Not verified: real key presses. Keyboard input was not delivered to the automation tab in this session (a Tab key did not even move focus), so Enter-to-submit was checked only by dispatching `submit` events (blocked when invalid, handled when valid) and by the HTML rule that a form with a disabled default button does not implicitly submit.

## O. Technical QA
`npm ci`, lint, `next typegen`, `tsc --noEmit` and `next build` pass on the final code. `npm audit --omit=dev`: 0 vulnerabilities. `npm audit`: the same 6 existing dev-only highs; not fixed, no `npm audit fix`.

## P. Functional QA
Pure-module unit test (36 assertions, all pass) plus browser checks on a local build and on production: A empty form disabled and forced submit opens nothing; B each missing field blocks the submit with the right inline error; C all valid enables the CTA; D notes empty omits the line; E notes filled shows it once; F Mobil and G Motor output; H `42.000 km`; I `Rp185.000.000`; J `Januari 2027`; K the URL opens the official chat with the encoded message (a real click opened `api.whatsapp.com/send?phone=6285111307044&text=…` with the exact message); L one `whatsapp_click`, not duplicated on rapid clicks.

## Q. Production verification
https://perkasamotors.id/sell, `/`, `/cars`, `/motorcycles`, `/privacy` and `/sitemap.xml` return 200. Navigation, form, invalid-state blocking, a real click opening WhatsApp, GA4 `page_view` and `whatsapp_click`, Meta `PageView` and `Contact`, the reject path (event still recorded, zero `fbq` calls, WhatsApp still opens), one soft-navigation PageView, and the double-click guard were verified live. These tests generated a handful of real `whatsapp_click` and Contact events with the test values only in the message (not in analytics); treat them as test traffic in GA4/Meta counts.

## R. Data safety
No database schema change, no Supabase read or write added, no storage, no CMS write, no API route, no inventory change. The page only reads `website_settings` (as every page does) for the WhatsApp number and company name.

## S. Deferred items
Photo upload, seller lead database, CRM, automated valuation, finance integration, seller profile, document upload, admin seller pipeline, analytics dashboard, social publishing, R2 attribution. Also: `vehicle_category` was not added to tracking (it would need a GTM mapping, which was out of scope).

## T. Final verdict
**PASS.** Caveats: responsive QA used iframe viewports on a local build; real keyboard presses could not be exercised in this session; the new `Contact` receipt in Meta Events Manager was not re-checked (the pixel request was observed leaving the page).
