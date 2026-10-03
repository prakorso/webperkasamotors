# Perkasa Motors — Measurement Architecture

Status: R1B code merged; external accounts created. The GTM container is built but **published only after QA** (see `docs/reports/measurement-foundation-r1b-production-release.md` for what is live).

## Account identifiers (non-secret)

| Asset | ID |
|---|---|
| GTM account / container | "Perkasa Motors" (6380342885) / `GTM-5B2CG228` (web, `perkasamotors.id`) |
| GA4 account / property | "Perkasa Motors" (410474557) / property `557215091` |
| GA4 stream / Measurement ID | stream `15991036236` / `G-XLBH4NP844` (Asia/Jakarta, IDR, Enhanced measurement: page views, scrolls, outbound clicks only) |
| Meta business portfolio / dataset (pixel) | "Perkasa Group" (1077754063409145) / "Perkasa Motors" `2546559625844473` |
| Search Console | Domain property `perkasamotors.id`, verified via DNS TXT at Hostinger; sitemap `https://perkasamotors.id/sitemap.xml` submitted |
| Netlify env | `NEXT_PUBLIC_GTM_ID=GTM-5B2CG228` (GTM is the only ID the app knows) |

## GTM container contents

Tags: `GA4 - Configuration / Google Tag` (Google tag, Initialization, built-in analytics consent), `GA4 - Event - view_item`, `GA4 - Event - whatsapp_click`, `Meta - Base` (Custom HTML, All Pages, requires `ad_storage`), `Meta - PageView (SPA)` (History Change, requires `ad_storage`), `Meta - ViewContent` (view_item, fires fbq only when `vehicle_status === "AVAILABLE"`, requires `ad_storage`), `Meta - Contact` (whatsapp_click, requires `ad_storage`).
Triggers: `Custom Event - view_item`, `Custom Event - whatsapp_click`, `History Change - All Pages`.
Variables: Data Layer Variables `DLV - <key>` for cta_location, cta_context, page_type, hero_slide_index, list_context, item_id, item_name, item_brand, item_category, item_variant, vehicle_status, vehicle_year, value, currency, items.
page_view on SPA navigation: the Google tag plus GA4 Enhanced measurement "Page views" (history-based) is the single GA4 mechanism; Meta uses the History Change tag.

Source audits: `docs/reports/measurement-foundation-r0-audit.md` (event taxonomy) and `docs/reports/measurement-foundation-r1a-production-release.md` (this foundation).

---

## 1. Canonical host

| Rule | Implementation |
|---|---|
| The only public host is `https://perkasamotors.id` | `lib/site-url.ts`: `SITE_URL` = `NEXT_PUBLIC_SITE_URL` or, if unset, `CANONICAL_ORIGIN` (`https://perkasamotors.id`). Never the netlify.app host |
| Netlify production env | `NEXT_PUBLIC_SITE_URL=https://perkasamotors.id`, **production context only**. Deploy previews and branch deploys inherit nothing, so they fall back to the canonical origin and point their canonicals at production |
| `webperkasamotors.netlify.app/*` → apex | `netlify.toml` host redirect, 301, `force = true`, `:splat` (path kept; Netlify forwards the query string) |
| `www` / `http` → apex | Netlify domain management (301) |
| Absolute URLs | Always via `absoluteUrl()` / `paginatedCanonical()`. Never concatenate `process.env.NEXT_PUBLIC_SITE_URL` in a page |
| Canonicals | Set **per page** (Next merges metadata shallowly; a canonical in a layout would leak to every child). `/`, `/cars`, `/motorcycles`, `/articles`, `/privacy`, and every `[slug]` detail. Listings canonicalize to the page actually rendered (out-of-range `?page=` clamps) |
| robots.txt | `Allow: /`, `Disallow: /admin/`, `Sitemap: https://perkasamotors.id/sitemap.xml` |
| sitemap.xml | Canonical-host URLs only. `lastModified` only where truthful (vehicle and article `updated_at`, trigger-maintained); omitted for listing pages and `/privacy` |

