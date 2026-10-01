# Perkasa Motors - Phase 2R.3: Vehicle Detail + Gallery Reconciliation

Result: **PASS** (RESERVED browser state NOT VERIFIED - no data). Task state ACTIVE -> REVIEW. Not merged, not deployed.

## A. Base verification
Branch `integration/phase-2r3-vehicle-detail-gallery` created from the pushed head of `integration/phase-2r2-catalogue-reconciliation`: `652baf32e7ddcf69a5db5edccd467b2739107a66` (local and origin matched). Worktree `C:\Users\USER\webperkasamotors\.claude\worktrees\phase-2r3-vehicle-detail-gallery`. All required reports present. `.env.local` copied locally (gitignored, not committed).

## B. R3B diff analysis
R3B (`15e525f..cc90d4f`) changed `vehicle-detail.tsx` and `vehicle-gallery.tsx`; `cc90d4f..c0b1bae` adds `.eq("status","AVAILABLE")` to `getRelatedVehicles`. Nothing was cherry-picked or copied: `vehicle-detail.tsx` was re-authored from the current integrated file, `vehicle-gallery.tsx` received targeted edits, and the related-vehicles line was applied by hand on top of the 2R.2 version of `lib/data/vehicles.ts`.

## C. Preserve / Adapt / Drop / Reconcile
| R3B change | Decision | Notes |
|---|---|---|
| Open editorial right column (no card box), hairline rows, larger price (30/34px), `break-words` title | ADAPT | Ported |
| Stock number demoted to small tracked label beside the status badge | PRESERVE | Ported (stock number retained, visually secondary) |
| "year . transmission . km" meta line | DROP | Duplicates the spec grid |
| "About" section, `vehicle.description`, description synthesized from longest highlight | DROP | Protected: description stays removed |
| `cleanHighlight` text rewriting ("Spek:", "dll") | DROP | Rewrites seller text; deferred to owner decision |
| Unbounded 2-column highlights checklist, `key={highlight}` | DROP | Phase 2C cap-5 + disclosure kept; check icons ADAPTED onto it, keyed by index |
| Check icon on highlights | ADAPT | Small primary check on each item |
| Full-width "Technical Specifications" section holding specs and the CTA | RECONCILE | Specs stay in the right column (2-col hairline grid); CTA kept in the first viewport |
| English headings "About", "Condition & Features", "Technical Specifications" | DROP | Indonesian ("Sorotan") |
| `mediaWithAlt` removal | DROP | Alt fallback kept |
| "Related Vehicles" heading | DROP | "Unit Lainnya" kept |
| Gallery 4:5 frame, `object-contain`, rounded-24 | PRESERVE | Real uploads are 4:5 portrait |
| Gallery 4 thumbnails at 4:3 | PRESERVE | MAX_THUMBNAILS 4 |
| 6/6 column split (was 7/5) | ADAPT | Ported |
| Related AVAILABLE-only (c0b1bae) | PRESERVE | Applied by hand |

## D. Vehicle-detail implementation
`components/public/vehicle-detail.tsx`: right column order is status + stock number, title, price, specs, WhatsApp CTA, highlights. The CTA was moved ahead of the highlights (a small deviation from the preferred order) because 5 visible, long highlight lines pushed it to y=962 on a 900px desktop viewport; it now sits at y=661-704 (inside the first viewport) at 1440/1280, 606-641 at 768, and below the gallery on mobile (about 1140-1170 px page offset; the sticky mobile CTA is a later phase). CTA logic, labels and aria text are unchanged. Financing was not touched.

## E. Gallery implementation
`components/public/vehicle-gallery.tsx`: frame `aspect-[4/5]` with `object-contain`, 4 thumbnails (`object-cover`, 4:3), sizes hints updated. Carousel logic, primary-photo start, lightbox, keyboard buttons and aria labels unchanged. Measured: main frame 621x776 at 1440, 342x428 at 390, `object-fit: contain`, no distortion.

## F. Status presentation
Public mapping in `lib/utils/format.ts` (`publicStatusLabel`: Tersedia / Dipesan / Terjual) rendered through `Badge`. The shared English `statusLabel` and `VehicleStatusBadge` used by the admin are untouched. Browser: badge "Tersedia" on available pages, "Terjual" on sold; no English status text in the article.

## G. Spec-grid behavior
Rows: Tahun, Kilometer, Transmisi, Bahan Bakar, Warna, Kapasitas Mesin, Plat Nomor. Optional rows (Warna, Kapasitas Mesin, Plat Nomor) render only when a value exists; no "—" ever (browser: 0 dash values). "Kondisi" (Used/New) was removed from the public page (field untouched in schema/admin). Capacity shows for any vehicle that has a value (all four test units have one). Enum labels: AUTOMATIC -> Otomatis, MANUAL -> Manual, CVT -> CVT, PETROL -> Bensin, DIESEL -> Diesel, HYBRID -> Hybrid, ELECTRIC -> Listrik (new `transmissionLabel` / `fuelTypeLabel` helpers; enum values not rewritten). The hide-empty-row path is code-verified; every live test unit has all optional values, so an empty case was not seen in the browser.

