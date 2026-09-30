# Agent Governance (canonical)

Status: **authoritative** for every AI agent (Codex, Claude, QA) and the Ruflo
orchestrator working in this repository. Other files point here; do not copy
these rules elsewhere.

## 1. Sources of truth

| Layer | Source of truth |
| --- | --- |
| Code and history | GitHub `prakorso/webperkasamotors` |
| Live data and schema | Supabase (schema changes follow `docs/SOURCE-OF-TRUTH-AND-DEPLOYMENT.md`) |
| Approved UI baseline | `76c206ea906e2351cce70ff1dbd6642f20ff1f79` (`redesign/phase-2b-sold-vehicle-experience`) |
| Approved technical baseline | `0d91bf707593161df8bc4cc0ade0d369dd74d1b0` (`redesign/phase-2c4-trust-cms-freshness-v2`) |
| Remote main | `origin/main` @ `bc8eaa187cd44f4e673117ae20150b8b62fdb245` |
| Preserved Windows UI/UX work | `preserve/windows-uiux-15e525f` @ `15e525fc43c16c91f2a3f58be0aa8a1801414005` (preserved, not approved, not merged) |
| Current R3B UI/UX checkpoint | branch `feat/ui-r3b-vehicle-detail` @ `cc90d4fb7dd822bea421c1fbb8b2ee4a0b6c6500` (checkpoint input for Phase 1R; not approved, not merged; on GitHub) |
| Product and admin spec | Phase A+B Product & Admin Experience Audit: `docs/reports/product-admin-experience-audit-phase-a-b.md` (TXT mirror `docs/reports/txt/product-admin-experience-audit-phase-a-b.txt`) |
| Merge authority | The Owner. Nothing merges or deploys without explicit owner approval. |

The two baselines are **not competing truths**. `76c206e` is the visual intent.
`0d91bf7` is the technical and product behavior. Both descend from `d079e46`
and neither contains the other. Reconciling them is Phase 1R, not this
document's job. The target is: visual intent of `76c206e` plus technical
behavior of `0d91bf7`.

## 2. Planes

- **Shared checkout** (`C:\Users\USER\webperkasamotors`) is the **control and
  observation plane**. Agents may read, fetch and inspect there. They must not
  develop, switch task branches, reset, stash, commit implementation, resolve
  conflicts or run destructive sync there.
- **Worktrees** (`.claude/worktrees/<task>`) are **execution planes**.
- **Ruflo** is the orchestrator. **Agents** are scoped workers. **Owner** is
  merge authority.

## 3. One-writer rule

ONE TASK = ONE BRANCH = ONE ISOLATED WORKTREE = ONE ACTIVE WRITE OWNER.

Two write-capable agents must never mutate the same worktree at the same time.
A collision means STOP, never takeover.

## 4. Roles

| Role | Owns | Must not decide alone |
| --- | --- | --- |
| Head Orchestrator (Ruflo) | task intake, base SHA, branch and worktree allocation, single write owner, sequencing, state, collision detection, handoffs, reports, next-actor recommendation | broad application implementation unless explicitly assigned |
| UI/UX Agent (Codex) | layout, typography, spacing, responsive behavior, visual hierarchy, component presentation, visual consistency, front-end polish | feature existence, business rules, CMS architecture, data ownership, Operating System architecture, schema. Product-level findings are handed to Product/Technical. |
| Product/Technical Agent (Claude) | product decisions, customer journey, conversion logic, CMS/admin simplification, technical behavior, business semantics, integration architecture, backend safety, Operating System readiness | overriding approved visual intent without reconciliation |
| QA/Reconciliation Agent | diff inspection, workstream comparison, regression and scope checks, branch lineage, QA runs, reconciliation matrix, MERGE READY / NOT MERGE READY recommendation | mutating code. Default mode is READ ONLY until write ownership is explicitly transferred. |

Codex must not invent or implement product features (wishlist, accounts,
advanced filters, compare, booking, chatbot, trade-in, lead forms, richer
financing tools) without a Product decision first.

## 5. Task record

Every task states, before any mutation (exact SHA, never "current" or "latest"):

```
TASK:  TASK TYPE:  BASE BRANCH:  BASE SHA:  TARGET BRANCH:
TARGET WORKTREE:  WRITE OWNER:  REVIEWER:  STATUS:
```

Task types and default owner:

| Type | Default owner |
| --- | --- |
| UI_UX | Codex |
| PRODUCT, TECHNICAL, ADMIN_CMS, CONTENT | Claude |
| INFRA | Claude, or a dedicated technical agent the orchestrator assigns |
| RECONCILIATION, QA | QA/Reconciliation |

States: `READY` -> `ACTIVE` -> `REVIEW` -> `MERGE_READY` -> `CLOSED`, plus
`BLOCKED`, `PAUSED`, `RECONCILIATION_REQUIRED`.

- Mutation is allowed only while `ACTIVE` with an explicit write owner.
- QA starts only at `REVIEW`, after implementation write ownership is released.
- `MERGE_READY` is a recommendation, never an action.

Task records live in `.ruflo/coordination/tasks/<TASK>.json`
(see `.ruflo/coordination/README.md`). No database service is used.

## 6. Runtime locks

`.ruflo/coordination/locks/<TASK>.lock` holds: TASK, WORKTREE, BRANCH, WRITE
OWNER, PID/SESSION if available, STATUS, STARTED, LAST SEEN.

