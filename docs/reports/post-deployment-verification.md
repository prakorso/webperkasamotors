# Perkasa Motors - Post-Deployment Verification (Final Production Release Gate)

**Result: PASS. PRODUCTION RELEASE VERIFIED.** Netlify production is serving the approved main commit `3d543a060c34bbb5473716e0c1c8f99f36d2bac8`, and the live public site behaves per the Phase 2R contract. No application code, CMS, database schema, vehicle status or price was modified. No manual redeploy was triggered.

## A. Source main verification
`git fetch origin --prune`: `origin/main` = `3d543a060c34bbb5473716e0c1c8f99f36d2bac8` (unchanged since the merge authorization; "MAIN MOVED" not triggered).

## B. Netlify site identity
Existing project, used as-is (no new site, no relink): name `webperkasamotors`, site id `37a5875a-eb95-4bee-8a32-b09d4eadd14d` (matches the local `.netlify/state.json` link), repo `https://github.com/prakorso/webperkasamotors`, production branch `main`, build command `npm run build`, publish dir `.next`, no custom domain. Queried read-only with the Netlify CLI under the Owner's existing authenticated account (`netlify api listSiteDeploys` / `getSite`; no write call).

## C. Deployment identity
Deploy id `6abf4dbdd4a90400085af681`: context `production`, branch `main`, state `ready`, commit_ref `3d543a060c34bbb5473716e0c1c8f99f36d2bac8`, title "docs: complete phase 2r7a main reconciliation", created 2026-10-02T06:22:53Z, published 2026-10-02T06:23:27Z, deploy time 33 s, no error message. It is the site's `published_deploy` (not locked). Previous production deploy: `6abe923b2cf67500089138eb` for `1ab0e5e` (2026-10-01T17:03Z). Branch deploys for the integration branches also exist but are not production.

## D. Commit match - PASS
Netlify reports the published production deploy built from `3d543a0…` (exact match). Independent corroboration from the served assets: the production CSS bundle is byte-identical in length (61,355 B) with the same 696 rules as a local build of this tree (the only differences are Windows/Linux floating-point rounding in `lab()` colour values), and it contains the `--container-container` token; 8 of 12 JS/CSS asset hashes referenced by the production homepage are identical to the local build.

## E. Deployment status - READY
`ready`, published, no failed/cancelled/errored deploy and no rollback among the five most recent deploys.

## F. Production URL
`https://webperkasamotors.netlify.app` (from Netlify project info; HTTPS; `http://` returns 301 to `https://`).

## G. Homepage QA - PASS
Order: Hero > Unit Tersedia (2 AVAILABLE cards) > Cara Pembelian > Unit Terjual (3 SOLD cards) > final CTA "Tanyakan unit yang Anda cari." Absent: Why Perkasa, About, Testimonials, Articles section. Hero copy factual ("Pilihan unit kendaraan dengan informasi yang jelas..."); no unsupported claims. No overflow, no broken images at 2560/1440/390.

## H. Catalogue QA - PASS
/cars: 1 AVAILABLE ("Saya Tertarik", unit-specific) + 6 SOLD shown (archive cap 6; "Tanya Unit Lain" generic). /motorcycles: 1 AVAILABLE + 6 SOLD. "Unit Tersedia" / "Unit Terjual" sections; no "Sold Out", no English sold split. Reflects live DB (see Q).

## I. Detail / gallery QA - PASS
Live AVAILABLE car (`hyundai-grand-avega-hatchback-2012`), SOLD car (`...-2013-4`), AVAILABLE motorcycle (`suzuki-gsx-r-sport-2017`), SOLD motorcycle (`yamaha-r15-v3-sport-2022`): Indonesian status (Tersedia/Terjual); CTA "Saya Tertarik dengan Unit Ini" vs "Tanya Unit Lain"; no description/About/"Technical Specifications"/"Condition & Features" headings; spec labels Tahun/Kilometer/Transmisi/Bahan Bakar; highlights 5 shown + "Lihat N sorotan lainnya" (16/20/13/19); "Unit Lainnya" (AVAILABLE only) present; all images load (7/7 and 8/8 on the two gallery pages tested); lightbox opens (counter), ArrowRight advances, Escape closes; main image `object-fit: contain`.

## J. Financing QA - PASS
"Pembiayaan Kendaraan"; no numeric calculator, installment, default rate or amount; CTA "Tanya Simulasi via WhatsApp".

## K. About / contact / articles - PASS
/about factual structure only; /contact WhatsApp primary, address only; /articles valid empty state ("Belum ada artikel."), no Artikel/Articles link in the nav (0 published articles in the DB).

## L. Header / footer - PASS
Header: Beli Mobil, Beli Motor, Tentang Kami, Pembiayaan, Hubungi Kami (no "Simulasi Kredit"). Footer: factual description, only the three configured social links (Instagram, TikTok, LinkedIn), "Jelajahi" nav without Artikel, exactly one "© 2026 Perkasa Motors. All rights reserved." on every page.

