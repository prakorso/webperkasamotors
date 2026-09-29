# Phase 2C.3 — Final Rendered QA + Editorial Gate

**Date:** 2026-09-30
**Purpose:** validate Phase 2C.2 (commit `e4fe1eb` on `redesign/phase-2c2-vehicle-content-ux`) with real rendered browser evidence before it's considered merge-ready. This is a QA gate, not a redesign phase.

This report is a working document, updated progressively as each QA step runs — not reconstructed from memory at the end.

---

## 0. Pre-QA state audit

**Starting branch:** `redesign/phase-2c2-vehicle-content-ux`
**Starting HEAD:** `e4fe1eb` — "feat: simplify vehicle content and ux"

**Working tree at session start:** NOT clean. Found an uncommitted, unexplained change to `app/(public)/page.tsx` (removed `AboutSection` and `TestimonialsSection` from the homepage entirely) that this session did not author. An independent `codex.js` CLI process was observed running against this same machine during Phase 2C.2, which is the most likely source. This change is unrelated to Phase 2C.2/2C.3, was not requested, and was not evaluated for correctness.

**Action taken:** stashed *only* that file's change, separately from the pre-existing stash, so QA runs against the actual approved `e4fe1eb` state:

```
stash@{0}: WIP: unexplained homepage change (About+Testimonials removed) - found
           uncommitted at start of Phase 2C.3, not authored by this session
stash@{1}: WIP: public UI restyle (pre-2C.2, uncommitted, found 2026-09-29)
```

The pre-existing stash (`public UI restyle`) was **not popped, applied, dropped, or modified** — its content is unchanged; only its stack index shifted from `{0}` to `{1}`, which is an unavoidable, non-destructive side effect of `git stash push` and does not alter what it contains. Both stashes are reported again in the Git Evidence section at the end of this report.

**Dependency state confirmed before QA:**
- `next`: `16.3.7` (package.json, package-lock.json, and installed binary all agree)
- `npm audit`: **0 vulnerabilities**
- No dependency attempted to downgrade Next.js

---

## 1. Browser QA availability

Chrome extension tools (`mcp__claude-in-chrome__*`) were loaded and tested at the start of this phase, via `tabs_context_mcp`. Tried twice.

**Result (both attempts):**
```
Browser extension is not connected. Please ensure the Claude browser extension is
installed and running (https://claude.ai/chrome), and that you are logged into
claude.ai with the same account as Claude Code.
```

This is a definitive "not connected" state, not a transient timeout.

**BLOCKED — real browser QA unavailable.**

Per this phase's explicit instructions, this is NOT substituted with server-rendered
HTML inspection, build success, or static source inspection. Phase 2C.2 already
performed and reported that kind of verification; it does not satisfy this phase's
purpose. Every section below that requires real rendered/viewport evidence is marked
`BLOCKED` or `NOT VERIFIED` accordingly, not `PASS`.

**Consequence for this phase:** no application code changes are made, because
Section 20 authorizes small fixes only when real rendered evidence proves they're
necessary — no such evidence exists. The sections below record what *can* be
verified without a browser (editorial carry-forward, dependency/security state, git
state) and mark everything else honestly as not verified.

---

## 2. Target routes and vehicles for this QA pass (not yet executed)

Re-confirmed live in the database before writing this table, so whoever runs the
actual browser pass has current, correct targets:

| Role | Vehicle | Stock # | Slug | Status |
|---|---|---|---|---|
| AVAILABLE car detail | Hyundai Grand Avega Hatchback 2012 | CAR-0001 | `/cars/hyundai-grand-avega-hatchback-2012` | AVAILABLE |
| SOLD car detail | Hyundai Grand Avega Hatchback 2013 | CAR-0007 | `/cars/hyundai-grand-avega-hatchback-2013-2` | SOLD |
| AVAILABLE motorcycle detail | Suzuki GSX R Sport 2017 | MOT-0010 | `/motorcycles/suzuki-gsx-r-sport-2017` | AVAILABLE |
| SOLD motorcycle detail | Yamaha R15 V3 Sport 2019 | MOT-0001 | `/motorcycles/yamaha-r15-v3-sport-2019` | SOLD |