## 2. Consent architecture

- **Default:** no choice = denied. Google Consent Mode v2 default for all four signals: `analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization` = `denied`.
- **Store:** `lib/measurement/consent.ts`. localStorage key **`perkasa_cookie_consent`**, value `{ status: "accepted" | "rejected", version: 1, updatedAt: ISO }`. No identity, no cookie, never sent to a server. If storage is blocked, the choice is held in memory for the page session.
- **API (client):** `getConsentStatus()`, `setConsentStatus()`, `subscribeToConsent()` (also reacts to other tabs via the `storage` event), `openPrivacySettings()` (dispatches `perkasa:open-privacy-settings`), `googleConsentState(status)` (the Consent Mode mapping).
- **Version bump:** if purposes or vendors change materially, increment `CONSENT_VERSION`. Old choices then read as "no choice" and the bar re-asks.
- **UI:** `components/public/consent-banner.tsx`. A compact bottom bar on the public layout only. "Tolak" and "Terima" have equal weight. While it is open it sets `--consent-offset`, used for body padding and the mobile sticky vehicle CTA offset, so it never permanently covers content. Reopened from the footer "Pengaturan Privasi" (`components/public/privacy-settings-button.tsx`) and from `/privacy`. When reopened it shows the current choice, focuses its title, closes on Esc and returns focus.
- **Notice:** `/privacy` (`app/(public)/privacy/page.tsx`). It is factual and names no unconfirmed legal entity, address, retention period or legal basis. Updated in R1B to describe the live behavior (GA4/Meta after consent, Google Consent Mode signals when denied).

### R1B loader contract (implemented and verified live — `components/public/measurement-loader.tsx`)

1. `consent default` (denied, `wait_for_update: 500`) and the replay of a stored "accepted" choice (`consent update`) are emitted by the **same inline script** that injects `gtm.js`, before the GTM snippet. A React effect is too late — Tag Assistant showed tags firing before consent in that case. `gtag` must push the `arguments` object, never an array.
2. The inline script is rendered only when `NEXT_PUBLIC_GTM_ID` is set and re-checks `window.location.hostname === MEASUREMENT_HOSTNAME`.
3. The component's effect handles later changes: on every `subscribeToConsent` change it pushes `gtag('consent','update', …)` and then the custom event `perkasa_consent_update`. GTM does not re-run an All Pages tag that was blocked by consent, so `Meta - Base` also fires on the `perkasa_consent_update` trigger. Its Custom HTML is guarded (`window.__pkInit`) so it initialises once.
4. **Meta Pixel** is a GTM Custom HTML tag requiring additional consent `ad_storage`. With no choice or "Tolak" it never loads (`fbq` undefined, no `fbevents.js`). A cookie set earlier remains until it expires after a later "Tolak".
5. **GA4** uses the Google tag with built-in consent checks (Consent Mode v2). With consent denied the Google tag may still send cookieless pings; this is stated in `/privacy`.
6. **page_view:** GA4 uses the Google tag plus Enhanced measurement "Page views" (history-based). Meta uses the `Meta - PageView (SPA)` tag on the GTM History Change trigger. The app adds no manual page_view.
7. `whatsapp_click` is a delegated click listener on `a[data-wa-location]` (dedupe 1s). `view_item` is pushed once per detail mount.

## 3. Placement and exclusions

| Rule | Implementation |
|---|---|
| The measurement loader lives in `app/(public)/layout.tsx`, **never** `app/layout.tsx` | `<MeasurementLoader />`, last child of `PublicLayout` — the root layout also wraps `/admin/*` |
| `/admin` and `/admin/*` never load GTM, GA4 or Meta | Verified: `/admin` renders zero `data-wa-*` markup and the loader component is not in the admin tree at all |
| Production host gate: `lib/measurement/host.ts` `isMeasurementHost(location.hostname)` must be true (`perkasamotors.id` only) | Checked twice — once in `MeasurementLoader`'s effect (consent/dataLayer init) and again inside the injected GTM snippet itself — and a third time inside `pushDataLayerEvent` (`lib/measurement/events.ts`), so `view_item`/`whatsapp_click` can never reach `dataLayer` from a non-production host even if called directly |
| Internal traffic (R1B) | GA4 data filter on the office IP(s) (Owner to supply) — **deferred**, no stable IP supplied yet. Host gate + admin exclusion remain mandatory regardless |

