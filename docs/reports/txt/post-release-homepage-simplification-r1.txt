# Perkasa Motors - Post-Release Simplification R1: Homepage IA + Public Nav + CMS Simplification

**Result: OWNER AUTHORIZATION REQUIRED (for one optional migration) / OWNER CONTENT REQUIRED (testimonials, About review).** All code, build, public QA and admin QA pass. The branch works as-is against the live database with **no live write**: the homepage uses code-owned About copy and the testimonials table (already live, empty) is reused unchanged. One additive migration is prepared but NOT applied; it only enables owner editing of the About copy. Nothing merged, nothing deployed, live data not modified.

## A. Base verification
`origin/main` at start = `21bf929865a4f2c9ffd503694a7ff61a40871792` (docs-only release-record commit on top of the verified production commit `3d543a0`). Branch `feature/post-release-homepage-simplification-r1`, worktree `.claude/worktrees/post-release-homepage-simplification-r1`, created from exactly that SHA.

## B. Current IA audit (before)
Homepage: Hero > Unit Tersedia (4) > Cara Pembelian > Unit Terjual (3) > final CTA. Header (CMS `navigation_items`): Beli Mobil, Beli Motor, Tentang Kami, Pembiayaan, Hubungi Kami (CTA). Footer nav (CMS): Tentang Kami, Hubungi Kami, Pembiayaan, Artikel (gated). Standalone pages /about, /financing, /contact. Admin Website tabs: Beranda, Tentang (read-only explainer), Kontak & WhatsApp, Lanjutan. Testimonials: table, RLS, reader, actions and a public component existed but were unused (no owner editor since 2R.5). Legacy `about_*` columns exist on `website_settings` (live: inactive, stale copy containing "kualitas unit").

## C. Homepage before/after
After (locked order, verified on the built site): Hero > **Unit Tersedia** (max 6, then Lihat Semua Mobil / Lihat Semua Motor) > **Tentang Perkasa Motors** > **Cara Pembelian** (outline timeline) > **Mekanisme Pembayaran** (+ CTA) > **Testimoni** (rendered only if active testimonials exist) > **Unit Terjual** (max 4) > footer. Decision: the previous separate "Tanyakan unit yang Anda cari" final-CTA block is removed because the locked order ends with Unit Terjual then footer; WhatsApp stays reachable from hero, header, payment CTA, every unit card and the footer WhatsApp button. Anchors: `#unit-tersedia`, `#tentang`, `#cara-pembelian`, `#pembayaran`, `#testimoni`, `#unit-terjual`, `#kontak` (footer); `html { scroll-padding-top: 5.5rem }` verified at 1440 and 390: no heading hidden under the sticky header.

## D. Available inventory algorithm
`getHomepageAvailableVehicles` (lib/data/vehicles.ts), `HOMEPAGE_AVAILABLE_LIMIT = 6`: query-level, two queries (AVAILABLE cars, AVAILABLE motorcycles), each ordered `updated_at DESC, id ASC`, each `LIMIT 6` (never the full inventory); pure `selectBalancedAvailable`: take up to 3 of each type; if slots remain (one type had fewer than 3) fill from the other type's next-newest rows; never exceed 6; display newest first across both types. Tested on 10 inventory shapes (0/0, 1/1, 2/0, 5/1, 1/5, 10/10, 2/2, 7/0, 0/9, 3/2): always <= 6 and balanced (e.g. 5 cars + 1 motorcycle => 6 total; 10+10 => 3+3). Live today: 1 car + 1 motorcycle AVAILABLE => 2 shown, no placeholders. `is_featured` is not used and no featured CMS exists.

## E. About ownership
Homepage-only block, no /about page, no "Selengkapnya". Owner-editable via new `homepage_about_*` fields (eyebrow, title, description, point_1..3, is_active). Chosen over reusing legacy `about_*` because those hold dormant, claim-bearing copy and a different semantic (old standalone block, `about_is_active=false` live), so reuse would show stale text the moment it is activated. **Fail-safe:** a separate reader (`lib/data/homepage-about.ts`) selects only the new columns; if they do not exist yet it returns "nothing stored", so the page renders the code defaults (title "Tentang Perkasa Motors", factual description from company name and address, three points: "Mobil dan motor dalam satu tempat", "Komunikasi langsung lewat WhatsApp", "Pembelian tunai atau melalui pembiayaan") and the admin form reports "belum aktif di database" and is read-only. No unsupported wording.

## F. Cara Pembelian
Code-owned (`how-to-buy-section.tsx`), four steps exactly as specified (Pilih Unit, Hubungi Kami, Cek & Sepakati, Pembayaran & Serah Terima) with the suggested descriptions. Monoline outline SVGs (new `outline-icons.tsx`, inline, no dependency, aria-hidden): car, generic chat, checklist, key. Desktop: horizontal timeline icon - line - icon; mobile (<lg): vertical timeline with connector. No emoji, cartoon icons or boxed cards.

