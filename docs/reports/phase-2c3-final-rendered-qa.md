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

---

## 11. Phase 2C.3B — Real Browser QA Completion Attempt

**Date:** 2026-09-30 (same day, follow-up session)
**Purpose:** re-check whether the Chrome extension is connected and, if so, complete
the browser QA this report left BLOCKED. If not, stop immediately — no static
substitute, no re-inference, no section above rewritten.

**Pre-check (per this phase's mandatory gate, §2–3 of the 2C.3B brief):**

```
$ git status        → clean, on redesign/phase-2c2-vehicle-content-ux
$ git branch --show-current → redesign/phase-2c2-vehicle-content-ux
$ git log -3 --oneline
  e7bcce9 docs: add Phase 2C.3 final rendered QA report (blocked)
  e4fe1eb feat: simplify vehicle content and ux
  d079e46 feat: refresh Perkasa Motors public UI
$ git stash list
  stash@{0}: WIP: unexplained homepage change (About+Testimonials removed) - found
             uncommitted at start of Phase 2C.3, not authored by this session
  stash@{1}: WIP: public UI restyle (pre-2C.2, uncommitted, found 2026-09-29)
```

Matches the expected state exactly. Neither stash was applied, popped, dropped,
renamed, or otherwise modified to check this — both were only listed.

**Browser connection check** (`mcp__claude-in-chrome__tabs_context_mcp`), tried twice:

```
Browser extension is not connected. Please ensure the Claude browser extension is
installed and running (https://claude.ai/chrome), and that you are logged into
claude.ai with the same account as Claude Code. If this is your first time
connecting to Chrome, you may need to restart Chrome for the installation to take
effect.
```

Identical, definitive "not connected" result both times — not a timeout, not
intermittent.

**BLOCKED — browser extension still unavailable.**

Per this phase's explicit §3 instruction, this stops here: no local production
environment was started for QA purposes (there was nothing to point a browser at),
no route was opened, no viewport was measured, and no section above was rewritten
from BLOCKED to PASS. Sections 4 onward of the 2C.3B brief (start local environment
through accessibility QA) were not attempted because the gate they depend on never
opened.

**What changed as a result of this attempt:** nothing in the QA findings. Only this
section and the corrected Git Evidence (§8, below) were added.

**Runtime console:** BLOCKED — browser tooling unavailable. No page was ever opened, so no console could be read.

**Issue log:** empty. No issue-log entries were opened this phase — real QA never started, so no concrete frontend problem was ever observed to log or fix. No application code was touched under the "small fix" authorization, because no rendered evidence existed to justify one.

**TypeScript / Lint / Build:** not rerun this phase — no application code changed. Last confirmed clean (`tsc --noEmit`, `eslint`, `next build`) in Phase 2C.2 on commit `e4fe1eb`, which this branch's HEAD still contains unmodified.

---

## 12. Corrected Git evidence (supersedes §8 above)

Section 8 above, written at the end of the original Phase 2C.3, contained hedged
wording ("unless a QA-derived fix commit was added", "see terminal summary") that
this follow-up phase's instructions correctly flagged as unacceptable for a
canonical report. Restating precisely:

**Starting HEAD (original Phase 2C.3):** `e4fe1eb` — "feat: simplify vehicle content and ux"
**Pre-existing report commit (original Phase 2C.3, now superseded by this update):** `e7bcce9` — "docs: add Phase 2C.3 final rendered QA report (blocked)" — pushed to `origin/redesign/phase-2c2-vehicle-content-ux` at that time.
**Starting HEAD (this Phase 2C.3B update):** `e7bcce9`

**This update's own commit hash is the one genuine value that cannot be written inside this same file with 100% precision** — a commit's content (including this file) is hashed to produce its own SHA, so the file cannot quote its own hash without changing it. This is stated plainly rather than hidden behind "see terminal summary": the exact hash is captured immediately below via a real `git log` / `git push` transcript, run in the same commands that produced this update, and is also restated verbatim in this session's terminal response per this phase's §29 template — both point at the same, real value, not a placeholder.

```
$ git add docs/reports/phase-2c3-final-rendered-qa.md
$ git commit -m "docs: complete phase 2c3 rendered qa"
[redesign/phase-2c2-vehicle-content-ux d7c576b] docs: complete phase 2c3 rendered qa
 1 file changed, 161 insertions(+)

$ git push origin redesign/phase-2c2-vehicle-content-ux
To https://github.com/prakorso/webperkasamotors.git
   e7bcce9..d7c576b  redesign/phase-2c2-vehicle-content-ux -> redesign/phase-2c2-vehicle-content-ux

$ git status
On branch redesign/phase-2c2-vehicle-content-ux
Your branch is up to date with 'origin/redesign/phase-2c2-vehicle-content-ux'.
nothing to commit, working tree clean

$ git log -3 --oneline
d7c576b docs: complete phase 2c3 rendered qa
e7bcce9 docs: add Phase 2C.3 final rendered QA report (blocked)
e4fe1eb feat: simplify vehicle content and ux
```

**Commit `d7c576b` is the commit containing the QA work and findings above** (§11–§13
of this report). This file (§12 onward) was subsequently corrected once more, in a
small, self-declared follow-up commit, to paste in this exact transcript — that
follow-up commit's own hash is, unavoidably, not written inside itself (see the
explanation two paragraphs up); `git log -1` on this branch after that follow-up
gives the true final HEAD, and the terminal response for that follow-up states it
directly rather than deferring to this file.

