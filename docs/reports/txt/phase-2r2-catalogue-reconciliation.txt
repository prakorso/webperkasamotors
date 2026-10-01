# Perkasa Motors - Phase 2R.2: Catalogue Reconciliation

Result: **PASS** (RESERVED and empty-state visuals NOT VERIFIED - no data). Task state ACTIVE -> REVIEW. Not merged, not deployed.

## A. Base verification
Branch `integration/phase-2r2-catalogue-reconciliation` created from the pushed head of `integration/phase-2r1-integrated-baseline`: `6881340dfdaf609695e9b6c53b81e43414b0a5ae` (local and origin matched). Worktree `C:\Users\USER\webperkasamotors\.claude\worktrees\phase-2r2-catalogue-reconciliation`. All required reports were present. `.env.local` was copied locally for the build; it is gitignored and not committed.

## B. 15e525f change analysis
15e525f (vs bc8eaa1) touched three files: `cars/page.tsx` (adds `separateSoldInventory`), `vehicle-card.tsx` (`soldPresentation` prop), `vehicle-catalogue.tsx` (Available/Sold split).

## C. Preserve / Adapt / Drop / Reconcile
| 15e525f change | Decision | Why |
|---|---|---|
| Visual muting of sold cards (desaturated image, lighter border, muted title/price) | ADAPT | Kept, but derived from `vehicle.status === "SOLD"` instead of a separate prop, so Cars, Motorcycles and any other caller behave the same |
| "Sold Out" centered overlay | DROP | English, implies restock; badge "Terjual" is used instead |
| Suppressing the WhatsApp CTA on sold cards | DROP | Owner decision: SOLD keeps generic "Tanya Unit Lain" (Phase 2C behavior wins) |
| `separateSoldInventory` flag, client-side filtering of one page | RECONCILE | Replaced by a data-layer split (`getCatalogueByType`) so pagination is not driven by SOLD |
| Section eyebrows and blurbs ("Available", "Arsip kendaraan...") | DROP | Extra marketing copy; headings are just "Unit Tersedia" / "Unit Terjual" |
| Cars-only | RECONCILE | Applied to both catalogues through the shared component |
| "Belum ada unit yang tersedia saat ini." | ADAPT | Reworded "Belum ada unit tersedia saat ini." plus optional generic WhatsApp CTA |

## D. Cars implementation
`app/(public)/cars/page.tsx` calls `getCatalogueByType("CAR", page)` and passes `vehicles` (active) and `soldVehicles` to the shared `VehicleCatalogue`. Route meta description changed from "curated collection of premium cars" to "Pilihan mobil yang tersedia di Perkasa Motors." (unsupported-claim removal).

## E. Motorcycles implementation
Identical, with `"MOTORCYCLE"`; meta description "Pilihan motor yang tersedia di Perkasa Motors." Same component, no separate design.

## F. AVAILABLE behavior
Unchanged: badge "Tersedia", secondary md button "Saya Tertarik", vehicle-specific `vehicleWhatsAppUrl`. Verified in browser: the message text names the vehicle.

## G. RESERVED behavior
Sorted after AVAILABLE inside "Unit Tersedia" (tier order retained), badge "Dipesan" (warning), generic "Tanya Unit Lain" CTA, never the vehicle-specific CTA. Code-verified only. **Browser state NOT VERIFIED**: there are zero RESERVED units in the data and none were fabricated.

## H. SOLD presentation
Section "Unit Terjual" (plain label, no "terbaru" claim), after a divider, muted heading, muted cards, badge "Terjual". The section is omitted entirely when there are no SOLD units (no "belum ada unit terjual" text).

## I. SOLD generic CTA verification
Browser: all 6 sold cards on /cars and /motorcycles show "Tanya Unit Lain", linking to the generic message "Halo Perkasa Motors, saya ingin mengetahui lebih lanjut mengenai unit yang tersedia." (does not name the sold unit). Rendered as `outline`/`sm`, quieter than AVAILABLE's `secondary`/`md`.

