# Perkasa Motors - Phase 2R.6A: Live Migration (Preflight + Authorized Apply)

Result: **PASS. LIVE MIGRATION APPLIED AND VERIFIED.** Migration `20261001010000_vehicle_lifecycle_os_readiness.sql` was applied once to the live Supabase project by AI, through the Owner-authorized dashboard session, after every preflight gate passed. No real vehicle was mutated; no CMS data changed. Task state REVIEW.

## A. Authorization
- Owner approved the Phase 2R.6 design, answered the one historical fact, and authorized AI to automate ONE Edge window (debug port 9341) signed in to the Supabase dashboard SQL editor: **CAR-0001 (Hyundai Grand Avega Hatchback 2012): "Belum pernah"** (never reserved or sold).
- Owner role: authorization and one business fact only. The Owner typed their own credentials into the Supabase sign-in page; no password, token, service-role key or database password passed through chat or was seen or stored by AI. The window targeted project "Perkasa Motors Website" (labeled PRODUCTION, Free plan).
- After use, the Edge instance was closed and its profile directory (which held the dashboard session) was deleted.

## B. Live schema introspection (read-only, catalog queries in the dashboard)
PostgreSQL 17.6. Captured (to the git-ignored `evidence/` folder): vehicles columns, enum values, indexes, constraints, triggers, RLS policies, grants, RLS flags, function definitions/owners/ACLs/config, `stock_number_pool` rows, status counts, and the 15 vehicle rows.

## C. Repository / live drift matrix
| Object | Repo expectation | Live state | Match | Impact |
|---|---|---|---|---|
| vehicles columns (id uuid PK default gen_random_uuid, stock_number, slug, status default DRAFT, is_published, is_featured, created_at, updated_at, created_by, capacity_cc, plate_number, ...) | per migrations | identical | MATCH | none |
| vehicle_status enum | DRAFT, AVAILABLE, RESERVED, SOLD, ARCHIVED | identical | MATCH | none |
| PK / stock_number unique / slug unique | present | `vehicles_pkey`, `vehicles_stock_number_key`, `vehicles_slug_key` | MATCH | none |
| other constraints | currency, capacity_cc checks, created_by FK | present | MATCH | none |
| profiles + is_active_staff() + current_user_role() | present | present (profiles: id, full_name, email, role, is_active, created_at); both functions SECURITY DEFINER `search_path=public` | MATCH | dependency satisfied |
| vehicles RLS | 1 public read + 4 staff policies | exactly those 5 policies, same predicates | MATCH | none |
| vehicles grants | Supabase default grants | anon/authenticated hold all DML-type privileges (default); RLS is the barrier | MATCH (pre-existing default) | noted in T |
| vehicles triggers | `vehicles_set_updated_at`, `vehicles_before_delete` | exactly those two | MATCH | none |
| vehicles_before_delete | per 20260816010000 | identical body (current-status lock + pool release), SECURITY DEFINER, `search_path=public` | MATCH | will be replaced by the hardened body |
| generate_stock_number / stock_number_pool | per 20260816010000 | identical function; pool exists with 14 released numbers, RLS enabled | MATCH | unchanged |
| Phase 2R.6 objects (`vehicle_status_history`, `vehicles_status_lifecycle`, `external_id`, `sold_at`, `status_changed_at`, `vehicles_external_id*`) | absent | absent (0 found) | MATCH | safe to apply |
No drift. **LIVE SCHEMA MATCH: PASS.**

## D. SECURITY DEFINER audit
Done in the earlier preflight session and corrected before apply (no change since): both trigger functions use `set search_path = ''` with every reference schema-qualified; EXECUTE revoked from PUBLIC, anon and authenticated; `auth.uid()` used only to look up an existing `profiles` row. Tests added for search_path, privileges and object-shadowing. Live confirmation: both functions are SECURITY DEFINER, owned by postgres, `proconfig = search_path=""`, ACL `{postgres, service_role}` only. **SECURITY AUDIT: PASS.**

## E. Live vehicle snapshot
15 vehicles: **2 AVAILABLE, 0 RESERVED, 13 SOLD**, all published. AVAILABLE: CAR-0001, MOT-0010. SOLD: CAR-0002, CAR-0003, CAR-0004, CAR-0006, CAR-0007, CAR-0008, MOT-0001, MOT-0005, MOT-0006, MOT-0007, MOT-0008, MOT-0009, QA-PAGN-01. Fingerprint before apply: `601c09ca8dd43ceb808b3421cb87fe1d` (md5 over id, stock number, slug, price, status, publish and feature flags, created_at, updated_at); stock-number pool: 14 rows, fingerprint `00a285b8ae30ce423f79360d4132a27f`; 100 media rows.