**Stash list, reconfirmed at the end of this phase:**
```
stash@{0}: WIP: unexplained homepage change (About+Testimonials removed) - found
           uncommitted at start of Phase 2C.3, not authored by this session
stash@{1}: WIP: public UI restyle (pre-2C.2, uncommitted, found 2026-09-29)
```

**Were either stash touched during Phase 2C.3B?** Not applied, popped, dropped, or
intentionally modified during this phase. (Using the precise wording this phase's
instructions ask for, rather than an unverifiable "byte-for-byte" claim: this
session did not run `git stash apply`, `git stash pop`, `git stash drop`, or any
command that writes to either stash entry — the two `git stash list` transcripts
above, taken at the start and end of this phase, show the same two entries in the
same order with the same messages.)

---

## 13. Reaffirmed scorecard and final decision (Phase 2C.3B)

The scorecard in §9 is **not revised** — every row that was BLOCKED remains BLOCKED,
because nothing was newly verified. Restated once, for a single unambiguous
end-of-phase reading, with the two rows this phase actually adds evidence for:

```
ARCHITECTURE:              PASS      (unchanged since Phase 2C.2; no schema/logic touched)
PUBLIC UX:                 BLOCKED   — browser extension still not connected
MOBILE:                    BLOCKED   — browser extension still not connected
TABLET:                    BLOCKED   — browser extension still not connected
DESKTOP:                   BLOCKED   — browser extension still not connected
HOMEPAGE:                  BLOCKED   — browser extension still not connected
CARS CATALOGUE:            BLOCKED   — browser extension still not connected
MOTORCYCLES CATALOGUE:     BLOCKED   — browser extension still not connected
VEHICLE DETAIL:            BLOCKED   — browser extension still not connected
AVAILABLE CTA:             BLOCKED   — browser extension still not connected (source label unchanged: "Saya Tertarik dengan Unit Ini")
SOLD CTA:                  BLOCKED   — browser extension still not connected (source label unchanged: "Tanya Unit Lain")
HIGHLIGHTS UX:              BLOCKED   — browser extension still not connected
SEO:                        INFERRED — NOT DIRECTLY VERIFIED (carried forward from Phase 2C.2's server-HTML check, §5; still not browser-verified)
OG:                         INFERRED — NOT DIRECTLY VERIFIED (same as SEO)
IMAGE ALT:                  INFERRED — NOT DIRECTLY VERIFIED (same basis)
ACCESSIBILITY:               BLOCKED   — browser extension still not connected
CONTENT INTEGRITY:          NEEDS HUMAN REVIEW — unchanged, see §6; separate from technical merge readiness per this phase's §26
SECURITY:                   PASS      (0 vulnerabilities, Next.js 16.3.7 — unchanged, reconfirmed not to have drifted)
TYPESCRIPT:                 NOT RUN this phase (no code changed; last PASS on e4fe1eb, Phase 2C.2)
LINT:                       NOT RUN this phase (no code changed; last PASS on e4fe1eb, Phase 2C.2)
BUILD:                      NOT RUN this phase (no code changed; last PASS on e4fe1eb, Phase 2C.2)
GIT:                        CLEAN
STASH:                      UNTOUCHED (both entries — see §12)
```

**FINAL DECISION: NOT MERGE READY**

