# Marketing Analytics V1 — Canonical Blueprint

Status: Phase 0 design plus Phase 1 API proof (2026-10-04). No UI is built. Evidence: `docs/reports/marketing-analytics-v1-architecture-audit.md` (audit) and `docs/reports/marketing-analytics-v1-phase1-api-proof.md` (real API results).

## 1. Purpose and scope
An internal, read-only admin module that answers seven questions: how much traffic, from where, which vehicles get interest, which vehicles get WhatsApp intent, which CTA placements work, how `/sell` performs, how organic search performs. Not a BI platform, not a warehouse: no raw hits, no custom sessionization, no copy of GA4 into Supabase.

## 2. Decisions (locked unless the Owner changes them)
| Topic | Decision |
|---|---|
| Admin route | `/admin/analytics` (one route; section and range in search params `?tab=overview\|acquisition\|inventory\|cta\|search&range=7d\|30d\|90d`) |
| Navigation | One flat sidebar item "Marketing Analytics" between Inventory and Website. No group headers until the sidebar itself is grouped. |
| Access | Same boundary as the rest of admin: any active staff profile (shell layout). Role gating is available later via `profile.role` (`OWNER`/`ADMIN`/`STAFF`), not enforced anywhere today. |
| Data access | Live server-side calls to the GA4 Data API and Search Console API, cached 30 minutes with `unstable_cache(fn, keyParts, { revalidate: 1800, tags: ['marketing-analytics'] })` (Next 16.3.7 without Cache Components; `use cache` is the documented successor, migrate when Cache Components is adopted). "Muat ulang" calls `revalidateTag`. Auth/cookies are read outside the cached function. No Supabase cache tables in V1. |
| Google auth | PROVISIONED. Project `perkasa-motors-analytics`, service account `perkasa-motors-marketing-analy@perkasa-motors-analytics.iam.gserviceaccount.com` (no project IAM roles), Viewer on GA4 property 557215091, `siteRestrictedUser` on `sc-domain:perkasamotors.id`. Only the Analytics Data API and Search Console API are enabled. |
| Library | `google-auth-library` for the JWT token, plain `fetch` to the two REST endpoints (no `googleapis` mega-package, no chart library needed for V1 tables). |
| Inventory join | GA4 `itemId` → `vehicles.stock_number`, with a created-at guard (section 6). |
| Date filters | 7D, 30D, 90D. Custom range and previous-period comparison deferred. |
| GA4 custom dimensions | REGISTERED 2026-10-04, event-scoped: `CTA Location` (`cta_location`) and `Vehicle Item ID` (`item_id`). No backfill: data accrues only from registration. `page_type`, `cta_context`, `vehicle_status`, `list_context` stay unregistered. |
| Days Listed | Not in V1 (no truthful publication timestamp exists). |
| Raw event storage | No. |

## 3. Canonical metrics
| Metric | Source | Definition |
|---|---|---|
| Users | GA4 `activeUsers` | Active users in range. Not `totalUsers`. |
| Sessions | GA4 `sessions` | |
| Page Views | GA4 `screenPageViews` | |
| Vehicle Views | GA4 `itemsViewed` (item-scoped, from `view_item`) | Sum over vehicle items. Per vehicle by `itemId`. |
| WhatsApp Clicks | GA4 `eventCount` where `eventName = whatsapp_click` | Intent clicks, includes clicks from lists, header and footer. Not conversations, not leads. |
| WhatsApp Conversion Rate (canonical) | GA4 `sessions` with `dimensionFilter eventName == whatsapp_click` ÷ `sessions` (two requests) | "Share of sessions with at least one WhatsApp click." PROVEN: 4 sessions vs 11 events in the same window. Do not use `sessionKeyEventRate`: key-event counting started only when the event was starred (2026-10-04), so it is not retroactive (returned 25% vs the true 50% in the proof window). |
| Most Viewed Vehicle | GA4 `itemsViewed` by `itemId`, top 1, joined to inventory | |
| Top Traffic Source | GA4 `sessions` by `sessionSourceMedium`, top 1 | Can be "(direct) / (none)" or "(data not available)"; shown as is. |
| Sell Vehicle Intent | GA4 `eventCount`, `eventName = whatsapp_click`, `pagePath = /sell` | Needs no custom dimension. |
| Sell page views | GA4 `screenPageViews`, `pagePath = /sell` | |
| Search clicks / impressions / CTR / position | Search Console Search Analytics | CTR and position are the API's own values, never recomputed from rounded daily numbers. |

Why sessions-based conversion: a visitor can click WhatsApp several times (header, card, sticky). Event-count ÷ sessions can exceed 100% and double-counts; users-based hides repeat visits; vehicle-views-based ignores the many sessions that never open a vehicle. Sessions-with-click ÷ sessions answers "what fraction of visits showed contact intent" and is bounded 0–100%. Defined by filtering `sessions` on the event name, not by GA4's `sessionKeyEventRate`, so it does not change meaning if another key event is added later.
Per-vehicle ratio (Inventory tab) is labelled differently: "Klik WA ÷ tayangan" (`whatsapp_click` with that `item_id` ÷ `itemsViewed`), shown as a plain ratio because the two metrics are not session-matched.