Plus: `/`, `/cars`, `/motorcycles`.

## 3. Responsive QA matrix — NOT EXECUTED (blocked)

| Route | Target Width | Actual Width | Scroll Width | Result | Notes |
|---|---|---|---|---|---|
| `/` | 390 | NOT VERIFIED | NOT VERIFIED | BLOCKED | Browser tooling unavailable |
| `/` | 768 | NOT VERIFIED | NOT VERIFIED | BLOCKED | Browser tooling unavailable |
| `/` | 1024 | NOT VERIFIED | NOT VERIFIED | BLOCKED | Browser tooling unavailable |
| `/` | 1440 | NOT VERIFIED | NOT VERIFIED | BLOCKED | Browser tooling unavailable |
| `/cars` | 390 / 768 / 1024 / 1440 | NOT VERIFIED | NOT VERIFIED | BLOCKED | Browser tooling unavailable |
| `/motorcycles` | 390 / 768 / 1024 / 1440 | NOT VERIFIED | NOT VERIFIED | BLOCKED | Browser tooling unavailable |
| `/cars/hyundai-grand-avega-hatchback-2012` (AVAILABLE) | 390 / 768 / 1024 / 1440 | NOT VERIFIED | NOT VERIFIED | BLOCKED | Browser tooling unavailable |
| `/cars/hyundai-grand-avega-hatchback-2013-2` (SOLD) | 390 / 768 / 1024 / 1440 | NOT VERIFIED | NOT VERIFIED | BLOCKED | Browser tooling unavailable |
| `/motorcycles/suzuki-gsx-r-sport-2017` (AVAILABLE) | 390 / 768 / 1024 / 1440 | NOT VERIFIED | NOT VERIFIED | BLOCKED | Browser tooling unavailable |
| `/motorcycles/yamaha-r15-v3-sport-2019` (SOLD) | 390 / 768 / 1024 / 1440 | NOT VERIFIED | NOT VERIFIED | BLOCKED | Browser tooling unavailable |

No `window.innerWidth` / `document.documentElement.scrollWidth` values were recorded because no page was ever actually opened in a browser this phase.

## 4. Per-section QA results

Sections 7–19 of the phase brief (homepage regression, cars catalogue, motorcycles
catalogue, vehicle-detail hierarchy, AVAILABLE/SOLD detail QA, highlights UX,
image/gallery QA, accessibility) all require real rendered/viewport evidence.

**Status for all of the above: BLOCKED — browser tooling unavailable.**

Not marked PASS, not inferred from Phase 2C.2's static source/HTML review, and not
guessed from familiarity with the code. Per Section 28 of the brief, `NOT VERIFIED`
is never silently converted to `PASS`.

**Partial exception — SEO/OG/canonical (Section 16):** Phase 2C.2 already checked
canonical tags, OG image, and title/description directly against server-rendered
HTML for these same four vehicles (see §5 below for the re-stated evidence) — that
data doesn't depend on viewport or client JS, so it's carried forward rather than
silently dropped. It is marked `INFERRED — NOT DIRECTLY VERIFIED IN THIS PHASE`
rather than `PASS`, since it wasn't re-verified with real browser rendering in this
session as the brief requires for a merge-ready determination.

## 5. SEO / OG / canonical — carried forward from Phase 2C.2 (not re-verified via browser)