## 4. Approved event taxonomy (from R0)

| Event | Trigger | GA4 | Meta | Key event |
|---|---|---|---|---|
| `page_view` | Every public page (GA4 Enhanced measurement history-based; Meta via History Change tag — zero app code, see loader contract above) | Automatic | `PageView` | No |
| `view_item` | Vehicle detail render, once per path (`components/public/view-item-tracker.tsx`) | Recommended | `ViewContent` (**AVAILABLE only** — configure the GTM trigger to require `vehicle_status = AVAILABLE`) | No |
| `whatsapp_click` | Click on any `wa.me` CTA, or a valid `/sell` form submit (11 canonical locations: `header`, `mobile_menu`, `hero`, `vehicle_card`, `catalogue_empty_state`, `payment_section`, `detail_inline`, `detail_sticky`, `detail_reserved`, `sell_form`, `footer` — one delegated listener in `measurement-loader.tsx`; `sell_form` is fired from the form submit handler, see event-taxonomy.md) | Custom | `Contact` | **Yes** |
| `select_item` | Vehicle card click | **Deferred** — not implemented in R1B (section 35: defer when it would complicate the release; core events took priority) | — | No |
| `vehicle_gallery_open` | Lightbox open | **Deferred** — not implemented in R1B (section 36, same reasoning) | — | No |

Parameters (`lib/measurement/events.ts`): `cta_location`, `cta_context` (`vehicle` / `generic` / `payment`), `page_type` (derived from `window.location.pathname` at click time inside the delegated listener, **not** a static prop — the public layout's header/footer never remount on client-side navigation, so a prop would go stale), `hero_slide_index` (hero only, 2–3 slide case), `list_context` (`home_available` / `home_sold` / `catalogue_available` / `catalogue_sold` / `related` — cards only), and for vehicle context `item_id` (stock number), `item_name`, `item_brand`, `item_category`, `item_variant`, `vehicle_status`, `value`, `currency=IDR`.

Accidental rapid double-tap on the same CTA (same `cta_location` + `href` within 1s) is deduplicated in `trackWhatsAppClick` — navigation itself is never blocked, only the duplicate `dataLayer` push.

**Never send:** plate number, WhatsApp number or message text, any staff/auth identifier. Confirmed: `tracking` props only ever carry `stockNumber`/`brand`/`model`/`variant`/`price`/`status`/`vehicleType` — no PII-shaped field exists on the `WhatsAppTracking` type.

**Do not track:** carousel controls, gallery navigation, lightbox zoom, nav/menu clicks, highlights expand, pagination, section impressions, sticky-bar visibility, articles (dormant).

**Future (Perkasa OS / CRM, not browser):** `conversation_started`, `lead_created`, `qualified_lead`, `site_visit`, `booking_created`, `vehicle_sold`.

## 5. R1B status

Live and verified in production: GTM container `GTM-5B2CG228` (published version "Perkasa Motors Measurement Foundation R1"), GA4 `G-XLBH4NP844`, Meta dataset `2546559625844473`, Search Console domain property for `perkasamotors.id`. See `docs/reports/measurement-foundation-r1b-production-release.md` for evidence and open items.

Deferred: `select_item`, `vehicle_gallery_open`, GA4 internal-traffic filter (needs an office IP list), marking `whatsapp_click` as a GA4 key event (GA4 lists an event only after it has been processed, up to 24h), and a live RESERVED / empty-catalogue check (no such data exists on the live site).
