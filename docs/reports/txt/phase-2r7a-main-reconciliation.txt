# Perkasa Motors - Phase 2R.7A: Main Reconciliation + Final Merge Gate

**Result: PASS.** `origin/main` (1ab0e5e) was merged into the audited 2R lineage by a controlled semantic merge. All 6 conflicts are resolved with 2R behavior, copy and CTA contracts intact. The branch is 0 commits behind main and a simulated merge into main is CLEAN (and equals this branch's tree, i.e. fast-forwardable). Nothing was merged to main; nothing deployed; no live data touched.

## A. Base verification
- Branch `integration/phase-2r7a-main-reconciliation`, worktree `.claude/worktrees/phase-2r7a-main-reconciliation`.
- Base: exact pushed HEAD of `integration/phase-2r7-final-qa` = `e34159f9885a6a4ed9b680aed0465c63a3ee3bb2` (contains the 2R.7 container fix `5a24a39`).
- Strategy: `git merge --no-commit --no-ff origin/main`, resolved per file, then committed (`bab5069`). No wholesale ours/theirs of the merge; file-level `--ours` was used only where main's change was entirely behavior that 2R forbids, after a hunk-by-hunk review (see D-I).

## B. Main divergence
- origin/main HEAD `1ab0e5e4a6383630f92c3ddc9d4cbdd99e192bd1` (unchanged at start and at final fetch).
- merge-base before merge: `bc8eaa187cd44f4e673117ae20150b8b62fdb245`; after merge: `1ab0e5e` (main is now an ancestor).
- Main-only commits: 7 (`15e525f`, `cc90d4f`, `c0b1bae`, `24f790c`, `1696c40`, `5a9ed73`, `1ab0e5e`).

## C. Main-only commit review
| Commit | Content | Classification |
|---|---|---|
| `15e525f` refine inventory hierarchy and sold experience | Original R3A UI input | ALREADY_SUPERSEDED (reconciled in 2R.1-2R.3) |
| `cc90d4f` refine vehicle detail editorial layout | R3B detail input (description, English headings, "Related Vehicles") | ALREADY_SUPERSEDED / DROP content (2R.3/2R.4 own detail) |
| `c0b1bae` restrict related vehicles to available | `.eq("status","AVAILABLE")` in `getRelatedVehicles` | ALREADY_SUPERSEDED (identical filter in 2R) |
| `24f790c` separate sold motorcycles | Adds `separateSoldInventory` to /motorcycles; plus catalogue/card sold split (earlier R3A1 work) | DROP (parallel client-side split with English eyebrows, "Sold Out" overlay, CTA-less sold cards; 2R.2 data-layer split owns this) |
| `1696c40` redesign public closing section (footer) | Footer composition, Indonesian labels (Ikuti Kami / Jelajahi / Kontak), logo, CTA button, `copyrightStatement` | ADOPT (presentation + robust single-copyright helper), with 2R behavior retained |
| `5a9ed73` contain footer layout and hit area | `max-w-[var(--container-max)]`, `min-h-11` | ADOPT (footer); container also covered globally by the 2R.7 token |
| `1ab0e5e` contain vehicle-detail layout | container literal; grid `md:grid-cols-2` removed | PARTIALLY_ADOPT: container literal adopted; single-column-until-lg grid DROPPED (see H) |

## D. Conflict inventory
Six conflicted files (the 2R.7 report listed five and called `lib/data/vehicles.ts` auto-merged; that was a reporting error, it was in the conflict list, comment-only):
`components/public/site-footer.tsx`, `vehicle-card.tsx`, `vehicle-catalogue.tsx`, `vehicle-detail.tsx`, `vehicle-gallery.tsx`, `lib/data/vehicles.ts`.
Also reconciled although git merged them cleanly: `app/(public)/cars/page.tsx` and `motorcycles/page.tsx` (main added the `separateSoldInventory` prop, which would not compile and would revive main's split; removed, files identical to 2R).
Final diff of this merge vs the 2R.7 head: only `site-footer.tsx`, `vehicle-detail.tsx` (2 classes) and two docs `.txt` from main.

## E. Footer reconciliation
Git merged main's redesign with 2R's footer edits; one real conflict (WhatsApp link attributes). Resolved: 2R's Indonesian `aria-label`/`title` ("Chat lewat WhatsApp") + main's button styling. Verified retained: `applyPublicNavRules` (Articles gate, Pembiayaan label), factual CMS description, `copyrightStatement` yielding exactly one "© 2026 Perkasa Motors. All rights reserved.", only configured social links (Instagram, TikTok, LinkedIn), no stale copy. Main's new fixed labels are Indonesian ("Ikuti Kami", "Jelajahi", "Kontak"). Rendered at 2560/1440/390: contained, no overflow.

## F. Vehicle-card reconciliation
Taking 2R's card in full. Main's `soldPresentation` variant (a) hides the WhatsApp CTA on sold cards, (b) removes the status badge, (c) overlays "Sold Out": all contradict the 2R contract. 2R's own `isSold` styling already gives the quieter archive card. Preserved: AVAILABLE specific CTA, RESERVED/SOLD generic "Tanya Unit Lain", Tersedia/Dipesan/Terjual badges, deterministic alt, no nested anchors. Nothing adopted (visual deltas were all tied to the dropped variant).

## G. Catalogue reconciliation
2R.2 version kept. Dropped: main's client-side split (English "Available"/"Sold" eyebrows, "Sudah Terjual", `separateSoldInventory`). Preserved: Unit Tersedia/Unit Terjual, cars/motorcycles parity, SOLD cap 6, SOLD outside pagination, Indonesian empty states, generic sold CTA.

## H. Detail reconciliation
2R.3/2R.4 structure kept (no description, Indonesian status/specs, CTA beside price, highlights 5 + disclosure, "Unit Lainnya" AVAILABLE-only, stock number demoted). Adopted from `1ab0e5e`: container `max-w-[var(--container-max)]`. Evaluated and dropped: removing `md:grid-cols-2`. At 768 that makes the 4:5 gallery full width (~860px tall) and pushes price and the WhatsApp CTA far below the fold, violating "CTA near primary info"; verified in a screenshot and reverted before commit.

## I. Gallery reconciliation
Comment-only conflict; code already identical (2R.3 ported the same 4:5 / object-contain / 4 thumbnails). 2R file kept; lightbox/keyboard behavior unchanged.

## J. Auto-merged file review
- `app/(public)/cars/page.tsx`, `motorcycles/page.tsx`: see D (prop removed; identical to 2R; uses `getCatalogueByType` active/sold).
- `lib/data/vehicles.ts`: `.eq("status","AVAILABLE")` present once in `getRelatedVehicles`; no duplicate catalogue logic; `getCatalogueByType` untouched.
- Main's `docs/reports/txt/ui-r3a1-catalogue-parity.txt`, `ui-r3c-footer-redesign.txt`: added docs only.

## K. Global container fix preservation - PRESERVED
`app/globals.css` unchanged by the merge; `--container-container: var(--container-max);` present (line 93). Footer and detail now use the literal too.

## L. Public QA
Production build of the merged branch, headless Edge. Routes: `/`, `/cars`, `/motorcycles`, `/financing`, `/about`, `/contact`, `/articles`, AVAILABLE + SOLD detail for a car and a motorcycle; widths 2560/1440/390 = 33 combinations: **33/33 clean** (no horizontal overflow, content centered/contained at 2560, 0 duplicate ids, 0 missing alt, 0 broken images, 0 unnamed controls, 0 nested anchors, 0 console errors). Regression diff against the 2R.7-approved output: **0 differences** in body text, headings, nav and every WhatsApp URL across all 11 pages (footer markup intentionally differs). Footer visually checked at 2560, 1440, 390; detail layout checked at 768 (two-column retained).

## M. Admin sanity
No admin file changed (0 files matching admin). `/admin/inventory` and `/admin/dashboard` redirect to `/admin/login` when signed out (307). No authenticated session was available (the earlier session profile was deleted); no full admin re-QA needed since admin code is untouched.

## N. Claim audit - PASS
Rendered text of all 11 pages: 0 matches for kurasi, inspeksi, terjamin, berkualitas, kemewahan, premium, verified, curated, inspected, "sold out". Code: only `lib/mock/vehicles.ts:36` (dev fixture, unused by public path) and `lib/utils/benefit-icons.ts:28` (dormant admin icon label); comments excluded. "Sold Out", `soldPresentation`, `separateSoldInventory`, "Sudah Terjual" absent from app/components/lib.

## O. WhatsApp contract - PASS
Every `wa.me` URL (destination 6285111307044 and message text) is identical to 2R.7 on all pages: AVAILABLE vehicle-specific; SOLD/RESERVED generic (`lib/utils/whatsapp.ts` untouched); homepage final generic; financing simulation inquiry. Footer WhatsApp button keeps the generic message.

## P. Lifecycle/data safety - PASS
Migrations, `lib/actions/*` and `lib/utils/whatsapp.ts` unchanged by this merge (diff vs 2R.7 head empty). No database access at all in this phase (no read, no write); schema state is as verified in 2R.7.

## Q. Lint / typecheck / build / audit - PASS
`npm ci`; `npm run lint` 0; `npx next typegen` + `npx tsc --noEmit` 0; `npm run build` PASS (29/29), run twice (before and after reverting the detail grid change). `npm audit --omit=dev`: 0 vulnerabilities. `npm audit`: 1 high, transitive dev-tooling `brace-expansion` (unchanged, not fixed). `.env.local` copied for the build, gitignored, not committed.

## R. Final diff vs main
- origin/main `1ab0e5e4a6383630f92c3ddc9d4cbdd99e192bd1`; reconciliation HEAD (merge commit) `bab50691087c0e355219d9e2796d599553c59b17` (this report's commit follows it).
- merge-base `1ab0e5e` (main fully contained); **commits ahead 20 (before report commit), behind 0**; 99 files changed vs main.

## S. Final merge simulation - CLEAN
After a fresh `git fetch` (main unchanged), `git merge-tree --write-tree origin/main <branch>` exits 0 with no conflicts, and the resulting tree equals the branch tree, so merging is a fast-forward-equivalent.

## T. Release blockers
None. Non-blockers carried over: dev-only `brace-expansion` advisory, dormant backend, minor English strings, lightbox focus, alt numbering (see 2R.7 debt register, unchanged).

## U. Merge authorization recommendation
**READY FOR MERGE AUTHORIZATION.** Recommended: merge `integration/phase-2r7a-main-reconciliation` into main as a fast-forward (or `--no-ff` if a merge commit is preferred). If `origin/main` moves before authorization, re-run the final merge simulation. Deployment and a first genuine owner status/price change in production remain the live end-to-end proof for the quick actions.