## G. Payment mechanism
Code-owned `payment-methods-section.tsx` (no CMS): Cash Keras, Cash Tempo, Cicilan / Kredit with the specified meanings; no tenor, percentage, DP, fee, interest or guarantee invented; states Perkasa Motors is not the financing provider. Outline icons (banknote, calendar+coin, document); peers separated by thin rules, not pricing tiers, nothing highlighted. One CTA "Tanyakan Mekanisme Pembayaran" -> generic wa.me inquiry ("...menanyakan mekanisme pembayaran (tunai, tempo, atau kredit)...", same destination 6285111307044).

## H. Testimonial backend audit - REUSED
Existing `testimonials` table fits: `customer_name`, `testimonial`, `role_label` (used as "Unit Dibeli"), `photo_storage_path` (optional), `sort_order`, `is_active`; RLS already: public reads active only, staff full CRUD (verified live). Live: 0 rows. No schema change, no second table. Existing reader (`getActiveTestimonials`) and actions reused; added `updateTestimonialFields` (edits text without touching the photo) and Indonesian validation messages. Photo upload UI intentionally not added (optional in R1).

## I. Testimonial public implementation - HIDDEN_NO_CONTENT (live)
`testimonials-section.tsx` rewritten as a CSS-only rail (`.testimonial-*` in globals.css, no JS, no dependency). Verified with fake data in a temporary local harness (deleted before commit, never shipped): desktop (>=768, hover, no reduced motion) with >=4 items loops slowly, pauses on hover/focus (verified play-state paused and no movement); fewer than 4 items render a static centered row; mobile/touch is a native swipeable row (rail scrolls internally, page does not overflow at 390); `prefers-reduced-motion` gives a static scrollable list; looped copy is `aria-hidden`. Cards: quote, customer name, "Customer {unit}". Zero active testimonials => section omitted entirely (verified on live data).

## J. Sold inventory rule
`HOMEPAGE_SOLD_LIMIT = 4` (was 3); same deterministic `created_at DESC, id ASC` (legacy `sold_at` is NULL, so it is not used); limit in the query; no archive link, no pagination; SOLD cards keep "Tanya Unit Lain" (generic).

## K. Public nav
Header: Beli Mobil, Beli Motor, (Artikel only when >= 3 published), Chat WhatsApp (generic message). Implemented in code without touching the CMS: `applyPublicNavRules` hides links to retired pages (shared `lib/utils/retired-routes.ts`) and gated Articles; the CMS CTA row is replaced by a WhatsApp CTA built from settings; `withCoreLinks` guarantees Beli Mobil / Beli Motor. Verified live-data render: `Beli Mobil | Beli Motor | Chat WhatsApp`.

## L. Retired route behavior
`next.config.ts` redirects (exact sources, no wildcard): `/about` -> `/#tentang`, `/financing` -> `/#pembayaran`, `/contact` -> `/#kontak`, all **307 temporary**, single hop, no loop (verified; query string preserved). Decision: temporary until the Owner confirms the IA is final (permanent redirects are cached by browsers and search engines). Page files deleted (no duplicate canonical content); removed from `sitemap.xml`; the only in-app link (vehicle-detail fallback) now points to `/#kontak`. `/admin/website/about` redirects to `/admin/website/homepage`.

## M. Footer
Navigation: Beli Mobil, Beli Motor, Artikel (gated). Contact: address + WhatsApp button (`id="kontak"`); only configured social links (Instagram, TikTok, LinkedIn); factual description; one copyright. Retired links removed.

## N. CMS before/after
Top level unchanged: Ringkasan, Inventory, Website, Artikel. Website tabs: **Beranda, Kontak & WhatsApp, Lanjutan** (Tentang removed). Beranda: Hero (editable) > Tentang Perkasa Motors (editable minimal) > Testimoni (add / edit / activate / reorder / delete) > "Otomatis di beranda" read-only list (Unit Tersedia max 6, Cara Pembelian and Mekanisme Pembayaran system-managed, Unit Terjual max 4). Lanjutan: menu manager no longer offers the header CTA; rows pointing to retired pages are flagged "Tidak tampil di situs"; explanatory text updated. Kontak & WhatsApp unchanged (text updated since /contact is gone). Dormant, left in place (SAFE_DORMANT): legacy About actions/columns/tables, Why Perkasa, Leads, Content, Settings, `about_page_sections`.

## O. Database / schema requirements
- **Testimonials: none.**
- **About copy: one additive migration, PREPARED, NOT APPLIED:** `supabase/migrations/20261002010000_homepage_about_section.sql` adds 7 columns to `website_settings` (`homepage_about_eyebrow`, `_title`, `_description`, `_point_1..3`, `_is_active boolean not null default true`) with `add column if not exists`; no drop/rename/rewrite; existing RLS applies unchanged. Live check (read-only): 0 `homepage_about_*` columns exist, so the fail-safe path is what currently runs. **OWNER AUTHORIZATION REQUIRED before applying** (shared production/staging Supabase). After authorization the AI applies it, then re-verifies; the Owner runs no SQL.

