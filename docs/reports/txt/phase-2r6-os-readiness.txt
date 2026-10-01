# Perkasa Motors - Phase 2R.6: Operating System Readiness

Result: **PASS. MIGRATION READY FOR OWNER AUTHORIZATION - NOT APPLIED.** Additive migration designed and verified against a real Postgres engine (35/35 scenarios), application code updated, no live database or CMS change. Task state ACTIVE -> REVIEW. Not merged, not deployed.

## A. Base verification
Branch `integration/phase-2r6-os-readiness` from the pushed head of `integration/phase-2r5-admin-cms-simplification`: `9a12768f16d3d850430d3bebdecee21ce28eb271` (local and origin matched). Worktree `C:\Users\USER\webperkasamotors\.claude\worktrees\phase-2r6-os-readiness`. Governance, Phase 1R, 2R.5 and 2R.5A reports present. `.env.local` copied locally, gitignored, not committed.

## B. Current schema audit
From `supabase/migrations` (the repo is the declared source of truth; the live database was not introspected, so drift is not ruled out):
- `vehicles`: id uuid PK, `stock_number` unique, `slug` unique, `status vehicle_status` (DRAFT, AVAILABLE, RESERVED, SOLD, ARCHIVED), `is_published`, `is_featured`, `created_at`, `updated_at` (trigger `vehicles_set_updated_at`), `created_by -> profiles(id)`. No sold date, status timestamp, external key or status history existed (the code comment in `lib/data/vehicles.ts` and the 2R.5 dashboard note agree).
- Auth model: `profiles(id, is_active, role)` with `is_active_staff()` / `current_user_role()` SECURITY DEFINER helpers; staff RLS policies use `is_active_staff()`.
- RLS on vehicles: public read only when `is_published = true AND status IN (AVAILABLE, RESERVED, SOLD)`; staff read/insert/update/delete. Left unchanged.
- Read-only observation (from the Phase 2R.5A authenticated admin session; no data touched): 15 vehicles: 2 Tersedia, 0 Dipesan, 13 Terjual, 0 Draft/Arsip.

## C. Current lifecycle audit
- Status changes: owner action `setVehicleStatus` (Phase 2R.5) with an `ALLOWED_TRANSITIONS` map (SOLD has no outgoing owner move), `archiveVehicle` (any status -> ARCHIVED), and, historically, the old form's free status select. Nothing recorded who/when.
- Delete: DB trigger `vehicles_before_delete` blocked only vehicles whose CURRENT status is RESERVED or SOLD; the 2R.5 UI mirrored it.
- Two real holes in that rule: (1) RESERVED -> AVAILABLE -> Delete; (2) SOLD -> Arsipkan (ARCHIVED) -> Delete (ARCHIVED is not locked). Both let a once-commercial vehicle be deleted and its stock number released for reuse. Both are closed by the history-based rule below.

## D. Stock-number audit
`generate_stock_number` first reclaims numbers from `stock_number_pool`, else `nextval`. `vehicles_before_delete` releases the number of any deletable vehicle into the pool. So stock-number permanence reduces to "which vehicles can be deleted". Conclusion: making deletion history-aware is sufficient and necessary; no change to the pool or generator is required and none was made. The existing permanent protections are preserved (same function, same trigger, same error code 23514, current-status rule retained as a subset). Residual limitation: a vehicle that was reserved or sold BEFORE this migration but is not RESERVED/SOLD now (for example returned to AVAILABLE or ARCHIVED earlier) has no recorded history and stays deletable; the baseline seeding only covers vehicles that are RESERVED/SOLD at migration time. Live data currently shows no ARCHIVED/DRAFT units and 0 Dipesan, so the practical exposure is the 2 Tersedia units; the Owner can confirm they were never reserved before approving.

## E. external_id design
`vehicles.external_id text NULL`, CHECK not blank, `UNIQUE INDEX ... WHERE external_id IS NOT NULL`. Not shown publicly, not in the owner form, not read by any code, no sync. The primary key and `stock_number` are untouched; stock_number is explicitly not the integration key. Tested: unique when present (23505), blank rejected (23514), many NULLs allowed.