**RATIONALE:** Nothing found in this phase contradicts Phase 2C.2's implementation —
architecture, security, and content-integrity findings are all reconfirmed exactly
as before, and no new problem was discovered because no new surface was actually
inspected. The single, unchanged blocker is that the Chrome browser extension is not
connected in this environment, on two separate occasions (original Phase 2C.3 and
this follow-up), both with a definitive "not connected" response rather than a
transient failure. This phase's own instructions are explicit that a technical merge
decision cannot be made from server-rendered HTML or static inspection standing in
for real browser QA — so "merge ready" cannot honestly be claimed yet, independent of
how clean the code itself looks.

**BLOCKERS:**
1. Real browser QA is still unavailable — confirmed unavailable twice, in two separate phases, with an identical, definitive "not connected" response.

(Content integrity — 5 year contradictions, 1 suspicious stock number, all-15 highlights needing rewrite — remains open per §6/§22, but per this phase's §26 is explicitly a human editorial workstream, not a technical merge blocker.)

**NEXT ACTION:** Connect the Claude Chrome extension in this environment
(https://claude.ai/chrome, same account as Claude Code, restart Chrome if newly
installed), then re-run the browser QA against the routes and viewports listed in
§2–§3 of this report. No further code investigation is needed first — the
implementation has already passed every check that doesn't require a browser.

*(§10's decision was superseded by Phase 2C.3C below, which succeeded in obtaining
real browser evidence through a different mechanism. §§0–10 above are preserved
unmodified as the historical record of what was and wasn't possible with
Claude-in-Chrome specifically.)*

---

## 14. Phase 2C.3C — Real Browser QA via an alternative real-browser mechanism

**Date:** 2026-09-30 (same day, second follow-up)
**Starting HEAD for this attempt:** `b205707`

### 14.1 Attempt history (preserved, not overwritten)

- **Attempt 1** (original Phase 2C.3): Claude-in-Chrome unavailable — timeout on `tabs_context_mcp`.
- **Attempt 2** (Phase 2C.3B): Claude-in-Chrome still unavailable — definitive "not connected" response, tried twice.
- **Attempt 3** (Phase 2C.3C, this section): **succeeded**, using a different real-browser mechanism.

### 14.2 Environment audit — what was already available

Per this phase's explicit instruction to prefer an existing mechanism over installing
a new one:

| Mechanism | Status |
|---|---|
| `@playwright/test` in `package.json` / `node_modules` | Not present as a real dependency — the string appears once in `package-lock.json` but is not installed in `node_modules` and not a project dependency. Not usable without installing. |
| Cached `npx` packages (`%LOCALAPPDATA%\npm-cache\_npx`) | Two cached entries found — `serve` and `skills`. Neither is a browser automation tool. |
| Google Chrome | **Installed** at `C:\Program Files\Google\Chrome\Application\chrome.exe` (Chrome 154.0.8037.57). |
| Microsoft Edge | Installed at `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe` (not used — Chrome was already found first and is sufficient). |
| `ms-playwright` browser cache | Not present. |
| Node.js built-in `fetch` / `WebSocket` | **Present** (Node v26.3.0) — both are stable globals in this Node version. |

**Decision:** Chrome itself ships a real browser automation interface — the Chrome
DevTools Protocol (CDP) — reachable over `--remote-debugging-port`, with no
additional software required. Combined with Node's built-in `fetch`/`WebSocket`,
this is a genuine "already available browser automation mechanism" per this phase's
§4(B)/(C): it opens real pages, runs real JavaScript in the page context, resizes
the viewport (`Emulation.setDeviceMetricsOverride`), reads the real console, and
renders real CSS/layout — it is the actual Chrome rendering engine, not a
simulation. **No new npm package was installed. `package.json` was not touched.**

Launched with:
```
chrome.exe --headless=new --disable-gpu --remote-debugging-port=9222 --user-data-dir=<scratchpad>/chrome-profile --no-first-run --no-default-browser-check about:blank
```

Confirmed reachable:
```
$ curl http://localhost:9222/json/version
{"Browser":"Chrome/154.0.8037.57","Protocol-Version":"1.3", ...}
```

A small (~170 line) driver script was written using only Node's built-in `fetch`
and `WebSocket` — no dependency installed — to open tabs, navigate, set viewport
size, evaluate JavaScript in-page, capture screenshots, and read
console/network/exception events over CDP. The script itself lives in this
session's scratchpad directory, not in the repository (it's a QA instrument, not
application code).