## M. WhatsApp - PASS
All live `wa.me` links go to 6285111307044 (0 wrong destinations, no malformed percent-encoding). Four distinct messages: generic ("...mengetahui lebih lanjut mengenai unit yang tersedia.") for header/footer/homepage/final CTA/SOLD cards and detail; vehicle-specific for AVAILABLE ("saya tertarik dengan {unit} {tahun} ({Mobil|Motor}) ..."); financing simulation inquiry ("...menanyakan simulasi pembiayaan untuk unit yang tersedia."). RESERVED: no live record; generic by code (verified in earlier phases).

## N. Responsive production QA - PASS
Routes: /, /cars, /motorcycles, 4 detail pages, /financing, /about, /contact, /articles at 2560, 1440, 390 = 33 combinations: 33/33 clean after one re-check. No horizontal overflow, content centered and contained at 2560, 0 duplicate ids, 0 missing alt, 0 broken images, 0 unnamed buttons/links, 0 nested anchors, 0 insecure sub-requests. Mobile menu opens (aria-expanded) with the five links. Body text, headings, nav and WhatsApp URLs match the 2R.7-approved output on all pages (the only per-page difference is that the live SOLD-car sample is a different vehicle than the 2R.7 sample). One console error was logged once on /cars at 1440 during the first sweep; four consecutive reloads of the same page produced 0 errors (only navigation-cancelled `ERR_ABORTED` requests), so it was transient and not reproducible.

## O. Admin auth gate - PASS
Signed-out `/admin/dashboard` and `/admin/inventory` redirect to `/admin/login` (307 via curl; confirmed in-browser). No authentication, no admin action in production.

## P. Live lifecycle sanity - PASS (read-only)
`vehicles.external_id`, `sold_at`, `status_changed_at` present; `vehicle_status_history` present, RLS on, **13 rows, all baseline, 0 non-baseline** (no real transitions since the migration); triggers `vehicles_status_lifecycle`, `vehicles_before_delete`, `vehicles_set_updated_at` present; `sold_at` non-null count 0 (by design for historical rows).

## Q. Inventory sanity - PASS
Database: 15 vehicles, 15 published, 2 AVAILABLE, 0 RESERVED, 13 SOLD (identical to the 2R.6A/2R.7 state; latest vehicle `updated_at` 2026-09-11). Public: 2 AVAILABLE cards (1 car + 1 motorcycle) and SOLD capped at 6 per catalogue (7 cars and 6 motorcycles sold in the DB, 6 shown each). No operational drift, no regression.

## R. Cache / stale-content check - NONE FOUND
Rendered production text across 11 pages: 0 occurrences of "Simulasi Kredit", "berkualitas", "Why Perkasa", "Testimoni(als)", "Sold Out", "Related Vehicles", kurasi, inspeksi, terjamin, kemewahan, premium, verified, curated, inspected. The first homepage response had Age ~52 min, consistent with the cache being repopulated after the 06:23Z deploy, and its content is post-2R.

## S. Security sanity - PASS
HTTPS with HSTS (`max-age=31536000; includeSubDomains; preload`) and `X-Content-Type-Options: nosniff`; http redirects to https; 0 mixed-content references in the HTML; scan of the homepage HTML and its 12 referenced JS bundles (755 KB): 0 `service_role`, 0 `sb_secret`, 0 JWTs, 0 password-like literals; `.js.map` requests return 404 and chunks carry no `sourceMappingURL`. Not a penetration test.

## T. Remaining debt (unchanged; none blocks release)
Security: broad default grants on `vehicles`, inert privileges on the history table, direct staff edit of `sold_at`/`status_changed_at`/`external_id`, dev-only `brace-expansion` advisory, no PITR (Free plan). Product: HEIC message, `sold_at` ordering, OS sync rules; first real owner status/price change is the live proof of the admin quick actions (code + DB definition verified only). Cleanup: dormant backend retirement, stale legacy CMS text, `QA-PAGN-01` stock number on a live SOLD car. UX: photo drag reorder, constrained navigation picker, English strings (some admin screens, public card labels "Transmission"/"Mileage" and raw values, hero taglines, gallery aria labels), lightbox focus management, two `h1` on the homepage, alt numbering starts at "foto 2". Also noted: Netlify has no `netlify.toml` (build config is dashboard-only; see `docs/SOURCE-OF-TRUTH-AND-DEPLOYMENT.md`).

## U. Release record housekeeping
Documentation-only commit to `main` containing only: `docs/reports/merge-authorization-post-merge-verification.md`, `docs/reports/txt/merge-authorization-post-merge-verification.txt`, `.ruflo/coordination/tasks/MERGE-AUTHORIZATION.json`, this report and its TXT mirror, and `.ruflo/coordination/tasks/POST-DEPLOYMENT-VERIFICATION.json`. Explicitly excluded (unrelated untracked files): `TASK.txt`, `docs/reports/codex-windows-setup-report.txt`, `docs/reports/txt/product-admin-experience-audit-phase-a-b.txt`. The docs-only commit's own SHA is recorded in the task's final output (a file cannot contain its own commit hash). Pushing it triggers another Netlify production build of `main`; no application code changes in it, so the build is deterministic and the production application SHA remains `3d543a060c34bbb5473716e0c1c8f99f36d2bac8`.

## V. Final production verdict
**PRODUCTION RELEASE VERIFIED.** Production application commit: `3d543a060c34bbb5473716e0c1c8f99f36d2bac8`, deploy `6abf4dbdd4a90400085af681`, `https://webperkasamotors.netlify.app`.
