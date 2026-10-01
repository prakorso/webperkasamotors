# Perkasa Motors - Phase 2R.1: Integrated Baseline Build

Result: **PASS**. Task state ACTIVE -> REVIEW. No application behavior changed. Not merged, not deployed.

## A. Integration branch
- Branch: `integration/phase-2r1-integrated-baseline`
- Worktree: `C:\Users\USER\webperkasamotors\.claude\worktrees\phase-2r1-integrated-baseline`
- Write owner: Claude Product/Technical

## B. Base SHA verification
`git rev-parse HEAD` at creation = `0d91bf707593161df8bc4cc0ade0d369dd74d1b0` (matches). Governance files and the Phase 1R report (MD + TXT) were all present and read.

## C. Main cleanup diff
`git diff 76c206e..bc8eaa1` = exactly 2 files, one commit (`bc8eaa1`): `.gitignore` (+`.netlify`, +`.claude/worktrees/`) and `eslint.config.mjs` (+ignore `.claude/worktrees/**`). Pure repo hygiene.
A trial `git merge-tree 0d91bf7 bc8eaa1` was clean and produced only those two file changes, so a full merge of `bc8eaa1` was accepted.

## D. Files applied
Merge commit `9e2be9b58ef7cb817f0320b627fc79c2f91d76d7` (`git merge --no-ff bc8eaa1`, no conflicts). Diff vs `0d91bf7`: `.gitignore` (+6), `eslint.config.mjs` (+2). 76c206e enters history through the merge; its only own change (package bump) is identical to what 0d91bf7 already has, so the package files did not change. 0d91bf7's `/evidence/` ignore is retained.

## E. Protected behavior verification (static, on this branch)
| Behavior | Evidence | Result |
|---|---|---|
| AVAILABLE specific CTA | `vehicle-detail.tsx`, `vehicle-card.tsx` "Saya Tertarik..." via `vehicleWhatsAppUrl` | PASS |
| SOLD/RESERVED generic "Tanya Unit Lain" | `genericVehicleWhatsAppUrl`, label present in card and detail | PASS |
| SOLD browsable | catalogue tier query unchanged (file identical to 0d91bf7) | PASS |
| Description removed | no `vehicle.description` render in public components | PASS |
| Alt fallback | `vehicleMediaAlt` in format.ts, card, detail | PASS |
| SEO, canonical, primary-photo OG | `alternates`/`images: ogImage` in cars and motorcycles [slug] pages | PASS |
| Highlights list + disclosure | `HIGHLIGHTS_VISIBLE_COUNT = 5`, details block | PASS |
| Trust copy / "Unit Lainnya" | present; "Related Vehicles" and "kurasi" absent from public UI | PASS |
| CMS revalidation | `revalidatePath("/", "layout")` in all CMS actions (about uses `"/about"`, as before) | PASS |
| Dead search / social section / Customer Stories CTA | not referenced in header or homepage; no "customer stories" string | PASS |
| Responsive/hero fixes | shared-ancestor files untouched (diff vs 0d91bf7 empty outside tooling) | PASS |
Behavioral confirmation of the above rests on the file-identical proof in L; no browser QA was run this phase.

## F. Dependency baseline
next 16.3.7; eslint-config-next 16.3.7; sharp 0.35.5; js-yaml 4.3.2 (`npm ls`). Package files byte-identical to 0d91bf7.

## G. npm ci
PASS (exit 0). Note: warning that `unrs-resolver` postinstall is not covered by allowScripts (pre-existing).

## H. Lint
`npm run lint` PASS (exit 0).

## I. Typecheck
`npx tsc --noEmit`: first run failed (`PageProps`/`LayoutProps` not found) because the fresh worktree lacks gitignored generated route types (same as noted in the 2C.4 report). After `npx next typegen`: PASS (exit 0).

## J. Build
First attempt failed: fresh worktree had no `.env.local` ("Supabase is not configured"). Copied the gitignored `.env.local` from the shared checkout (not committed; confirmed ignored by `.gitignore:34`). The build only reads. `npm run build` then PASS (exit 0, 28/28 pages). Route table unchanged in shape: homepage static, catalogue/detail/admin dynamic.

## K. npm audit
`npm audit`: **1 high** vulnerability, 0 others. Package `brace-expansion` (<=1.1.20 and 4.0.0-5.0.11) - advisories GHSA-q2hr-2g5m-vwhr, GHSA-qhr7-859c-m2p7, GHSA-6j4f-fj2g-mc7p (CPU/stack DoS on crafted brace patterns). Installed 1.1.18 (via eslint > minimatch) and 5.0.9 (via eslint-config-next > typescript-eslint > minimatch). Transitive dev tooling only: `npm audit --omit=dev` = **0 vulnerabilities**. `npm audit fix` is offered but was NOT run (no dependency changes this phase). The lockfile is identical to origin/main, so main has the same finding; the earlier "audit clean" state is no longer true for the full tree, almost certainly due to newly published advisories. Recommend a dedicated dependency task.

## L. Application-diff safety
`git diff --name-only 0d91bf7 HEAD` = `.gitignore`, `eslint.config.mjs` only. `git diff --quiet 0d91bf7 HEAD -- app components lib supabase public package.json package-lock.json` = identical. Application code changed: NO.

## M. R3B record update
Current checkpoint of record: `feat/ui-r3b-vehicle-detail` @ `c0b1bae81f24842f5982706b86d3d695f1f6417c`. Previous: `cc90d4f`. Chain `15e525f -> cc90d4f -> c0b1bae`; do not double-count. Registered in `.ruflo/coordination/tasks/PHASE-2R1.json`. Note: the shared `baselines.json` lives on the infra branch and was deliberately not edited from here; it still lists cc90d4f and should be updated there.

## N. SOLD CTA owner decision (registered, not implemented)
SOLD archive card: KEEP generic WhatsApp CTA, label "Tanya Unit Lain", generic inquiry, secondary/subtle visual priority. Resolves the Phase 1R ruling request; the Windows `soldPresentation` behavior of suppressing the CTA must therefore be changed in 2R.2.

## O. Next phase readiness
READY FOR PHASE 2R.2 (catalogue reconciliation). Open items to carry: audit finding (K); update baselines.json on the infra branch; Windows catalogue needs "Terjual" wording, motorcycles parity, sold cap, empty-state copy. Phase 2R.2 not started.
