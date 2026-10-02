# Perkasa Motors - Phase 2R.7: Final Integrated QA + Merge Readiness

**Result: PARTIAL.** The integrated product (public site, admin/CMS, lifecycle schema) passes final QA. One release-blocking responsive regression was found and fixed (one CSS line). The only remaining gate is that a direct merge to `origin/main` **conflicts in 5 files** (main moved 7 commits that were never reconciled into the 2R lineage). Decision: **NOT READY for direct merge; READY once the main-reconciliation step is done.** Nothing was merged or deployed. No live data was modified.

## A. Base / lineage
- Branch `integration/phase-2r7-final-qa`, worktree `.claude/worktrees/phase-2r7-final-qa`.
- Base: exact pushed HEAD of `integration/phase-2r6-os-readiness` = `675857dc5f60bf548c451fd34a2469329f140eb8`.
- Lineage contains (verified `merge-base --is-ancestor`): UI baseline `76c206e`, technical baseline `0d91bf7`, `d079e46`, `bc8eaa1`; Phase 2R.1 (`9e2be9b`, `6881340`), 2R.2 (`652baf3`), 2R.3 (`c28b772`), 2R.4 (`665a8a6`), 2R.5 (`3fa73db`), 2R.5A (`6ec0897`, `9a12768`), 2R.6 (`16562fc`), 2R.6A (`380594e`, `675857d`).
- No reversion: no financing calculator, homepage renders no About/Why/Testimonials blocks, detail is the 2R.3/2R.4 version.
- Authenticated admin session: Owner signed in (twice; first window closed) in a local Edge window; AI ran all admin QA read-only. Session profile deleted afterward (see Z).

## B. Public homepage QA - PASS
Order (headings): Hero (2 slides) > Unit Tersedia > Cara Pembelian (4 steps) > Unit Terjual (3, "Terjual" badge, "Tanya Unit Lain") > final CTA "Tanyakan unit yang Anda cari." Absent: Why Perkasa, About, Testimonials, Articles. Unit Tersedia shows the 2 live AVAILABLE units with vehicle-specific CTAs and working detail links. Hero copy factual ("Pilihan unit kendaraan dengan informasi yang jelas..."). Note: hero headlines remain the English CMS taglines "Find Your Next Drive." / "Built for the Ride." (owner-editable; not a claim).

## C. Catalogue QA - PASS
/cars and /motorcycles: "Unit Tersedia" (AVAILABLE, "Saya Tertarik", unit-specific WA) then "Unit Terjual" (SOLD archive, cap 6, "Tanya Unit Lain", secondary). No "Sold Out", no English empty states, no unsupported claims. RESERVED: no live record; verified by code (card maps RESERVED to "Dipesan" with generic CTA).

## D. Detail/gallery QA - PASS
Tested AVAILABLE car (CAR-0001), SOLD car (CAR-0003), AVAILABLE motorcycle (MOT-0010), SOLD motorcycle (MOT-0009). Status "Tersedia"/"Terjual"; CTA "Saya Tertarik dengan Unit Ini" vs "Tanya Unit Lain"; no description; factual spec rows ("Transmisi: Otomatis"); highlights show 5 + "Lihat N sorotan lainnya"; related block "Unit Lainnya" lists AVAILABLE only; no "Related Vehicles"/About block. Gallery: main image, thumbnails, lightbox opens, ArrowRight/ArrowLeft change image (1/10 > 2/10 > 1/10), Escape closes; images `object-fit: contain` (no distortion). Alt text deterministic ("{unit} - foto N"). Minor (debt): gallery control labels are English ("View ... fullscreen", "Previous photo", "Vehicle photo viewer"); focus is not moved into the lightbox on open nor restored on close; alt numbering starts at "foto 2" while counter reads "1 / 10".

## E. Financing QA - PASS
"Pembiayaan Kendaraan"; no calculator, installment, default rate or default amount; no lender implication ("diproses oleh perusahaan pembiayaan, bukan oleh Perkasa Motors"). Explains DP, tenor, bunga, biaya lain, persetujuan. CTA "Tanya Simulasi via WhatsApp".

## F. About / Contact / Articles - PASS
- /about: Siapa Perkasa Motors, Apa yang kami jual, Cara Pembelian, Kontak & lokasi. No kurasi/inspeksi/kemewahan/premium/warranty/history. Live `about_page_sections` rows: 2, both inactive; `website_settings.about_is_active=false`.
- /contact: WhatsApp primary, factual, address only, no appointment system.
- /articles: valid page ("Belum ada artikel."), 0 articles in DB; absent from header and footer (gate: published >= 3).

