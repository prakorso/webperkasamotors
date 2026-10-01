# Perkasa Motors - Phase 2R.5A: Owner Acceptance + CMS Content Remediation Gate

Result: **BLOCKED on the write step. NO CMS WRITE WAS EXECUTED.** The before snapshot and drift check were completed (no drift). Authenticated admin acceptance is **OWNER WALKTHROUGH REQUIRED**. No application code, inventory, auth or schema change.

## Why the write is blocked
This environment holds only the public Supabase anon key (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). There is no service-role key, no database connection string, no Supabase CLI or SQL tool, and no authenticated admin session (the Claude-in-Chrome extension is disconnected and I may not enter or ask for credentials). Row-level security allows writes to these tables only for signed-in staff, so the approved writes cannot be performed from here without bypassing authentication, which I will not do. Items 6 and 7 additionally have no admin screen any more (Phase 2R.5 removed them), so they require SQL anyway. I did not attempt any write with the anon key.

## A. Before snapshot (read-only, anon key, 2026-10-01T15:51:34Z)
website_settings id=1:
- hero_1_description = "Pilihan unit kendaraan berkualitas dengan informasi yang jelas dan proses pembelian yang mudah."
- footer_description = "Pilihan kendaraan berkualitas, informasi transparan, dan pengalaman pembelian yang lebih mudah."
- copyright_text = "© 2026 Perkasa Motors. All rights reserved."
- about_is_active = true
- why_perkasa_is_active = true

navigation_items:
- 25c73cb7-fe4b-4022-b518-e000873be931: HEADER, group null, label "Simulasi Kredit", href /financing, sort 4, visible true, cta false
- 3bac7b0d-ea2a-4cac-a8b6-618afacfead5: FOOTER_NAV, group "Navigasi", label "Simulasi Kredit", href /financing, sort 3, visible true, cta false
- de854216-5494-4cea-bd69-a6391eb1280c: FOOTER_NAV, group "Navigasi", label "Articles", href /articles, sort 4, visible true, cta false

about_page_sections:
- 4e6badb4-18e3-4c7e-bed7-7b2c761e6c93: key hero, is_active true, sort 1
- 4becc88d-bb88-4f01-a110-eae14535b03a: key story, is_active true, sort 2

No unrelated customer or inventory data was read.

## B. Content drift check
**CMS DRIFT CHECK: PASS.** All 10 expected values match the Phase 2R.5 snapshot exactly (hero, footer, copyright, both flags, both financing labels and hrefs, articles label and href, both About rows active). Re-check immediately before the SQL below is run; the SQL itself re-asserts every expected value.

## C. Exact writes executed
**None.** CMS PATCH EXECUTED: NO. Item 8 (hero slide 3) is not approved and is not in the SQL.

### Owner-run SQL (Supabase dashboard > SQL editor)
All-or-nothing: every UPDATE is conditioned on the expected current value and the block aborts and rolls back everything if any statement does not change exactly the expected number of rows (that is the drift guard). Targets exact rows and fields only. Not stored as a script in the repository.

```sql
DO $$
DECLARE n integer;
BEGIN
  -- Item 1
  UPDATE website_settings
     SET hero_1_description = 'Pilihan unit kendaraan dengan informasi yang jelas dan proses pembelian yang mudah.'
   WHERE id = 1
     AND hero_1_description = 'Pilihan unit kendaraan berkualitas dengan informasi yang jelas dan proses pembelian yang mudah.';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN RAISE EXCEPTION 'CONTENT DRIFT at item 1 (hero_1_description)'; END IF;

  -- Item 2
  UPDATE website_settings
     SET footer_description = 'Mobil dan motor dengan informasi yang jelas, dan proses pembelian lewat WhatsApp.'
   WHERE id = 1
     AND footer_description = 'Pilihan kendaraan berkualitas, informasi transparan, dan pengalaman pembelian yang lebih mudah.';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN RAISE EXCEPTION 'CONTENT DRIFT at item 2 (footer_description)'; END IF;

  -- Item 3
  UPDATE website_settings
     SET copyright_text = 'All rights reserved.'
   WHERE id = 1
     AND copyright_text = '© 2026 Perkasa Motors. All rights reserved.';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN RAISE EXCEPTION 'CONTENT DRIFT at item 3 (copyright_text)'; END IF;

  -- Item 4 (two rows)
  UPDATE navigation_items
     SET label = 'Pembiayaan'
   WHERE id IN ('25c73cb7-fe4b-4022-b518-e000873be931', '3bac7b0d-ea2a-4cac-a8b6-618afacfead5')
     AND href = '/financing' AND label = 'Simulasi Kredit';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 2 THEN RAISE EXCEPTION 'CONTENT DRIFT at item 4 (financing labels)'; END IF;

  -- Item 5
  UPDATE navigation_items
     SET label = 'Artikel'
   WHERE id = 'de854216-5494-4cea-bd69-a6391eb1280c'
     AND href = '/articles' AND label = 'Articles';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN RAISE EXCEPTION 'CONTENT DRIFT at item 5 (articles label)'; END IF;

  -- Item 6 (two rows; no delete, no text change)
  UPDATE about_page_sections
     SET is_active = false
   WHERE id IN ('4e6badb4-18e3-4c7e-bed7-7b2c761e6c93', '4becc88d-bb88-4f01-a110-eae14535b03a')
     AND is_active = true;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 2 THEN RAISE EXCEPTION 'CONTENT DRIFT at item 6 (legacy About)'; END IF;

  -- Item 7
  UPDATE website_settings
     SET about_is_active = false, why_perkasa_is_active = false
   WHERE id = 1 AND about_is_active = true AND why_perkasa_is_active = true;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN RAISE EXCEPTION 'CONTENT DRIFT at item 7 (homepage legacy flags)'; END IF;
END $$;
```