## F. Historical AVAILABLE-unit investigation
- MOT-0010: CONFIRMED NEVER RESERVED (109-second lifetime before its last edit; high-confidence circumstantial evidence).
- CAR-0001: was HISTORY UNKNOWN; **resolved by Owner statement: never reserved or sold.** No extra baseline row was needed; baseline = the 13 SOLD vehicles only (no RESERVED rows existed).
**HISTORICAL AVAILABLE CHECK: PASS.**

## G. Backup / recovery readiness
- Free plan: no PITR and no downloadable backup is available through the dashboard. Before-state evidence saved locally (`evidence/live-before-introspection.json`, `live-before-fingerprint.json`, vehicle snapshot).
- Previous `vehicles_before_delete` definition preserved (live capture plus the repo file `20260816010000_*.sql`).
- The migration is additive; the rollback below removes only what the migration created.
- **Rollback SQL (not needed, kept ready):**
```sql
drop trigger if exists vehicles_status_lifecycle on public.vehicles;
drop function if exists public.vehicles_status_lifecycle();
create or replace function public.vehicles_before_delete() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if OLD.status in ('SOLD','RESERVED') then
    raise exception 'Cannot delete a % vehicle (%). Its stock number is permanently reserved and cannot be freed. Archive it instead.', OLD.status, OLD.stock_number using errcode = '23514';
  end if;
  insert into public.stock_number_pool (vehicle_type, stock_number) values (OLD.vehicle_type, OLD.stock_number);
  return OLD;
end; $$;
-- export vehicle_status_history first if real transitions were recorded, then:
drop table public.vehicle_status_history;
drop index if exists public.vehicles_external_id_key;
alter table public.vehicles drop constraint if exists vehicles_external_id_not_blank,
  drop column if exists external_id, drop column if exists sold_at, drop column if exists status_changed_at;
```
Note: after rollback, restore the original default EXECUTE grant on `vehicles_before_delete` only if desired (the original had PUBLIC execute).
**BACKUP/ROLLBACK: READY.**

## H. Migration final SQL review
Additive only: 3 nullable columns, 1 CHECK, 1 partial unique index, 1 table, 2 indexes, RLS + 1 staff SELECT policy + REVOKEs, 1 trigger function + trigger, EXECUTE revokes, 1 truthful baseline INSERT (history only), 1 `CREATE OR REPLACE FUNCTION` (delete guard). No DROP, RENAME, TRUNCATE, DELETE, ALTER TYPE, id/stock rewrite or fabricated timestamp. The file applied is byte-identical to the repo file (md5 `bde4fbd7581366725f15739974b0f05d`).

## I. Test rerun
Migration harness: **42 of 42 PASS** (35 lifecycle/RLS scenarios plus 7 security-hardening scenarios) after the hardening edit. **MIGRATION TESTS: PASS.**

## J. Migration execution
- Method: pasted in full into the Supabase SQL editor and run as one query (a multi-statement query executes as a single implicit transaction, so it is all-or-nothing).
- First attempt (tab 1): the dashboard's request stayed on "Running..." and never reached the database. Verified afterwards: no active sessions, no locks, no idle-in-transaction connections, none of the new objects present, vehicle fingerprint unchanged. So no partial state existed.
- Second attempt (fresh tab, same authorized window): **"Success. No rows returned."** Applied exactly once. The stale first-tab request, if it ever fires, would fail loudly (columns already exist) and change nothing.

## K. Post-schema verification (live)
- `vehicles.external_id text NULL`, `sold_at timestamptz NULL`, `status_changed_at timestamptz NULL`: PRESENT.
- `vehicles_external_id_not_blank` CHECK: present. `vehicles_external_id_key` partial unique index (`WHERE external_id IS NOT NULL`): present.
- `vehicle_status_history`: present with columns id, vehicle_id, from_status, to_status, changed_at, changed_by, is_baseline; FK to vehicles ON DELETE CASCADE; FK to profiles ON DELETE SET NULL; CHECK from <> to; PK; indexes `vehicle_status_history_vehicle_idx` and partial `vehicle_status_history_commercial_idx`.
- RLS enabled; policy "staff can read vehicle status history" (SELECT, authenticated, `is_active_staff()`): present; no other policy.
- Trigger `vehicles_status_lifecycle` (BEFORE UPDATE OF status, WHEN status changes): installed. `vehicles_before_delete` trigger and `vehicles_set_updated_at`: still present.
- `vehicles_before_delete()` body replaced: references `vehicle_status_history` (confirmed in the live definition).
- No unrelated schema change (stock-number function and all vehicles policies unchanged).

## L. Post-data verification (live)
Vehicle count 15 and fingerprint `601c09ca8dd43ceb808b3421cb87fe1d`: **identical to before** (no id, stock number, slug, price, status, publish flag, feature flag, created_at or updated_at changed). Pool: 14 rows, fingerprint identical. Status counts 13 SOLD, 2 AVAILABLE. New columns non-NULL on existing rows: **0** (`sold_at` and `status_changed_at` NULL for all, `external_id` NULL for all). `vehicle_status_history`: **13 rows**, all `to_status = SOLD`, `from_status` NULL, `is_baseline = true`, `changed_by` NULL; none for the two AVAILABLE units, none RESERVED. No vehicle deleted, no stock number altered.