## G. Header / footer - PASS
Header: Beli Mobil, Beli Motor, Tentang Kami, Pembiayaan, Hubungi Kami (CTA). Footer: factual description, address, WhatsApp, Instagram/TikTok/LinkedIn only (the three configured), nav without Artikel, exactly one "© 2026 Perkasa Motors. All rights reserved." Live CMS rows reflect remediation (Pembiayaan, Artikel label stored for footer, `copyright_text` = "All rights reserved.").

## H. Admin dashboard - PASS
Sidebar exactly Ringkasan, Inventory, Website, Artikel. Dashboard: Tersedia 2, Dipesan 0, Terjual 13, Perlu Dilengkapi ("Semua unit sudah lengkap."), Terakhir Diubah (real vehicles), Tambah Unit, Lihat Situs. No leads, fake activity or placeholder text.

## I. Admin inventory - PASS
Tabs: Semua 15, Tersedia 2, Dipesan 0, Terjual 13, Draft/Arsip 0 (matches live DB). Row cards with status badge, "Tayang di situs", price + "Ubah", status buttons ("Tandai Dipesan"/"Tandai Terjual" on AVAILABLE only), Edit, Hapus (an active button only on the 2 AVAILABLE rows; on SOLD/RESERVED rows it is a muted non-interactive label with a tooltip explaining the permanent stock-number lock, `inventory-list.tsx:91-99`). No horizontal table; 390px layout has no overflow. No mutation performed. Status quick action: CODE + DATABASE DEFINITION VERIFIED. Price quick action: CODE VERIFIED. Live end-to-end proof = first genuine owner mutation.

## J. Admin create / edit - PASS
/admin/inventory/new: 1 Jenis kendaraan, 2 Informasi unit, 3 Harga, 4 Spesifikasi, 5 Highlights, then "Simpan & lanjut ke foto". No slug, stock number, SEO, canonical, featured or published control; selects start empty (no silent false defaults). Edit (CAR QA-PAGN-01 SOLD; MOT-0010 AVAILABLE): status panel, one vehicle form, photos; no description, Social Content, Featured, Published or SEO fields; sold unit shows "tidak bisa dihapus (nomor stok dikunci permanen)". Minor: photo uploader strings are English ("UPLOAD PHOTOS").

## K. Website CMS - PASS
Tabs Beranda / Tentang / Kontak & WhatsApp / Lanjutan. Beranda: hero editor + "Otomatis di beranda" (4 latest available, fixed 4-step purchase, 3 sold). Tentang: honest read-only ownership explanation. Kontak & WhatsApp: single canonical contact/WhatsApp/social source. Lanjutan: logo/favicon, SEO defaults, footer description, copyright, header/footer menus with the Articles >= 3 and "Pembiayaan" rules explained. Minor: hero editor helper text is English.

## L. Article admin - PASS
/admin/articles: "Artikel", 0 articles, gate message. /admin/articles/new: Title, Body, Status (Draft/Published), "Lanjutan" collapsed. Minor: English labels ("New Article", "CREATE ARTICLE"). Not created (no fabrication).

## M. Responsive public - PASS (after fix)
Widths 2560/1440/1280/768/390 x 11 pages (home, cars, motorcycles, financing, about, contact, articles, 4 detail pages) = 55 combinations: no horizontal overflow, 0 duplicate ids, 0 missing alt, 0 broken images, 0 unnamed buttons/links, 0 nested anchors, 0 console errors. Mobile menu opens (aria-expanded, Escape closes). Footer contained.
**Release blocker found and fixed:** at 2560 the first sweep showed header, page and footer left-aligned and uncontained (cards stretched, page heights 4911 vs 3601 at 1440). Cause: `max-w-container` (13 files) had no matching Tailwind v4 token (`--container-max` was defined, but the utility reads `--container-container`), so no CSS was generated. Fix: one line in `app/globals.css` (`--container-container: var(--container-max);`). Re-run: all 55 combinations pass and 2560 is centered and contained (heights now equal 1440).

## N. Responsive admin - PASS
1440/1280/768/390 x dashboard, inventory, new, edit, Website (tabs + sub-pages), Articles, new article: no overflow, 0 console errors, mobile menu ("Buka menu") present, tabs and inventory controls within viewport.

## O. Accessibility sanity - PARTIAL
Pass: ids, alt, button/link names, nested anchors, form labels (only file inputs unlabeled), keyboard gallery, mobile menu aria. Findings (non-blocking): two `h1` on the homepage (one per hero slide); lightbox focus management; English aria labels in gallery; English strings in a few admin screens.

