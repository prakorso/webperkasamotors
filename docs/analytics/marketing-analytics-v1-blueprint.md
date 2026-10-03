# Marketing Analytics V1 — Canonical Blueprint

Status: design only (Phase 0). Nothing here is implemented. Evidence and open questions: `docs/reports/marketing-analytics-v1-architecture-audit.md`.

## 1. Purpose and scope
An internal, read-only admin module that answers seven questions: how much traffic, from where, which vehicles get interest, which vehicles get WhatsApp intent, which CTA placements work, how `/sell` performs, how organic search performs. Not a BI platform, not a warehouse: no raw hits, no custom sessionization, no copy of GA4 into Supabase.

## 2. Decisions (locked unless the Owner changes them)
| Topic | Decision |
|---|---|
| Admin route | `/admin/analytics` (one route; section and range in search params `?tab=overview\|acquisition\|inventory\|cta\|search&range=7d\|30d\|90d`) |
| Navigation | One flat sidebar item "Marketing Analytics" between Inventory and Website. No group headers until the sidebar itself is grouped. |
| Access | Same boundary as the rest of admin: any active staff profile (shell layout). Role gating is available later via `profile.role` (`OWNER`/`ADMIN`/`STAFF`), not enforced anywhere today. |
| Data access | Live server-side calls to the GA4 Data API and Search Console API, with a short server-side cache. No Supabase cache tables in V1. |
| Google auth | One Google Cloud service account, read-only, added as Viewer on the GA4 property and as a restricted user on the Search Console property. Credentials only in Netlify env, server-only module. |
| Library | `google-auth-library` for the JWT token, plain `fetch` to the two REST endpoints (no `googleapis` mega-package, no chart library needed for V1 tables). |
| Inventory join | GA4 `itemId` → `vehicles.stock_number`, with a created-at guard (section 6). |
| Date filters | 7D, 30D, 90D. Custom range and previous-period comparison deferred. |
| GA4 custom dimensions | Register exactly two, event-scoped: `cta_location`, `item_id`. |
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
| WhatsApp Conversion Rate (canonical) | GA4 `sessions` with `eventName = whatsapp_click` ÷ `sessions` | "Share of sessions with at least one WhatsApp click." |
| Most Viewed Vehicle | GA4 `itemsViewed` by `itemId`, top 1, joined to inventory | |
| Top Traffic Source | GA4 `sessions` by `sessionSourceMedium`, top 1 | Can be "(direct) / (none)" or "(data not available)"; shown as is. |
| Sell Vehicle Intent | GA4 `eventCount`, `eventName = whatsapp_click`, `pagePath = /sell` | Needs no custom dimension. |
| Sell page views | GA4 `screenPageViews`, `pagePath = /sell` | |
| Search clicks / impressions / CTR / position | Search Console Search Analytics | CTR and position are the API's own values, never recomputed from rounded daily numbers. |

Why sessions-based conversion: a visitor can click WhatsApp several times (header, card, sticky). Event-count ÷ sessions can exceed 100% and double-counts; users-based hides repeat visits; vehicle-views-based ignores the many sessions that never open a vehicle. Sessions-with-click ÷ sessions answers "what fraction of visits showed contact intent" and is bounded 0–100%. Defined by filtering `sessions` on the event name, not by GA4's `sessionKeyEventRate`, so it does not change meaning if another key event is added later.
Per-vehicle ratio (Inventory tab) is labelled differently: "Klik WA ÷ tayangan" (`whatsapp_click` with that `item_id` ÷ `itemsViewed`), shown as a plain ratio because the two metrics are not session-matched.

## 4. GA4 query catalogue (property `557215091`, timezone Asia/Jakarta, IDR)
All dates are Jakarta dates, inclusive; ranges end yesterday (`today-1`) so a partial day never distorts a trend.
1. Overview totals: metrics `activeUsers, sessions, screenPageViews`.
2. WhatsApp: metric `eventCount`, dimension filter `eventName == whatsapp_click`, dimension `date` (trend).
3. WA sessions: metric `sessions`, filter `eventName == whatsapp_click` (numerator of the conversion rate); denominator from query 1.
4. Vehicle views: metric `itemsViewed`, dimensions `itemId, itemName` (item scope).
5. Vehicle WA clicks: metric `eventCount`, filter `eventName == whatsapp_click`, dimension `customEvent:item_id` (needs registration).
6. Acquisition: dimensions `sessionSourceMedium, sessionCampaignName`, metrics `sessions, activeUsers`; separate query for WA sessions with the same dimensions and the `eventName` filter, joined in code. (Item-scoped and event-scoped parts cannot share a request with session-scoped dimensions; join by key.)
7. CTA: metric `eventCount`, filter `eventName == whatsapp_click`, dimension `customEvent:cta_location`.
8. Sell: `screenPageViews` and `eventCount` filtered by `pagePath == /sell`.
Expected cost is about 8–10 small requests per full page load, run in parallel. Property quota is far above this at current traffic.