## F. sold_at design
`vehicles.sold_at timestamptz NULL`, set by the lifecycle trigger on the first transition into SOLD, never overwritten, never cleared (kept even if a SOLD unit is later archived). **No backfill:** the 13 existing SOLD vehicles keep `sold_at = NULL` (no truthful date; created_at/updated_at are not used). Public SOLD ordering is unchanged (still deterministic `created_at`); a future change can sort `sold_at DESC NULLS LAST` once real data accumulates.

## G. status_changed_at design
`vehicles.status_changed_at timestamptz NULL`, set only when `status` actually changes (trigger `WHEN old.status IS DISTINCT FROM new.status`). Distinct from `updated_at` (any edit). NULL for all existing rows. Tested: price edit leaves it NULL; same-status update no-op.

## H. Status-history design
`vehicle_status_history(id uuid PK, vehicle_id -> vehicles ON DELETE CASCADE, from_status NULL, to_status NOT NULL, changed_at default now(), changed_by -> profiles ON DELETE SET NULL, is_baseline boolean default false)`, CHECK from <> to.
- `reason` and `source` were NOT added (not needed now; avoid overbuilding). The one extra column, `is_baseline`, is justified: it marks the migration-seeded rows for vehicles that were already RESERVED/SOLD, whose real transition times are unknown (changed_at = migration time for those rows only).
- `changed_by` references `profiles(id)` (the existing pattern used by `created_by`; there is no FK to `auth.users` in this codebase) and is recorded only if the user exists in profiles, otherwise NULL.
- Written ONLY by SECURITY DEFINER trigger `vehicles_status_lifecycle`, in the same transaction as the status UPDATE. This is the atomicity answer: a status change and its history row, timestamps and `sold_at` cannot be partially applied, and it holds for every path (owner action, archive, SQL console), not just `setVehicleStatus`.
- Failed updates leave no history (tested, including a status change that fails a different constraint in the same statement).
- Vehicles deleted while never RESERVED/SOLD take their history with them (cascade); history of commercial vehicles is permanent because those vehicles cannot be deleted.

## I. ever_reserved decision
**NOT NEEDED (not added).** `vehicle_status_history` answers "was it ever RESERVED or SOLD?" exactly (`EXISTS ... to_status IN ('RESERVED','SOLD')`, served by a partial index), so a mutable boolean would only duplicate it and risk drifting. The baseline rows make that query complete from the migration forward (with the limitation in D).

## J. Delete protection (layered)
- Application (`lib/actions/vehicles.ts: deleteVehicle`): refuses if current status is RESERVED/SOLD or `hasCommercialHistory()` finds RESERVED/SOLD in history; returns the friendly Indonesian message "Unit yang pernah dipesan atau terjual tidak dapat dihapus. Arsipkan unit ini sebagai gantinya." If the history table does not exist yet (migration not applied) the check degrades safely to the current-status rule.
- Database (`vehicles_before_delete`, replaced in place): same rule using history, errcode 23514; the action maps that code to the same friendly message (no raw DB text).
- Draft/Archive rules: vehicles that never reached RESERVED/SOLD stay deletable and their stock numbers are still released (tested: DRAFT -> AVAILABLE -> DRAFT then delete succeeds, number goes to the pool and is reused).
- Admin UI: no redesign; the inventory list and edit form already show the server's error text, which is now the friendly message. The row lock icon still keys off current status.

## K. Visibility rule
Confirmed and documented, no change: DRAFT/ARCHIVED not public; AVAILABLE/RESERVED/SOLD public. `is_published` is derived from status in the owner workflow (2R.5) and kept as a column because the public RLS policy, media policy and queries still reference it. Future simplification: once nothing writes it independently, public RLS can use status alone and the column can be dropped in a separate, owner-approved migration. Not done here.

