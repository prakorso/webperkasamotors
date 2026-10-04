# Perkasa Motors — Stock Number Production Hygiene Fix (Phase 1.5B)

Policy now in force: **stock numbers are never reused.** `vehicles.id` (UUID) remains the immutable internal identity; `stock_number` is the human-readable operational label. Verdict: **SAFE TO CREATE NEW VEHICLES.**

## A. Executive summary
The 13 invalid QA/test rows were removed from the reuse pool, then one migration made reuse impossible: the generator now reads only the per-type sequence, the delete trigger keeps its SOLD/RESERVED/history lock but releases nothing, and a CHECK constraint rejects any new stock number that is not `CAR-NNNN` or `MOT-NNNN` (with a named exception for the two historical rows, which were not touched). Production verification: pool empty, next numbers `CAR-0009` and `MOT-0013`, a fingerprint of all 18 vehicle rows identical before and after, 23 of 23 policy tests passing on production (rolled back each time). The admin delete confirmations no longer promise reuse. One honest limit: the concurrency check proved uniqueness and format over 3,600 calls but the tool serialised the calls, so true interleaving was not demonstrated (safety rests on `nextval()` being the generator's only operation).

## B. Base SHA
`origin/main` = `ebe5151a2e265a78686486414f71392432aafbe2` (the audit commit; no database logic had changed since).

## C. Pre-write safety recheck (all matched the audit)
Same 13 pool rows (names and types), `car_stock_number_seq` 8/true, `motorcycle_stock_number_seq` 12/true, next CAR from the pool `QA-PAGN-03`, next MOT `MOT-0013`, 18 vehicles (newest created 2026-10-03), no format constraint yet, no repository change under `supabase/` since the audit. Baseline fingerprint of all vehicle rows (md5 over each row's JSON): `84d34547711ba680d0d52902ae497cee`; media rows 131; status-history rows 19.

## D. Exact 13 pool rows removed
All `vehicle_type = CAR`: `QA-PAGN-03`, `QA-PAGN-04`, `QA-PAGN-05`, `QA-T1-AVAIL-A`, `QA-T1-AVAIL-B`, `QA-T1-RESERVED`, `QA-T1-SOLD-NEWER`, `QA-T1-SOLD-OLDER-EDITED`, `TEST-PAGN-01`, `TEST-PAGN-02`, `TEST-PAGN-03`, `TEST-PAGN-04`, `TEST-PAGN-05`. Deleted by an exact name list (no wildcard) in a block that aborts and rolls back unless exactly 13 rows match. Before: 13 rows; after: 0 rows, 0 invalid rows left. (To undo, re-insert these names with `vehicle_type = 'CAR'`.)

## E. Old generator behavior
Prefer the alphabetically first pooled number for the vehicle type (no format check), else `nextval()`. Next CAR would have been `QA-PAGN-03`.

## F. New generator behavior
`generate_stock_number(v_type)` only calls `nextval()` on `car_stock_number_seq` / `motorcycle_stock_number_seq` and returns `CAR-` / `MOT-` plus the number left-padded to 4 digits. It raises an error past 9999 instead of letting `lpad()` silently truncate. It never reads `stock_number_pool`. Privileges unchanged (EXECUTE for `authenticated`, not `anon`).

## G. Delete-trigger change
`vehicles_before_delete()` keeps exactly the previous lock: refuse (errcode 23514) when the vehicle is SOLD or RESERVED now, or its status history shows it ever was. The only change: the `INSERT INTO stock_number_pool` is gone. Deleting a DRAFT/AVAILABLE/ARCHIVED vehicle now permanently retires its number.

## H. Reuse policy
Never reuse. `stock_number_pool` stays as an inert, empty legacy table (commented as such); nothing reads or writes it. Sequence gaps are accepted (cars: 0005 missing, motorcycles: 0002–0004 missing).

## I. Format constraint
`vehicles_stock_number_format_check`: `stock_number ~ '^(CAR|MOT)-[0-9]{4}$' OR stock_number IN ('QA-PAGN-01','QA-PAGN-02')`, added `NOT VALID` then validated (all 18 existing rows pass; `convalidated = true`). A plain constraint would also have blocked any later UPDATE of the two historical rows (PostgreSQL checks the new row version), so those two names are an explicit, commented exception. They cannot be re-inserted (UNIQUE) and the exception must not be extended. Manual-write audit: the admin form never sends `stock_number` on update and the app always inserts the generator's value, but staff sessions can write the column through the API, so the constraint is the real guard; tests show invalid inserts and updates are rejected by this constraint.

## J. Historical QA rows
`QA-PAGN-01` (SOLD, published) and `QA-PAGN-02` (AVAILABLE, published) were not modified: not renamed, status, slug, media and plate untouched. Evidence: fingerprint of all vehicle rows identical before and after (`84d34547711ba680d0d52902ae497cee`), 18 vehicles, 131 media rows, 19 history rows.

## K. Admin copy changes
`components/admin/inventory-list.tsx` and `components/admin/vehicle-form.tsx` delete confirmations: "Nomor stoknya bisa dipakai lagi." → "Nomor stoknya dipensiunkan permanen dan tidak akan dipakai lagi." Two comments in `lib/actions/vehicles.ts` that described reuse were corrected. No UI redesign.

## L. Next CAR proof
`CAR-0009`. Evidence: pool has 0 rows, `generate_stock_number` has no pool reference (checked on the live function text), `car_stock_number_seq` last_value 8/true so the next value is 9. The generator was deliberately not called on production because `nextval()` is not transactional and would permanently burn the number.

## M. Next MOTORCYCLE proof
`MOT-0013`: `motorcycle_stock_number_seq` last_value 12/true.

## N. Concurrency proof
Procedure: a throwaway schema `zz_stockproof` with its own sequences (starting at 9 and 13) and a copy of the live function text with names replaced (verified to touch no production sequence); 12 separate connections (6 CAR, 6 MOTORCYCLE) each requested 300 numbers with a tiny sleep. Result: 3,600 numbers issued; 1,800 CAR all distinct, exactly `CAR-0009…CAR-1808`; 1,800 MOT all distinct, exactly `MOT-0013…MOT-1812`; 0 bad formats; 0 QA/test identifiers. The scratch schema was dropped and production sequences were unchanged (8 and 12). Limit: the batches did not overlap (the tool executed the calls one after another), so simultaneous interleaving was not observed. The guarantee therefore rests on the function containing a single `nextval()` and no read-modify-write (asserted by test I) and PostgreSQL's documented atomicity of `nextval()`.

## O. Tests
New file `supabase/tests/stock_number_policy.sql` (one statement that always rolls back everything it creates; the exception text is the report). It checks A, B (generator definition builds `CAR-NNNN` / `MOT-NNNN`), C (deleted AVAILABLE vehicle not pooled), D (generator never references the pool), E (8 invalid formats rejected by the named constraint, invalid update rejected), F (exactly the two historical rows non-standard, still readable and updatable), G (SOLD undeletable), H (RESERVED undeletable, and still undeletable after returning to AVAILABLE), I (generator is only `nextval`, range guard present), plus pool and sequences unchanged. Results: rehearsal before applying the migration (migration and tests inside one rolled-back block): 23 PASS, 0 FAIL. After applying: 23 PASS, 0 FAIL on production. The repository has no SQL test runner, so this file is run through the SQL editor.

## P. Technical QA
`npm run lint` clean; `npx next typegen`; `npx tsc --noEmit` clean; `npm run build` compiled; `npm audit --omit=dev`: 0 vulnerabilities; `npm audit`: the same 6 existing dev-only highs (not fixed). `npm ci` ran for this worktree.

## Q. Production DB verification (read-only, after the migration)
Pool 0 rows; generator and delete trigger contain no pool reference; format constraint present and validated; 2 non-standard rows (the historical ones); vehicles 18 with identical fingerprint; media 131; history 19; sequences 8/true and 12/true; no leftover test vehicles or scratch schema; delete trigger present; `generate_stock_number` EXECUTE: `anon` false, `authenticated` true. Migration recorded in Supabase as version `20261004010626` (`retire_stock_number_reuse`); the repository file is `20261004010000_retire_stock_number_reuse.sql` (the repo and live version numbers have differed for every earlier migration too).

## R. Data safety
Writes performed: delete of the 13 audited pool rows; the migration (two functions, one constraint, comments); admin copy and comments. Not touched: any vehicle row, status, media, slug, plate, Finance, analytics/GA4/GTM, CMS content, social. The 0-modified count is proven by the identical vehicle fingerprint.

## S. Analytics impact
New reuse is impossible, so a future vehicle can no longer inherit a deleted vehicle's GA4 history and the planned `QA-` exclusion cannot hide a real car. Past reuse risk is documented, not rewritten (none observed in live data). The `created_at` guard in the analytics blueprint stays harmless. An immutable analytics id (UUID or dedicated public id) remains future architecture debt. GA4 was not modified.

## T. Final verdict
**SAFE TO CREATE NEW VEHICLES.** The next CAR is `CAR-0009` and the next motorcycle `MOT-0013`; QA/test identifiers can no longer be generated, no number can be released, and non-canonical numbers are rejected on write. Open items (not blockers): the two historical `QA-PAGN` vehicles still need an Owner decision; true interleaved concurrency was not demonstrated by the available tooling.