**Required follow-up after running it (important):** the public homepage and layout are statically prerendered and only refresh when a CMS action calls `revalidatePath` (Phase 2C.4 found that edits made directly in the database bypass this). So after the SQL, sign in to the admin once and press **Save** on Website > Lanjutan (no change needed) to trigger the site-wide revalidation; otherwise the old footer/hero text can keep showing. `updated_by` on `website_settings` will be empty for the SQL edit; harmless.

## D. After snapshot
NOT TAKEN (no write happened). Once the SQL is run, re-read the same rows and tell me, or ask for the verification run. Note: `about_page_sections` rows that become inactive are hidden from the public anon key by row-level security, so item 6 can only be confirmed with an authenticated read or in the SQL editor (`select id, is_active from about_page_sections;`).

## E. Public verification
Patch-dependent checks (hero sentence removed, footer text, single copyright, "Pembiayaan"/"Artikel" stored labels, legacy About/homepage flags) are **NOT VERIFIED** because the patch has not been applied. No code changed since Phase 2R.5, whose public regression (homepage, /about, /financing, /cars, /motorcycles, detail pages) passed; that result stands for the pre-patch state. After the patch, expected results: hero slide 1 without "berkualitas"; footer showing the new description and a single "(c) 2026 Perkasa Motors. All rights reserved."; header and footer showing "Pembiayaan" (already true at runtime); Articles still hidden (0 published); /about unchanged.

## F. Authenticated admin acceptance
**AUTHENTICATED ADMIN QA: OWNER WALKTHROUGH REQUIRED.** No authenticated session is available and none will be requested or bypassed. Read-only checklist for the Owner (do not change status or price, do not save a test vehicle):
- /admin sidebar: Ringkasan, Inventory, Website, Artikel only (no Leads, Content, Settings).
- /admin/dashboard: Tersedia, Dipesan, Terjual, Perlu Dilengkapi, Terakhir Diubah, Tambah Unit, Lihat Situs; no leads/fake activity.
- /admin/inventory: status tabs with counts; each unit shows status buttons and an "Ubah" price control; no horizontal overflow.
- /admin/inventory/new: sections Jenis kendaraan, Informasi unit, Harga, Spesifikasi, Highlights; no Published or Featured checkbox, no slug or SEO fields.
- An existing unit page: status panel, form, photos; no Social Content editor.
- /admin/website: tabs Beranda, Tentang, Kontak & WhatsApp, Lanjutan. Beranda = hero only plus the automatic-content note (no Why Perkasa, Testimonials, About editor). Tentang = read-only explanation. Kontak & WhatsApp = single contact source. Lanjutan = logo/SEO/footer/copyright and menus.
- /admin/articles: list and editor usable (Lanjutan section collapsed by default).

## G. Responsive admin acceptance
NOT PERFORMED (needs the signed-in session). Please check 1440, 1280, 768 and 390 for: sidebar/menu button, inventory rows, vehicle create form, Website tabs scrolling.

## H. Quick-action verification status
STATUS QUICK ACTION: CODE VERIFIED. PRICE QUICK ACTION: CODE VERIFIED. Neither was run against live inventory (policy). They remain unproven end-to-end until used intentionally in normal operation or against an isolated test dataset.

## I. Phase 2R.5 implementation acceptance
**NOT YET ACCEPTED.** Code, lint, typecheck and build passed in 2R.5, and the unauthenticated gate was verified, but acceptance requires (1) the owner walkthrough in F/G and (2) the content patch in C being applied and checked. No acceptance blocker (application bug) was found in this phase; no application code was changed.

## J. Phase 2R.6 carry-forward risks (design inputs)
1. **Status-lifecycle risk (REQUIRED 2R.6 design input):** RESERVED -> AVAILABLE -> DELETE can delete a formerly reserved vehicle and make its permanently-reserved stock-number semantics ambiguous. 2R.6 must evaluate status history, `ever_reserved` / history-based deletion protection, `sold_at` / `status_changed_at`, and the stock-number lifecycle. Not solved here.
2. SOLD is final from the owner UI (no SOLD -> AVAILABLE).
3. Direct database content edits bypass site revalidation (see C follow-up).
4. Dormant code/data to retire later: About/Why Perkasa/Testimonials tables and actions, `vehicle-social-content.tsx`, Leads/Content routes.
5. Constrained navigation destination picker, HEIC upload message, drag reorder (deferred).

## K. Database safety statement
This phase performed only read-only anon queries of the exact rows listed in A. No INSERT, UPDATE, DELETE, migration, auth, inventory or storage operation was performed. CMS PATCH ITEMS APPROVED: 1-7. ITEM 8: not approved, not modified. UNAPPROVED CMS FIELDS MODIFIED: NO. INVENTORY DATA MODIFIED: NO. AUTH DATA MODIFIED: NO. SCHEMA MODIFIED: NO. APPLICATION CODE CHANGED: NO.
