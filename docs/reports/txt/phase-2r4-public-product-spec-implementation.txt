# Perkasa Motors - Phase 2R.4: Public Product-Spec Implementation

Result: **PASS with one flagged remainder** (CMS-stored copy, see O). Task state ACTIVE -> REVIEW. Not merged, not deployed. No schema or CMS writes.

## A. Base verification
Branch `integration/phase-2r4-public-product-spec` from the pushed head of `integration/phase-2r3-vehicle-detail-gallery`: `c28b7725e1fe93c6e81fbf5c43048d898336e922` (local and origin matched). Worktree `C:\Users\USER\webperkasamotors\.claude\worktrees\phase-2r4-public-product-spec`. All governance, Phase 1R/2R.2/2R.3 reports and the Product/Admin spec (md + txt) were present. `.env.local` copied locally, gitignored, not committed.

## B. Homepage before/after
Before: Hero > Featured Stock (is_featured) > CMS About > Why Perkasa (generic claims) > Testimonials > final CTA.
After: Hero > Unit Tersedia > Cara Pembelian > Unit Terjual > final WhatsApp CTA. Why Perkasa, About block and Testimonials are no longer rendered (their components for About/Testimonials, CMS data and admin editors are untouched; the Why Perkasa component, which held the unsupported claims, was deleted).

## C. Hero changes
Architecture unchanged. Fallback copy rewritten: removed "curated showroom of inspected, premium vehicles - every unit verified"; now "Mobil dan motor yang tersedia di Perkasa Motors, lengkap dengan foto, spesifikasi, dan harga. Tanya langsung lewat WhatsApp." and CTA "Lihat Unit Tersedia". Added a secondary "Tanya via WhatsApp" action (generic message; shown only when a usable number exists), passed through `HeroSlideshow` to every slide. The live homepage uses CMS slides, whose headline/body/primary-CTA text stays CMS-owned ("Find Your Next Drive.", "Built for the Ride.", "LIHAT SEMUA UNIT"); I did not write to the CMS.

## D. Homepage AVAILABLE behavior
New `getHomepageAvailableVehicles(4)`: real AVAILABLE units across cars and motorcycles, ordered like the catalogue's AVAILABLE tier. No dependence on `is_featured` (`getFeaturedVehicles` kept, unused by the homepage, available for an optional pinning feature later). Links "Semua Mobil" and "Semua Motor" visible on all breakpoints. Empty state: "Belum ada unit tersedia saat ini." plus generic WhatsApp button. Browser: 2 AVAILABLE cards, both "Tersedia", vehicle-specific CTAs.

## E. How to Buy implementation
New `components/public/how-to-buy-section.tsx`: four steps (Pilih unit; Hubungi lewat WhatsApp; Lihat & cek unit; Sepakati transaksi & serah terima) plus the supporting sentence "Pembayaran tunai atau kredit melalui perusahaan pembiayaan; detail dibahas lewat WhatsApp." Single flow, no booking or scheduling. Reused (compact) on About. OWNER_FACT_REQUIRED: owner must confirm steps 3-4 match real practice.

## F. Homepage SOLD behavior
New `getHomepageSoldVehicles` (3 max, `created_at DESC, id ASC` since there is no sold_at). Section "Unit Terjual" (no "terbaru"/"recent" wording), existing muted SOLD cards with "Terjual" badge and generic "Tanya Unit Lain" CTA; section hidden when no SOLD units. No sold dates shown. Browser: 3 sold cards, badges "Terjual", CTA "Tanya Unit Lain".

## G. Why Perkasa removal
Removed from the homepage and its component deleted (it held "Kualitas Terjamin / inspeksi menyeluruh / kendaraan premium / purna jual eksklusif"). CMS rows, types and the admin form remain.

## H. Testimonials handling
Not rendered on the homepage. Component, data layer and admin untouched (dormant).