Restated for the record, not re-run this session (server unchanged since Phase
2C.2's own verification, same commit `e4fe1eb`):

| Vehicle | Canonical | OG image | "Curated and inspected" wording |
|---|---|---|---|
| CAR-0001 (AVAILABLE) | `https://webperkasamotors.netlify.app/cars/hyundai-grand-avega-hatchback-2012` | vehicle's own primary photo URL | absent |
| CAR-0007 (SOLD) | `https://webperkasamotors.netlify.app/cars/hyundai-grand-avega-hatchback-2013-2` | vehicle's own primary photo URL | absent |
| MOT-0010 (AVAILABLE) | `https://webperkasamotors.netlify.app/motorcycles/suzuki-gsx-r-sport-2017` | vehicle's own primary photo URL | absent |
| MOT-0001 (SOLD) | `https://webperkasamotors.netlify.app/motorcycles/yamaha-r15-v3-sport-2019` | vehicle's own primary photo URL | absent |

**Status: INFERRED — NOT DIRECTLY VERIFIED IN THIS PHASE.** Status vocabulary per
Section 28 — this is not claimed as a fresh `PASS` from real browser rendering.

---

## 6. Editorial / data quality

Carried forward from `docs/reports/phase-2c2-editorial-review.md`. Nothing below was
re-inferred, re-corrected, or re-classified differently from that report — this is a
restatement for this phase's required format, not a new pass. **Production data
changed by this phase: NO**, for every item.

### Identifier: CAR-0007
**Vehicle:** Hyundai Grand Avega Hatchback 2013
**Issue:** `year` field says 2013; the vehicle's own ad-copy (in `highlights`) says "2012".
**Current evidence:** `highlights[0]` = "MOBIL HYUNDAI GRAND AVEGA 1.4 A.T HATCHBACK MATIC TRIPTONIC 4 SPEED **2012** ..." vs. `year = 2013`.
**Risk:** A buyer or the CMS itself may be showing the wrong model year.
**Required human action:** Check STNK/BPKB and correct whichever field is wrong.
**Production data changed?** NO
**Classification:** NEEDS HUMAN VERIFICATION

### Identifier: MOT-0007
**Vehicle:** Yamaha R15 V3 Sport 2026
**Issue:** `year` field says 2026; the vehicle's own ad-copy says "2017".
**Current evidence:** `highlights[0]` = "MOTOR YAMAHA R15 V3 **2017** WARNA BLUE ..." vs. `year = 2026`. 2026 is also the current calendar year at time of writing — a 2026-model-year *used* motorcycle being sold is itself implausible on its face.
**Risk:** Same as above; this is the most visually implausible of the five (a "brand-new-model-year used bike").
**Required human action:** Check STNK/BPKB and correct whichever field is wrong.
**Production data changed?** NO
**Classification:** NEEDS HUMAN VERIFICATION

### Identifier: MOT-0001
**Vehicle:** Yamaha R15 V3 Sport 2019
**Issue:** `year` field says 2019; the vehicle's own ad-copy says "2017". Also: `description` field literally contains the placeholder text `"Test"`.
**Current evidence:** `highlights[0]` = "MOTOR YAMAHA R15 V3 **2017** WARNA BLUE ..." vs. `year = 2019`; `description = "Test"`.
**Risk:** Year contradiction as above. The `"Test"` description is no longer customer-visible (Phase 2C.2 removed the public description render entirely), but the column still holds junk data.
**Required human action:** Verify correct year from paperwork; clear the `"Test"` description value whenever convenient (cosmetic only — not customer-facing anymore).
**Production data changed?** NO
**Classification:** NEEDS HUMAN VERIFICATION

### Identifier: CAR-0004
**Vehicle:** Hyundai Tucson SUV 2012
**Issue:** `year` field says 2012; the vehicle's own ad-copy says "2011".
**Current evidence:** `highlights[0]` = "MOBIL HYUNDAI TUCSON 2.0 A.T SUV MATIC TRIPTONIC 6 SPEED **2011** ..." vs. `year = 2012`.
**Risk:** Same as CAR-0007.
**Required human action:** Check STNK/BPKB and correct whichever field is wrong.
**Production data changed?** NO
**Classification:** NEEDS HUMAN VERIFICATION

### Identifier: CAR-0008
**Vehicle:** Hyundai Grand Avega Hatchback 2013
**Issue:** `year` field says 2013; the vehicle's own ad-copy says "2012".
**Current evidence:** `highlights[0]` = "MOBIL HYUNDAI GRAND AVEGA 1.4 A.T HATCHBACK MATIC TRIPTONIC 4 SPEED **2012** ..." vs. `year = 2013`.
**Risk:** Same as CAR-0007.
**Required human action:** Check STNK/BPKB and correct whichever field is wrong.
**Production data changed?** NO
**Classification:** NEEDS HUMAN VERIFICATION

### Identifier: QA-PAGN-01
**Vehicle:** Hyundai Grand Avega Hatchback 2013
**Issue:** Stock number does not match the site's generated format (`CAR-0001`, `CAR-0002`, … via `generate_stock_number()`), which suggests this row was inserted directly into the database rather than through the CMS's Create Vehicle flow — consistent with leftover QA/test fixture data.
**Current evidence:** `stock_number = "QA-PAGN-01"`; record is `is_published = true`, `status = SOLD`, and appears in the public SOLD catalogue and sitemap like a real historical sale.
**Risk:** If this is test data, it's currently live on the public site and in search engines' sitemap as if it were a real transaction — a trust/accuracy risk, however small.
**Required human action:** Confirm whether this is a real historical sale (keep as-is) or test data that leaked into production (archive or delete via the CMS).
**Production data changed?** NO
**Classification:** NEEDS HUMAN VERIFICATION

### Systemic: all 15 live vehicles
**Issue:** `highlights` holds raw seller ad-copy (5–27 lines per vehicle) instead of the curated 3–5 factual bullets the field is meant to hold.
**Required human action:** An admin should rewrite `highlights` for every vehicle. Not done automatically, per explicit instruction in both Phase 2C.2 and this phase.
**Production data changed?** NO
**Classification:** NEEDS EDITORIAL REVIEW (all 15)

No inferred corrections were made for any of the above — years were not guessed, highlights were not rewritten, no record was archived or deleted.

---

## 7. Security / dependency state

- **Next.js version (installed + pinned):** `16.3.7` — confirmed via `node node_modules/next/dist/bin/next --version`, `package.json`, and `package-lock.json` (`node_modules/next` resolves to `16.3.7`). All three agree.
- **`npm audit`:** `found 0 vulnerabilities` (re-run this session, see below).
- **Did any dependency attempt to downgrade Next.js?** No.
- **Was the existing stash applied?** No — neither stash was popped, applied, or dropped.

```
$ npm audit
found 0 vulnerabilities
```

---

## 8. Git evidence

**Starting branch:** `redesign/phase-2c2-vehicle-content-ux`
**Starting HEAD:** `e4fe1eb`

**Final branch:** `redesign/phase-2c2-vehicle-content-ux` (unchanged — this phase does not create a new branch, per instructions)
**Final HEAD:** `e4fe1eb` unless a QA-derived fix commit was added (see terminal summary for the actual final SHA — no application code change was made this phase, so HEAD should equal the starting HEAD plus only this report file).

**Commit created:** yes — this report file only (`docs/reports/phase-2c3-final-rendered-qa.md`). No application code changed.
**Push status:** see terminal summary.

**`git status` at end of phase:** clean except for this report being committed.

**Stash list at end of phase:**
```
stash@{0}: WIP: unexplained homepage change (About+Testimonials removed) - found
           uncommitted at start of Phase 2C.3, not authored by this session
stash@{1}: WIP: public UI restyle (pre-2C.2, uncommitted, found 2026-09-29)
```

**Was `"WIP: public UI restyle (pre-2C.2, uncommitted, found 2026-09-29)"` touched?**
**NOT TOUCHED.** Not popped, applied, dropped, or modified. Its content is byte-for-byte what it was before this phase started; only its stack index moved from `{0}` to `{1}` because one additional, unrelated stash entry was pushed above it during this phase (see §0) — an unavoidable consequence of using the stash for anything else, not a modification of this entry.

The additional stash pushed this phase (`WIP: unexplained homepage change...`) is new, was not present in the brief's expected state, and is flagged for the user's attention — it was not authored by this session and was not evaluated.

---

## 9. Final CTO scorecard

```
ARCHITECTURE:              PASS   (unchanged from Phase 2C.2; no schema/logic touched)
PUBLIC UX:                 BLOCKED — browser tooling unavailable
MOBILE:                    BLOCKED — browser tooling unavailable
TABLET:                    BLOCKED — browser tooling unavailable
DESKTOP:                   BLOCKED — browser tooling unavailable
HOMEPAGE:                  BLOCKED — browser tooling unavailable
CARS CATALOGUE:             BLOCKED — browser tooling unavailable
MOTORCYCLES CATALOGUE:      BLOCKED — browser tooling unavailable
VEHICLE DETAIL:             BLOCKED — browser tooling unavailable
AVAILABLE CTA:              BLOCKED — browser tooling unavailable (label unchanged in source: "Saya Tertarik dengan Unit Ini")
SOLD CTA:                   BLOCKED — browser tooling unavailable (label unchanged in source: "Tanya Unit Lain")
HIGHLIGHTS UX:               BLOCKED — browser tooling unavailable
SEO:                        INFERRED — NOT DIRECTLY VERIFIED IN THIS PHASE (carried forward, §5)
OG:                         INFERRED — NOT DIRECTLY VERIFIED IN THIS PHASE (carried forward, §5)
IMAGE ALT:                  INFERRED — NOT DIRECTLY VERIFIED IN THIS PHASE (server-rendered, not visually confirmed)
ACCESSIBILITY:               BLOCKED — browser tooling unavailable
CONTENT INTEGRITY:          NEEDS HUMAN REVIEW (5 year contradictions + 1 suspicious stock number + all-15 highlights rewrite — see §6)
SECURITY:                   PASS   (0 vulnerabilities, Next.js 16.3.7 confirmed)
TYPESCRIPT:                 NOT RUN this phase (no code changed; last confirmed PASS in Phase 2C.2 on this exact HEAD)
LINT:                       NOT RUN this phase (no code changed; last confirmed PASS in Phase 2C.2 on this exact HEAD)
BUILD:                      NOT RUN this phase (no code changed; last confirmed PASS in Phase 2C.2 on this exact HEAD)
GIT:                        CLEAN (after stashing the unrelated, unexplained change)
STASH:                      UNTOUCHED (the pre-existing "public UI restyle" stash — see §8)
```

---

## 10. Final decision

**FINAL DECISION: NOT MERGE READY**

**RATIONALE:** Phase 2C.2's implementation appears sound by every check that doesn't
require a browser — TypeScript, lint, and build were clean on this exact commit,
dependency security is patched and verified (0 vulnerabilities), server-rendered
HTML confirmed canonical/OG/alt-text/CTA-label correctness, and no vehicle data was
altered. But this phase's entire purpose was to validate real rendered, responsive
UX before merge, and that could not be done — the Chrome browser extension is not
connected in this environment. Declaring "merge ready" without ever having actually
seen the page would be exactly the kind of unverified claim this phase exists to
prevent.

**BLOCKERS:**
1. Real browser QA is unavailable (Chrome extension not connected) — Sections 5–19 of the QA brief are entirely unexecuted.
2. Content integrity: 5 vehicles with unresolved year contradictions, 1 vehicle with a non-standard stock number possibly indicating test data in production, and all 15 vehicles' `highlights` still need editorial rewriting. None of these block a *technical* merge, but they are open, human-owned items the CTO/CMO should be aware of independent of this phase's merge decision.

**NEXT ACTION:** Connect the Claude Chrome extension (install/log in at
https://claude.ai/chrome with the same account as Claude Code, restart Chrome if
newly installed) and re-run this phase's browser QA section against the four target
vehicles and required viewports (390/768/1024/1440) before merging
`redesign/phase-2c2-vehicle-content-ux`.
