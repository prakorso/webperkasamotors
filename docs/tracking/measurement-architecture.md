# Perkasa Motors — Measurement Architecture

Status: R1B code-complete and merged. The loader, consent wiring, data-layer events and every CTA instrumentation point described below are live in the codebase. **No tag actually fires yet**: `NEXT_PUBLIC_GTM_ID` is unset in Netlify, and the GTM container/GA4 property/Meta dataset have not been created. See `docs/reports/measurement-foundation-r1b-production-release.md` for exactly what is and isn't live, and `docs/tracking/event-taxonomy.md` for the full parameter contract.

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
- **Notice:** `/privacy` (`app/(public)/privacy/page.tsx`). It is factual and names no unconfirmed legal entity, address, retention period or legal basis. **Update it in R1B** (it currently says the analytics/ads services are not yet active).

### R1B loader contract (implemented — `components/public/measurement-loader.tsx`)

1. Before GTM loads: `window.dataLayer = window.dataLayer || []; gtag('consent', 'default', { ...googleConsentState(null), wait_for_update: 500 })`.
2. Immediately after: if `getConsentStatus()` is set, `gtag('consent', 'update', googleConsentState(status))`.
3. On every change (`subscribeToConsent`): `gtag('consent', 'update', …)`.
4. The GTM container script loads via `next/script` (`strategy="afterInteractive"`), gated a second time inside the script itself on `window.location.hostname === MEASUREMENT_HOSTNAME`, and only rendered at all when `NEXT_PUBLIC_GTM_ID` is set.
5. **Meta Pixel** is a GTM tag (Custom HTML or the Meta template), not app code — it must not load at all until `status === "accepted"` (Meta has no Consent-Mode equivalent that prevents `_fbp`). Configure its GTM trigger with an additional consent check on `ad_storage` (or a custom consent type) granted. On a later "Tolak", stop firing; the cookie set earlier remains until it expires (document this in the notice).
6. GA4 tags fire only with `analytics_storage` granted (GTM's built-in Google consent check, no extra configuration needed). Advanced consent mode (cookieless pings) is **not** used unless the Owner decides otherwise. Use basic mode: no Google tag loads before acceptance.
7. **page_view** is not app code at all — GTM's own History Change trigger (patches `pushState`/`replaceState`/`popstate`, which Next.js App Router's client navigation uses natively) plus a GA4 event tag is the single mechanism. Do not add a manual route-change page_view in the app and do not rely on the GA4 Configuration tag's own automatic page_view (disable it) — see §39 of the production-release report for the exact GTM tag/trigger setup once the container exists.

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
| `page_view` | Every public page (GTM History Change trigger — zero app code, see §2.7 above) | Automatic | `PageView` | No |
| `view_item` | Vehicle detail render, once per path (`components/public/view-item-tracker.tsx`) | Recommended | `ViewContent` (**AVAILABLE only** — configure the GTM trigger to require `vehicle_status = AVAILABLE`) | No |
| `whatsapp_click` | Click on any `wa.me` CTA (10 canonical locations: `header`, `mobile_menu`, `hero`, `vehicle_card`, `catalogue_empty_state`, `payment_section`, `detail_inline`, `detail_sticky`, `detail_reserved`, `footer` — one delegated listener in `measurement-loader.tsx`) | Custom | `Contact` | **Yes** |
| `select_item` | Vehicle card click | **Deferred** — not implemented in R1B (section 35: defer when it would complicate the release; core events took priority) | — | No |
| `vehicle_gallery_open` | Lightbox open | **Deferred** — not implemented in R1B (section 36, same reasoning) | — | No |

Parameters (`lib/measurement/events.ts`): `cta_location`, `cta_context` (`vehicle` / `generic` / `payment`), `page_type` (derived from `window.location.pathname` at click time inside the delegated listener, **not** a static prop — the public layout's header/footer never remount on client-side navigation, so a prop would go stale), `hero_slide_index` (hero only, 2–3 slide case), `list_context` (`home_available` / `home_sold` / `catalogue_available` / `catalogue_sold` / `related` — cards only), and for vehicle context `item_id` (stock number), `item_name`, `item_brand`, `item_category`, `item_variant`, `vehicle_status`, `value`, `currency=IDR`.

Accidental rapid double-tap on the same CTA (same `cta_location` + `href` within 1s) is deduplicated in `trackWhatsAppClick` — navigation itself is never blocked, only the duplicate `dataLayer` push.

**Never send:** plate number, WhatsApp number or message text, any staff/auth identifier. Confirmed: `tracking` props only ever carry `stockNumber`/`brand`/`model`/`variant`/`price`/`status`/`vehicleType` — no PII-shaped field exists on the `WhatsAppTracking` type.

**Do not track:** carousel controls, gallery navigation, lightbox zoom, nav/menu clicks, highlights expand, pagination, section impressions, sticky-bar visibility, articles (dormant).

**Future (Perkasa OS / CRM, not browser):** `conversation_started`, `lead_created`, `qualified_lead`, `site_visit`, `booking_created`, `vehicle_sold`.

## 5. R1B remaining work (code is done; this is the live-account phase)

1. Owner-held accounts: GTM container, GA4 property (Asia/Jakarta, IDR), Meta Pixel/dataset under the business's Business Manager, Search Console **Domain** property (DNS TXT on `perkasamotors.id`) — not yet created/discovered.
2. Set `NEXT_PUBLIC_GTM_ID` in Netlify production env once the container exists. GA4 Measurement ID and Meta Pixel ID are GTM-side variables, never app env vars (GTM is the only tag-loading layer — see §8 of the R1B request).
3. Build the GTM tags/triggers/variables themselves (GA4 config, `GA4 - Event - view_item`, `GA4 - Event - whatsapp_click` marked as a GA4 **Key Event**, `Meta - Base`, `Meta - ViewContent`, `Meta - Contact`, the History Change page_view tag) — none of this is app code.
4. Office IP list for the GA4 internal-traffic filter (optional, deferred until supplied).
5. Update `/privacy` copy from "not yet active" to the live description once the above is actually verified firing in production — not before (section 47: never claim activation that hasn't been confirmed).
6. QA once the container exists: GTM Preview/Tag Assistant, GA4 DebugView, Meta Test Events, both consent states, the host gate, `/admin` exclusion, 1440/768/390.

**Already done (this file, code-verified):** CTAs instrumented with `data-wa-*` attributes plus one delegated listener (zero visible UI change — confirmed via local SSR HTML diff and a live consent-flow browser pass); `item_id` confirmed as `vehicle.stockNumber`; `lint` / `tsc --noEmit` / `next build` / `npm audit --omit=dev` all pass.