### 14.3 Application under test

The already-running local production server on `http://localhost:3100` — started
earlier from this exact branch's build (`next start`, no dependency or Netlify
changes). No stash was applied. No production data was modified.

### 14.4 Responsive QA matrix — real measured evidence

All 7 routes × 4 viewports = 28 combinations, `window.innerWidth` /
`document.documentElement.scrollWidth` read directly from each live page via
`Runtime.evaluate`:

| Route | Target | Actual Width | Scroll Width | Result | Notes |
|---|---:|---:|---:|---|---|
| `/` | 390 | 390 | 390 | PASS | clean |
| `/` | 768 | 768 | 753 | PASS | clean |
| `/` | 1024 | 1024 | 1009 | PASS | clean |
| `/` | 1440 | 1440 | 1425 | PASS | clean |
| `/cars` | 390 | 390 | 390 | PASS | clean |
| `/cars` | 768 | 768 | 753 | PASS | clean |
| `/cars` | 1024 | 1024 | 1009 | PASS | clean |
| `/cars` | 1440 | 1440 | 1425 | PASS | clean |
| `/motorcycles` | 390 | 390 | 390 | PASS | clean |
| `/motorcycles` | 768 | 768 | 753 | PASS | clean |
| `/motorcycles` | 1024 | 1024 | 1009 | PASS | clean |
| `/motorcycles` | 1440 | 1440 | 1425 | PASS | clean |
| `/cars/hyundai-grand-avega-hatchback-2012` (AVAILABLE) | 390 | 390 | 390 | PASS | clean |
| `/cars/hyundai-grand-avega-hatchback-2012` (AVAILABLE) | 768 | 768 | 753 | PASS | clean |
| `/cars/hyundai-grand-avega-hatchback-2012` (AVAILABLE) | 1024 | 1024 | 1009 | PASS | clean |
| `/cars/hyundai-grand-avega-hatchback-2012` (AVAILABLE) | 1440 | 1440 | 1425 | PASS | clean |
| `/cars/hyundai-grand-avega-hatchback-2013-2` (SOLD) | 390 | 390 | 390 | PASS | clean |
| `/cars/hyundai-grand-avega-hatchback-2013-2` (SOLD) | 768 | 768 | 753 | PASS | clean |
| `/cars/hyundai-grand-avega-hatchback-2013-2` (SOLD) | 1024 | 1024 | 1009 | PASS | clean |
| `/cars/hyundai-grand-avega-hatchback-2013-2` (SOLD) | 1440 | 1440 | 1425 | PASS | clean |
| `/motorcycles/suzuki-gsx-r-sport-2017` (AVAILABLE) | 390 | 390 | 390 | PASS | clean |
| `/motorcycles/suzuki-gsx-r-sport-2017` (AVAILABLE) | 768 | 768 | 753 | PASS | clean |
| `/motorcycles/suzuki-gsx-r-sport-2017` (AVAILABLE) | 1024 | 1024 | 1009 | PASS | clean |
| `/motorcycles/suzuki-gsx-r-sport-2017` (AVAILABLE) | 1440 | 1440 | 1425 | PASS | clean |
| `/motorcycles/yamaha-r15-v3-sport-2019` (SOLD) | 390 | 390 | 390 | PASS | clean |
| `/motorcycles/yamaha-r15-v3-sport-2019` (SOLD) | 768 | 768 | 753 | PASS | clean |
| `/motorcycles/yamaha-r15-v3-sport-2019` (SOLD) | 1024 | 1024 | 1009 | PASS | clean |
| `/motorcycles/yamaha-r15-v3-sport-2019` (SOLD) | 1440 | 1440 | 1425 | PASS | clean |

**No horizontal overflow anywhere.** `scrollWidth` never exceeds `innerWidth` on any
route/viewport combination — in fact it's consistently a few px *under* at ≥768px,
which is `document.documentElement.scrollWidth` correctly excluding the vertical
scrollbar's own width (normal, not a defect). All target widths (390/768/1024/1440)
were reachable exactly via `Emulation.setDeviceMetricsOverride` — no substitution or
rounding needed, unlike a real device where the actual width can differ from the
target.

### 14.5 Console / runtime / network evidence

Collected live for all 28 combinations via `Runtime.consoleAPICalled`,
`Runtime.exceptionThrown`, and `Network.loadingFailed`/`responseReceived`:

- **Console errors/warnings: 0** on every route at every viewport.
- **Uncaught JS exceptions: 0** on every route at every viewport (this also rules out
  hydration mismatches, which surface as console errors/exceptions — none were seen).
- **Failed network requests: 0** genuine failures. (The first run of this check
  logged `net::ERR_ABORTED` on Next.js's own link-prefetch/RSC fetches that get
  cancelled every time this script navigates away mid-flight — that's normal
  browser behavior for an automated rapid-navigation script, not a site defect, and
  was excluded from the final count after correlating request IDs to URLs and
  confirming what they were.)

**Runtime console: PASS.**

### 14.6 Image / DOM-level checks (queried directly, not inferred)

For every one of the 28 combinations, via a direct DOM query after each navigation:

- **Broken images (`img.complete && img.naturalWidth === 0`): 0** everywhere.
- **Nested anchors (`querySelectorAll('a a').length`): 0** everywhere — confirms the
  Phase 2C.2 server-HTML check with a second, independent method.
- **Images with empty `alt`:** exactly 2 on the homepage, at every viewport — both are
  the hero slideshow's background photos (`alt=""`), which is the correct,
  deliberate pattern for a purely decorative background image (the actual headline
  text is what conveys the meaning, not the photo). Zero elsewhere. Vehicle photos
  on cards, catalogues, and detail pages/galleries all carry the Phase 2C.2
  deterministic fallback, confirmed live, e.g. `"HYUNDAI GRAND AVEGA HATCHBACK 2012
  — foto 2"`, `"SUZUKI GSX R SPORT 2017 — foto 3"`.

**Image alt: PASS** (confirmed live, not just server-HTML-inferred as in the earlier
attempts).

### 14.7 CTA evidence (live `getBoundingClientRect` + `href`, not just text match)

**AVAILABLE — `/cars/hyundai-grand-avega-hatchback-2012` @ 390×844:**
Primary CTA: `<a>` "Saya Tertarik dengan Unit Ini", `href="https://wa.me/6285111307044?text=...saya%20tertarik%20dengan%20HYUNDAI%20GRAND%20AVEGA%20HATCHBACK%202012...` (vehicle-specific message, confirmed live), `target="_blank"`, rect `292×74px` — comfortably exceeds the 44×44px minimum touch-target guideline. Not nested inside another link (confirmed by the nested-anchor DOM query above and by this element being its own top-level `<a>`).

**SOLD — `/motorcycles/yamaha-r15-v3-sport-2019` @ 390×844:**
Primary CTA: `<a>` "Tanya Unit Lain" (generic, no vehicle-specific wording — correctly does not imply the sold unit is purchasable), `href="https://wa.me/...saya%20ingin%20mengetahui%20lebih%20lanjut%20mengenai%20unit%20yang%20tersedia..."` (generic availability inquiry, not this specific unit), rect `292×52px`. No "Saya Tertarik" CTA present anywhere on this page.

Related-vehicle cards below each detail page also carry their own "Tanya Unit Lain" CTAs (rect `300×44px` each — exactly at the touch-target minimum, still compliant), consistent with the SOLD-status-aware card behavior from Phase 2B.

**CTA wrapping, visually confirmed** (screenshots `cta-available-390-closeup.png` /
`cta-sold-390-closeup.png`): the AVAILABLE label wraps cleanly to two centered
lines ("SAYA TERTARIK" / "DENGAN UNIT INI") exactly as the code comment in
`whatsapp-cta.tsx`'s caller describes; the shorter SOLD label stays on one line. No
clipping, no overlap with surrounding content.

**AVAILABLE CTA: PASS. SOLD CTA: PASS.**

### 14.8 Accessibility spot check (only what was actually tested — not a full audit)