## J. SOLD archive cap
`SOLD_CATALOGUE_LIMIT = 6` in `lib/data/vehicles.ts`. Order: `created_at DESC, id ASC` (existing deterministic order; there is no sold_at, so this is NOT "most recently sold" and nothing claims it). Both catalogues have more than 6 SOLD units, so exactly 6 render.

## K. Pagination behavior
`getVehiclesByTypePaginated` gained an optional `tiers` parameter (default unchanged). The catalogue now paginates only AVAILABLE + RESERVED (10 per page). SOLD never counts toward pages and is fetched only when the shown page is the last active page, so there is no page of only sold units and SOLD cannot shift available inventory. An out-of-range `?page=` is clamped to the last active page. Current inventory (1 available per type) fits one page.

## L. Empty states
"Belum ada unit tersedia saat ini." plus a "Tanya via WhatsApp" button reusing `genericVehicleWhatsAppUrl` (aria-label: tanyakan unit yang akan datang); no future-stock promise. The old English text is removed. The visual state is NOT VERIFIED in the browser (it would need data changes); verified by code review, typecheck and build only.

## M. Trust-copy verification
No "kurasi", "inspeksi", "terjamin", "premium" or "sempurna" strings were added; the route meta "curated ... premium" was removed.

## N. Image-alt preservation
`vehicleMediaAlt(vehicle, primaryMedia)` retained in the card. Browser: 0 images without alt on all six catalogue views; example "HYUNDAI GRAND AVEGA HATCHBACK 2013 — foto 2".

## O. Browser QA
Environment: `next start` (production build) on 127.0.0.1:3220, headless Edge driven over CDP (the Chrome extension browser could not reach localhost: connection refused). Screenshots were captured to a scratch directory and are not committed.

| View | Result |
|---|---|
| /cars and /motorcycles at 1440, 768, 390 | no horizontal overflow; h2 = "Unit Tersedia", "Unit Terjual"; 1 available + 6 sold cards; badges Tersedia/Terjual; 0 broken images; 0 nested anchors; no "Sold Out"; 0 console errors or exceptions |
| Cars/Motorcycles parity | identical structure and counts |
| Detail navigation from catalogue links (available car, sold car, available motorcycle, sold motorcycle) | all resolve to the right page, 0 console errors; sold pages show "Tanya Unit Lain", available pages show "Saya Tertarik dengan Unit Ini". Detail design not evaluated |
| RESERVED, empty state | NOT VERIFIED |

Note: detail pages and admin keep English status labels (Available/Sold); that is 2R.3 scope.

## P. Lint
`npm run lint` PASS.

## Q. Typecheck
`npx next typegen` then `npx tsc --noEmit` PASS.

## R. Build
`npm run build` PASS (28/28 pages).

## S. npm audit
`npm audit --omit=dev`: 0 vulnerabilities. Full `npm audit`: 1 high (transitive `brace-expansion`, dev tooling), same as Phase 2R.1; not fixed.

## T. Changed-file list
`app/(public)/cars/page.tsx`, `app/(public)/motorcycles/page.tsx`, `components/public/vehicle-card.tsx`, `components/public/vehicle-catalogue.tsx`, `lib/data/vehicles.ts`, this report (md and txt), `.ruflo/coordination/tasks/PHASE-2R2.json`.

## U. Scope verification
No change to vehicle-detail, vehicle-gallery, homepage, financing, About, Contact, Articles, admin, supabase, public or package files. No DB write, schema change or CMS mutation (reads only). Side effect: `VehicleCard` is shared, so homepage Featured cards now show the Indonesian badge "Tersedia" instead of "Available" (no logic change). The shared `VehicleStatusBadge`/`statusLabel` is untouched.

## V. Known deferred issues
- Detail page and admin still show English status labels.
- No sold_at: "Unit Terjual" order is by created_at, not sale date (Phase 2R.6).
- Empty-state and RESERVED visuals unverified until data exists.
- Homepage Featured grid and copy are 2R.4.
- Full `npm audit` brace-expansion finding still open.

## W. Phase 2R.3 readiness
READY. Detail and gallery are untouched; 2R.3 can port R3B (c0b1bae) onto `vehicle-detail.tsx` as planned in Phase 1R.