## M. RLS / security verification
- Privilege check (catalog): anon has no privileges on `vehicle_status_history`; authenticated has SELECT (plus the inert REFERENCES and TRIGGER) and no INSERT, UPDATE, DELETE or TRUNCATE; no EXECUTE on `vehicles_status_lifecycle` or `vehicles_before_delete` for anon or authenticated; `generate_stock_number` EXECUTE unchanged (authenticated yes, anon no).
- Through the live public API (anon key): `GET vehicle_status_history` -> 401 `42501 permission denied`; `POST vehicle_status_history` -> 401 `42501`; vehicles still readable (15 rows: 13 SOLD, 2 AVAILABLE) with the new columns visible as NULL. No public status-history endpoint.
- vehicles public-read policy and all staff policies unchanged; no RLS weakening.
- No service-role key or database credential appears in tracked code (scan clean).

## N. Lifecycle protection verification
Verified by (a) live function-definition inspection: `vehicles_before_delete` blocks when `old.status in ('SOLD','RESERVED')` OR the vehicle has any history row with `to_status in ('RESERVED','SOLD')`, errcode 23514; `vehicles_status_lifecycle` sets `status_changed_at`, sets `sold_at` only when null on entering SOLD, and appends a history row, all in the same transaction; and (b) the 42-scenario Postgres suite covering current RESERVED/SOLD, RESERVED -> AVAILABLE then delete, SOLD -> ARCHIVED then delete, never-commercial drafts remaining deletable, sold_at never overwritten. No real commercial vehicle was deleted or mutated.
**LIVE STATUS TRANSITION: NOT EXECUTED - SAFETY POLICY** (no unmistakable test record exists; a real transition would permanently lock a real vehicle's stock number).

## O. Stock-number verification
`generate_stock_number` definition is unchanged (identical after whitespace normalization, same ACL); `stock_number_pool` untouched (14 rows, same fingerprint); the history-aware delete guard is now the permanent-lifecycle guard (closing RESERVED -> AVAILABLE -> delete and SOLD -> Archived -> delete).

## P. Application compatibility
`lib/actions/vehicles.ts` (this branch) works with the migrated database: `deleteVehicle` now finds the history table and returns the friendly Indonesian lifecycle message; the DB trigger's 23514 maps to the same message; `setVehicleStatus` is unchanged and the trigger owns history, `status_changed_at` and `sold_at`; the public app reads no new column. No technical field was added to the owner UI. Live exercise of those admin actions was not performed (no staff session; no data mutation).

## Q. Public regression
AI-run against the live migrated database (production build of this branch, headless Edge): homepage at 1440, 1280, 768, 390; /about, /financing, /contact, /articles, /cars, /motorcycles, an AVAILABLE and a SOLD detail at 1440. No overflow, 0 console errors, 0 broken images; hierarchy and all Phase 2R.2-2R.5A outcomes unchanged (Pembiayaan nav, factual footer, one copyright, no "berkualitas", no Why Perkasa/About/Testimoni, Articles hidden). **PASS.**

## R. Admin regression
**NOT VERIFIED.** No authenticated staff (app) session is available; the Supabase dashboard session is not an app session. No manual walkthrough was requested. No admin code changed.

## S. Technical validation
Lint PASS. `npx next typegen` + `npx tsc --noEmit` PASS. `npm run build` PASS (29/29). `npm audit --omit=dev`: 0 vulnerabilities. Full `npm audit`: 1 high (transitive dev-tooling `brace-expansion`), unchanged; not fixed.

## T. Remaining limitations
- Live status transition and the admin delete/status actions are verified by definition inspection and the Postgres suite, not by a live transition.
- The history is empty of real transitions (13 baseline rows only); `sold_at` is NULL for all 13 historical SOLD units by design.
- Pre-existing Supabase default grants give `anon`/`authenticated` broad table privileges on `vehicles` (including TRUNCATE, which RLS does not govern); the API exposes only the normal verbs and RLS protects them, but a future hardening pass could revoke the unused ones. Not changed here (out of scope).
- `authenticated` retains the inert REFERENCES and TRIGGER privileges on the history table (no data-write capability); optional tidy-up.
- Staff with API access can still edit `sold_at`, `status_changed_at` and `external_id` directly on `vehicles`; the history table itself cannot be edited.
- Free plan: no PITR/backups available; recovery relies on the additive design and the rollback SQL.
- A stale "Running..." query tab may remain in the (now closed) dashboard window; it had no effect.

## U. Phase 2R.7 readiness
READY. Schema and code are aligned and verified. Suggested 2R.7 scope: final integrated QA with an authenticated admin session (inventory, status quick actions, delete behavior), ideally including one real owner-intentional status change as end-to-end proof, then merge planning.