## L. Migration SQL
File: `supabase/migrations/20261001010000_vehicle_lifecycle_os_readiness.sql` (one migration). Sections and classification:
| # | Statement | Class |
|---|---|---|
| 1 | `ALTER TABLE vehicles ADD COLUMN external_id, sold_at, status_changed_at` (all NULL) | ADDITIVE |
| 1 | `ADD CONSTRAINT vehicles_external_id_not_blank` | CONSTRAINT |
| 1 | `CREATE UNIQUE INDEX vehicles_external_id_key ... WHERE external_id IS NOT NULL` | INDEX |
| 2 | `CREATE TABLE vehicle_status_history` | ADDITIVE |
| 2 | two indexes (vehicle+time; partial commercial) | INDEX |
| 2 | `ENABLE ROW LEVEL SECURITY`, staff SELECT policy, `REVOKE` anon all / authenticated write | POLICY |
| 3 | function `vehicles_status_lifecycle()` + BEFORE UPDATE OF status trigger | TRIGGER |
| 4 | `INSERT INTO vehicle_status_history ... SELECT FROM vehicles WHERE status IN (RESERVED, SOLD)` (is_baseline = true) | DATA-BACKFILL (history only; no vehicle column touched) |
| 5 | `CREATE OR REPLACE FUNCTION vehicles_before_delete()` (same trigger) | TRIGGER (behavior tightened) |
Destructive operations: **none** (no DROP, RENAME, DELETE, TRUNCATE, type change, id/stock/slug rewrite, status value change, fabricated timestamp). Impact if applied: instant on ~15 rows; one baseline row for each currently RESERVED/SOLD vehicle (13 expected); new triggers fire only on status change and delete.

## M. RLS / policies
`vehicle_status_history`: RLS enabled; `anon` has no privileges (verified: permission denied); active staff can SELECT (verified); staff cannot INSERT/UPDATE/DELETE through the API (verified, privileges revoked and no policy); only the SECURITY DEFINER trigger writes. The vehicles public-read policy and all other policies are unchanged (verified: anon still sees only published AVAILABLE/RESERVED/SOLD).

## N. Application mutation changes
Only `lib/actions/vehicles.ts` changed: `deleteVehicle` (history-aware, friendly error, graceful pre-migration) plus documentation on `setVehicleStatus`. `setVehicleStatus` needed no new writes: the trigger records history, `status_changed_at` and `sold_at`, and it keeps writing `status` + `is_published` exactly as in 2R.5. The code never reads or writes the new columns, so migration and code can be deployed in either order (this resolves the "code ahead of schema" concern without a compatibility layer). SOLD stays final from the owner UI; SOLD -> AVAILABLE not implemented.