## I. Financing changes
`/financing` is now "Pembiayaan Kendaraan": guidance only. Text states financing is processed by finance companies, not Perkasa Motors; lists what determines the installment (DP, tenor, interest, other fees, approval), all stated as provider-determined; one CTA "Tanya Simulasi via WhatsApp" with a message asking for a real simulation. The calculator component was deleted. Browser: no inputs, no "Suku Bunga", no 6.5%, no Rp 500.000.000, no monthly estimate. OWNER_FACT_REQUIRED: whether Perkasa assists with applications or works with named finance companies (deliberately not stated).

## J. About changes
`/about` rendered from code: (1) Siapa Perkasa Motors (company name, address from settings), (2) Apa yang kami jual, (3) Cara Pembelian (shared component), (4) Kontak & lokasi (address, phone, WhatsApp). No inspection, curation, warranty, after-sales, history, team or marketplace claims. IMPORTANT: the stored CMS About sections (which currently say "kurasi", "inspeksi internal", "kemewahan") are intentionally no longer rendered, so the admin About editor currently has no public effect - Phase 2R.5 must resolve that (clean the data and/or reconnect or retire the editor). I could not reuse the CMS sections because I may not edit CMS data.

## K. Contact changes
"Ajukan pertanyaan umum, jadwalkan kunjungan, ..." replaced by "Tanyakan ketersediaan unit atau waktu kunjungan melalui WhatsApp."; meta description Indonesian. WhatsApp stays the only action; no form, booking or calendar.

## L. Articles behavior
Routes, admin and tables untouched. Public page text localized ("Artikel", "Belum ada artikel."); not linked anywhere public unless 3 or more articles are published (see M). Currently 0 published; browser: no Articles link in header or footer.

## M. Navigation changes
New `lib/data/public-nav.ts`: `getPublicNavRules()` (dynamic gating: Articles links hidden unless published count >= 3, hidden on error) and `applyPublicNavRules()` (also relabels `/financing` items "Pembiayaan" without writing to the CMS). Applied to header (desktop + mobile) and footer. Browser nav: Beli Mobil, Beli Motor, Tentang Kami, Pembiayaan, Hubungi Kami.

## N. Footer changes
Footer nav groups pass through the same rules (Articles removed, "Simulasi Kredit" -> "Pembiayaan", empty groups dropped); footer WhatsApp aria-label/title localized. Duplicate-contact architecture untouched (2R.5).

## O. Trust-claim audit
Searched app/components/lib (excluding admin, actions, mocks) for kurasi, inspeksi, terjamin, premium, sempurna, eksklusif, purna jual, curated, inspected, verified (+ berkualitas, kemewahan, luxury, "Simulasi Kredit"). Remaining occurrences:
| Where | Text | Status |
|---|---|---|
| code comments (cars/[slug]/page, site-header, vehicle-detail, public-nav, social-embed, benefit-icons) | explaining history or "verified via screenshot" | SUPPORTED (not public output) |
| `lib/utils/benefit-icons.ts` | admin icon picker label "Sparkles (Premium)" | admin-only, REMOVE_LATER (2R.5) |
| `lib/mock/vehicles.ts` | mock data "Curated and inspected" | not public (mock) |
| **CMS-stored footer description** | "Pilihan kendaraan berkualitas, informasi transparan, ..." | REMOVE_LATER: owner-edited CMS data, not changed (no CMS writes). Shows on every page |
| **CMS hero slide 1 body** | "Pilihan unit kendaraan berkualitas ..." | REMOVE_LATER: CMS data, homepage only |
"berkualitas" is a generic quality claim, not one of the listed inspection/curation terms, but it is unsupported in the same spirit and should be edited in the CMS in 2R.5. Code-owned defaults (hero fallback, SAFE_DEFAULTS in `lib/data/site-settings.ts`, root-layout title fallback) are clean. Also noted: footer copyright reads "(c) 2026 Perkasa Motors. (c) 2026 Perkasa Motors. All rights reserved." (CMS text duplicates the symbol/year) - 2R.5.

