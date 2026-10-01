# Perkasa Motors - Phase 1R: Baseline Reconciliation Audit

Task: PHASE-1R (RECONCILIATION, read-only). Mode: no application, Supabase, CMS-data or Netlify change.
Audit branch: `audit/phase-1r-baseline-reconciliation`
Audit base: `chore/ruflo-orchestration-foundation` @ `11864c96f3a5664bdba2c5582187ab855ca6ae98` (governance + audit base only, not an application baseline)
Worktree: `.claude/worktrees/phase-1r-baseline-reconciliation`
Date: 2026-10-01

---------------------------------------------------------------------
0. EXECUTIVE SUMMARY
---------------------------------------------------------------------

1. All input SHAs verified. One discrepancy: the R3B branch HEAD is `c0b1bae`, one commit
   past the specified `cc90d4f` (see 1.2). Analysis is done on `cc90d4f` as instructed; the extra
   commit is analysed separately.
2. **Decisive finding:** `76c206e` differs from its parent `d079e46` ONLY in `package.json` and
   `package-lock.json` (security bump). Its UI code is byte-identical to `d079e46`. `0d91bf7`
   = `d079e46` + Phase 2C (7 app/lib/component files). Therefore `76c206e..0d91bf7` is
   exactly the Phase 2C change set, and **`0d91bf7` already contains 100% of the approved UI
   code**. Basing the integration on `0d91bf7` loses no approved UI.
3. Package state (Next 16.3.7, eslint-config-next 16.3.7, sharp 0.35.5, js-yaml 4.3.2, lockfile
   hash) is identical on every input branch. No dependency reconciliation needed.
4. Windows `15e525f` (catalogue sold archive) merges cleanly with `0d91bf7` (git merge-tree, no
   conflicts) and the clean merge keeps the 2C alt fallback and trust copy. It is a
   RECONCILIATION_REQUIRED rather than a free merge because of product and behavior issues (4.3).
5. R3B `cc90d4f`/`c0b1bae` was built on the stale `bc8eaa1` detail page, not on Phase 2C. It
   textually conflicts with `0d91bf7` in exactly one file, `vehicle-detail.tsx`, and **semantically
   reverts five protected Phase 2C behaviors in that file** (HIGH_RISK_CONFLICT, 4.1). Its visual
   direction (editorial hierarchy, portrait gallery) is the part worth keeping.
6. `0d91bf7` lacks the `bc8eaa1` tooling cleanup (`.gitignore` and `eslint.config.mjs` ignore
   rules for `.claude/worktrees`). It merges cleanly; it must be included in the integration base.
7. Several unsupported claims survive even on `0d91bf7` (Hero fallback, Why Perkasa default,
   route meta descriptions, site-settings default). They are PRODUCT_SPEC_SUPERSEDES_EXISTING items.
8. Recommended integration base: `0d91bf7` (+ `bc8eaa1` tooling), verified (section 19).

---------------------------------------------------------------------
1. INPUT VERIFICATION
---------------------------------------------------------------------

| Input | Role | Expected SHA | Actual (rev-parse) | Result |
|---|---|---|---|---|
| A origin/main | control | bc8eaa187cd44f4e673117ae20150b8b62fdb245 | same | PASS |
| B UI `redesign/phase-2b-sold-vehicle-experience` | UI | 76c206ea906e2351cce70ff1dbd6642f20ff1f79 | same | PASS |
| C Tech `redesign/phase-2c4-trust-cms-freshness-v2` | technical | 0d91bf707593161df8bc4cc0ade0d369dd74d1b0 | same | PASS |
| D `preserve/windows-uiux-15e525f` | Windows UI/UX | 15e525fc43c16c91f2a3f58be0aa8a1801414005 | same | PASS |
| E `feat/ui-r3b-vehicle-detail` | R3B | cc90d4fb7dd822bea421c1fbb8b2ee4a0b6c6500 | branch HEAD `c0b1bae81f24842f5982706b86d3d695f1f6417c`; `cc90d4f` is its parent | PASS with DISCREPANCY |
| F Product spec | product | sha256 in baselines.json | file present in audit base | PASS (not re-hashed) |
| infra | audit base | 11864c96f3a5664bdba2c5582187ab855ca6ae98 | same | PASS |

### 1.1 Lineage (merge-base / ancestry verified)
```
d079e46 (common ancestor of UI and Technical baselines)
 |-- 76c206e  UI baseline          (= d079e46 + package bump only)
 |    `-- bc8eaa1  origin/main     (= 76c206e + .gitignore/eslint tooling cleanup)
 |         `-- 15e525f  Windows UI/UX
 |              `-- cc90d4f  R3B
 |                   `-- c0b1bae  R3B branch HEAD (+1 commit)
 `-- e4fe1eb..0d91bf7  Phase 2C (technical baseline; neither contains 76c206e)
