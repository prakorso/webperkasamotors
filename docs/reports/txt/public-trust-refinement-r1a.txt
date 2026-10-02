# Perkasa Motors - Public Trust Refinement R1A: About Media Migration + CMS Enablement + Merge Gate

**Result: PASS, with OWNER CONTENT REQUIRED (non-blocking).** The authorized additive migration `20261003010000_homepage_about_media.sql` was applied once to the live Supabase project and verified; the About photo manager is now enabled by the live schema (verified in an authenticated session). No real About photos were provided, so none were uploaded: the public About stays copy-only by design until the Owner adds real photos. Main has not moved; the branch is a clean fast-forward. Nothing merged or deployed.

## A. Authorization
The Owner authorized applying `20261003010000_homepage_about_media.sql` to the live project; Owner role was authorization plus one sign-in to the local admin (credentials typed by the Owner, never seen by the AI). The migration was executed by the AI through its authenticated Supabase connection. No other live write was authorized or made.

## B. Pre-migration check (read-only) - no drift
`homepage_about_media` did not exist; `public.set_updated_at()` and `public.is_active_staff()` exist; `site-assets` bucket exists (public) with exactly 4 policies (public read; staff insert/update/delete). Baselines: `website_settings` row md5 `aaf35de8...` (65 columns), vehicles 15 (md5 `49d984e3...`), status history 13, testimonials 2 (md5 `05f1c18c...`), articles 0, navigation 9 (md5 `fb7afaba...`), `about_page_sections` md5 `d74d690c...`. Migration re-reviewed: every statement targets only the new table (create table, comment, index, trigger, enable RLS, 5 policies); no DROP, RENAME, TRUNCATE, DELETE, data write or change to any existing object.

## C. Migration execution
Applied exactly once with `apply_migration` (name `homepage_about_media`), statements identical to the repo file (header comment shortened). Result `success: true`. No other migration, no manual row creation, no content write.

## D. Post-migration schema verification (read-only)
Columns: id uuid default gen_random_uuid() PK; storage_path text not null; caption text null; sort_order integer not null default 0; is_active boolean not null default true; created_at / updated_at timestamptz not null default now(). Constraints: `homepage_about_media_path_not_blank` (btrim(storage_path) <> ''), `homepage_about_media_caption_length` (null or <= 140), primary key. Index `homepage_about_media_sort_order_idx`. Trigger `homepage_about_media_set_updated_at`. RLS enabled. Policies: public SELECT for anon+authenticated `using (is_active = true)`; staff SELECT, INSERT (check), UPDATE (using + check) and DELETE, all `is_active_staff()`. Rows: 0. All baselines identical after the migration (settings, vehicles, history, testimonials, articles, navigation, About sections, site-assets policies).
Note: like every other public table in this project, `anon` holds Supabase's default table grants; RLS is the barrier (verified in E). This is the already-registered "default grants hardening" debt, not new.

## E. Storage verification
`site-assets` remains the destination (no new bucket). Live API probes with the public anon key: SELECT on `homepage_about_media` -> `[]` (HTTP 200); INSERT -> refused, `42501 new row violates row-level security policy` (HTTP 401); upload to `site-assets` -> refused, `AccessDenied ... row-level security` (HTTP 400/403); public read of an existing site-assets file -> HTTP 200. Re-checked afterwards: 0 rows in the table and 0 `about-proof-*` objects, so the refused probes left nothing behind. Staff upload/update/delete is granted by the existing storage policies (`is_active_staff()`).

## F. CMS enablement
Authenticated admin (local build against the live project), Website > Beranda: sections Hero Slides, Tentang Perkasa Motors, **Foto / Bukti Perkasa**, Testimoni, Otomatis di beranda. The previous "belum aktif di database" notice is gone; "Tambah Foto" and the file input are enabled; empty state "Belum ada foto..." with "(0 aktif saat ini)". About text form editable. Tabs Beranda / Kontak & WhatsApp / Lanjutan; sidebar Ringkasan / Inventory / Website / Artikel (no new menu). 1440/768/390: no overflow, 0 errors.

