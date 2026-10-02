# Perkasa Motors - Merge Authorization + Post-Merge Verification

**Result: PASS. MAIN MERGED (fast-forward) and pushed; READY FOR DEPLOYMENT VERIFICATION.** No deployment was performed or configured by this task. No database or CMS write occurred.

Report location: the canonical main checkout, `C:\Users\USER\webperkasamotors` (primary working tree of the repo; `main` is checked out there). This report and the Ruflo record were written there as **untracked files and were not committed or pushed** (the authorization covered pushing the approved merge only).

## A. Authorization
The Owner authorized: MERGE TO MAIN, source `integration/phase-2r7a-main-reconciliation` only, fast-forward preferred, no force push, no deploy. Basis: Phase 2R.7A PASS (report `docs/reports/phase-2r7a-main-reconciliation.md`), final merge simulation CLEAN, release blockers NONE.

## B. Pre-merge main check
`git fetch origin --prune`: `origin/main` = `1ab0e5e4a6383630f92c3ddc9d4cbdd99e192bd1`, identical to the reviewed main. **Main moved before merge: NO.** No new simulation was needed.

## C. Source branch verification
- `origin/integration/phase-2r7a-main-reconciliation` = `3d543a060c34bbb5473716e0c1c8f99f36d2bac8` (pushed and visible remotely). Contains the expected merge commit `bab50691087c0e355219d9e2796d599553c59b17` (report commit `3d543a0` follows it).
- `origin/main` is an ancestor of the source; behind 0, ahead 21.
- Source worktree clean (0 changes). No tracked env files (only `.env.example`), no secrets (scan 0 hits for service_role / JWT / sb_secret / sk_live outside docs), no temporary QA artifacts, no remediation route (the only "remediation" paths are four 2R.5A report files under `docs/reports`; no `app/` path).

## D. Merge execution
In the canonical checkout (`main`, tracked tree clean; three untracked files present that are unrelated to this task: `TASK.txt`, `docs/reports/codex-windows-setup-report.txt`, `docs/reports/txt/product-admin-experience-audit-phase-a-b.txt`; none collide with incoming paths):
`git pull --ff-only origin main` (already up to date) then `git merge --ff-only origin/integration/phase-2r7a-main-reconciliation`: succeeded. **Method: FAST_FORWARD.** Resulting main `3d543a060c34bbb5473716e0c1c8f99f36d2bac8`. No `--no-ff`, no rebase, no squash, no force.

## E. Push verification
`git push origin main`: `1ab0e5e..3d543a0  main -> main` (normal fast-forward push, accepted without force).

## F. Remote main verification
After a fresh fetch: local `main` = `origin/main` = `3d543a060c34bbb5473716e0c1c8f99f36d2bac8`; same commit as the approved branch, so the tree is identical (**tree match: PASS**). Ancestors of main verified: `76c206e` (UI baseline), `0d91bf7` (technical baseline), `bc8eaa1`, Phase 2R.1 `6881340`, 2R.2 `652baf3`, 2R.3 `c28b772`, 2R.4 `665a8a6`, 2R.5 `3fa73db`, 2R.5A `9a12768`, 2R.6 `16562fc`, 2R.6A `675857d`, 2R.7 `5a24a39`/`e34159f`, 2R.7A `bab5069`, former main `1ab0e5e`.

## G. Technical validation (clean detached worktree of origin/main at 3d543a0)
`npm ci` OK; `npm run lint` PASS; `npx next typegen` + `npx tsc --noEmit` PASS; `npm run build` PASS (29/29). `npm audit --omit=dev`: **0 vulnerabilities**. `npm audit`: 1 high, the existing transitive dev-tooling `brace-expansion` advisory (not fixed; no `audit fix` run). `.env.local` (gitignored) was copied only to build locally; not committed.