## 5. Search Console
Property `sc-domain:perkasamotors.id`; API `searchanalytics.query`, scope `webmasters.readonly`. Dimensions `query`, `page`, `date`; metrics clicks, impressions, ctr, position. Data is delayed about 2–3 days and the API's dates are Pacific Time, not Jakarta: the UI must say so and end the range at least 3 days ago. At audit time the property reported "Processing data, please check again in a day or so" (no data yet), so the Search tab must ship with a real empty state. Sitemap `https://perkasamotors.id/sitemap.xml`: read, status Success, 23 discovered pages.

## 6. Inventory join
- Join key: `item_id` (GA4) = `vehicles.stock_number` (unique column, `CAR-NNNN` / `MOT-NNNN`). `external_id` is reserved for a future Operating System and must not be used here.
- Risk: stock numbers of deleted DRAFT/AVAILABLE/ARCHIVED vehicles go to `stock_number_pool` and are reissued (13 pooled today); SOLD/RESERVED numbers are locked. A reissued number would inherit the old vehicle's historical GA4 rows.
- Rule: per-vehicle queries add dimension `date`; rows dated before the current vehicle's `created_at` (Jakarta date) are discarded.
- Orphans: GA4 item ids with no inventory row are listed as "Unit tidak ditemukan" and excluded from vehicle KPIs.
- Test data: two live rows are QA fixtures (`QA-PAGN-01`, `QA-PAGN-02`); the dashboard should exclude stock numbers beginning `QA-` (or the Owner removes them first).

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
- Service account JSON never in the repo, client bundle or logs. Env names: `GOOGLE_SA_CLIENT_EMAIL`, `GOOGLE_SA_PRIVATE_KEY`, `GA4_PROPERTY_ID`, `GSC_SITE_URL`. Store only email and key (not the whole JSON) to stay inside Netlify's total environment size limit; mark the key as a secret.
- All Google calls in a `server-only` module, called from Server Components under the existing admin shell. No public API route, no client-side fetch of analytics.
- Service account permissions: Viewer on the GA4 property; restricted/read user on the Search Console property; no Cloud IAM roles.
- Display aggregates only: no visitor identity, IP, WhatsApp number, message text or `/sell` form values. `/sell` is shown only as page views, click count and session rate.

## 11. Known limits to state in the UI
GA4 processing delay (up to ~24–48h), possible thresholding on small counts, attribution that shows "(data not available)" or Unassigned for consent-denied/direct sessions, event count vs session/user count differences, Search Console 2–3 day lag and Pacific Time dates, internal and test traffic included until an internal-traffic filter exists, custom dimensions only populate from the day they are registered (not retroactive).

## 12. Implementation prerequisites
1. Register GA4 event-scoped custom dimensions `cta_location` and `item_id` (no GTM change needed: both are already sent as event parameters). Wait for them to populate.
2. Create a Google Cloud project, enable the Analytics Data API and Search Console API, create the service account and key; add it to GA4 (Viewer) and Search Console. Set the four Netlify env vars.
3. Prove the query catalogue with real API calls (PASS/BLOCKED per query) before building UI.
4. Decide what to do with the two `QA-` inventory rows and whether to define a GA4 internal-traffic filter.

## 13. Phases
- P1 Access and proof: prerequisites 1–3, server module with typed queries and a throwaway server-side verification (no UI).
- P2 Shell and Overview: route, nav item, KPI cards, trend, states.
- P3 Acquisition and CTA tabs.
- P4 Inventory tab with the join guard.
- P5 Search tab (once Search Console has data).
- Deferred: custom range, previous-period comparison, Days Listed, charts library, role gating, cache tables.