## P. Metadata cleanup
`SAFE_DEFAULTS` seoTitle/seoDescription/footerDescription and the `app/layout.tsx` title fallback now factual and Indonesian ("Jual Beli Mobil dan Motor"); `<html lang>` changed from "en" to "id"; page metadata for financing, about, contact and articles rewritten in Indonesian. Vehicle detail metadata (Phase 2C) untouched. Live titles still come from CMS settings.

## Q. Preserved catalogue/detail behavior
Not edited: catalogue components, `getCatalogueByType`, detail, gallery, `vehicle-card.tsx`. Browser regression: /cars and /motorcycles show "Unit Tersedia" + "Unit Terjual"; available car detail shows no related section; sold car detail shows "Sorotan" + "Unit Lainnya"; no console errors. `lib/data/vehicles.ts` only gained two homepage query functions.

## R. Browser QA
**HEADLESS FALLBACK, not visible QA** (the Claude-in-Chrome browser still gets ERR_CONNECTION_REFUSED on localhost/127.0.0.1 while curl returns 200). Production build via `next start`, headless Edge over CDP. Homepage at 1440/1280/768/390: no overflow, h2 sequence correct, no Why Perkasa/Testimonials/Articles, no calculator inputs, 0 console errors, 0 nested anchors, 0 broken images. /financing, /about, /contact, /articles at 1440 and 390: no overflow, 0 errors. /cars, /motorcycles, one available and one sold detail at 1440: no regression. Empty states (no AVAILABLE units, no SOLD units) and the Articles-gate with 3+ articles not exercised (no data change allowed): NOT VERIFIED visually; gate logic code-reviewed.

## S. Lint
PASS.
## T. Typecheck
`npx next typegen` + `npx tsc --noEmit` PASS.
## U. Build
`npm run build` PASS (28/28 pages; homepage prerendered as before).
## V. npm audit
`--omit=dev`: 0 vulnerabilities. Full: 1 high (transitive `brace-expansion`, dev tooling), unchanged; not fixed.

## W. Changed files
Modified: `app/(public)/page.tsx`, `app/(public)/financing/page.tsx`, `app/(public)/about/page.tsx`, `app/(public)/contact/page.tsx`, `app/(public)/articles/page.tsx`, `app/(public)/articles/[slug]/page.tsx` (back-link text), `app/layout.tsx`, `components/public/hero.tsx`, `components/public/hero-slideshow.tsx`, `components/public/section-heading.tsx` (optional id), `components/public/site-header.tsx`, `components/public/site-footer.tsx`, `lib/data/vehicles.ts`, `lib/data/articles.ts`, `lib/data/site-settings.ts`.
Added: `components/public/how-to-buy-section.tsx`, `lib/data/public-nav.ts`.
Deleted: `components/public/financing-calculator.tsx`, `components/public/why-perkasa-section.tsx`.
Plus this report (md/txt) and `.ruflo/coordination/tasks/PHASE-2R4.json`.

## X. Scope verification
No admin, supabase, public asset, package or migration change; no CMS or DB writes. The stale comments in `lib/data/site-settings.ts` / `lib/types/site-settings.ts` that mention `components/public/why-perkasa-section.tsx` now point at a deleted file (comment-only; to tidy in 2R.5 together with the Why Perkasa admin form).

## Y. Owner facts still required
OWNER_FACT_REQUIRED: accuracy of the four buying steps; whether Perkasa assists with financing applications / which finance companies; opening hours; showroom visit policy; document verification process; inspection checklist (if any, claims could return); active social channels (footer shows Instagram, TikTok, LinkedIn icons from CMS); decision whether CMS hero/footer copy containing "berkualitas" stays.

## Z. Phase 2R.5 readiness
READY. Carry-overs: admin About editor now disconnected from the public page; admin Homepage (About/Why Perkasa/Testimonials) forms edit unrendered content; CMS nav label "Simulasi Kredit"; CMS copy with "berkualitas" and the doubled copyright; single-source contact fields; dashboard/leads/settings simplification per the spec.