## H. Highlights preservation
5 visible, `<details>` "Lihat N sorotan lainnya" for the rest (browser: 5 visible; 16/20/13/19 remaining). No chip de-duplication against specs was implemented (deferred; it would rewrite seller content).

## I. Description removal verification
No `vehicle.description` rendering, no synthesized description. Browser: the article contains only 2 `<p>` elements (stock number, price); no "About" heading.

## J. Image alt verification
`mediaWithAlt` preserved, shared by main image, thumbnails and lightbox. Browser, all 16 views: 0 images without alt, 0 broken images; example "HYUNDAI GRAND AVEGA HATCHBACK 2012 — foto 2".

## K. WhatsApp behavior
AVAILABLE: "Saya Tertarik dengan Unit Ini", vehicle-specific message naming the unit. SOLD: "Tanya Unit Lain", generic message "Halo Perkasa Motors, saya ingin mengetahui lebih lanjut mengenai unit yang tersedia." RESERVED: generic by the same `!isAvailable` branch (code-verified).

## L. Related-vehicle behavior
`getRelatedVehicles` now filters `status = AVAILABLE`. Heading "Unit Lainnya"; section hidden when empty. Browser: sold car and sold motorcycle pages show 1 related card each, badge "Tersedia"; available pages show none (no other available unit of that type), so the section is hidden. "Related Vehicles" text absent everywhere.

## M. Responsive behavior
Browser at 1440, 1280, 768, 390 for 4 detail pages: no horizontal overflow in any of the 16 views; gallery proportions hold; CTA inside the first viewport on desktop and tablet; thumbnails (4) render; lightbox opens on click and closes on Escape (checked at 1440 on all four pages); long title wraps (`break-words`).

## N. Browser QA
**HEADLESS FALLBACK, not visible QA.** The Claude-in-Chrome browser could not reach the local server (`localhost` and `127.0.0.1`: ERR_CONNECTION_REFUSED while `curl` returned 200 on the same ports), so QA used headless Edge driven over CDP against a production build (`next start`). Pages: available car `/cars/hyundai-grand-avega-hatchback-2012`, sold car `/cars/hyundai-grand-avega-hatchback-2013-4`, available motorcycle `/motorcycles/suzuki-gsx-r-sport-2017`, sold motorcycle `/motorcycles/yamaha-r15-v3-sport-2022`. Per view: 0 console errors/exceptions, 0 nested anchors. Screenshots of 1440 and 390 were captured to a scratch folder (not committed). RESERVED: NOT VERIFIED (no data; none created).

## O. Lint
`npm run lint` PASS.
## P. Typecheck
`npx next typegen` + `npx tsc --noEmit` PASS.
## Q. Build
`npm run build` PASS (28/28 pages), run again after the CTA move.
## R. npm audit
`npm audit --omit=dev`: 0 vulnerabilities. Full `npm audit`: 1 high (transitive `brace-expansion`, dev tooling), unchanged; not fixed.

## S. Changed files
`components/public/vehicle-detail.tsx`, `components/public/vehicle-gallery.tsx`, `lib/utils/format.ts` (new public label helpers only), `lib/data/vehicles.ts` (one filter in `getRelatedVehicles`), this report (md/txt), `.ruflo/coordination/tasks/PHASE-2R3.json`.

## T. Scope verification
No change to homepage, financing, About, Contact, Articles, admin, supabase, public, package files, or `vehicle-card.tsx`/`vehicle-catalogue.tsx`. No DB or CMS writes (reads only).

## U. Phase 2R.2 regression check
`getCatalogueByType`, SOLD cap 6, pagination, catalogue components and the card were not edited (git diff of those files vs `652baf3` is empty). The only `lib/data/vehicles.ts` change is inside `getRelatedVehicles`. Catalogue pages were not re-browsed this phase; the build compiles them unchanged.

## V. Known deferred items
- Raw seller highlight text (e.g. "- BPKB DAN STNK", "KELENGKAPAN:") is shown as entered; cleanup needs owner or product decision.
- Catalogue card still shows "Automatic" and raw "MANUAL" for transmission; only the detail page was localized.
- Sticky mobile CTA (later polish); on mobile the CTA is about 1140-1170px down the page, after the gallery and specs.
- Empty optional spec rows and RESERVED detail not seen in the browser.
- Detail financing link/estimate: none, per Phase 2R.4.
- Full `npm audit` brace-expansion advisory still open.
- Live data contains a sold car with a QA-style stock number ("QA-PAGN-01"); not touched.

## W. Phase 2R.4 readiness
READY. Detail and gallery are reconciled; 2R.4 covers homepage, How to Buy, Recent SOLD, financing, About and claim removals.