## O. Test matrix
Tested on PGlite (in-process PostgreSQL) replaying the repo's real prior migrations (enums, tables, indexes, functions/triggers, RLS, stock-number generation, URL history, reuse/safe-delete, legacy normalization, capacity/plate) with minimal stand-ins for Supabase's `auth` schema, roles and `auth.uid()`, then the new migration. The live database was not used. **35 of 35 PASS:** migration applies; not silently idempotent; existing rows byte-identical (id, stock number, slug, price, status, publish flag, created_at); new columns NULL everywhere (no fabricated dates); baseline only for RESERVED/SOLD; DRAFT -> AVAILABLE (1 row, timestamps, changed_by); AVAILABLE -> RESERVED -> AVAILABLE (2 rows) then DELETE blocked, stock number not released; AVAILABLE -> SOLD sets sold_at; SOLD -> ARCHIVED keeps sold_at and DELETE blocked; re-entering SOLD does not move sold_at; pre-existing RESERVED -> AVAILABLE then DELETE blocked; pre-existing SOLD blocked; DRAFT -> AVAILABLE -> DRAFT deletable, stock number released and reused, history cascaded; never-commercial ARCHIVED deletable; price edit / same status / invalid status / failed multi-column update write no history; external_id uniqueness, blank rejection, many NULLs; anon denied, staff read allowed, staff writes denied; public vehicle policy unchanged; changed_by NULL without a user. Caveat: PGlite is Postgres but not Supabase; roles, grants and `auth.uid()` were simulated (default privileges mimicked Supabase's), so a final check on a Supabase staging branch is still advisable. The harness is kept in `docs/reports/phase-2r6-migration-test-harness.mjs.txt` (not part of the app, no dependency added to the repo).

## P. Public regression
Headless Edge/CDP on the production build: homepage 1440/1280/768/390; /about, /financing, /contact, /articles, /cars, /motorcycles, available and sold detail at 1440. No overflow, 0 console errors, 0 broken images; hierarchy and all Phase 2R.2-2R.5A results unchanged (Pembiayaan nav, factual footer, single copyright, no "berkualitas", no Why Perkasa/About/Testimoni, Articles hidden).

## Q. Admin regression
Signed-in session was closed after 2R.5A, so only the auth gate was re-checked (`/admin/dashboard`, `/admin/inventory`, `/admin/website` redirect to login). The only admin-reachable code change is the delete action (type-checked, linted, built). **PARTIAL:** signed-in admin rendering was not re-run; no admin component or route changed in this phase.

## R. Lint / typecheck / build / audit
Lint PASS. `npx next typegen` + `npx tsc --noEmit` PASS. `npm run build` PASS (29/29). `npm audit --omit=dev`: 0 vulnerabilities. Full `npm audit`: 1 high (transitive dev-tooling `brace-expansion`), unchanged; not fixed.

## S. Changed files
Added: `supabase/migrations/20261001010000_vehicle_lifecycle_os_readiness.sql`, `docs/reports/phase-2r6-migration-test-harness.mjs.txt`, this report (md/txt), `.ruflo/coordination/tasks/PHASE-2R6.json`. Modified: `lib/actions/vehicles.ts`. No other application file.

## T. Destructive-change verification
None. Static review of the SQL found no DROP/RENAME/DELETE/TRUNCATE/ALTER TYPE; the PGlite run confirmed existing vehicle rows are byte-identical before and after.

## U. OS integration contract (future; nothing built)
| Field | Future source of truth | Note |
|---|---|---|
| vehicle id (UUID) | CMS | local primary key, never replaced |
| external_id | OS (written once per vehicle) | unique when present; the only cross-system key |
| brand / model / year (and variant) | OS | CMS holds the public projection |
| price (public selling price) | OS | shared projection; CMS displays |
| status | OS | CMS mirrors; trigger records every change locally; `is_published` derived |
| sold_at | OS (truthful sale time) | CMS keeps its own trigger-set value until sync exists |
| photos | CMS | |
| highlights | CMS | |
| slug / SEO / alt / canonical | CMS (generated) | |
| stock_number | CMS (shared reference) | permanent once RESERVED/SOLD; NOT an integration key |
| cost, repairs, funding, margin, CRM/leads | OS only | must never enter the CMS |
Not decided/built: source markers, sync direction conflict rules, webhooks.

## V. Live migration readiness
**READY FOR OWNER AUTHORIZATION. NOT APPLIED.** Before applying (as a separate owner-authorized step, PHASE-2R6A): (1) Owner confirms the two Tersedia units were never reserved earlier (limitation D); (2) take a database backup/snapshot (shared staging/production project); (3) apply the single migration; (4) verify: columns exist, 13 baseline rows, history readable by staff only, one test via an isolated record or the first real status change; (5) revalidate. Rollback plan: no data loss paths; to revert, drop the trigger `vehicles_status_lifecycle`, restore the previous `vehicles_before_delete` body (from migration 20260816010000), then drop the table and columns. Application code is compatible both before and after.

## W. Phase 2R.7 readiness
Code and migration are ready for the final QA gate. Required before or during 2R.7: owner migration authorization (2R.6A) and a signed-in admin re-check including a real status change once the migration is live (status/price quick actions remain code-verified until then).