## P. Claim audit - PASS
Rendered public pages (home, cars, motorcycles, articles, 4 detail pages): 0 occurrences of berkualitas, terjamin, terverifikasi, terinspeksi, kurasi, inspeksi, premium, warranty, garansi, guaranteed, kemewahan, "Sold Out", "Simulasi Kredit". Remaining matches of "Tentang Kami", "Hubungi Kami", "Pembiayaan" are section labels, a step title and body copy, not navigation.

## Q. WhatsApp contract - PASS
Destination 6285111307044 everywhere. AVAILABLE: unit-specific (e.g. "...saya tertarik dengan SUZUKI GSX R SPORT 2017 (Motor)..."); SOLD/RESERVED: generic; hero, header, footer, empty state: generic (36 links); payment CTA: new generic payment inquiry (1 link).

## R. Responsive QA - PASS
Public: home, cars, motorcycles, articles and 4 detail pages at 2560/1440/1280/768/390: 40/40 clean on the final build (plus 50/50 earlier including the fake-data testimonial harness): no horizontal overflow, contained at 2560, 0 duplicate ids, 0 missing alt, 0 broken images, 0 unnamed controls, 0 nested anchors, 0 console errors. Timeline verified horizontal on desktop and vertical on mobile; payment blocks stack; icons enlarged after the first visual review. Admin: dashboard, inventory, Website (Beranda, About redirect, Lanjutan, Kontak), Articles at 1440/1280/768/390: 28/28 clean.

## S. Public QA - PASS
Homepage section order and counts verified (2 AVAILABLE live, 4 SOLD, testimonial section hidden); redirects verified; cars/motorcycles/articles/detail unchanged (Unit Tersedia / Unit Terjual, correct CTAs); sitemap no longer lists retired routes.

## T. Admin QA - PASS (authenticated, view-only)
Owner signed in to a local window; AI ran read-only checks only (no save, no create, no delete, no live write). Sidebar: Ringkasan, Inventory, Website, Artikel. Website tabs: Beranda, Kontak & WhatsApp, Lanjutan; `/admin/website/about` lands on Beranda. Beranda shows Hero, Tentang form (read-only with the "belum aktif di database" notice), Testimoni manager (empty state, Tambah Testimoni, "0 aktif"), and the automatic-sections list. Lanjutan flags 6 legacy menu rows pointing to retired pages. Not exercised live by design: saving the About form (needs the migration) and creating/editing a testimonial (would write a real row).

## U. Technical validation - PASS
`npm ci`; `npm run lint` 0; `npx next typegen` + `npx tsc --noEmit` 0; `npm run build` PASS (26 routes; /about, /financing, /contact gone; a stale `.next` cache caused one transient font-module build error, cleared by deleting `.next`); `npm audit --omit=dev`: 0 vulnerabilities; `npm audit`: 1 high (existing dev-tooling `brace-expansion`, unchanged, no fix run). `.env.local` copied for local builds only (gitignored).

## V. Changed files
Modified: `app/(public)/page.tsx`, `app/globals.css`, `app/sitemap.ts`, `next.config.ts`, `components/public/{how-to-buy-section,site-footer,site-header,testimonials-section,vehicle-detail}.tsx`, `components/admin/{contact-whatsapp-form,navigation-manager,website-subnav}.tsx`, `app/(admin)/admin/(shell)/website/{page,about/page,advanced/page,homepage/page}.tsx`, `lib/actions/testimonials.ts`, `lib/data/{public-nav,vehicles}.ts`, `lib/types/index.ts`, `lib/utils/whatsapp.ts`. Added: `components/public/{homepage-about-section,outline-icons,payment-methods-section}.tsx`, `components/admin/{homepage-about-form,homepage-testimonials-manager}.tsx`, `lib/{actions,data,types}/homepage-about.ts`, `lib/utils/retired-routes.ts`, `supabase/migrations/20261002010000_homepage_about_section.sql`. Deleted: `app/(public)/{about,financing,contact}/page.tsx`. Plus this report, its TXT mirror and the Ruflo record.

## W. Live-write status
**No live database write, no CMS write, no schema change, no deploy.** Live access was read-only SELECTs (testimonials count/policies, `homepage_about_*` column presence, AVAILABLE counts). The migration is a file only.

## X. Owner content requirements
- **TESTIMONIALS REQUIRED:** real customer name, unit bought and quote for each (none exist; the section stays hidden until at least one active testimonial is added in Website > Beranda > Testimoni). No fake data was seeded.
- **ABOUT REVIEW REQUIRED:** confirm the default About copy and the three points; after the migration is authorized they can be edited in Beranda.
- Confirm Cash Tempo wording and the four Cara Pembelian steps (OWNER_FACT_REQUIRED markers in code).
- Confirm the retired-page redirects are final (then switch 307 to permanent).

## Y. Release readiness
Ready for Owner review. Safe to merge and deploy as is (works without the migration). Recommended sequence: Owner review > merge authorization > deploy verification; separately authorize the About migration when the Owner wants to edit that copy. Open note: hero headlines remain the owner-editable English CMS taglines ("Find Your Next Drive." / "Built for the Ride."); unchanged per "keep existing Hero behavior".
