# Perkasa Motors — Measurement Architecture

Status: R1A shipped (canonical host, SEO and consent foundation). **No analytics or advertising tag is installed yet.** R1B adds GTM, GA4, Meta and Search Console on top of this file's rules.

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

### R1B loader contract (must hold)

1. Before GTM loads: `window.dataLayer = window.dataLayer || []; gtag('consent', 'default', { ...googleConsentState(null), wait_for_update: 500 })`.
2. Immediately after: if `getConsentStatus()` is set, `gtag('consent', 'update', googleConsentState(status))`.
3. On every change (`subscribeToConsent`): `gtag('consent', 'update', …)`.
4. **Meta Pixel** must not load at all until `status === "accepted"` (Meta has no Consent-Mode equivalent that prevents `_fbp`). On a later "Tolak", stop firing; the cookie set earlier remains until it expires (document this in the notice).
5. GA4 tags fire only with `analytics_storage` granted. Advanced consent mode (cookieless pings) is **not** used unless the Owner decides otherwise. Use basic mode: no Google tag loads before acceptance.

## 3. Placement and exclusions

| Rule | Why |
|---|---|
| The measurement loader lives in `app/(public)/layout.tsx`, **never** `app/layout.tsx` | The root layout also wraps `/admin/*` |
| `/admin` and `/admin/*` never load GTM, GA4 or Meta | Staff CMS, not marketing traffic; also disallowed in robots |
| Production host gate: `lib/measurement/host.ts` `isMeasurementHost(location.hostname)` must be true (`perkasamotors.id` only) | No hits from netlify.app, deploy previews, branch deploys or localhost |
| Internal traffic (R1B) | GA4 data filter on the office IP(s) (Owner to supply), plus the host gate. Optional later: an app-level, logged-in-staff suppression flag set by the admin app. **Do not** read or forward the Supabase auth cookie/token for this |

## 4. Approved event taxonomy (from R0)

| Event | Trigger | GA4 | Meta | Key event |
|---|---|---|---|---|
| `page_view` | Every public page (history-based for App Router soft navigation; exactly one mechanism) | Automatic | `PageView` | No |
| `view_item` | Vehicle detail render, once per path | Recommended | `ViewContent` (**AVAILABLE only**) | No |
| `whatsapp_click` | Click on any `wa.me` CTA (11 types: header, mobile_menu, hero, card, empty_state, payment_section, detail_inline, detail_sticky, detail_reserved, footer) | Custom | `Contact` | **Yes** |
| `select_item` | Vehicle card click (optional) | Recommended | — | No |
| `vehicle_gallery_open` | Lightbox open (optional) | Custom | — | No |

Parameters: `cta_location`, `cta_context` (vehicle / generic / payment), `page_type`, `hero_slide_index` (hero only), `list_context` (cards only), and for vehicle context `item_id` (stock number), `item_name`, `item_brand`, `item_category`, `vehicle_status`, `value`, `currency=IDR`.

**Never send:** plate number, WhatsApp number or message text, any staff/auth identifier.

**Do not track:** carousel controls, gallery navigation, lightbox zoom, nav/menu clicks, highlights expand, pagination, section impressions, sticky-bar visibility, articles (dormant).

**Future (Perkasa OS / CRM, not browser):** `conversation_started`, `lead_created`, `qualified_lead`, `site_visit`, `booking_created`, `vehicle_sold`.

## 5. R1B prerequisites

1. Owner-held accounts: GTM container, GA4 property (Asia/Jakarta, IDR), Meta Pixel/dataset under the business's Business Manager, Search Console **Domain** property (DNS TXT on `perkasamotors.id`).
2. Office IP list for the GA4 internal-traffic filter.
3. Confirm `item_id` = stock number.
4. Update `/privacy` copy when tags go live.
5. Instrument CTAs with `data-*` attributes plus one delegated listener; no visible UI change.
6. QA: GA4 DebugView + Meta Test Events at 1440 / 768 / 390, both consent states, the host gate, and `/admin` exclusion.
