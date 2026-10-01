# Perkasa Motors - Phase 2R.6A: Live Migration Preflight

Result: **STOPPED BEFORE APPLY. LIVE MIGRATION: NOT APPLIED.** Two gates are open and both are legitimate boundaries, not errors: (1) OWNER FACT REQUIRED about one vehicle's history, (2) OWNER AUTHORIZATION REQUIRED for a privileged database session, because the live catalog (functions, policies, triggers, grants) can neither be read nor changed with the credentials available here. Everything that could be done without those two things is done: security hardening of the migration, re-testing (42/42), live probes, snapshot, rollback plan.

## A. Authorization
Owner approved the Phase 2R.6 design (conceptually). No privileged database credential or authenticated database session exists in this environment: only the public anon key. Authorization needed from the Owner (and nothing else): sign in once to the Supabase dashboard in the Edge window opened for this purpose (it points at the project's SQL editor) and confirm AI may automate that one window, exactly as in Phase 2R.5A. No password, token, service-role key or SQL is requested in chat. A visible Edge window (debug port 9341, dedicated profile) was opened and is waiting on the Supabase sign-in page.

## B. Live schema introspection
Read-only with the anon key. What is observable and what is not:
| Probe | Result |
|---|---|
| `vehicle_status_history` table | does not exist (PGRST205) |
| `vehicles.external_id` / `sold_at` / `status_changed_at` | do not exist (42703) |
| Existing `vehicles` data | readable: 15 rows (public RLS) |
| `stock_number_pool` via anon | returns an empty list (RLS-filtered, consistent with the repo design) |
| PostgREST OpenAPI schema | 401 (not available to anon) |
| Function definitions, triggers, policies, grants, constraints, indexes | NOT observable with anon/PostgREST at all |
Conclusion: no Phase 2R.6 object exists live (no collision); everything else in the requested checklist needs catalog access (pg_catalog / dashboard SQL), which is gate 2.

## C. Repo / live drift matrix
| Object | Repo expectation | Live state | Match | Impact |
|---|---|---|---|---|
| vehicle_status_history | absent | absent | MATCH | safe to create |
| vehicles.external_id, sold_at, status_changed_at | absent | absent | MATCH | safe to add |
| vehicles table, id/stock_number/slug/status/is_published/is_featured/created_at/updated_at | present | present (selected without error; 15 rows) | MATCH (columns), types UNVERIFIED | |
| vehicle_status enum values | DRAFT, AVAILABLE, RESERVED, SOLD, ARCHIVED | AVAILABLE and SOLD observed | PARTIAL | enum list needs catalog |
| stock_number unique, slug unique | present | not observable | UNVERIFIED | |
| profiles, is_active_staff(), current_user_role() | present | staff login and admin worked in 2R.5A, so they exist and function | MATCH (behavioral) | |
| vehicles RLS policies + grants | per 20260814030400 | public read behaves as designed (anon sees only published AVAILABLE/RESERVED/SOLD) | MATCH (behavioral), definitions UNVERIFIED | |
| vehicles_before_delete function + trigger | per 20260816010000 | not observable | UNVERIFIED | the migration replaces its body; the live body must be captured first |
| generate_stock_number, stock_number_pool | per 20260815050000 / 20260816010000 | pool table exists (anon select returns 200 []); function not observable | PARTIAL | |
| vehicles_status_lifecycle (function/trigger) | absent | not observable (table/columns absent, so the trigger cannot meaningfully exist) | UNVERIFIED | |
Migration may proceed only if the UNVERIFIED rows are confirmed from the live catalog (first step of the privileged session, together with saving the live definitions as the rollback source).

## D. SECURITY DEFINER audit (done; migration corrected before any apply)
Findings on the Phase 2R.6 draft:
1. `vehicles_status_lifecycle()` used `set search_path = public`. References were schema-qualified, but a non-empty search_path still lets unqualified operator/function resolution reach `public`.
2. `vehicles_before_delete()` (replaced by this migration) was `set search_path = public`.
3. Neither function had its default PUBLIC EXECUTE privilege revoked (trigger functions cannot be called through the API, but the grant was needless).
Corrections made in `supabase/migrations/20261001010000_vehicle_lifecycle_os_readiness.sql` (semantics unchanged):
- both functions now use `set search_path = ''` with every reference already schema-qualified (`public.profiles`, `public.vehicle_status_history`, `public.stock_number_pool`, `auth.uid()`); built-ins resolve from `pg_catalog`.
- `revoke all on function ... from public, anon, authenticated` for both (a trigger needs no EXECUTE at fire time; verified).
- `auth.uid()` is used only to look up an existing `profiles` row; NULL outside a signed-in session; no caller-controlled object resolution remains.
Tests added: both functions are SECURITY DEFINER with `search_path=""`; no EXECUTE for anon/authenticated/PUBLIC on either; a staff user cannot call the trigger function directly; triggers still fire for staff after the revoke; object-shadowing attack (look-alike `profiles`, `vehicle_status_history`, `stock_number_pool` in an attacker schema placed first in the caller's search_path): history still lands in `public`, delete guard still blocks a once-reserved vehicle.
**SECURITY AUDIT: PASS (after fix).**

## E. Live vehicle snapshot (read-only; saved to the git-ignored `evidence/` folder)
15 vehicles visible: **2 AVAILABLE, 0 RESERVED, 13 SOLD** (DRAFT/ARCHIVED are invisible to anon; the 2R.5A admin session showed Draft/Arsip = 0 and total 15, consistent). Matches the Phase 2R.6 expectation.
- AVAILABLE: CAR-0001 (Hyundai Grand Avega Hatchback 2012, id 99441cae-a348-4ce8-8049-20be08c207d6, created 2026-08-18, last updated 2026-09-03T13:46Z); MOT-0010 (Suzuki GSX-R Sport 2017, id 355e8612-adb6-40d4-9000-7dbdbe9b60f1, created 2026-09-03T14:14:59Z, last updated 14:16:48Z).
- SOLD (13): CAR-0002, CAR-0003, CAR-0004, CAR-0006, CAR-0007, CAR-0008, MOT-0001, MOT-0005, MOT-0006, MOT-0007, MOT-0008, MOT-0009, QA-PAGN-01 (a QA-style record already marked SOLD; these will receive baseline history and can never be hard-deleted).
Full id/stock/slug/status/is_published/is_featured/created_at/updated_at rows are in `evidence/vehicles-before-2r6a.json` (not committed).

## F. Historical AVAILABLE-unit investigation
Evidence sources checked: vehicle timestamps, photo upload times, public content rows, repository seed/Git history, existing log tables. There is no audit or status log anywhere in the system (that gap is exactly what this migration fills), and the old admin form allowed free status edits without recording them.
- **MOT-0010 (Suzuki GSX-R Sport 2017): CONFIRMED NEVER RESERVED, on circumstantial but tight evidence.** The vehicle's whole life before it was last modified is 109 seconds (created 14:14:59, 8 photos uploaded 14:15:17-14:16:09, last update 14:16:48) and it has not been edited since. A reservation that started and ended inside that window, between photo uploads, is not plausible. Remaining uncertainty is low but nonzero; if the Owner prefers certainty it can be included in the question below.
- **CAR-0001 (Hyundai Grand Avega Hatchback 2012): HISTORY UNKNOWN.** Created 2026-08-18, photos uploaded the same day, edited as late as 2026-09-03; a 16-day span in which a reservation could have happened and ended unrecorded. No source in the system can confirm or refute it. Current status AVAILABLE is not evidence.
Per the gate rule, the migration is not applied while a unit's history is unknown.

**OWNER FACT REQUIRED**
Unit: CAR-0001, Hyundai Grand Avega Hatchback 2012.
Question: "Apakah unit ini pernah berstatus Dipesan/Reserved atau Terjual sebelumnya?"
How it will be used: if NO, the standard migration applies. If YES, the migration's baseline gets one extra row for this vehicle (`to_status = RESERVED`, `is_baseline = true`, no invented time) so the vehicle becomes permanently non-deletable. Either way no date is fabricated.

## G. Backup / recovery readiness
- Before-state evidence: vehicle snapshot saved locally (above); the previous `vehicles_before_delete` definition exists in `supabase/migrations/20260816010000_*.sql` (repo version).
- Required first step of the privileged session: dump the LIVE definitions of `vehicles_before_delete`, its trigger, `generate_stock_number`, the vehicles policies and grants, and `stock_number_pool` row count, save to `evidence/`, and diff them against the repo (drift check). The migration will not run if they differ materially.
- Supabase project backups/PITR availability could not be verified from here (plan-dependent, dashboard-only). The migration is additive and the rollback below loses only data created after the apply, so a restore is not the primary recovery path.
- **Rollback SQL (concrete, run in this order):**
```sql
drop trigger if exists vehicles_status_lifecycle on public.vehicles;
drop function if exists public.vehicles_status_lifecycle();
-- restore the previous delete guard exactly as in 20260816010000 (live copy from the evidence dump):
create or replace function public.vehicles_before_delete() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if OLD.status in ('SOLD','RESERVED') then
    raise exception 'Cannot delete a % vehicle (%). Its stock number is permanently reserved and cannot be freed. Archive it instead.', OLD.status, OLD.stock_number using errcode = '23514';
  end if;
  insert into public.stock_number_pool (vehicle_type, stock_number) values (OLD.vehicle_type, OLD.stock_number);
  return OLD;
end; $$;
-- export vehicle_status_history first if any real transitions were recorded, then:
drop table public.vehicle_status_history;
drop index if exists public.vehicles_external_id_key;
alter table public.vehicles drop constraint if exists vehicles_external_id_not_blank,
  drop column if exists external_id, drop column if exists sold_at, drop column if exists status_changed_at;
```
**BACKUP/ROLLBACK: READY (conditional on capturing the live definitions as step 1).**

## H. Migration final SQL review
`20261001010000_vehicle_lifecycle_os_readiness.sql`: additive only. Contains: 3 nullable columns, 1 CHECK, 1 partial unique index, 1 new table, 2 indexes, RLS enable + 1 staff SELECT policy + REVOKEs, 1 trigger function + 1 trigger, EXECUTE REVOKEs, 1 baseline INSERT (history only, RESERVED/SOLD vehicles, `is_baseline = true`), 1 `CREATE OR REPLACE FUNCTION` for the delete guard. No DROP, RENAME, TRUNCATE, DELETE, ALTER TYPE, id/stock rewrite or fabricated timestamp. Semantics unchanged from the reviewed Phase 2R.6 design; only the hardening in D was added.

## I. Test rerun
Migration test harness re-run after the SQL change: **42 of 42 PASS** (the original 35 lifecycle/security scenarios plus 7 new hardening scenarios; none removed). Same caveat as Phase 2R.6: PGlite is real PostgreSQL but not Supabase.

## J-L. Migration execution and post-verification
**NOT EXECUTED.** Post-schema and post-data verification (sections K and L of the brief) are therefore pending; their exact checks are defined: new columns exist; CHECK and partial unique index; history table, indexes, RLS, staff SELECT, anon denied, staff API writes denied; lifecycle trigger installed; delete function replaced; existing vehicles unchanged (id, stock_number, slug, price, status, is_published); all `sold_at` / `status_changed_at` NULL; baseline row count = 13 (+1 only if the Owner answers YES for CAR-0001); no stock number altered, no vehicle deleted.

## M-O. RLS, lifecycle, stock-number verification
Verified in the 42-scenario run (not live): history unreadable by anon, staff-readable, not API-writable; delete blocked for current and historical RESERVED/SOLD (including SOLD -> Archived and RESERVED -> Available); stock-number generator and pool unchanged and still reusing released numbers. Live definition verification pending the privileged session.

## P. Application compatibility
`lib/actions/vehicles.ts` (Phase 2R.6) works before and after the migration: it does not read or write the new columns, `deleteVehicle` degrades safely if the history table is missing, `setVehicleStatus` is unchanged and the trigger owns history, `status_changed_at` and `sold_at`. No owner-facing technical field added.

## Q. Public regression
Run on this branch in Phase 2R.6 (homepage 4 widths + /cars, /motorcycles, available and sold detail, /about, /financing, /contact, /articles): PASS, no change since. Not re-run this session because no application code or live data changed (the only edits are the migration file, the harness and documentation).

## R. Admin regression
NOT VERIFIED this session (no authenticated staff session; none requested, no manual walkthrough requested). No admin code changed since Phase 2R.5A.

## S. Technical validation
Run in this session after the migration edit (no application code changed): see the final results in the terminal summary (lint, typecheck, build, audit). The previous run on this branch: lint PASS, typecheck PASS, build PASS (29/29), `npm audit --omit=dev` 0 vulnerabilities, full audit 1 high transitive dev-tooling `brace-expansion`.

## T. Remaining limitations
- CAR-0001 history is unknown (F). MOT-0010 is a high-confidence "never reserved".
- Live catalog definitions unverified until a privileged session (C).
- Backup/PITR availability unverified.
- Vehicles that were reserved or sold before the migration, and are not RESERVED/SOLD now, cannot be detected except through the Owner's knowledge (only CAR-0001 is in that class).
- Staff with API access can still edit `sold_at` / `status_changed_at` / `external_id` directly on `vehicles` (history itself is protected); the owner UI never does.
- No live lifecycle test: a transition test would change a real vehicle's status and, once RESERVED or SOLD, make it permanently non-deletable; no unmistakable test record exists and none will be created. LIVE STATUS TRANSITION: NOT EXECUTED - SAFETY POLICY.

## U. Phase 2R.7 readiness
Not ready until the migration is applied. Next steps once the two gates are cleared (AI-executed in the same task): capture and diff live definitions, apply the migration once, run sections K-O live, deploy-compatibility check, public and admin regression, then PHASE 2R.7.