## 4. GA4 query catalogue (property `557215091`, Asia/Jakarta, IDR) — all PROVEN against the real Data API
All dates are Jakarta dates, inclusive; ranges end yesterday. One quota token per request; ~0.7 s per request; 8 parallel 90-day requests took 0.6 s.
1. Overview totals: `activeUsers, sessions, screenPageViews`. Trend: add dimension `date`.
2. WhatsApp clicks: `eventCount`, filter `eventName == whatsapp_click` (trend with `date`).
3. WA sessions: `sessions`, filter `eventName == whatsapp_click` (numerator), total `sessions` (denominator).
4. Vehicle views: `itemsViewed` by `itemId, itemName`; for the join guard add `date`.
5. WhatsApp clicks per vehicle: `eventCount`, filter `eventName == whatsapp_click`, dimension `customEvent:item_id` (+ `date`). Valid and accepted, but returns `(not set)` until post-registration events are processed.
6. Acquisition: `sessionSourceMedium` (+ `sessionCampaignName`) × `sessions, activeUsers`; WA sessions with the same dimensions plus the `eventName` filter, joined in code by key.
7. CTA: `customEvent:cta_location` × `eventCount`, filter `eventName == whatsapp_click`. Same processing caveat.
8. Sell: `screenPageViews` and (`eventCount` or `sessions`) filtered by `pagePath == /sell` and, for clicks, `eventName == whatsapp_click` (no custom dimension needed).
Traps found by real calls (never use):
- `itemId × eventCount` → HTTP 400 (that is why WhatsApp-per-vehicle needs `customEvent:item_id`).
- `itemsViewed × sessionSourceMedium` returns 200 but every row is `(not set)` (item-scoped metric with session-scoped dimension). Never join views to source this way.
- `itemId × sessions` returns 200 but is not a view count; use `itemsViewed`.
- Dimension splits do not have to sum to the total: sessions with a click were 4, but split by source/medium they summed to 5 (one visit can carry two attributions when consent changes mid-visit). Show totals from the unsplit query.
- `landingPage` is empty for sessions without attribution (6 of 8 in the proof window); show as "(tidak diketahui)".
- `customEvent:*` dimensions are not available in `runRealtimeReport`.
Server code must accept the private key either with real newlines or with literal `\n` sequences and normalise before signing.

## 5. Search Console
Property `sc-domain:perkasamotors.id`; API `searchanalytics.query`, scope `webmasters.readonly`. Dimensions `query`, `page`, `date`; metrics clicks, impressions, ctr, position. Data is delayed about 2–3 days and the API's dates are Pacific Time, not Jakarta: the UI must say so and end the range at least 3 days ago. PROVEN access (2026-10-04): `sites.list` shows `sc-domain:perkasamotors.id` with `siteRestrictedUser`; `searchAnalytics.query` returned HTTP 200 with 0 rows for total, `query`, `page` and `date` (also with `dataState=all`). That is ACCESS PASS, DATA NOT READY: the UI says "Processing data, please check again in a day or so". The Search tab must ship with a real empty state. Date semantics are documented as Pacific Time and cannot be verified empirically until rows exist; verify in Phase 2. Sitemap `https://perkasamotors.id/sitemap.xml`: read, status Success, 23 discovered pages.

## 6. Inventory join (PROVEN)
- Key: GA4 `itemId` / `customEvent:item_id` = `vehicles.stock_number` (`NOT NULL UNIQUE`; 18 rows, 18 distinct). `external_id` is reserved for a future Operating System; `slug` can change.
- Proof: 3 analytics vehicles (`CAR-0001`, `MOT-0012`, `QA-PAGN-02`) joined 3/3 to current inventory, 0 orphans, 0 dropped by the guard.
- Guard (stock numbers can be reused): keep an analytics row only if `date >= (vehicles.created_at at time zone 'Asia/Jakarta')::date` (inclusive, Jakarta). Query per vehicle with the `date` dimension and filter in the server layer.
- Reuse facts: deleting a DRAFT/AVAILABLE/ARCHIVED vehicle inserts its stock number into `stock_number_pool`; `generate_stock_number` hands pooled numbers out first, alphabetically. SOLD/RESERVED (or ever SOLD/RESERVED) vehicles can never be deleted.
- Architecture debt (do not fix in V1): stock numbers are reusable, so they are not a permanent analytics identity. The future unified Perkasa OS should introduce an immutable business/analytics vehicle id that is never reused.
- Data hygiene finding: the reuse pool currently holds 13 non-standard numbers (`QA-T1-*`, `QA-PAGN-03/04/05`, `TEST-PAGN-*`), all CAR, none in `CAR-0000` format; the next cars created in the admin will be given these (starting with `QA-PAGN-03`). Needs an Owner decision outside this module.
- Test data: live rows `QA-PAGN-01` (SOLD) and `QA-PAGN-02` (AVAILABLE) are published with real-looking photos, plates and location. Not removed (see the Phase 1 report); the dashboard excludes stock numbers starting with `QA-` by default.