## H. Public sanity (production build of main, headless Edge)
Routes: `/`, `/cars`, `/motorcycles`, AVAILABLE and SOLD detail for a car and a motorcycle, `/financing`, `/about`, `/contact`, `/articles` at 2560, 1440, 390 = 33 combinations: **33/33 clean** (no horizontal overflow, content contained at 2560, 0 duplicate ids, 0 missing alt, 0 broken images, 0 unnamed buttons/links, 0 nested anchors, 0 console errors). Body text, headings, nav and every WhatsApp URL are identical to the 2R.7-approved output on all 11 pages. Rendered text contains none of: kurasi, inspeksi, terjamin, berkualitas, kemewahan, premium, verified, curated, inspected, "Sold Out". One "© ..." sequence per page. Admin gate: `/admin/dashboard` redirects to `/admin/login` (307).

## I. Critical contract check - all present
- Homepage order: Hero > Unit Tersedia > Cara Pembelian > Unit Terjual > final WhatsApp CTA.
- Catalogue: Unit Tersedia / Unit Terjual.
- Detail: no description, Indonesian status, "Unit Lainnya", AVAILABLE "Saya Tertarik dengan Unit Ini", SOLD "Tanya Unit Lain"; no "Related Vehicles".
- Financing: guidance only, no calculator/installment/default rate.
- Nav: Beli Mobil, Beli Motor, Tentang Kami, Pembiayaan, Hubungi Kami (no Articles while < 3 published).
- Admin sidebar: Ringkasan, Inventory, Website, Artikel.
- Lifecycle: migration `20261001010000_vehicle_lifecycle_os_readiness.sql` present (`external_id`, `sold_at`, `status_changed_at`, `vehicle_status_history`); `lib/actions/vehicles.ts` uses the history-aware lifecycle code; history-aware delete protection is defined in the migration (live DB verified in Phase 2R.7).
- Global container token: `--container-container: var(--container-max);` in `app/globals.css` (line 93).
- WhatsApp contract: AVAILABLE vehicle-specific; SOLD/RESERVED generic; homepage final generic; financing simulation inquiry; destination unchanged.

## J. Data safety
No live database access of any kind in this task. No CMS write, no status or price mutation, no schema migration (the lifecycle migration is already live from 2R.6A and was not reapplied). No service-role key used.

## K. Deployment status
**Not authorized and not performed.** Per `docs/SOURCE-OF-TRUTH-AND-DEPLOYMENT.md`, Netlify is intended to deploy from commits on GitHub `main`, so a deploy may have been triggered automatically by the push; whether it did cannot be determined from the repository (no `netlify.toml` exists; build command, publish directory, Node version and plugin settings are dashboard-only) and no Netlify or GitHub CI status was accessible from this environment (`gh` is not installed). Netlify configuration was not touched. Main is build-ready (build verified above). Next step: deployment verification (check the Netlify dashboard for a deploy of `3d543a0`, then smoke-test the production URL; a first genuine owner status/price change remains the live proof of the quick actions).

## L. Remaining post-release debt (unchanged from Phase 2R.7)
- Security: revoke unused broad default grants on `vehicles`; revoke inert REFERENCES/TRIGGER on `vehicle_status_history`; staff can edit `sold_at`/`status_changed_at`/`external_id` directly; `brace-expansion` dev dependency; no PITR on the Free plan.
- Product: HEIC upload message; `sold_at` ordering for the sold archive; Operating System source/sync rules.
- Cleanup: dormant backend retirement (Why Perkasa, Testimonials, Leads, Content, Settings, About legacy actions, `vehicle-social-content.tsx`, `getFeaturedVehicles`, mocks); stale legacy CMS text; non-standard stock number `QA-PAGN-01` on a live SOLD car (owner decision).
- UX: photo drag reorder; constrained navigation picker; English strings in some admin screens and on public card labels (Transmission/Mileage, raw MANUAL/Automatic); English hero taglines; lightbox focus management and English gallery aria labels; two `h1` on the homepage; photo alt numbering starts at "foto 2"; footer logo link `aria-label` ends in English "home".

## M. Final release readiness
`origin/main` is `3d543a060c34bbb5473716e0c1c8f99f36d2bac8`: build-ready, audited, contract-verified. No release blockers. **MAIN MERGED - READY FOR DEPLOYMENT VERIFICATION.**