## G. About content / photo status
No Owner-provided real photos were available, so per policy no record or file was created: **0 photos**. Public About = **COPY_ONLY** (the approved copy and 3 points, no frames, no placeholders). **OWNER CONTENT REQUIRED - ABOUT PHOTOS** (non-blocking). The upload/caption/activate/reorder/delete flows were verified in R1 against a local harness (including refusal without a session) and are now backed by the live table; live CRUD will be exercised with the Owner's first real photos.

## H. About responsive QA
Real live state (copy-only) at 1440/768/390: renders as before, no overflow. The 1/2/3/4-photo collage states were verified in R1 at 1440/1024/768/390/360 (images load, captions below photos, side-by-side desktop, stacked mobile, no overflow, capped at 4); code unchanged since.

## I. Hero regression - PASS
Both slides: 1440 desktop overlay (738px, 68px headline, primary 191x52 / 156x52); 1024 stacked (1009x505 image block); 768 stacked (753x471); 390 stacked mobile (390x260). Secondary WhatsApp CTA outlined (1px border) and visible on all; graphite surface below xl; 0 CTA/controls overlap with the photo; no overflow; 0 errors.

## J. SOLD regression - PASS
Homepage (4 SOLD), /cars (6), /motorcycles (6) at 1440 and 390: 0 SOLD cards with a WhatsApp CTA; centred TERJUAL marker (within 2px); cards link to detail. SOLD car and SOLD motorcycle detail: no unit CTA, no decision area, no sticky bar, "Unit ini sudah terjual."; related AVAILABLE cards keep "Saya Tertarik" (unit-specific). AVAILABLE detail unchanged (decision area + sticky, vehicle-specific). RESERVED unchanged (code).

## K. Footer regression - PASS
Visible button text "WhatsApp" only (no digits); destination wa.me/6285111307044 with the generic message; rest of footer unchanged.

## L. Main divergence
`origin/main` = `019c527b24b516ede0572f7c11badb4e9d4d35b4` (unchanged since R1); branch head `c54a14969348c240f1591b8bcf6ad0671089835f` before this report; merge-base = main; 0 commits behind.

## M. Reconciliation
Not required (main did not move).

## N. Public QA - PASS
Production build: /, /cars, /motorcycles, /articles, AVAILABLE car/motorcycle detail, SOLD car/motorcycle detail at 1440/768/390: 23/24 clean on the sweep; the one flagged item (a console error on the AVAILABLE car detail at 1440) did not reproduce in 6 repeat loads (0 errors, 0 HTTP >= 400), so it was transient. No broken images, no overflow. Browser-extension "runtime.lastError" messages in the test profile are excluded (they appear on unrelated sites too). Homepage order: Unit Tersedia > Tentang (copy-only) > Cara Pembelian > Mekanisme Pembayaran > Testimoni (2 real Owner testimonials) > Unit Terjual.

## O. CMS QA - PASS (enablement, view-only)
Enablement verified live with the Owner's session (F). No upload/save/delete was performed because no real photo was provided; full live CRUD is pending the Owner's first real photos (non-blocking).

## P. Claim audit - PASS
0 occurrences of berkualitas, terjamin, terverifikasi, terinspeksi, kurasi, inspeksi, premium, warranty, garansi, guaranteed, kemewahan, "Sold Out"; TERJUAL present as expected (4 on the homepage).

## Q. Data safety
Live writes: the authorized About media migration only (DDL). No About photo content, inventory, testimonial, navigation, hero, About text, vehicle status/price or article write. The two anonymous write probes were refused by RLS and created nothing (verified).

## R. Technical validation - PASS
`npm run lint` 0; `npx next typegen` + `npx tsc --noEmit` 0; `npm run build` PASS (26 routes); `npm audit --omit=dev`: 0 vulnerabilities; `npm audit`: 1 high (existing dev-tooling `brace-expansion`, no fix run).

## S. Final merge simulation
After a fresh fetch: `origin/main` still `019c527`; merge-tree exit 0 (CLEAN); merge-base equals main, so the branch fast-forwards.

## T. Release readiness
READY FOR MERGE AUTHORIZATION. The live database already matches the code. Remaining Owner content (non-blocking): real About photos via Website > Beranda > Foto / Bukti Perkasa.