## 7. Navigation and layout
Admin shell is `app/(admin)/admin/(shell)/layout.tsx` (session + active `profiles` row) with a fixed 256px sidebar on desktop and off-canvas on tablet/mobile; pages use `PageHeader` and `StatCard`. There is no chart library today. V1 uses `StatCard` + tables + (at most) two small inline SVG/CSS sparklines; add a chart dependency only if a trend chart is actually built.
Sections (tabs via `?tab=`):
1. Overview: 6 KPI cards (Users, Sessions, Page Views, Vehicle Views, WhatsApp Clicks, WA Conversion Rate), a WhatsApp-clicks-per-day trend, then three insight cards: Most Viewed Vehicle, Top Traffic Source, Sell Vehicle Intent (page views, clicks, session rate).
2. Acquisition: table Source / Medium, Campaign, Users, Sessions, WA Sessions, WA Conversion Rate.
3. Inventory: table Vehicle, Stock Number, Status, Views, WA Clicks, Klik WA ÷ tayangan. Optional status filter (Tersedia/Terjual). No Days Listed.
4. CTA: table CTA Location, Clicks, Share of WA Clicks. No per-CTA conversion rate (no impression denominator exists).
5. Search: 4 KPI cards + Top Queries and Top Pages tables, with the 3-day latency and Pacific Time note.

## 8. States
Each section fetches independently inside its own Suspense boundary; one source failing never blanks the page.
- Loading: skeleton cards/rows.
- No data: "Belum ada data untuk periode ini." (Search adds "Data Search Console tertunda 2–3 hari.")
- Source error: inline card "Data GA4 tidak dapat dimuat" / "Data Search Console tidak dapat dimuat" with a retry link and no stack trace; the other source still renders.
- Not configured (env missing): explicit "Belum dikonfigurasi" state, never a crash.
- Footer note on every tab: "Diperbarui: <time>. Angka GA4 dapat berubah hingga 48 jam. Pengunjung yang menolak cookie hanya terhitung sebagian."

## 9. Refresh model
No polling. Server cache of 30 minutes per query key (range + section); a "Muat ulang" button revalidates. Show "Diperbarui HH:mm WIB" from the cached fetch time. Verify the exact Next 16 caching API in `node_modules/next/dist/docs/` before implementing (AGENTS.md requires it).

## 10. Security and privacy
- Netlify env names (production context only; set 2026-10-04): `GOOGLE_ANALYTICS_PROPERTY_ID`, `GOOGLE_SEARCH_CONSOLE_SITE_URL`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`. None has the `NEXT_PUBLIC_` prefix; total environment is ~2.2 KB.
- Limitation: this Netlify plan cannot restrict scopes and refuses to mark a variable secret while the default scopes include `post_processing`, so the private key is a normal (non-secret) server variable, readable by Netlify team members and available to builds. Mitigations: read-only Viewer / `siteRestrictedUser` permissions only, no project IAM roles, never printed or committed. If the team grows or the plan is upgraded, mark it secret or rotate it.
- The only copy of the key outside Netlify is `~/.perkasa-secrets/marketing-analytics-sa.json` (mode 600, outside any repository, used for local API proof). Delete it once Phase 2 no longer needs local verification; the key can be revoked in Google Cloud at any time.
- All Google calls are in a `server-only` module used from Server Components under the existing admin shell. No public analytics endpoint, no client-side fetch, no token to the browser.
- Aggregates only: no visitor identity, IP, WhatsApp number, message text or `/sell` form values.

## 11. Known limits to state in the UI
GA4 processing delay (up to ~24–48h), possible thresholding on small counts, attribution that shows "(data not available)" or Unassigned for consent-denied/direct sessions, event count vs session/user count differences, Search Console 2–3 day lag and Pacific Time dates, internal and test traffic included until an internal-traffic filter exists, custom dimensions only populate from the day they are registered (not retroactive).

## 12. Prerequisite status (2026-10-04)
1. GA4 custom dimensions `cta_location`, `item_id`: DONE (registered). Verification of populated values pending: re-run query 5 and 7 after Google processes post-registration events (up to ~24h) — Phase 2 gate for the CTA and vehicle-click tables.
2. Google Cloud project, APIs, service account, key, GA4 and Search Console grants, Netlify env: DONE.
3. Real API proof of the query catalogue: DONE (see Phase 1 report), except populated custom-dimension values and Search Console rows (data not ready).
4. Owner decisions: QA-PAGN rows retained (blocked by DB lock and not provably test-only); internal traffic filter deferred; analytics access = any active staff.
5. New: decide how to clean the stock-number reuse pool (not a dashboard task).

## 13. Phases
- P2 Shell and Overview (route, nav item, KPI cards, trend, states) — can start now.
- P3 Acquisition tab; P3 CTA tab after custom dimensions show values.
- P4 Inventory tab with the join guard (views now; per-vehicle clicks after processing).
- P5 Search tab once Search Console returns rows.
- Deferred: custom range, previous-period comparison, Days Listed, charts library, role gating, cache tables.
