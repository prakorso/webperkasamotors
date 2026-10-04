# Marketing Analytics V1 — Phase 2 Admin UI — Production Release

## A. Summary
Read-only internal module at `/admin/analytics` shipped to production. Five tabs (Overview, Acquisition, Inventory, CTA, Search), ranges 7d/30d/90d (default 30d), data from GA4 Data API and Search Console API, server-side only.

## B. Commits
- Base main: `9c89cb84360e7921c50ebcd40f9c0df075ab451b`
- Feature commit / final main / deployed: `e46dad7eb750cf20b48b0b70b108a6583d341b0b` (`feat: add marketing analytics admin dashboard`), fast-forward, no rebase/squash/force.
- This report was committed afterwards as a docs-only commit.

## C. Route, navigation, auth
- `/admin/analytics`, inside the existing admin shell layout; unauthenticated request returns 307 to `/admin/login`.
- Nav item "Marketing Analytics" between Inventory and Website (flat nav).
- Access = existing admin auth (all active staff); no new RBAC. No public API route (`/api/analytics` returns 404).

## D. Parameters
`?tab=overview|acquisition|inventory|cta|search`, `?range=7d|30d|90d`. Unknown values fall back to overview / 30d. Ranges are complete Asia/Jakarta days ending yesterday (inclusive). Search Console window ends today−3.

## E. Metrics
- Overview: Users, Sessions, Page Views, Vehicle Views (view_item), WhatsApp Clicks, WA Conversion Rate = sessions with ≥1 `whatsapp_click` ÷ sessions (not eventCount/sessions, not sessionKeyEventRate). Insights: most viewed vehicle, top source, /sell interest. One daily trend chart (Sesi / Klik WhatsApp).
- Acquisition: source/medium, campaign, users, sessions, vehicle views, WA clicks, conversion.
- Inventory: GA4 `item_id` joined to `vehicles.stock_number`; analytics dated before vehicle `created_at` (Jakarta date) ignored; no Days Listed; click columns degrade to "—" while the dimension is processing.
- CTA: `cta_location` clicks and share; no per-CTA conversion; processing state.
- Search: clicks, impressions, CTR, position, top queries/pages; processing state when 0 rows.

## F. Architecture
- Pure modules (`lib/analytics/ranges|sections|metrics|format.ts`) unit tested; server-only modules (`google-auth|ga4|search-console|marketing-analytics.ts`).
- Auth to Google: dependency-free service-account JWT (node:crypto RS256 + fetch) instead of google-auth-library. No new dependencies.
- Cache: `unstable_cache`, revalidate 1800 s (30 min), tag `marketing-analytics`, key = query+start+end (env not in key). Cache Components is not enabled in this Next.js setup.
- Per-source error isolation: every section resolves through `settle()` into ok/empty/processing/error; unknown errors become a generic message, never raw upstream text.
- No Supabase cache tables, no raw event storage, no Meta, Finance, realtime or comparison.

## G. Google API calls per tab load (cold; warm = 0)
Overview 9 GA4 queries, Acquisition 4, Inventory 2 (item views shared with Overview), CTA 1, Search 3. Cold latency about 0.6–2 s. Per-request timeout 20 s, no retries.

## H. Data status at release
- GA4 Data API: PASS with real data (Users 3, Sessions 8, Page Views 17, Vehicle Views 5, WA clicks 11, WA conversion 50,0% = 4 of 8 sessions, 30d).
- Search Console API: access PASS; 0 rows (data not ready) → "belum tersedia" state. Real-data verification is pending.
- `cta_location` and `item_id` custom dimensions registered 2026-10-04, no backfill → CTA tab shows processing state; Inventory shows views per unit with "—" for clicks.
- Test-heavy data note: GA4 counts at this stage are dominated by test traffic. This is documented here, not shown in the UI permanently. Internal-traffic filter is deferred.
- QA-PAGN-01/02 vehicle rows remain (published, real-looking); not excluded by the dashboard.

## I. QA performed
- Technical: `npm run lint` clean; `npx next typegen` + `npx tsc --noEmit` clean; `npm run build` OK (`ƒ /admin/analytics`); `npm test` 16/16 pass; `npm audit --omit=dev` 0 vulnerabilities; full `npm audit` shows pre-existing dev-only highs (not fixed, no `audit fix`).
- Tests cover range normalization, WA formula, GA4 mapping, inventory join, pre-created_at filter, CTA aggregation, Search mapping, error fallback.
- Failure isolation (local, cache cleared between runs): GA4 broken → Overview/Inventory show GA4 error while Search tab still renders; Search Console broken → Search shows its own error while Overview renders normally.
- Ranges 7d/30d/90d and tab switching with URL persistence verified; loading skeleton verified.
- Visual: screenshots at 1440, 1280, 1024, 768 via same-origin iframes of a temporary local harness (removed before commit). Cards, chart, tab bar and range switch fit; Inventory/Acquisition tables scroll horizontally inside their own container on narrow widths (the last column can sit off-screen at 1024 and needs a scroll). Admin shell collapses to a hamburger below the lg breakpoint.
- Credential leak: grep of `.next/static`, `.next/server`, app, lib, components for private key markers found nothing.
- Production: deploy `e46dad7` state ready, commit_ref matches; authenticated Owner session loaded Overview (real data), Search (processing), CTA (processing).

## J. Local service-account file
`~/.perkasa-secrets/marketing-analytics-sa.json` deleted after production env was confirmed working. The key remains only in Netlify production env vars (a regular, non-secret variable because of Netlify plan limits on scopes and the secret flag).

## K. Known limits / deferred
Custom date range, comparison, Days Listed, manual refresh, internal-traffic filter, Netlify secret-flag plan, QA-PAGN decision, Search Console real-data verification, per-unit and CTA data once Google processes the dimensions. Inventory column header is "Klik ÷ Tayangan".

## L. Decision
MARKETING ANALYTICS V1 COMPLETE (with follow-ups listed in K).
