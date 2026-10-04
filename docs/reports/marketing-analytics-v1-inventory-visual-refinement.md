# Marketing Analytics V1.1 — Inventory Visual Refinement

## A. Executive summary
The Inventory tab now shows each unit's public cover photo as a 48×60 thumbnail. Presentation only: no metric, tracking, schema, storage or auth change. No Pages tab was added.

## B. Base / main SHA
Base origin/main: `619b603f5d4367bd21ac113dc6b4ff90df085d55`. Final main = deployed commit: `1c212cf2bffb3687ab00350f5e74ebbeefa44ed5` (`fix: add vehicle thumbnails to marketing analytics inventory`), fast-forward, no rebase/squash/force. Netlify state ready, commit_ref matches.

## C. Files changed
- `lib/analytics/marketing-analytics.ts` — `loadVehicleRefs` also reads media and sets `imageUrl`.
- `lib/analytics/metrics.ts` — optional `imageUrl` on `VehicleRef`.
- `components/admin/analytics/vehicle-thumb.tsx` — new client component.
- `components/admin/analytics/views.tsx` — new "Foto" column.

## D. Existing Inventory structure
Columns were Unit (name + stock number as second line), Status, Tayangan, Klik WhatsApp, Klik ÷ Tayangan. Kept as is; stock number stays as the unit cell's second line, so no separate stock column (clearer and denser). New first column "Foto".

## E. Media source
Existing `vehicle_media` table in the existing `vehicle-media` Supabase bucket, via the existing `getAllVehicleMediaForAdmin()` helper. No new table, column, bucket, copy or upload.

## F. Primary image logic
Same definition as the public catalogue: the vehicle's media row with `is_primary = true` (public cards use `.find(m => m.isPrimary)`). No second definition, no fallback to another photo.

## G. Data-query change
One extra batched query (all media, ordered by vehicle_id, sort_order) run in parallel with the two existing vehicle queries. Media errors are caught and degrade to placeholders; they never fail the table.

## H. N+1 audit
None. One media query per page load regardless of vehicle count. Inventory does not wait on the click dimension (media is independent of GA4).

## I. Thumbnail design
48×60 px (4:5, same ratio as public cards), rounded 8px, object-cover, fixed box so no layout jump. `next/image` with `sizes="48px"` (served ~48/96 px variants through the existing optimizer and `remotePatterns`), lazy loading by default.

## J. Fallback behavior
No primary photo or load failure → neutral box with car icon and "Tidak ada foto". Verified live by forcing a broken image URL on one row: placeholder appeared, no broken-image icon, row intact. All 18 live vehicles currently have a primary photo, so the no-photo case was only exercised through the error path.

## K. Inventory metrics regression
No formula or column definition touched (diff limited to the files above). Live values before/after identical: CAR-0001 3 views, MOT-0012 1, QA-PAGN-02 1, others 0; click columns "—" (processing notice preserved). Join to stock_number, created_at guard, QA-PAGN rows unchanged.

## L. Responsive QA (real screenshots, production, same-origin iframes)
1440/1280: full table, rows ~80px, names on one line. 1024: names wrap to 3–4 lines in the narrow unit column but remain readable, thumbnails intact. 768: shell collapses to hamburger, table fits, names wrap to 2–3 lines. Table scrolls inside its own container when narrower than its minimum width; page never overflows. Vehicle ↔ image mapping confirmed against the database for every row (primary storage path per stock number matches the rendered image URL).

## M. Accessibility
Thumbnail uses `alt=""` (decorative): the unit name is in the adjacent cell, so alt text would only duplicate it. Placeholder icon is `aria-hidden`; its visible "Tidak ada foto" text is read.

## N. Performance
One additional Supabase read per Inventory/overview load (parallel, no added GA4 calls: counts unchanged at Inventory 2 GA4 queries). 18 small lazy images per load. No noticeable response impact observed.

## O. Production verification
Authenticated Owner session on `https://perkasamotors.id/admin/analytics?tab=inventory&range=30d` and `range=7d`: images render, mapping correct, no broken media, metrics unchanged, params persist. Other tabs share no changed code (Overview/Acquisition/CTA/Search untouched). Technical: lint, typegen, tsc, build pass; 16/16 tests pass; `npm audit --omit=dev` 0; full audit shows the existing dev-only highs (no audit fix).

## P. Data safety
Read-only. No migration, schema change, storage or media mutation, Supabase write.

## Q. Tracking safety
No tracking added. Admin page has no GTM/GA/Meta script or inline loader; no credential markers in the rendered page.

## R. Final verdict
COMPLETE. Deferred: optional "Lihat Halaman" public link (needs slug/type/published logic and adds clutter; not clearly useful), wider unit column at 1024.
