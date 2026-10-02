# Perkasa Motors - Post-Release Simplification R1A: About Migration + Content Lock + Final IA Confirmation

**Result: PASS.** The prepared additive About migration was applied once by AI to the live Supabase project, the Owner-approved About content was written through the real CMS form and read back exactly, the Cash Tempo and Cara Pembelian wording is locked, and the retired routes are now permanent redirects. Public and CMS QA pass. Live writes: the About migration and the About content only. Testimonials: none written (OWNER CONTENT REQUIRED, non-blocking). Inventory: not modified. Nothing merged, nothing deployed.

## A. Authorization
The Owner authorized applying `20261002010000_homepage_about_section.sql` to the existing live project, approved the About content, the four-step Cara Pembelian, the Cash Tempo wording, and confirmed the simplified IA is final (permanent redirects). Owner role: authorization and one sign-in only; the Owner typed their own credentials into the local admin login and ran no SQL. AI executed everything. The migration was applied through the authenticated Supabase connection already available to the AI; the CMS content was written through the Owner's signed-in admin session using the app's own form and server action.

## B. Pre-migration schema check (read-only) - no drift
- `homepage_about_*` columns: 0 existing (expected).
- `website_settings`: 58 columns, RLS on, policies "public can read website settings" (SELECT) and "staff can update website settings" (UPDATE).
- Baselines captured: `website_settings` row fingerprint excluding the new columns `621f410ee47adaf039531edcf6522f92`; vehicles 15 (md5 `49d984e3...`), status history 13, navigation 9 (md5 `fb7afaba...`), testimonials 0, articles 0, `about_page_sections` md5 `d74d690c...`.
- Migration review: executable content is one `ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS` (7 columns) and 4 `COMMENT ON COLUMN`. Scan for DROP, RENAME, DELETE, TRUNCATE, UPDATE, INSERT, POLICY, GRANT, REVOKE: none. File md5 `74265c4c69961d25f49caa56156dcd92`.

## C. Migration execution
Applied exactly once with `apply_migration` (name `homepage_about_section`, registry version `20261002114733`), SQL equivalent to the repo file (same statements; header comment shortened). Result `success: true`. No other migration or schema change. Note: the registry already has an older, unrelated entry also named `homepage_about_section` (`20260816065921`, the legacy `about_*` columns); the new one is distinguishable by version. The earlier 2R.6A lifecycle migration was applied through the SQL editor and is not in this registry; that is unchanged.

## D. Post-migration verification (read-only)
- All 7 columns exist: `homepage_about_eyebrow/title/description/point_1/point_2/point_3` (`text`, nullable) and `homepage_about_is_active` (`boolean not null default true`). `website_settings` now 65 columns.
- Pre-existing columns unchanged: fingerprint of all original columns `621f410e...` identical before and after the DDL.
- Vehicles 15 / md5 unchanged; status history 13; navigation 9 / md5 unchanged; testimonials 0; `about_page_sections` md5 unchanged; RLS still on with the same two policies.

## E. About content write and read-back
Written through the real admin form (Website > Beranda > Tentang Perkasa Motors, "Simpan"), driven in the Owner's signed-in browser; the form was editable (the "belum aktif di database" notice was gone) and reported "Tersimpan." Exact read-back from the database:
- eyebrow: `Tentang Perkasa Motors`
- title: `Kendaraan yang Tepat, Proses yang Lebih Sederhana`
- description: `Perkasa Motors menyediakan pilihan mobil dan motor dengan informasi unit yang jelas serta proses pembelian yang sederhana. Mulai dari memilih unit hingga transaksi, komunikasi dapat dilakukan langsung melalui WhatsApp.`
- point 1 `Mobil & Motor`; point 2 `Komunikasi langsung via WhatsApp`; point 3 `Tunai, tempo, atau pembiayaan`; `is_active = true`.
All eight match the approved text character for character. Other `website_settings` values re-checked unchanged (company, WhatsApp, address, copyright, footer description, SEO title, social URLs, hero headlines/flags, legacy About flags); vehicles/navigation/testimonials/history unchanged. The public homepage renders these values from the database; the code-default copy ("Mobil dan motor dalam satu tempat" etc.) no longer appears. The code defaults were intentionally left different so this is observable.
Claim safety: the About text contains none of berkualitas, terjamin, terverifikasi, terinspeksi, kurasi, premium, warranty, guaranteed; it states who Perkasa Motors is, what it sells, how communication works and that payment can be cash, tempo or financing.

## F. Cara Pembelian lock
Owner-approved four steps unchanged (Pilih Unit, Hubungi Kami, Cek & Sepakati, Pembayaran & Serah Terima); stays code-owned with no CMS editing; outline timeline unchanged (horizontal on desktop, vertical below `lg`); no emoji, no boxed cards. The OWNER_FACT_REQUIRED marker in code became OWNER_APPROVED.