```
- merge-base(76c206e, 0d91bf7) = d079e46. merge-base(0d91bf7, cc90d4f) = d079e46. merge-base(76c206e, cc90d4f) = 76c206e.
- `bc8eaa1 -> 15e525f -> cc90d4f -> c0b1bae` verified with `merge-base --is-ancestor`.
- **R3B lineage handling: PASS.** 15e525f was analysed once (bc8eaa1..15e525f). R3B own work is only 15e525f..cc90d4f.
  Neither R3B nor Windows contains any Phase 2C commit.

### 1.2 Discrepancy: R3B HEAD is c0b1bae, not cc90d4f
`c0b1bae fix: restrict related vehicles to available` adds `.eq("status","AVAILABLE")` to
`getRelatedVehicles` in `lib/data/vehicles.ts` (1 line). It touches `lib/`, outside the two
components registered in baselines.json. It is aligned with the Product Spec (A3 "Related: show only
AVAILABLE units") and does not remove SOLD browsing (catalogue/detail pages unaffected). Treated here as
R3B_ONLY / PRODUCT_SPEC-aligned behavior to ADOPT. Owner should confirm which SHA is the
R3B checkpoint of record; baselines.json should be updated to `c0b1bae` or the extra commit declared out of scope.

---------------------------------------------------------------------
2. GIT ANALYSIS RESULTS (read-only)
---------------------------------------------------------------------

| Range | Files (non-docs) | Summary |
|---|---|---|
| A. bc8eaa1..76c206e | `.gitignore`, `eslint.config.mjs` | Only REMOVES the tooling lines bc8eaa1 added. Artifact of direction; bc8eaa1 is the child. |
| B. 76c206e..0d91bf7 | cars/[slug]/page, motorcycles/[slug]/page, cars/page, motorcycles/page, vehicle-card, vehicle-detail, lib/utils/format.ts, `.gitignore` (+/evidence/) | = Phase 2C exactly. +3 docs reports. |
| C. bc8eaa1..15e525f | cars/page, vehicle-card, vehicle-catalogue | +133/-9. Sold archive split on /cars only. |
| D. 15e525f..cc90d4f | vehicle-detail, vehicle-gallery | +168/-82. R3B only. |
| E. 76c206e..cc90d4f | 7 files (above + tooling) | No app file other than the 5 UI components changed. |
| F. 0d91bf7..cc90d4f | 14 files | Shows 2C files "changed back" - this is the regression footprint if cc90d4f were used as base. |
| bonus cc90d4f..c0b1bae | lib/data/vehicles.ts | +1 line. |

Trial merges (git merge-tree, no refs touched), target 0d91bf7:
- + 15e525f: CLEAN. Result keeps `vehicleMediaAlt`, 2C catalogue descriptions, `separateSoldInventory`.
- + cc90d4f / c0b1bae: ONE conflict, `components/public/vehicle-detail.tsx`. Auto-merges elsewhere.
- + 76c206e, + bc8eaa1: CLEAN.

Application files changed by any input vs 0d91bf7 (union): 14, listed in the matrix below. No admin, Supabase,
homepage, header, footer, financing, about, contact or articles file was changed by ANY input branch.
Those areas are therefore PRODUCT_SPEC deltas only (sections 11 to 17).

---------------------------------------------------------------------
3. RECONCILIATION RULE APPLIED
---------------------------------------------------------------------
Visual -> approved UI intent. Behavior -> `0d91bf7`. Product existence/flow -> Product spec.
Mixed file -> semantic reconciliation. Not "latest wins", not "largest diff wins".

---------------------------------------------------------------------
4. FILE-BY-FILE RECONCILIATION MATRIX
---------------------------------------------------------------------

Legend: UI=76c206e, TECH=0d91bf7, WIN=15e525f (vs bc8eaa1), R3B=cc90d4f (vs 15e525f) [+c0b1bae].

### 4.1 components/public/vehicle-detail.tsx - MIXED, decomposed

Overall classification: **HIGH_RISK_CONFLICT** (R3B vs TECH). Only concern-level rows below are actionable.

| # | Concern | UI | TECH | WIN | R3B | PRODUCT SPEC | Class | FINAL INTENT | Risk |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Vehicle description paragraph | rendered raw `vehicle.description` | REMOVED (2C.2) | - | RE-ADDED as "About" section; additionally SYNTHESISES a description from the longest highlight (>=72 chars) when CMS description is empty | description = OWNER DECISION (short "Catatan" or drop) | HIGH_RISK_CONFLICT | Keep removed. R3B "About" must not return. If owner wants "Catatan", that is a separate PRODUCT task | HIGH |
| 2 | Highlights presentation | flat chips | list of 5 + `<details>` "Lihat N sorotan lainnya" | - | full unbounded 2-col checklist (15-27 real items) with `key={highlight}` | "max 3-5 short facts" | HIGH_RISK_CONFLICT / RECONCILIATION_REQUIRED | Keep 2C disclosure behavior (cap 5 + disclosure). R3B check-icon/2-col styling may be adapted onto it. Key by index (dup-key risk in R3B) | HIGH |
| 3 | Highlight text normalisation (`cleanHighlight`, strips "Spek:", "dll") | - | none, "nothing rewritten" | - | NEW | Highlights are the main place for inconsistent claims | RECONCILIATION_REQUIRED | Optional presentation sanitiser; needs Owner OK because it edits seller text. Defer | MEDIUM |
| 4 | Image alt fallback (`vehicleMediaAlt`, `mediaWithAlt`) | none | resolved once, feeds gallery + lightbox | - | LOST: passes raw `media`, gallery uses `active.altText` | auto alt fallback = KEEP | HIGH_RISK_CONFLICT | TECH wins. Every upload has `alt_text=""` so R3B ships empty alt on all photos | HIGH |
| 5 | Related heading | "Related Vehicles" | "Unit Lainnya" | - | reverts to "Related Vehicles" | Indonesian; AVAILABLE-only | HIGH_RISK_CONFLICT | TECH wins ("Unit Lainnya") | MEDIUM |
| 6 | CTA placement | inside info card | inside info card, same viewport as highlights | - | moved BELOW the full-width Technical Specifications section (far below fold on long pages) | WhatsApp = primary conversion; sticky mobile = later polish | RECONCILIATION_REQUIRED | Visual layout from R3B is fine; CTA must stay with identity/price block (above fold). CTA logic (AVAILABLE specific / non-AVAILABLE generic, labels, aria) is TECH, unchanged by R3B | HIGH |
| 7 | WhatsApp CTA logic | AVAILABLE specific, else generic | same | - | logic unchanged (copied) | - | OVERLAP_SAFE | Preserve | LOW |
| 8 | Visual hierarchy: stock number demoted to small label beside badge; title; meta line "year . transmission . km"; larger price; editorial two-column | card layout | card layout | - | NEW | stock number should be small (A3) | R3B_ONLY (aligned with spec) | ADOPT visual hierarchy | LOW |
| 9 | Spec rows as full-width "Technical Specifications" 4-col grid | in card | in card | - | moved | hide empty rows instead of "-" | R3B_ONLY + PRODUCT_SPEC_SUPERSEDES_EXISTING | ADOPT layout; hide empty rows (R3B still prints "-" for color, CC, plate) | LOW |
| 10 | Section headings language | Indonesian ("Sorotan") | Indonesian ("Sorotan", "Unit Lainnya") | - | English: "About", "Condition & Features", "Technical Specifications" | nothing English left by accident | RECONCILIATION_REQUIRED | Indonesian vocabulary; copy needs product sign-off | MEDIUM |
| 11 | Transmission display | enum | enum | - | maps AUTOMATIC only; MANUAL/CVT print raw | - | RECONCILIATION_REQUIRED | normalise via shared label helper | LOW |
| 12 | Sold detail behavior | status badge + generic CTA | same | - | same | SOLD browsable | OVERLAP_SAFE | Preserve | LOW |
| 13 | Highlights/CTA ordering vs SEO | - | n/a (SEO in page files) | - | no effect | - | OVERLAP_SAFE | - | LOW |

Textual merge: single conflict in this file. Resolution must be re-authored concern by concern (rows 1-6, 10), not by picking a side.

### 4.2 components/public/vehicle-gallery.tsx - R3B_ONLY
| Concern | UI/TECH | WIN | R3B | Class | Final intent | Risk |
|---|---|---|---|---|---|---|
| Primary frame | 4:3 mobile, 16:9 lg, `object-cover` | - | 4:5 portrait, `object-contain`, rounded-24 | R3B_ONLY | ADOPT (real photography is mostly portrait 4:5; cover crops cars). Needs viewport QA 320-1440 | MEDIUM |
| Thumbnails | 3 across 4:3/16:9 | - | 4 across 4:3 | R3B_ONLY | ADOPT after QA | LOW |
| Alt text | uses `item.altText` (receives fallback from detail) | - | unchanged code | OVERLAP_SAFE | Works only if detail keeps passing `mediaWithAlt` (see 4.1 #4) | HIGH if detail regressed |
| Lightbox | `vehicle-lightbox.tsx` untouched by all branches | - | - | OVERLAP_SAFE | Preserve | LOW |
| `object-contain` on a `bg-surface-muted` frame | - | - | letterboxing on landscape photos | RECONCILIATION_REQUIRED | check landscape/odd-ratio uploads | LOW |

### 4.3 components/public/vehicle-card.tsx - MIXED
| Concern | UI | TECH | WIN | R3B | Spec | Class | Final intent | Risk |
|---|---|---|---|---|---|---|---|---|
| Alt fallback `vehicleMediaAlt(vehicle, primaryMedia)` | raw altText | added | untouched line (clean merge keeps TECH) | - | KEEP | TECHNICAL_ONLY | Preserve | LOW (verified in trial merge) |
| `soldPresentation` visual (desaturated image, muted price, border) | - | - | NEW | - | KEEP card variant ("data and card variant already exist") | WINDOWS_UIUX_ONLY | ADOPT | LOW |
| Overlay text "Sold Out" | status badge | status badge | English overlay | - | use "Terjual" ("sold out" implies restock) | PRODUCT_SPEC_SUPERSEDES_EXISTING | ADOPT variant, change wording to "Terjual" | LOW |
| Sold card CTA | generic "ask about other units" CTA on non-AVAILABLE | same | `soldPresentation` sets WhatsApp href null: sold archive cards have NO CTA | spec A10: "never offering a purchase CTA" | RECONCILIATION_REQUIRED | Protected list says SOLD generic inquiry CTA. Detail page keeps it. Needs Owner ruling: card-level generic CTA dropped in archive or kept | MEDIUM |
| RESERVED card behavior | generic | generic | RESERVED stays in active section with normal card, generic CTA | - | RESERVED generic preserved | OVERLAP_SAFE | Preserve | LOW |

### 4.4 components/public/vehicle-catalogue.tsx - WINDOWS_UIUX_ONLY (+product)
| Concern | UI | TECH | WIN | Spec | Class | Final intent | Risk |
|---|---|---|---|---|---|---|---|
| Available / Sold split | single grid | single grid | `separateSoldInventory`: "Unit Tersedia" vs "Sudah Terjual" archive | Keep Cars/Motorcycles separate; same sold split on BOTH; cap archive (6-9) | WINDOWS_UIUX_ONLY -> PRODUCT_SPEC aligned | ADOPT (PRESERVE+ADAPT) | MEDIUM |
| Applied only to /cars | - | - | motorcycles page not wired | split on both | RECONCILIATION_REQUIRED | wire /motorcycles | LOW |
| RESERVED inside section titled "Unit Tersedia" | - | - | RESERVED + AVAILABLE share it | wording tension | RECONCILIATION_REQUIRED | heading/label decision (e.g. "Tersedia & Dipesan") | LOW |
| Pagination with client-side split | tiers AVAILABLE>RESERVED>SOLD ordered in DB | same | filter applied per page: page 2+ can show "Belum ada unit yang tersedia" above a sold-only page; archive repeats per page | no cap on archive | RECONCILIATION_REQUIRED | cap/limit sold archive; revisit pagination for the split | MEDIUM |
| Empty state | English "No vehicles available in this category right now." | same (not fixed in 2C) | unchanged | Indonesian empty states | PRODUCT_SPEC_SUPERSEDES_EXISTING | Indonesian copy | LOW |
| Sold sort | created_at DESC (no sold date) | same | same | sold_at needed for "recent" | PRODUCT_SPEC_ONLY / OS_READINESS | schema Phase D | MEDIUM |

### 4.5 Route files
| File | UI | TECH | WIN | R3B | Class | Final intent | Risk |
|---|---|---|---|---|---|---|---|
| `app/(public)/cars/page.tsx` | "kurasi dan inspeksi internal" | "Pilihan mobil yang tersedia di Perkasa Motors." | adds `separateSoldInventory` | - | MIXED: TECH copy + WIN flag, auto-merge clean | Keep both. Route `metadata.description` still says "curated collection of premium cars" on TECH: unsupported | LOW (merge) / MEDIUM (claim) |
| `app/(public)/motorcycles/page.tsx` | same | TECH copy | not touched | - | TECHNICAL_ONLY | keep; add sold split later; fix "curated ... premium" meta | LOW |
| `app/(public)/cars/[slug]/page.tsx` | "Curated and inspected by Perkasa Motors." in description | derived title/description, canonical, OG primary photo, no inspection claim | untouched | untouched | TECHNICAL_ONLY | Preserve exactly | HIGH if lost |
| `app/(public)/motorcycles/[slug]/page.tsx` | same | same | untouched | untouched | TECHNICAL_ONLY | Preserve exactly | HIGH if lost |
| `lib/utils/format.ts` (`vehicleMediaAlt`) | absent | added | untouched | untouched | TECHNICAL_ONLY | Preserve; R3B detail must call it | HIGH if lost |
| `lib/data/vehicles.ts` | related = any status | same | untouched | c0b1bae: related AVAILABLE only | R3B_ONLY, spec-aligned | ADOPT | LOW |

### 4.6 Tooling / config
| File | State | Class | Final intent |
|---|---|---|---|
| `.gitignore` | TECH adds `/evidence/`; bc8eaa1 adds `.netlify` + `.claude/worktrees/`; Windows/R3B inherit bc8eaa1 but lack `/evidence/` | OVERLAP_SAFE (both needed) | union of both. Trial merge is clean |
| `eslint.config.mjs` | bc8eaa1 ignores `.claude/worktrees/**`; TECH lacks it | OVERLAP_SAFE | include bc8eaa1 cleanup (otherwise lint scans worktrees) |
| `package.json`, `package-lock.json` | identical on all 6 refs | OVERLAP_SAFE | no action |
| `docs/reports/phase-2c2/2c3/2c4-*.md` | only on TECH; deleted in F-range diff as divergence artifact | TECHNICAL_ONLY | keep (QA evidence) |

### 4.7 Unchanged by every input branch (spec-only deltas)
`app/(public)/page.tsx`, `why-perkasa-section.tsx`, `hero.tsx`, `testimonials-section.tsx`,
`financing/page.tsx`, `financing-calculator.tsx`, `about/page.tsx`, `contact/page.tsx`,
`articles/*`, `site-header.tsx`, `site-footer.tsx`, `lib/data/site-settings.ts`, all admin code,
`sitemap.ts`. All classified in sections 11-17 as PRODUCT_SPEC_ONLY or PRODUCT_SPEC_SUPERSEDES_EXISTING.

Matrix summary (concern rows): UI_ONLY 0 (UI baseline code is fully inside TECH); TECHNICAL_ONLY 5;
WINDOWS_UIUX_ONLY 2; R3B_ONLY 4; PRODUCT_SPEC_SUPERSEDES_EXISTING 4; OVERLAP_SAFE 7;
RECONCILIATION_REQUIRED 10; HIGH_RISK_CONFLICT 4 (all in vehicle-detail.tsx); NO_LONGER_RELEVANT 1
(the A-range `.gitignore`/eslint "removal", a direction artifact).

---------------------------------------------------------------------
5. PROTECTED PHASE 2C BEHAVIORS - WHERE THEY LIVE (on 0d91bf7)
---------------------------------------------------------------------

| Protected behavior | Location / mechanism | Threatened by |
|---|---|---|
| AVAILABLE vehicle-specific WhatsApp CTA | `vehicle-detail.tsx` (`isAvailable ? vehicleWhatsAppUrl`), `vehicle-card.tsx`, `lib/utils/whatsapp.ts` | R3B moves it (logic intact) |
| SOLD / RESERVED generic CTA | same + `genericVehicleWhatsAppUrl` | **Windows removes it on sold archive cards** (4.3) |
| SOLD browsable | `getVehiclesByTypePaginated` tiers AVAILABLE>RESERVED>SOLD; detail page serves SOLD | none |
| Description removed | `vehicle-detail.tsx` | **R3B re-adds** (HIGH_RISK) |
| Deterministic alt fallback | `lib/utils/format.ts: vehicleMediaAlt`; detail `mediaWithAlt`; card | **R3B drops** (HIGH_RISK) |
| Generated SEO, canonical, primary-photo OG | `cars/[slug]/page.tsx`, `motorcycles/[slug]/page.tsx` | none (untouched by UI branches) |
| Highlights list + disclosure | `vehicle-detail.tsx` `HIGHLIGHTS_VISIBLE_COUNT=5`, `<details>` | **R3B drops** |
| Catalogue trust-copy cleanup | `cars/page.tsx`, `motorcycles/page.tsx` descriptions | none (merges clean) |
| "Unit Lainnya" | `vehicle-detail.tsx` | **R3B reverts** |
| Homepage CMS revalidation | pre-existing `revalidatePath("/", "layout")` in all CMS actions (no 2C code; 2C.4 proved root cause was edits outside admin) | none. Caveat: Netlify runtime not tested |
| Dead search removal | `site-header.tsx` (from bf04862/d079e46 lineage, shared by all) | none |
| Broken Instagram/public social removal | `homepage-social-section.tsx`, `social-content-strip.tsx` are unreferenced dead components; admin `vehicle-social-content.tsx` still active | none; dormant |
| Dead Customer Stories hero CTA removal | shared ancestor lineage | none |
| Phase 1/1.5 responsive, hero crossfade | shared ancestor (a94d323, 82904d6) | R3B gallery needs responsive QA |
| Next 16.3.7 | identical on all refs | none |
| npm audit clean | not re-run (no installs permitted) | UNVERIFIED in this audit; re-run in 2R.1 |

---------------------------------------------------------------------
6. PRODUCT SPEC OVERRIDES (not implemented here)
---------------------------------------------------------------------

| Item | Class | Present state (TECH) | Spec direction |
|---|---|---|---|
| Homepage simplification | PRODUCT_SPEC_SUPERSEDES_EXISTING | Hero > Featured Stock > About(opt) > Why Perkasa > Testimonials(opt) > Final CTA | Hero > Unit Tersedia > Cara Pembelian > Recent SOLD > Final WhatsApp |
| Why Perkasa removal | PRODUCT_SPEC_SUPERSEDES_EXISTING | `why-perkasa-section.tsx` default includes "Kualitas Terjamin / inspeksi menyeluruh" | remove, replace with How to Buy |
| Cara Pembelian (4 steps) | PRODUCT_SPEC_ONLY | absent | add; owner must confirm steps (OWNER_FACT_REQUIRED) |
| SOLD social proof on homepage | PRODUCT_SPEC_ONLY | absent (data + card variant exist) | latest 3 SOLD, wording "Terjual" |
| Financing simplification | PRODUCT_SPEC_SUPERSEDES_EXISTING | working calculator, default 6.5% rate, "Simulasi Kredit" | guidance + WhatsApp request; no authoritative rates |
| About simplification | PRODUCT_SPEC_SUPERSEDES_EXISTING | CMS sections or footer fallback; homepage About block conditional | four short factual blocks; homepage block deferred |
| Testimonials | DEFER | renders only if rows exist; currently correctly hidden | keep hidden until real |
| Articles | DEFER | `/articles` live with English copy and nav presence | hide until >=3 published |
| Admin/CMS simplification | PRODUCT_SPEC_SUPERSEDES_EXISTING | 7-item sidebar, 5-tab Website | 4 items; Website regrouped |
| Leads out of nav | PRODUCT_SPEC_SUPERSEDES_EXISTING | `ADMIN_NAV_ITEMS` includes Leads | remove from nav, keep backend dormant |
| Settings out of nav | PRODUCT_SPEC_SUPERSEDES_EXISTING | disabled placeholder page | remove from nav |
| Website CMS regrouping | PRODUCT_SPEC_SUPERSEDES_EXISTING | General/Navigation/Footer/Homepage/About tabs | Beranda/Tentang/Kontak&WhatsApp/Lanjutan |
| Task-based inventory admin | PRODUCT_SPEC_ONLY | list + full form | Tersedia/Dipesan/Terjual tabs, quick status/price |
| Future OS readiness | PRODUCT_SPEC_ONLY | none | additive nullable fields (Phase D) |
| Related = AVAILABLE only | PRODUCT_SPEC; delivered by R3B c0b1bae | any status | adopt |
| Hide empty spec rows | PRODUCT_SPEC_SUPERSEDES_EXISTING | prints "-" | hide |
| "Sold Out" -> "Terjual" | PRODUCT_SPEC_SUPERSEDES_EXISTING | Windows adds "Sold Out" | change |
| Inspection/curation claims | PRODUCT_SPEC (owner decision made: REMOVE) | survive in hero fallback, why-perkasa fallback, route meta "curated... premium", site-settings default | remove |
| Vehicle description | PRODUCT_SPEC: owner decision open | removed (2C) | keep removed until decided; never synthesise |
| Pajak / owners / documents facts | OWNER_FACT_REQUIRED | none in schema | highest-value trust addition; owner must state truthfully |

OWNER_FACT_REQUIRED (not invented): opening hours; physical showroom claim (address shown is Cibubur per spec trust audit,
visit policy unknown); document verification process; inspection checklist; active social channels; How-to-Buy step accuracy;
LinkedIn keep/remove.

---------------------------------------------------------------------
7. PUBLIC EXPERIENCE RECONCILIATION
---------------------------------------------------------------------

| Area | Current best source | Preserve | Remove | Later (spec) | Conflict |
|---|---|---|---|---|---|
| Homepage | TECH (= UI code) | hero crossfade fix, CMS-driven fallbacks, CMS revalidation, WhatsApp final CTA | unsupported hero fallback text ("inspected... verified"), Why Perkasa default | restructure per spec; auto featured; mobile "Lihat Semua"; Recent SOLD; How to Buy | LOW among branches (nobody touched it); HIGH product delta |
| Cars catalogue | TECH copy + WIN split | 2C copy, SOLD browsable, tier ordering | English empty state, "Sold Out" overlay | sold cap; sold_at ordering; unify with motorcycles | MEDIUM |
| Motorcycles catalogue | TECH | 2C copy | "curated... premium" meta | same sold split as cars | LOW |
| Vehicle card | TECH + WIN visual | alt fallback, per-status CTA | "Sold Out" English; (decide) CTA drop on sold cards | "Terjual" + month/year once sold_at exists | MEDIUM |
| Vehicle detail | TECH behavior + R3B visual | CTA logic, alt fallback, highlights disclosure, no description, Unit Lainnya, SEO | R3B About section, synthesised description, English headings | hide empty rows, owner-supplied facts, sticky mobile CTA (polish) | HIGH |
| Vehicle gallery | R3B visual + TECH alt flow | alt via detail, lightbox | none | drag reorder/HEIC (admin) | LOW-MEDIUM (needs QA) |
| Financing | TECH (unchanged) | WhatsApp CTA | default 6.5% as authoritative default | guidance + WhatsApp (see 15) | product only |
| About | TECH | CMS sections + fallback | - | four factual blocks | product only |
| Contact | TECH | WhatsApp-first, no form | - | owner facts (hours) | LOW |
| Articles | TECH | route + CMS | nav prominence | defer until >=3 | product only |
| Header/nav | TECH | search removal, xl breakpoint, CMS nav | - | labels/ordering via CMS; hide Articles | LOW |
| Footer | TECH | CMS footer | LinkedIn/Instagram unless real | single contact source | LOW |
| WhatsApp | TECH | AVAILABLE specific / other generic | - | stays primary | LOW |
| SOLD experience | TECH (detail) + WIN (cards) | browsable, generic CTA on detail | sold-only "no CTA" ambiguity pending ruling | "Terjual", month/year, cap | MEDIUM |

---------------------------------------------------------------------
8. HOMEPAGE (implementation delta only)
---------------------------------------------------------------------
Identical code on UI, TECH, WIN, R3B (no branch touched it). Current: HeroSlideshow/Hero (resolveSlide fallback to
DEFAULT_HERO), Featured Stock (`getFeaturedVehicles(4)`, AVAILABLE + is_featured), AboutSection (only if CMS active),
WhyPerkasaSection (CMS benefits or hardcoded default), TestimonialsSection (null when empty), final CTA.
No SOLD section; `HomepageSocialSection` exists but is unreferenced (dormant, dead code).

Delta to target (Hero > Unit Tersedia > Cara Pembelian > Recent SOLD > Final WhatsApp):
1. Hero: replace default eyebrow/body claim ("curated showroom of inspected, premium vehicles - every unit verified").
2. Featured: auto-fill from latest AVAILABLE (drop is_featured dependency); show "Lihat Semua" on mobile; rename "Featured Stock" -> "Unit Tersedia".
3. About: leave CMS-driven but default off (DEFER).
4. Why Perkasa: remove; delete the hardcoded default; new HowToBuy section (4 steps).
5. Testimonials: keep component dormant (renders nothing).
6. New Recent SOLD (3): needs data function; ordering true only after sold_at exists.
7. Final CTA: keep.
8. Delete dead `homepage-social-section.tsx` / `social-content-strip.tsx` only after social-per-vehicle decision.

---------------------------------------------------------------------
9. CATALOGUE
---------------------------------------------------------------------
- Hierarchy today (TECH): single grid ordered AVAILABLE > RESERVED > SOLD, 3 `.range()` queries per page.
- Windows: split into "Unit Tersedia" and "Sudah Terjual" (cars only), sold cards visually muted.
- Decisions: Windows catalogue split = **PRESERVE + ADAPT** (add to motorcycles, "Terjual", sold cap,
  heading wording for RESERVED, Indonesian empty state, pagination semantics). Windows card sold variant = **PRESERVE** (wording ADAPT).
  Windows sold-card CTA removal = **RECONCILE** (owner ruling).
- Trust copy: TECH wins (keep). Remaining "curated/premium" in route metadata = fix as product copy.
- Pagination: tier-range pagination is a TECH behavior and must be preserved; the client split is layered on top and is where the edge cases appear (4.4).

---------------------------------------------------------------------
10. VEHICLE DETAIL / GALLERY (HIGH PRIORITY, mixed)
---------------------------------------------------------------------
| Topic | Source of truth for final state |
|---|---|
| Visual hierarchy (status + small stock number, title, meta line, large price, editorial columns) | R3B |
| Gallery layout (4:5, contain, 4 thumbs) | R3B (after responsive QA) |
| Lightbox / photo interactions | UI = TECH = WIN = R3B (unchanged `vehicle-lightbox.tsx`) |
| Price prominence | R3B |
| Status presentation | UI (`VehicleStatusBadge`); spec: Tersedia/Dipesan/Terjual |
| Stock number | R3B small label (spec A3) |
| Spec rows | R3B layout; hide empty rows (spec) |
| Empty specs | spec: hide rows, no "-" |
| Highlights | TECH (cap 5 + disclosure); R3B styling adaptable |
| Description | TECH (removed) - R3B About rejected |
| WhatsApp CTA | TECH logic; placement near price block (R3B placement rejected) |
| SOLD behavior | TECH |
| Related | TECH heading "Unit Lainnya" + R3B c0b1bae AVAILABLE-only |
| Alt fallback | TECH |
| SEO interaction | TECH (page files; no UI branch touches them) |
| Responsive | R3B desktop layout must be re-QA'd at 320/375/768/1024/1280; Phase 1/1.5 rules kept |

R3B must not be merged as a file. Re-author `vehicle-detail.tsx` on the TECH file by porting R3B's JSX structure and classes while keeping
the 2C `mediaWithAlt`, `HIGHLIGHTS_VISIBLE_COUNT`, no-description, CTA logic and "Unit Lainnya".

---------------------------------------------------------------------
11. FINANCING
---------------------------------------------------------------------
Current (all branches identical): `/financing` "Simulasi Kredit", client `FinancingCalculator` (price default 500,000,000, DP 20%, tenor 12-60,
**default rate 6.5%**), result plus "Tanya Simulasi via WhatsApp" which appends the estimate to the message. Spec: misleading default; owner
decision made: guidance + WhatsApp, no authoritative rates.
Classification: **REPLACE LATER** (interim: SIMPLIFY by removing default 6.5% and adding disclaimer; REMOVE the computed result from the WhatsApp text).
Keep the route and WhatsApp CTA. No vehicle-detail financing module (link only, spec).

---------------------------------------------------------------------
12. ADMIN / CMS RECONCILIATION (no branch changed admin)
---------------------------------------------------------------------
| Area | Finding | Verdict |
|---|---|---|
| Dashboard | stale copy "computed from the current mock inventory"; "Recent Activity" placeholder; New Leads card; Total Vehicles | NEEDS SIMPLIFICATION + TECHNICAL DEBT (references nonexistent vehicle_status_history) |
| Inventory | list + full form; delete locked for SOLD/RESERVED; archive action; stock number auto | NEEDS SIMPLIFICATION (quick status/price, tabs). ALREADY ALIGNED: auto stock number, auto SEO/slug |
| Vehicle editor | description/seoTitle/seoDescription kept in form state, not editable | ALREADY ALIGNED (SEO automatic). Re-group fieldsets |
| Media/photos | vehicle-level upload/cover/reorder present; standalone Media nav already removed (redirects) | ALREADY ALIGNED. Alt is render-time (TECH) |
| Leads | page reads table the public no longer writes (WhatsApp-direct) | REMOVE FROM NAV ONLY; backend DORMANT; real CRM = FUTURE OS OWNED |
| Content (social) | admin only; public components unreferenced | DORMANT; REMOVE FROM NAV; per-vehicle section pending owner decision |
| Articles | live CMS | DEFER (hide nav when empty) |
| Website | General/Navigation/Footer/Homepage/About tabs, 4 homepage forms (hero, about, why-perkasa, testimonials) | NEEDS SIMPLIFICATION (regroup; remove why-perkasa form when section removed) |
| Homepage/About/Navigation/Footer editors | duplicated contact facts General vs Footer (`footer.ts` vs site-settings) | TECHNICAL DEBT: single source for phone/WhatsApp (mapping NOT VERIFIED here) |
| Settings | disabled shell, hardcoded values | REMOVE FROM NAV ONLY |
| Admin nav | 7 items | target 4 |
Not designed here. CMS revalidation relies on every Server Action calling `revalidatePath("/", "layout")` - any new quick-action must keep doing so.

---------------------------------------------------------------------
13. OS READINESS (schema/code assumptions at 0d91bf7)
---------------------------------------------------------------------
| Concept | Present? | Where | Future owner |
|---|---|---|---|
| status (DRAFT/AVAILABLE/RESERVED/SOLD/ARCHIVED) | yes, edited in CMS | `lib/types/vehicle.ts`, form | OPERATING_SYSTEM source; CMS mirrors -> SHARED_PROJECTION |
| is_published | yes, separate from status | `isPubliclyVisible` in `lib/data/vehicles.ts` | CMS (derive from status later) |
| is_featured | yes | featured query | CMS (automatic) |
| sold date / status_changed_at | NO (comment in `lib/data/vehicles.ts` admits it) | sort uses created_at | OPERATING_SYSTEM, projected |
| status history | NO table (dashboard placeholder references it) | - | OPERATING_SYSTEM; optional CMS log |
| stock number | yes, auto-generated, reused after delete | migrations 20260815050000/20260816010000 | SHARED (OS needs stable external key) |
| price | yes, CMS-edited | `price` | SHARED_PROJECTION (OS decides; duplication risk) |
| location | optional field | type | SHARED |
| condition | yes (NEW/USED) | type | SHARED (low value in UI) |
| leads | table + `createLead` dormant | `lib/data/leads.ts` | OPERATING_SYSTEM |
| external identifier | NO | - | SHARED key, add nullable in Phase D |
| cost/repairs/funding/profit | none (correct) | - | OPERATING_SYSTEM only; must never enter CMS |
No migrations proposed by this audit. Any later change follows `docs/SOURCE-OF-TRUTH-AND-DEPLOYMENT.md` (additive only).

---------------------------------------------------------------------
14. DEPENDENCY BASELINE
---------------------------------------------------------------------
Identical on origin/main, 76c206e, 0d91bf7, 15e525f, cc90d4f, c0b1bae (`git show <ref>:package.json` and lockfile):
next 16.3.7; react/react-dom 19.2.8; eslint-config-next 16.3.7 (matches next); eslint ^9; sharp 0.35.5; js-yaml 4.3.2; typescript ^5.
package-lock hash identical across all six refs. Desired integrated baseline = exactly this; no upgrades, no regeneration.
Not verified in this audit (no installs/commands against dependencies): `npm audit` result, build/lint/typecheck. Re-run in Phase 2R.1.
Note: AGENTS.md says this Next.js has breaking changes; the 2R implementation must read `node_modules/next/dist/docs/` first.

---------------------------------------------------------------------
15. INTEGRATION BASE RECOMMENDATION
---------------------------------------------------------------------
RECOMMENDED INTEGRATION BASE: `0d91bf7` (redesign/phase-2c4-trust-cms-freshness-v2), then merge `bc8eaa1` (tooling) before layering.

Verification of the hypothesis:
- UI code of 76c206e == d079e46; 76c206e..0d91bf7 is exactly Phase 2C. So 0d91bf7 is a strict superset of approved UI code. VERIFIED.
- Alternative bases: `bc8eaa1`/`15e525f`/`cc90d4f` all lack Phase 2C; building on cc90d4f would make Phase 2C the thing to re-apply (14-file reverse diff, section 2 range F) - rejected.
- Trial merges prove layering is cheap: bc8eaa1, 15e525f merge with 0 conflicts; R3B conflicts in exactly 1 file that must be hand-reconciled anyway.

Rationale: 2C is the QA-hardened behavior layer (SEO, alt, CTA, highlights, copy); every UI input is presentation-only and touches <=5 files.
Risks: (a) forgetting bc8eaa1 tooling -> lint scans worktrees; (b) `/evidence/` ignore lost if base switched; (c) R3B c0b1bae discrepancy; (d) Netlify revalidation unproven; (e) npm audit unverified.

---------------------------------------------------------------------
16. FINAL INTEGRATED STATE BLUEPRINT (not implemented)
---------------------------------------------------------------------
PUBLIC HOMEPAGE - visual: UI/TECH existing sections; behavior: TECH (CMS fallbacks, revalidation); delta: Unit Tersedia (auto), Cara Pembelian, Recent SOLD (3), Final WhatsApp; remove Why Perkasa; About/Testimonials/Articles deferred; no inspection claims.
CATALOGUE - visual: UI + Windows split/sold card; behavior: TECH tier pagination + 2C copy; delta: split on both types, "Terjual", capped archive, Indonesian empty states, route meta without "curated/premium", sold CTA ruling.
VEHICLE DETAIL - visual: R3B hierarchy; behavior: TECH (CTA, alt, highlights disclosure, no description, SEO, Unit Lainnya); delta: hide empty rows, Indonesian headings, CTA near price, related AVAILABLE-only (c0b1bae), optional owner-supplied facts.
GALLERY - R3B 4:5/contain/4 thumbs after QA; alt via detail.
FINANCING - guidance + WhatsApp; calculator simplified then replaced.
ABOUT - short and factual (4 blocks).
CONTACT - WhatsApp-first; hours only if owner supplies.
ADMIN - 4-item nav; inventory task-based; dashboard counts + "perlu dilengkapi"; Leads/Settings/Content out of nav.
CMS - Website regrouped; single contact source; revalidation preserved.
OS READINESS - additive nullable sold_at, status history, external_id (later, reviewed migration); no finance data in CMS.
DEPENDENCIES - exactly as today.

---------------------------------------------------------------------
17. IMPLEMENTATION ORDER (from evidence)
---------------------------------------------------------------------
1. **2R.1 Base**: branch from 0d91bf7; merge bc8eaa1 (clean); run install/lint/typecheck/build/npm audit; record baseline. No product change.
2. **2R.2 Catalogue**: merge 15e525f (clean); then wire /motorcycles, "Terjual", sold cap, empty states, route meta copy. Needs owner ruling on sold-card CTA first. (Smallest and cleanest, independent of detail.)
3. **2R.3 Vehicle detail/gallery**: re-author vehicle-detail.tsx on TECH; port R3B visuals (+gallery); adopt c0b1bae; checklist: alt, CTA above fold, no description, highlights disclosure, "Unit Lainnya", SEO untouched. Viewport QA.
4. **2R.4 Public product spec**: homepage restructure, How to Buy, Recent SOLD, remove Why Perkasa, claim removal (hero fallback, site-settings default), financing reframe, About, Articles deferral. Gate: owner facts.
5. **2R.5 Admin/CMS**: nav 7->4, dashboard, Website regroup, single contact source; inventory quick actions (must not bypass delete-lock triggers).
6. **2R.6 OS readiness migrations** (additive, reviewed) then sold_at-based ordering.
7. **2R.7 QA**: protected-behavior checklist (section 5), browser QA 8 combos as 2C.4, Netlify revalidation check.
Rationale: 2R.2 and 2R.3 are separated because they share no files after the base is set; both are separated from product removal so regressions are attributable.

---------------------------------------------------------------------
18. RISK REGISTER
---------------------------------------------------------------------
HIGH
- R3B reverts description/alt/highlights/Unit Lainnya. Files: vehicle-detail.tsx. Sources: cc90d4f, c0b1bae. Protects: 2C.2/2C.4. Mitigation: re-author on TECH, never take R3B file; checklist test in 2R.3.
- R3B synthesises a description from highlights. Same file. Mitigation: drop `presentVehicleContent` description path.
- Empty alt on all photos if detail passes raw media. Mitigation: grep gate for `vehicleMediaAlt` use in detail + card.
- CTA moved far below fold. Mitigation: keep CTA beside price.
MEDIUM
- Sold card CTA ambiguity (Windows vs protected generic CTA). Files: vehicle-card.tsx. Mitigation: owner ruling.
- Catalogue split + pagination edge cases; unbounded sold archive. Files: vehicle-catalogue.tsx, lib/data/vehicles.ts.
- Gallery 4:5/contain responsive and landscape behavior. Files: vehicle-gallery.tsx.
- Missing tooling cleanup if base chosen without bc8eaa1. Files: .gitignore, eslint.config.mjs.
- R3B SHA ambiguity (c0b1bae) and a lib/ change outside registered scope.
- Unsupported claims still live on TECH (hero fallback, why-perkasa, meta, site-settings default).
- Netlify revalidation not proven.
LOW
- English headings/empty states; raw transmission enum; "-" rows; `key={highlight}` duplicates; dormant social components; dashboard stale text; npm audit not re-verified.

---------------------------------------------------------------------
19. COMPLETION CHECKLIST
---------------------------------------------------------------------
1 inputs verified (R3B discrepancy noted) YES | 2 R3B lineage not double counted YES | 3 matrix YES | 4 mixed files decomposed YES (vehicle-detail, vehicle-card, catalogue, cars page) |
5 protected behaviors mapped YES | 6 spec overrides YES | 7 admin delta YES | 8 dependency baseline YES | 9 base recommendation YES | 10 sequence YES |
11 no application code changed YES | 12 committed and pushed: see task record.
Limits: no build/lint/audit executed; admin analysis from 0d91bf7 source reading (no live DB, no browser); spec facts about live site taken from the spec, not re-verified.

FINAL DECISION: READY FOR INTEGRATION PLANNING (with two Owner rulings required before 2R.2/2R.3: sold-card CTA; R3B SHA of record).