- **Native `<details>`/`<summary>` (highlights disclosure):** confirmed present on
  vehicle detail pages with >5 highlights; `summary.tabIndex === 0` confirmed live —
  keyboard-focusable by default (native HTML semantics; Enter/Space toggle it
  without any custom JS). Not independently simulated with an actual key-press
  event in this pass — the `0` tabIndex plus native `<details>` behavior is a
  reliable, well-established platform guarantee, not something this site's code
  could accidentally break without removing the native element entirely (it
  hasn't).
- **Nested anchors:** 0, confirmed live (§14.6).
- **Status communicated by text, not color alone:** confirmed via screenshots — the
  AVAILABLE/SOLD badge always carries the word ("AVAILABLE"/"SOLD"), not just a
  color change.
- **Image alt:** covered in §14.6.
- **Heading hierarchy:** see the finding in §14.9 below (pre-existing, not a
  regression).
- **Focus-visible styling on the CTA:** not empirically tested by simulating a Tab
  key press and inspecting computed style in this pass — inferred only from source
  (`whatsapp-cta.tsx` applies the same `focus-visible:outline` utility class used
  elsewhere on the site). Recorded as `INFERRED — NOT DIRECTLY VERIFIED`, not `PASS`.

This is a spot check, not a WCAG audit, consistent with this phase's own framing.

### 14.9 Findings from real rendered evidence — none caused by Phase 2C.2

All four items below were discovered through this phase's actual browser
inspection. **None are in files this branch's commits (`e4fe1eb`, `e7bcce9`,
`d7c576b`, `b205707`) touched, and none are fixed in this phase** — per this
phase's own scope rules (§7 of the 2C.3C brief: "Do not expand scope unless it is a
direct regression caused by Phase 2C.2"; §21: small-fix authorization covers
spacing/layout, not copy or caching architecture) and the top-level instruction to
stop and report rather than silently expand scope.

**Finding A — unsupported "curated and inspected" claim, found on a different page
than the one Phase 2C.2 already fixed.**
`app/(public)/cars/page.tsx:27` and `app/(public)/motorcycles/page.tsx:27` both
hardcode: *"Setiap unit telah melalui kurasi dan inspeksi internal Perkasa
Motors."* ("Every unit has gone through internal curation and inspection by
Perkasa Motors.") — visible directly under the catalogue page titles (see
`cars-390.png`). This is the same category of unsupported claim Phase 2C.2 was
explicitly instructed to remove from vehicle SEO metadata, just living in
different, unrelated page copy that Phase 2C.2 never touched or was asked to
review. Not fixed here — it's a one-line copy edit, not a layout/spacing fix, and
outside this QA phase's explicit small-fix list. **Recommended as a fast, obvious
follow-up**, separate from this phase.