## P. WhatsApp contract - PASS
AVAILABLE: "Halo Perkasa Motors, saya tertarik dengan {unit} {tahun} ({Mobil|Motor}) ..." SOLD: generic "...mengetahui lebih lanjut mengenai unit yang tersedia." Homepage final, header, footer: generic. Financing: separate simulation inquiry. RESERVED: generic by code (`lib/utils/whatsapp.ts`). Destination unchanged: 6285111307044.

## Q. Live lifecycle schema - PASS (read-only)
`vehicles.external_id`, `sold_at`, `status_changed_at` present (nullable); `vehicle_status_history` present with 13 rows, all baseline (`is_baseline`), 0 real transitions; triggers `vehicles_status_lifecycle`, `vehicles_before_delete`, `vehicles_set_updated_at`; live status counts 2 AVAILABLE / 13 SOLD (matches 2R.6A).

## R. RLS / security - PASS
History table: RLS on; one policy (SELECT, authenticated staff); privileges: authenticated has SELECT (+inert REFERENCES/TRIGGER), no INSERT/UPDATE/DELETE; anon none. `vehicles_status_lifecycle` and `vehicles_before_delete`: SECURITY DEFINER, `search_path=""`, EXECUTE only to postgres and service_role (anon/authenticated false). `vehicles` RLS on, 5 policies. Admin routes redirect to /admin/login when signed out (307).

## S. Stock-number lifecycle - PASS
`generate_stock_number` live definition: reuse-from-pool then sequence (unchanged; same ACL as 2R.6A); `stock_number_pool` 14 rows (unchanged). `vehicles_before_delete` blocks delete when status is SOLD/RESERVED or any history row has `to_status` RESERVED/SOLD (errcode 23514), else releases the number to the pool. Verified by definition; no vehicle deleted.

## T. Public claim audit - PASS
Searched `app components lib supabase` for kurasi, inspeksi, terjamin, berkualitas, kemewahan, premium, verified, curated, inspected. Public output: none. Occurrences: code comments (`cars/[slug]/page.tsx:23`, `site-header.tsx:22,26`, `vehicle-detail.tsx:29`, `lib/actions/content.ts:28,194`, `lib/utils/social-embed.ts:7`, `benefit-icons.ts:16`) - SAFE; `benefit-icons.ts:28` "Sparkles (Premium)" - dormant admin icon label, not rendered; `lib/mock/vehicles.ts:36`, `supabase/seed.sql` - local dev fixtures, not used by the public data path; `migrations/20260912020000_about_page_sections.sql` - historic seed rows, live rows inactive; live `website_settings.about_description` contains "kualitas unit" but `about_is_active=false` and /about does not render it (STALE_BUT_NONBLOCKING).

## U. Dead-code audit - PASS
`remediation-2r5a` / "Run approved remediation": absent from app/components/lib (only in 2R.5A docs). No remediation route. Dormant: Why Perkasa (admin/data/types; not rendered) SAFE_DORMANT; Testimonials (components, actions, data) SAFE_DORMANT; About legacy actions SAFE_DORMANT; Leads, Content, Settings, Media routes (not in nav) SAFE_DORMANT; `vehicle-social-content.tsx` unused component STALE_BUT_NONBLOCKING; `getFeaturedVehicles` defined, no callers STALE_BUT_NONBLOCKING. No RELEASE_BLOCKER.

## V. Technical validation - PASS
Clean `npm ci` (after clearing a half-installed `node_modules` caused by two overlapping installs of mine), `npm run lint` 0, `npx next typegen` OK, `npx tsc --noEmit` 0, `npm run build` PASS (29/29), re-run after the CSS fix with lint/tsc also green. Build needs `.env.local` (gitignored, copied from the 2R.6 worktree; not committed).

## W. Dependency status
`npm audit --omit=dev`: 0 vulnerabilities. `npm audit`: 1 high - transitive dev-tooling `brace-expansion` (GHSA-qhr7-859c-m2p7, GHSA-6j4f-fj2g-mc7p). Not fixed (policy); registered as debt.

## X. origin/main divergence
- main HEAD `1ab0e5e4a6383630f92c3ddc9d4cbdd99e192bd1`; base HEAD `675857d`; merge-base `bc8eaa187cd44f4e673117ae20150b8b62fdb245`.
- Ahead 17 (+ the 2 commits of this phase), behind 7; 95 files changed (three-dot) on the integrated side; main side changes 10 files.
- Main's 7 commits: `15e525f`, `cc90d4f`, `c0b1bae` (referenced and reconciled by 2R.1-2R.3 reports) and `24f790c`, `1696c40`, `5a9ed73`, `1ab0e5e` (footer redesign, footer/detail containment, sold-motorcycle catalogue split: **not** referenced in any 2R report, i.e. not reconciled).

