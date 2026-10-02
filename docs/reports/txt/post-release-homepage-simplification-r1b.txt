# Perkasa Motors - Post-Release Simplification R1B: Main Reconciliation

**Result: PASS.** Current `origin/main` (`dfce117`, the Owner's "detail conversion layer") was merged into the R1/R1A lineage by a controlled semantic merge. One conflict, in `components/public/vehicle-detail.tsx`, is resolved: main's new layout and mobile conversion behavior are kept, and the two no-WhatsApp fallback links to the retired `/contact` route now point to `/#kontak`. Everything else is exactly R1A. No database, CMS or schema write; nothing merged to main; nothing deployed.

## A. Base verification
- `git fetch origin --prune`: `origin/main` = `dfce11780598dbea1fc49682ad11f94cc277065a` (unchanged at start, at validation and at the final fetch).
- R1A head = `22b2decf352009392434a68d8a9dce8920c2bdfd`; merge-base with main = `21bf929865a4f2c9ffd503694a7ff61a40871792` (the commit R1 was branched from).
- New branch `feature/post-release-homepage-simplification-r1b` in worktree `.claude/worktrees/post-release-homepage-simplification-r1b`, created from the exact pushed R1A head. Strategy: `git merge --no-commit --no-ff origin/main`, resolved by hand, then committed (merge commit `f71fccd`, parents `22b2dec` and `dfce117`). No rebase, squash, force or wholesale ours/theirs.

## B. Main divergence
Main is 1 commit ahead of the base (`dfce117`), touching 2 files (`vehicle-detail.tsx`, new `mobile-vehicle-cta.tsx`; +164/-35). The branch is 3 R1/R1A commits ahead of the base (40 files vs main, expected: the whole R1 change set).

## C. Main commit review
| Commit | Content | Classification |
|---|---|---|
| `dfce117` feat(vehicle): add detail conversion layer | (1) AVAILABLE detail gets an in-page decision area under the price (`aside`, "Tanya via WhatsApp", vehicle-specific link); (2) new `MobileVehicleCta` sticky bar (price + CTA) on mobile only; (3) the old shared bottom CTA block is split: AVAILABLE no longer has it, SOLD/RESERVED keep "Tanya Unit Lain"; (4) spacer + `relative` wrapper | **ADOPT** (Owner's newer approved behavior; does not touch any 2R/R1 contract). |
Only one main commit exists after the R1 base, so nothing else needed review.

## D. Conflict inventory
One conflicted file: `components/public/vehicle-detail.tsx` (1 hunk: the bottom CTA block). Git auto-merged the rest of the file and added `mobile-vehicle-cta.tsx`. This matches the expected conflict. No other conflicts.

## E. vehicle-detail reconciliation
- Resolution: main's side of the conflicting hunk (the `!isAvailable` "Tanya Unit Lain" block); the R1 side (the old shared CTA block) is dropped because main moved AVAILABLE's CTA into the decision area.
- **Correction to the R1A report:** R1A said main's new version "no longer has" the `/contact` fallback link. That was wrong: main's file still contains it in **two** places (the decision-area fallback and the SOLD/RESERVED block). Following the Owner's instruction, both now use `/#kontak`. These fallbacks only render when no usable WhatsApp number is configured. `grep` confirms no `href="/contact"`, `/about` or `/financing` remain anywhere in `app`, `components` or `lib`.
- Final file vs `origin/main`: exactly 2 changed lines (the two hrefs). The old vehicle-detail implementation was not restored. `mobile-vehicle-cta.tsx` is byte-identical to main.
- Contract check on the merged page (live data): no description or old headings ("About", "Technical Specifications", "Condition & Features", "Related Vehicles" all absent); status Tersedia/Terjual; Indonesian spec labels; highlights 5 + "Lihat N sorotan lainnya"; "Unit Lainnya" shown on SOLD pages with AVAILABLE units and correctly hidden on AVAILABLE pages (live has no other AVAILABLE unit of the same type); gallery unchanged; no unsupported claims.
- Intentional behavior change coming from main (flagging for the record): the AVAILABLE detail button label is now "Tanya via WhatsApp" (previously "Saya Tertarik dengan Unit Ini"). The message remains vehicle-specific. SOLD/RESERVED remain "Tanya Unit Lain" with the generic message. Catalogue/home cards still say "Saya Tertarik".

## F. Homepage contract - preserved
Order: Hero > Unit Tersedia > Tentang Perkasa Motors (title from the database: "Kendaraan yang Tepat, Proses yang Lebih Sederhana") > Cara Pembelian (outline timeline, 4 locked steps) > Mekanisme Pembayaran (Cash Keras, Cash Tempo with the locked wording, Cicilan / Kredit) > Testimoni hidden (0 live) > Unit Terjual > footer; no standalone final CTA block. AVAILABLE max 6 (2 live), SOLD max 4 (4 shown), "Lihat Semua Mobil/Motor" present, no archive link.

## G. Public nav - preserved
Header on every checked page: Beli Mobil, Beli Motor, Chat WhatsApp (Artikel hidden, 0 published). Footer: Beli Mobil, Beli Motor, WhatsApp, address, Instagram/TikTok/LinkedIn, single copyright. No Tentang Kami, Pembiayaan or Hubungi Kami.

## H. Retired routes - preserved
`/about` -> `/#tentang`, `/financing` -> `/#pembayaran`, `/contact` -> `/#kontak`: HTTP 308, single hop, final 200, query preserved (`/financing?utm=x` -> `/?utm=x#pembayaran`).

## I. CMS contract - preserved
No admin file changed by this merge (0 admin paths in the diff against R1A), so no admin re-QA was needed. Signed-out `/admin` and `/admin/dashboard` redirect to `/admin/login` (307). The R1A CMS state (tabs Beranda / Kontak & WhatsApp / Lanjutan, editable About, testimonial manager, no Tentang tab, no new top-level menu) is unchanged by code. The About migration remains applied from R1A and was not reapplied.

## J. Detail conversion QA - PASS
AVAILABLE car, AVAILABLE motorcycle, SOLD car, SOLD motorcycle, at 1440, 768 and 390/360 (production build, headless Edge; scroll sweep with settle time and real geometry checks):
- **Mobile (390, 360), AVAILABLE:** the in-page decision area ("Tanyakan ketersediaan unit..." + "Tanya via WhatsApp") is the CTA while it is on screen; once it scrolls away the sticky bar (price + "Tanya via WhatsApp") appears and docks above the footer. Never both at once (0 steps with the decision area and the sticky together); never more than one visible "Tanya via WhatsApp" at a time; sticky never overlaps the footer or the related-units cards (spacer reserves room); no horizontal overflow; no console errors; 0 duplicate ids. The sticky's `aria-label` names the unit and its link is vehicle-specific. Note: on these short pages the footer is within the viewport as soon as the decision area leaves, so the bar goes straight to its docked state; the floating "fixed" state was not observed (it is main's design, untouched).
- **768 and 1440:** the sticky bar is CSS-hidden (`md:hidden`); the in-page decision area is the only CTA; no overflow.
- **SOLD (both types):** no decision area, no sticky bar; single "Tanya Unit Lain" with the generic message; related cards show "Saya Tertarik" (their own unit-specific links).
- WhatsApp: AVAILABLE decision area and sticky both build the vehicle-specific message (e.g. "...saya tertarik dengan HYUNDAI GRAND AVEGA HATCHBACK 2012 (Mobil)..."); SOLD generic. Visual checks of the decision-area and docked states at 390 look correct.
- The `/#kontak` fallback links are code-verified (they render only without a WhatsApp number, so they were not forced in the browser).

## K. Public QA - PASS
`/`, `/cars`, `/motorcycles`, `/articles`, AVAILABLE and SOLD detail (car and motorcycle) at 2560, 1440, 390: 24/24 clean (no horizontal overflow, 0 duplicate ids, 0 missing alt, 0 broken images, 0 unnamed controls, 0 nested anchors, 0 console errors). Redirects and admin gate verified (H, I).

## L. Claim audit - PASS
Rendered text of all checked pages: 0 occurrences of berkualitas, terjamin, terverifikasi, terinspeksi, kurasi, inspeksi, premium, warranty, garansi, guaranteed, kemewahan, "Sold Out".

## M. WhatsApp contract - PASS
All links go to 6285111307044. Four distinct messages: generic (header, footer, hero, SOLD cards/detail), two unit-specific (AVAILABLE cards and detail), payment-specific inquiry. SOLD/RESERVED generic by code.

## N. Data safety
No database write, no CMS write, no migration, no schema change. No Supabase access at all in this task.

## O. Technical validation - PASS
`npm ci`; `npm run lint` 0; `npx next typegen` + `npx tsc --noEmit` 0; `npm run build` PASS (clean `.next`); `npm audit --omit=dev`: 0 vulnerabilities; `npm audit`: 1 high (existing dev-tooling `brace-expansion`, unchanged, not fixed).

## P. Final diff vs main
`origin/main` `dfce117`; branch HEAD is the merge commit `f71fccd` plus this report's commit; merge-base with main is now `dfce117` itself (main is an ancestor). 0 commits behind. The branch differs from main by the full R1/R1A change set (40 files) and, in the two files main changed, only by the two `/#kontak` hrefs.

## Q. Final merge simulation
Recorded in the final output after the last fetch (non-destructive `git merge-tree --write-tree origin/main <branch>`); expected and verified CLEAN because main is already an ancestor of this branch.

## R. Merge readiness
Release blockers: none. The product, QA and data are ready; the live database already matches the code (About migration and content applied in R1A). Recommended: merge `feature/post-release-homepage-simplification-r1b` into main (fast-forward) after Owner authorization, then a deployment verification. Remaining owner content (non-blocking): real testimonials.