**Finding B — homepage has two `<h1>` elements, pre-existing, not a real
accessibility violation in practice.**
`HeroSlideshow` (`components/public/hero-slideshow.tsx`) mounts *every* configured
hero slide simultaneously for the crossfade transition, and every slide runs
`components/public/hero.tsx`'s unconditional `<h1>`. With 2 configured slides, the
DOM genuinely contains 2 `<h1>` elements at once. However, the inactive slide's
wrapper carries `aria-hidden="true"`, which correctly removes it from the
accessibility tree — so only one `<h1>` is ever exposed to assistive technology at
a time. Confirmed via live DOM query (`document.querySelectorAll('h1').length ===
2`), and via source review of `hero-slideshow.tsx`. Predates this branch's Phase
2C.2 changes (neither `hero.tsx` nor `hero-slideshow.tsx` is in this branch's diff)
— not fixed here.

**Finding C — About section not rendering despite active CMS content; root cause
identified (stale static build, not a code bug).**
Live DOM inspection at `/` found no About section, even though
`website_settings.about_is_active = true` and both `about_headline` and
`about_description` are non-empty in the database — which should satisfy
`resolveAbout()` in `app/(public)/page.tsx` and render `<AboutSection>`. Root cause,
confirmed via `.next/prerender-manifest.json`: **the homepage (`/`) is fully static
(`"compute": "static"`, `"initialRevalidateSeconds": false`)** — it was pre-rendered
once at build time and only updates via an explicit on-demand revalidation
(`revalidatePath`) or a fresh build/deploy, neither of which has happened since
About was activated in the database. This is an existing architectural
characteristic of the homepage, not something introduced by Phase 2C.2 (this
branch never touched `page.tsx`'s data-fetching, `about-section.tsx`, or ran a
rebuild after any About-related CMS edit) — **not fixed here.** Worth the site
owner knowing: any homepage CMS edit needs a rebuild+redeploy (or a revalidation
trigger) to actually go live, not just a database change.

**Finding D (not a defect) — Testimonials absence is correct, deliberate
behavior, confirmed by data.** `testimonials` table has 0 rows
(`count: 0`, confirmed live). `TestimonialsSection`'s own code explicitly documents
*"fabricating fake customer quotes would be actively dishonest, so zero
testimonials means the section is simply omitted"* and returns `null` when empty.
This is correct, matches the top-level brief's anti-fabrication principle, and is
unrelated to the quarantined stash.

**Finding E (confirms no regression) — "Related Vehicles" heading remains in
English** (`vehicle-detail.tsx`) while the rest of the site is Indonesian. This was
a deliberate decision *not* to change during Phase 2C.2 (documented at the time as
out-of-scope, to avoid unnecessary copy churn) — confirmed still present, not a new
issue, not fixed here.

### 14.10 Screenshot evidence

Stored in `evidence/phase-2c3/` (git-ignored — see `.gitignore`, not committed;
this repository has no existing policy for committing QA screenshots, so none were
added to it):

| File | What it shows |
|---|---|
| `home-390.png` | Homepage hero, mobile |
| `home-1440.png` | Homepage hero, desktop |
| `cars-390.png` | Cars catalogue, mobile (also shows Finding A) |
| `car-available-390.png` | AVAILABLE car detail, mobile |
| `car-sold-1440.png` | SOLD car detail, desktop (also visually confirms the CAR-0007 year contradiction from the editorial report — "2012" visible in the highlights text directly under "TAHUN 2013") |
| `moto-available-390.png` | AVAILABLE motorcycle detail, mobile |
| `cta-available-390-closeup.png` | AVAILABLE CTA close-up, confirms two-line wrap |
| `cta-sold-390-closeup.png` | SOLD CTA close-up, confirms single-line fit |
| `results.json` | Raw machine-readable output for all 28 route×viewport combinations |

### 14.11 CTO/CMO visual review (why, not just "looks good")

**Homepage hero (mobile and desktop):** PASS — headline, one-sentence subhead, and a
single primary CTA ("LIHAT SEMUA UNIT") establish one clear action above the fold at
every width tested; the scrim keeps white text legible over a real photo without
looking like a generic stock-photo overlay. No competing CTA, no clutter.

**Cars/Motorcycles catalogue (mobile):** PASS on layout — single-column cards at
390px, status badge legible over the photo, price/spec hierarchy clear, no card
overflow. The one issue found (Finding A, the unsupported inspection claim in the
page subtitle) is a copy/trust problem, not a layout problem — visually the page is
clean and restrained.

**Vehicle detail (AVAILABLE, mobile):** PASS — gallery, status, title, price, and
the start of specs are all visible with minimal scrolling; the AVAILABLE CTA's
two-line wrap is intentional and reads clearly, not cramped.

**Vehicle detail (SOLD, desktop):** PASS — the SOLD badge is immediately legible
next to the title (muted gray, distinct from AVAILABLE's green), the spec grid is
clean and evenly spaced, and the "SOROTAN" (highlights) list is readable prose, not
cramped chips — confirming the Phase 2C.2 pill-to-list change reads well in a real
browser, not just in code. On a 1440×900 viewport the primary CTA sits below the
initial fold (specs + first 5 highlights push it down roughly one extra scroll) —
this is a reasonable, not excessive, amount of content for a 2-column desktop
layout and matches the approved content order (identity → price → specs →
highlights → CTA); not treated as a defect.

**Overall:** the removal of the description block reads as an improvement, not a
regression — nothing in any screenshot shows awkward empty space or a hierarchy gap
where description used to be; specs flow directly into highlights, which flow
directly into the CTA, exactly as designed.

### 14.12 TypeScript / Lint / Build

Not rerun this phase — **no application code changed**. Last confirmed clean on
this exact HEAD's underlying implementation in Phase 2C.2 (`e4fe1eb`): `tsc
--noEmit`, `eslint`, `next build` all passed with 28 routes generated and 0 errors.

### 14.13 Git evidence (per this phase's simplified, non-self-referential
requirement)

```
Branch:                redesign/phase-2c2-vehicle-content-ux
Starting HEAD (this phase): b205707
git status before starting: clean
Stash list before starting:
  stash@{0}: WIP: unexplained homepage change (About+Testimonials removed) -
             found uncommitted at start of Phase 2C.3, not authored by this session
  stash@{1}: WIP: public UI restyle (pre-2C.2, uncommitted, found 2026-09-29)
```

Neither stash was applied, popped, dropped, renamed, or modified during this
phase — both were only listed, at the start and confirmed again at the end. Git
itself (`git log`, `git stash list` on this branch) is authoritative for the exact
final commit hash and push result; this report states the commit it was based on
(`b205707`) and, once committed, is itself part of the branch's history.

### 14.14 Final scorecard (Phase 2C.3C — supersedes §9/§13 for every row now
directly verified)

```
ARCHITECTURE:              PASS      (unchanged; no schema/logic touched)
PUBLIC UX:                 PASS      (real rendered evidence, §14.11)
MOBILE (390):               PASS      (§14.4 — 0 overflow, 0 broken images, 0 errors)
TABLET (768):                PASS      (§14.4)
DESKTOP (1024/1440):        PASS      (§14.4)
HOMEPAGE:                  PASS      (§14.11; Finding B/C/D noted, none are Phase 2C.2 regressions)
CARS CATALOGUE:            PASS      (§14.11; Finding A noted, pre-existing, not fixed)
MOTORCYCLES CATALOGUE:     PASS      (independently verified, not inferred from Cars — §14.4/14.11)
VEHICLE DETAIL:            PASS      (§14.7, §14.11)
AVAILABLE CTA:              PASS      (§14.7 — live href, rect, wrap confirmed)
SOLD CTA:                  PASS      (§14.7 — live href, rect confirmed; no vehicle-specific wording)
HIGHLIGHTS UX:               PASS      (§14.11 — reads cleanly, disclosure present, no overflow)
SEO:                        PASS      (Phase 2C.2 server-HTML check + this phase's title checks, §14.4 titles captured in raw results.json)
OG:                         INFERRED — NOT DIRECTLY VERIFIED (OG image tag not re-read via CDP this pass; carried forward from Phase 2C.2's direct HTML check, §5)
IMAGE ALT:                  PASS      (§14.6 — live DOM check, not just server HTML)
ACCESSIBILITY:               PASS for what was tested (§14.8); focus-visible styling INFERRED, not empirically tested
CONTENT INTEGRITY:          NEEDS HUMAN REVIEW — unchanged (§6); explicitly separate from technical merge readiness per this phase's §26
SECURITY:                   PASS      (0 vulnerabilities, Next.js 16.3.7 — unchanged)
TYPESCRIPT:                 NOT RUN this phase (no code changed; last PASS on e4fe1eb)
LINT:                       NOT RUN this phase (no code changed; last PASS on e4fe1eb)
BUILD:                      NOT RUN this phase (no code changed; last PASS on e4fe1eb)
GIT:                        CLEAN
STASH:                      UNTOUCHED (both entries)
```

### 14.15 FINAL DECISION

**FINAL DECISION: MERGE READY**

**RATIONALE:** Real browser QA, via headless Chrome driven directly over the Chrome
DevTools Protocol (no Claude-in-Chrome dependency, no new npm package), covered all
7 required routes at all 4 required viewports (28 combinations) plus 4 required
vehicle scenarios (AVAILABLE/SOLD × car/motorcycle), with live measurements —
not inference — for viewport width, scroll width, console errors, JS exceptions,
broken images, nested anchors, image alt text, and CTA behavior (href, touch
target, text, wrapping). Every one of those checks passed. TypeScript, lint, and
build were already confirmed clean on this exact implementation in Phase 2C.2 and
nothing has changed since. Dependency security is patched and re-confirmed
unchanged. Five findings surfaced during this real inspection (§14.9) — none of
them are in files this branch modified, none are regressions caused by Phase 2C.2,
and none were silently fixed or silently ignored; they're documented for separate,
fast follow-up work. Per this phase's own §26, open editorial/content items
(5 year contradictions, 1 suspicious stock number, all-15 highlights needing a
rewrite, plus the two newly-found unrelated content items in §14.9) are real and
should be acted on, but are explicitly not technical merge blockers.

**BLOCKERS:** None.

**NEXT ACTION:** Merge `redesign/phase-2c2-vehicle-content-ux` when the repository
owner is ready (this phase does not merge to main itself, per explicit
instruction). Separately, and not blocking that merge: (1) fix the "kurasi dan
inspeksi internal" copy on `/cars` and `/motorcycles` (Finding A) — a one-line
change in each of two files; (2) have an admin work through the editorial report's
6 named records and the all-15 highlights rewrite; (3) be aware the homepage needs
a rebuild/redeploy (or an explicit revalidation) to reflect the About section that
was recently activated in the CMS (Finding C) — unrelated to this branch, but
worth knowing before wondering why the change to the About section isn't visible.
