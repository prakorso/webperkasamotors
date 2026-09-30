# Phase 2C.4 — Trust copy, CMS freshness, vocabulary

**Status: MERGE READY (pending QA/Review agent inspection and owner decision).**

## Orchestration

- **Original collision:** the first Phase 2C.4 worktree
  (`.claude/worktrees/phase-2c4-trust-cms-freshness`) was created from `main`
  (`410974a`) instead of the approved Phase 2C base, and is locked by a live
  Claude session (PID 30028).
- **Old worktree:** OWNER Claude session PID 30028, STATUS ACTIVE / LOCKED,
  ACTION QUARANTINED FROM THIS TASK. Not touched, removed, pruned or renamed.
- **New worktree:** `.claude/worktrees/phase-2c4-v2`
- **Base SHA:** `cb24841` (`redesign/phase-2c2-vehicle-content-ux`)
- **Task branch:** `redesign/phase-2c4-trust-cms-freshness-v2`
- **Write owner:** Implementation Agent — Phase 2C.4 V2 (released on handoff)
- **Coordination state:** local, git-excluded `.claude/coordination/phase-2c4.md`
- **Main checkout:** untouched (no checkout/switch/reset/clean/stash/add/commit).
  A concurrent process was observed operating there (Codex, `next dev` on :3100,
  later a `next build`); it was not interfered with.
- **Ruflo:** not installed; plain filesystem coordination used. Permanent
  governance docs are recommended as a separate task
  (`chore/agent-orchestration-governance`), not mixed in here.

## Implementation

Files changed (3, one line each):

| File | Change |
|---|---|
| `app/(public)/cars/page.tsx` | Description → "Pilihan mobil yang tersedia di Perkasa Motors." |
| `app/(public)/motorcycles/page.tsx` | Description → "Pilihan motor yang tersedia di Perkasa Motors." |
| `components/public/vehicle-detail.tsx` | `Related Vehicles` → `Unit Lainnya` |

- **Trust copy:** the unsupported "kurasi dan inspeksi internal" claim is removed
  from `/cars` and `/motorcycles`. The replacement is purely factual and adds no
  quality/inspection/certification claim ("bekas" was deliberately not used — it
  appears nowhere else on the site, so it would be a new claim).
- **CMS freshness root cause:** **no code defect.** The homepage is statically
  prerendered (`○ /`, `s-maxage=31536000`), and every CMS Server Action already
  calls `revalidatePath("/", "layout")` (about, hero, why-perkasa, footer,
  navigation, vehicles, media, testimonials, articles). The Phase 2C.3 "stale
  About" finding came from the database being edited outside the admin UI, which
  bypasses revalidation. **No revalidation code was added**, since the existing
  architecture already works (see proof below).
- **Language consistency:** the detail-page section heading is now Indonesian.
  No data logic changed.

## Verification

### CMS freshness — PASS (empirical)
Real path, not a database edit: admin UI → `updateAboutSection` Server Action →
`revalidatePath("/", "layout")` → public homepage. Production build served with
`next start` on :3210 from this worktree; no rebuild between steps.

1. Baseline: `/` served cached prerender (`x-nextjs-cache: HIT`), eyebrow
   `About Perkasa Motors`, marker count 0.
2. Original captured: `about_eyebrow = "About Perkasa Motors"` (section active,
   headline/description/CTA untouched).
3. Changed only the eyebrow to `QA-FRESHNESS-2C4` in the admin About form and
   saved ("Saved." shown).
4. Homepage immediately served the marker (count 2, original 0), same server,
   no rebuild.
5. Restored the exact original via the same admin form ("Saved.").
6. Verified restoration: homepage marker 0 / original present; admin form after
   a reload reads `About Perkasa Motors`, active = true, CTA `About Me|/about`,
   headline unchanged; `/cars` contains no marker.

Side effect: the `website_settings` row's `updated_at`/`updated_by` changed
(inherent to any save). No QA text or temporary state remains.

Caveat: verified on a local Node production server. Netlify's runtime handling of
`revalidatePath` was not tested here (Netlify was not to be altered).

### Static checks
| Check | Result |
|---|---|
| `npx tsc --noEmit` | PASS (exit 0)* |
| `npm run lint` | PASS (exit 0) |
| `npm run build` | PASS (exit 0) |

\* A fresh worktree lacks the gitignored `next-env.d.ts` route types; `npx next
typegen` generates them (first tsc run failed on `PageProps`/`LayoutProps` until then).

### Browser QA (Edge via CDP, headless, temp profile)
`/`, `/cars`, `/motorcycles`, `/cars/hyundai-grand-avega-hatchback-2012` at 390
and 1440 — all 8 combinations:

- horizontal overflow: 0 · broken images: 0 · console errors: 0 · JS exceptions: 0
- "kurasi/inspeksi" absent from `/cars`, `/motorcycles`, detail
- "Related Vehicles" absent everywhere; "Unit Lainnya" present on detail
- replacement catalogue copy renders correctly at both widths

### Findings outside scope (not changed)
- **Homepage still contains an inspection claim:** `components/public/why-perkasa-section.tsx:37`
  fallback benefit text "Setiap unit melewati inspeksi menyeluruh untuk memastikan
  performa dan kondisi sempurna." (also a "Kualitas Terjamin" title). Same kind of
  unsupported claim; the approved scope covered the catalogue only. Recommend a
  follow-up decision by the owner.

## Git
- Starting HEAD: `cb24841`
- Commit / push: see final terminal summary (recorded after push)
- Working tree after commit: clean
- Stashes touched: **NO** (4 existing stashes left as found)
- Shared main checkout touched: **NO**
- Old worktree touched: **NO**
- Merged anything: **NO**

## Final decision
**MERGE READY**, subject to QA/Review inspection and owner approval. Scope: 3
one-line copy changes; freshness needed no code change.