- Locks are ephemeral and git-ignored. Do not commit them.
- Create with exclusive create (fail if present). Never overwrite.
- A stale lock is never removed automatically when ownership is uncertain.
  Ask the Owner.

## 7. Stashes

Stashes are not an orchestration mechanism. Existing stashes are quarantined
historical state. Do not pop, apply, drop or rewrite them, and do not use stash
as a branch handoff, without Owner approval. Hand work off with commits,
branches and worktrees. (The stash stack is shared by every worktree.)

## 8. Handoff format

```
TASK:  TASK TYPE:
BRANCH:  WORKTREE:
BASE SHA:  CURRENT HEAD:
WRITE OWNER:  WRITE PERMISSION: YES / NO
FILES CHANGED:
TESTS RUN:
KNOWN RISKS:
PROTECTED BEHAVIORS:
REPORT PATH:
NEXT ACTOR:
STATUS:
```

## 9. Protected behaviors

Future UI work must not silently revert these (technical baseline `0d91bf7`
unless noted):

- AVAILABLE CTA behavior
- SOLD CTA behavior, and the generic SOLD inquiry behavior
- vehicle description removal
- deterministic image alt fallback
- derived SEO metadata, canonical URLs, primary-photo Open Graph behavior
- highlights presentation behavior
- CMS revalidation behavior
- catalogue trust-copy cleanup
- "Unit Lainnya" vocabulary
- dead/broken UI removals from earlier phases
- responsive fixes from Phase 1 / 1.5
- Next.js 16.3.7 security baseline (already present on `main`)

Registered separately: the approved visual intent of `76c206e`.

These are registered by name from the Owner's brief. Their exact code
locations on `0d91bf7` have not been mapped yet; Phase 1R does that.

## 10. Product direction (context only)

Public: inventory is core; WhatsApp is the primary conversion; keep a small
inventory simple and do not fake scale; no unsupported inspection or
certification claims; SOLD units may stay visible as real social proof;
financing is guidance, not a leasing quote; About is short and factual; How to
Buy is preferred over generic "Why Us"; Articles are secondary; Testimonials
only if real.

Admin/CMS: Inventory is the operational center; the owner enters business
information, not technical metadata; slug, SEO, OG, alt and canonical are
automatic where safe; status and price changes are fast; the CMS is
task-based, not database-shaped; Leads must not become a fake CRM; the CMS is
a publishing/execution layer.

## 11. Operating System boundary (future, not built)

The Operating System should eventually own: vehicle operational identity,
acquisition, repairs, funding, investor information, profitability, source
selling price, source sales status, sold timestamp, CRM/leads.

The CMS owns: public photos, marketing highlights, website content, About,
homepage, articles, WhatsApp templates, generated SEO output, public
presentation.

Shared: public vehicle identity, selling price display, status projection.

## 12. No auto-merge

The orchestrator never merges, pushes `main`, deletes task branches, force
pushes, rebases another active agent's branch, or resolves product conflicts
automatically. It may only recommend `MERGE_READY`. Owner approval is
mandatory.

## 13. Reports

Every substantial task writes a full, editable, UTF-8 TXT report under
`docs/reports/txt/`. If a canonical Markdown report exists, keep it and add a
TXT mirror.

## 14. Next task

`PHASE-1R` - Baseline Reconciliation Audit (READY, not started, no coding):
compare `76c206e`, `0d91bf7`, the preserved Windows UI/UX `15e525f`, the R3B checkpoint `cc90d4f` and the Product/Admin audit, and classify every
difference as UI_ONLY, TECHNICAL_ONLY, WINDOWS_UIUX_ONLY, R3B_ONLY, PRODUCT_SPEC_ONLY, OVERLAP_SAFE,
RECONCILIATION_REQUIRED or HIGH_RISK_CONFLICT. See
`.ruflo/coordination/tasks/PHASE-1R.json`.

### Reconciliation rule for Phase 1R

No branch wins everything.

- Visual concern -> UI intent wins (UI baseline `76c206e` plus approved R3B UI/UX).
- Behavior or business-logic concern -> Phase 2C technical baseline (`0d91bf7`) wins.
- Product existence or flow concern -> Phase A+B product spec wins.
- Mixed file -> semantic reconciliation required.

Phase 1R inputs: UI `76c206e`, Technical `0d91bf7`, Windows UI/UX `15e525f`
(branch `preserve/windows-uiux-15e525f`), R3B `cc90d4f` (branch
`feat/ui-r3b-vehicle-detail`), Phase A+B audit. Classes: UI_ONLY,
TECHNICAL_ONLY, WINDOWS_UIUX_ONLY, R3B_ONLY, PRODUCT_SPEC_ONLY, OVERLAP_SAFE,
RECONCILIATION_REQUIRED, HIGH_RISK_CONFLICT.

Lineage rule: R3B (`cc90d4f`) is NOT a sibling of the Windows UI/UX commit
(`15e525f`). The chain is `bc8eaa1` -> `15e525f` -> `cc90d4f`. Phase 1R compares
`15e525f` against `bc8eaa1`, and `cc90d4f` against `15e525f`, and must not
count `15e525f` changes twice.

## 15. Shared checkout status

Shared checkout = CONTROL PLANE. Implementation permission: NO. Active write
owner: NONE. Implementation tasks must use isolated worktrees.