## Y. Merge simulation - CONFLICTS
`git merge-tree --write-tree` (non-destructive, nothing merged). Conflicts (hunks):
| File | Hunks | Semantic owner |
|---|---|---|
| `components/public/site-footer.tsx` | 1 | Layout/containment: main (`1696c40`, `5a9ed73`); content (factual description, single copyright, gated nav): 2R.5A |
| `components/public/vehicle-card.tsx` | 6 | Behavior (status badges, CTAs, Indonesian labels): 2R lineage; presentation: main |
| `components/public/vehicle-catalogue.tsx` | 2 | Section split and caps: 2R.2 (Unit Tersedia/Terjual, archive cap 6); main `24f790c` implements a parallel split |
| `components/public/vehicle-detail.tsx` | 2 | Content/spec/CTA: 2R.3/2R.4; responsive containment: main `1ab0e5e` |
| `components/public/vehicle-gallery.tsx` | 1 | Gallery behavior: 2R.3; main small presentation diff |
Auto-merged cleanly: `app/(public)/cars/page.tsx`, `app/(public)/motorcycles/page.tsx`, `lib/data/vehicles.ts` (main's `.eq("status","AVAILABLE")` for related units is already satisfied by 2R). `app/globals.css` is untouched by main, so this phase's fix does not add a conflict. The conflicts are reconcilable by taking the 2R behavior/copy and main's containment/presentation, but this needs a deliberate, reviewed reconciliation (not resolved here per phase rules).

## Z. Deployment-config sanity - PASS
No `.env*` tracked (only `.env.example`); no secrets/keys/tokens in tracked code (scan for service_role, JWT, sb_secret, sk_live clean); localhost strings only in README and comments; production URL fallback in `app/layout.tsx` intentional; no remediation route; no QA artifact tracked (QA scripts and screenshots live outside the repo). `next.config.ts` unchanged. No deploy performed; Netlify dashboard config not inspected.
Housekeeping: the temporary Edge session profile for the admin sign-in was deleted after use (see final note if any lock remained).

## AA. Release blockers
- Found and FIXED: uncontained layout above 1440px (`max-w-container` token). Commit lists exactly `app/globals.css`.
- Open merge prerequisite: 5-file conflict with `origin/main` (not a defect of the integrated product; a reconciliation task).
- No build/type failure, no security regression, no auth break, no schema/code incompatibility, no WhatsApp breakage, no live-data corruption.

## AB. Debt register
- POST_RELEASE_SECURITY: revoke unused broad default grants (anon/authenticated incl. TRUNCATE) on `vehicles`; revoke inert REFERENCES/TRIGGER on `vehicle_status_history`; staff can still edit `sold_at`/`status_changed_at`/`external_id` directly; `brace-expansion` dev-dependency advisory; no PITR on the Free plan.
- POST_RELEASE_PRODUCT: HEIC upload message; future `sold_at` ordering for the sold archive (historical `sold_at` is NULL by design); source/sync rules for Operating System integration (`external_id`); first real status change = live proof of quick actions.
- POST_RELEASE_CLEANUP: dormant backend retirement (Why Perkasa, Testimonials, Leads, Content, Settings, About legacy actions, `vehicle-social-content.tsx`, `getFeaturedVehicles`, mock fixtures); stale legacy CMS text (`about_description`, hero 3 fields); the non-standard stock number `QA-PAGN-01` on a live SOLD car (owner decision).
- POST_RELEASE_UX: drag reorder of photos; constrained navigation picker; English strings in admin (new article, photo upload, hero helper text) and public cards (Transmission/Mileage and raw MANUAL/Automatic values); English hero taglines; lightbox focus management and English gallery aria labels; two h1 on homepage; alt numbering start.

## AC. Merge recommendation
Do not merge directly. Authorize a **main-reconciliation step** first: merge `origin/main` into the integration lineage (or rebase), resolving the 5 files by keeping 2R behavior/copy/CTA contracts and adopting main's containment/presentation, then re-run this QA (public responsive sweep and a footer/detail visual check at 2560/1440/390). After that the product is READY FOR MERGE AUTHORIZATION. Live DB needs no further change.

## Changed files in this phase
- `app/globals.css` (one token; documented release-blocker fix)
- `docs/reports/phase-2r7-final-integrated-qa.md`, `docs/reports/txt/phase-2r7-final-integrated-qa.txt`
- `.ruflo/coordination/tasks/PHASE-2R7.json`
Live data modified: NO.