## G. Payment wording lock
Cash Tempo is now exactly: "Pembayaran dilakukan secara bertahap dalam periode dan nominal yang disepakati antara pembeli dan Perkasa Motors." (old wording verified gone). Cash Keras and Cicilan / Kredit unchanged; no tenor, amount, DP, interest, penalty or approval promise added; Perkasa Motors still stated as not the financing provider.

## H. Testimonial status
0 testimonials live; none created. Public Testimoni section hidden (verified: no "Testimoni" or "Apa Kata Pelanggan" in the rendered homepage; no empty gap, adjacent sections touch). Admin manager shows the empty state, "Tambah Testimoni" and "0 aktif". **OWNER CONTENT REQUIRED - TESTIMONIALS** (real name, unit bought, quote); not a release blocker.

## I. Redirect permanence
`next.config.ts`: `/about` -> `/#tentang`, `/financing` -> `/#pembayaran`, `/contact` -> `/#kontak` now `permanent: true`. Verified on the production build: HTTP 308, single hop, final 200, no loop; queries preserved (`/financing?utm=x` -> `/?utm=x#pembayaran`). Permanent redirects are cached by browsers and search engines, which is the intended effect now that the IA is final.

## J. Public nav
Header: Beli Mobil, Beli Motor, (Artikel only with >= 3 published), Chat WhatsApp. Footer: Beli Mobil, Beli Motor, (Artikel gated), plus WhatsApp, address and the three configured social links (Instagram, TikTok, LinkedIn). No Tentang Kami / Pembiayaan / Hubungi Kami links anywhere; articles link hidden (0 published).

## K. Homepage order
Verified on the built site: Hero > Unit Tersedia > Kendaraan yang Tepat... (Tentang Perkasa Motors block) > Cara Pembelian > Mekanisme Pembayaran > (Testimoni hidden) > Unit Terjual > footer. No standalone final CTA block. Limits: AVAILABLE max 6 with up-to-3/3 balanced selection (live: 2 shown); SOLD max 4 (4 shown); no homepage pagination, no all-sold archive link; "Lihat Semua Mobil" / "Lihat Semua Motor" present.

## L. CMS QA (authenticated, view-only apart from the one authorized About save)
Sidebar: Ringkasan, Inventory, Website, Artikel. Website tabs: Beranda, Kontak & WhatsApp, Lanjutan (`/admin/website/about` lands on Beranda). Beranda: Hero, Tentang Perkasa Motors (editable, saved values equal the approved content), Testimoni (empty state, Tambah Testimoni available, 0 active), Otomatis di beranda (max 6 / max 4 / system-managed). Admin pages at 1440/1280/768/390: 28/28 clean (no overflow, no console errors, labelled inputs). No testimonial created.

## M. Public QA
`/`, `/cars`, `/motorcycles`, `/articles`, AVAILABLE and SOLD detail pages (car and motorcycle) plus the three redirects: all as expected; every WhatsApp link goes to 6285111307044 (4 distinct messages: generic, two unit-specific, payment inquiry).

## N. Responsive QA
Public at 2560/1440/1280/768/390 x 8 pages = 40 combinations: 39 clean on the first sweep and the 40th (a console error on /motorcycles at 2560) did not reproduce in 6 consecutive reloads (0 errors; only navigation-cancelled requests), so it is a transient; no overflow, 0 duplicate ids, 0 missing alt, 0 broken images, 0 unnamed controls. Homepage geometry: About contained (1440 max-width at 2560), timeline horizontal at 2560/1440/1280 and vertical at 768/390, payment blocks 3-across then stacked, no page overflow at any width, no whitespace gap where Testimoni is hidden, Unit Terjual shows 4, footer contained.

## O. Claim audit - PASS
Rendered text of all checked pages: 0 occurrences of berkualitas, terjamin, terverifikasi, terinspeksi, kurasi, inspeksi, premium, warranty, garansi, guaranteed, kemewahan, "Sold Out".

## P. Technical validation - PASS
`npm run lint` 0; `npx next typegen` + `npx tsc --noEmit` 0; `npm run build` PASS (clean `.next`); `npm audit --omit=dev`: 0 vulnerabilities; `npm audit`: 1 high (existing dev-tooling `brace-expansion`, unchanged; no audit fix run).

## Q. Live-write summary
1. DDL: the 7 additive `homepage_about_*` columns on `website_settings` (once).
2. Data: the 7 About values on the singleton `website_settings` row (via the app; `updated_at`/`updated_by` updated by the app and trigger).
Not written: testimonials, inventory, navigation, articles, status history, any other CMS value. All other access was read-only SELECTs.

## R. Merge readiness
The branch is READY FOR MERGE AUTHORIZATION from a product, QA and data standpoint (the live database already matches the code). **One mechanical item:** `origin/main` has moved (`dfce117`, "feat(vehicle): add detail conversion layer", by the Owner) and touches `components/public/vehicle-detail.tsx`, which this branch changed by one line (`/contact` -> `/#kontak` in a fallback link; main's new version no longer has that link). A simulated merge reports a single conflict in that file; resolution is to keep main's version of the hunk. Re-run the merge simulation (and a quick detail-page check, since main's change adds a mobile CTA component) at merge time.
