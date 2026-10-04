# Finance Phase 0A — Emergency Security Lockdown

## A. Executive Summary
Public (anon) access to the Perkasa Motors Finance database was removed on 2026-10-04. The Finance Supabase project `pefkfuoowzfnbkmygzxo` now denies anonymous and generic-authenticated reads, writes and function calls on all tables, backup tables and views. All 32 table fingerprints are identical before and after: no financial row changed. The old Finance dashboard login is disabled until Phase 0B. **Status: PASS** for containment. Finance authentication itself is **not** secure yet (see T/U).

## B. Incident / Risk Context
The architecture audit proved the Finance database was readable (verified with count-only requests) and, by policy, writable by anyone holding the public anon key embedded in the dashboard; `pm_partner_auth` accepted the literal `__internal__` as a password and legacy passwords sat in plaintext tables. Impact: confidentiality and integrity of units, capital, settlement, payroll and debt data.

## C. Product Decision — Partner Access Deferred
Partner-facing product is deferred. Access was retired; data was not. No partner, investor, capital or settlement row was deleted or changed.

## D. Base Finance SHA
`eaf3800675274c6d13a3447597c1033c9451f885` (origin/main before). Final Finance main: `9563160b26f7ec68423feb0a4c8524077c1f09da` (branch `security/phase-0a-finance-lockdown`, fast-forward, no rebase/squash/force). Netlify site `perkasamotorsdashboard`: commit_ref = 9563160, state ready.

## E. Base Website SHA
Website main before the report: `5a65bb0`. Website database `itjytnbipxaflnaplwpd` was not touched.

## F. Live Pre-Remediation Security State
Revalidated live before any write; matched the audit (no drift). Correction to the audit: Finance has **32** public base tables (29 was an undercount; the 6 backups are included). 32 base tables, 41 views, 33 functions; 6 tables without RLS; 20 `ALL true` policies; 4 `SELECT true` policies; 18 SECURITY DEFINER functions executable by anon (all 33 functions executable by anon/PUBLIC); 41 views readable by anon; all objects owned by `postgres`; 0 storage buckets; 1 auth user.

## G. Tables / RLS
Before: 20 allow_all tables, 4 select-open tables, 2 deny-all (`accounts`, `app_config`), 6 RLS-off backups. After: RLS enabled on all 32 base tables; 0 permissive policies; the 2 `no_direct_access` deny-all policies kept. ALLOW_ALL tables: 20 → 0. Tables without RLS: 6 → 0. No replacement policy was added.

## H. Backup Tables
accounts_bak_20260818 (4 rows, credentials, CRITICAL), app_config_bak_20260818 (3, config, CRITICAL), app_config_bak_phasec (7, config, CRITICAL), units_bak_20260818 (42, HIGH), kas_keluar_bak_20260818 (6, HIGH), aset_inventori_bak_20260818 (2, MEDIUM). Now RLS enabled, no policies, no anon/authenticated privileges. Not dropped, rows unmodified. No credential values appear in this report.

## I. Grants
Before: arwdDxtm on every table/view and rwU on every sequence for anon and authenticated; default privileges re-granted them for future objects. After: `REVOKE ALL` on all tables, views and sequences from anon and authenticated; default privileges revoked. `service_role` and `postgres` untouched. Catalog check: 0 anon and 0 authenticated table/view privileges.

## J. Views
All 41 SECURITY DEFINER views kept (not dropped or rewritten, no formula change); anon and authenticated SELECT revoked. Anon requests to v_inventory, v_unit_economics, v_profitability, v_cash_position, v_balance_sheet, v_capital_reconcile, v_reserve_reconcile: HTTP 401 `permission denied for view`. The advisor ERROR "security definer view" (41) is gone because the views are no longer exposed.

## K. RPC / Functions
33 functions: reporting (`fn_*`, `pm_funding_sim`), settlement (`pm_unit_settle_v2/policy/reverse`, `pm_settle_unit`, `pm_settlement_eligible`), reserve (`fn_refresh_perkasa_reserve`, `fn_sync_perkasa_reserve`, `pm_set/clear_reserve_override`, `pm_reserve_advance`), auth/admin (`pm_login`, `pm_partner_auth`, `pm_get/save_admin_config`), investor (`pm_save/delete_investor`), partner (`pm_partner_agreement_*`, `pm_partner_policy_save`), payroll, debt, `set_updated_at`. `REVOKE ALL` from PUBLIC, anon, authenticated on all of them. No function body, trigger (`trg_perkasa_reserve`) or formula was changed. Trigger functions keep firing for the owner role. Catalog check: 0 functions executable by anon or authenticated; `pm_unit_settle_v2`, `pm_partner_auth`, `pm_login` all denied.

## L. Legacy Auth Risk
`pm_login`, `accounts` (plaintext password column), `app_config` (shared admin password) and `pm_partner_auth` remain in the database, unchanged and now unreachable by anon. They are still bad design. Not rotated or migrated in 0A (Phase 0B).

## M. `__internal__` Exposure
Contained: every RPC it protects is no longer executable by anon, and `pm_partner_auth` itself is denied (HTTP 401 on a harmless empty-password probe). The bypass still exists in function source and the old client; it cannot be reached from the public API. Removal is Phase 0B.

## N. Partner Access Containment
Login is the only entrypoint to the old dashboard, so disabling it removes partner login, partner dashboard and investor portfolio access in one step. `index.html`: login fields and button disabled, neutral Indonesian notice shown ("Akses dashboard sementara dinonaktifkan selama peningkatan keamanan sistem…"), `doLogin()` returns before any database call (`PHASE_0A_LOCKDOWN` flag), stale `pm_session` entries are cleared on load. No partner fields, calculations or data removed. PARTNER LOGIN: DISABLED. PARTNER DASHBOARD: DISABLED (unreachable). PARTNER DATA: PRESERVED.

## O. Migration Applied
`supabase/phase24_0a_security_lockdown.sql` (applied as migration `phase_0a_finance_security_lockdown`), verification `supabase/phase24_0a_verify.sql`, evidence/rollback `docs/security/phase-0a-lockdown-evidence.md` in the Finance repo. Idempotent; metadata only.

## P. Financial Data Integrity Verification
md5 of every row per table, before vs after, for all 32 base tables (incl. units 51, unit_cost_entries 20, unit_funding 9, unit_settlement 6, capital_accounts 6, capital_allocations 84, reserve_ledger 8, founder_capital_ledger 2, debts 1, debt_payments 6, kas_keluar 7, backups): **all identical**. Financial rows modified: 0. Financial logic changed: NO.

## Q. Anonymous External Verification
Using the Finance app's own public anon key as an external browser would: GET units, capital_allocations, unit_cost_entries, unit_settlement, reserve_ledger, payroll_people, accounts, units_bak_20260818, accounts_bak_20260818, app_config_bak_phasec → HTTP 401 `42501 permission denied`; 7 views → 401; PATCH units and DELETE reserve_ledger with non-matching filters → 401; RPC pm_partner_auth → 401. No row data was read; no mutation RPC was invoked (permission/catalog evidence used instead).

## R. Finance SPA Impact
BROKEN BY DESIGN (until Phase 0B): all data screens, settlement, reversal, reserve, funding, payroll, debt, admin config, investor and partner screens (every database call needs a credential that no longer exists). WORKING: static page and login notice only. READ-ONLY: none. DEFERRED TO 0B: all of the above.

## S. Production Verification
Netlify `perkasamotorsdashboard` deploy ready on 9563160; production HTML contains the lockdown flag and notice. The Finance site itself remains publicly reachable (HTTP 200): it is now an empty shell with no data, but it is still a public surface; no access restriction was applied (none supported with current credentials/plan without new services). Database security stands independently.

## T. Remaining Security Debt (not hidden)
- Plaintext legacy passwords (`accounts`, backups) and shared admin password in `app_config`: still stored.
- `pm_login`, `pm_partner_auth` (`__internal__` and default fallback), custom accounts: still in the database.
- 33 functions with mutable `search_path` (advisor WARN, deferred, not publicly invocable).
- Old SPA architecture (browser to database, anon key).
- No actor identity in settlement history; no Supabase Auth integration; 1 existing auth user not linked to Finance.
- 30 tables with RLS and no policy (advisor INFO: intentional deny-all until 0B).
- Backup tables still exist.
- Leaked-password protection off.
- The Finance app is down for operations; business operating of Finance data is currently impossible through the UI.

## U. Phase 0B Requirements
Supabase Auth with OWNER/ADMIN/STAFF roles for Finance; owner/admin-only RLS policies and grants per table; re-authored RPCs (invoker rights or role checks via `auth.uid()`, fixed `search_path`, no password arguments); remove `__internal__`, default password and plaintext credentials; rotate all legacy passwords; decide archive/drop of backup tables; restore a working internal dashboard on the new auth; settlement actor audit.

## V. Cross-Device Checkpoint
Not needed: Phase 0A is complete on this Mac. Everything is in Git: Finance branch `security/phase-0a-finance-lockdown` at 9563160 (also main); migration already applied (do not re-apply; the SQL is idempotent anyway). Windows resume: `git fetch origin --prune`, new worktree from `origin/security/phase-0a-finance-lockdown`, run `supabase/phase24_0a_verify.sql` (all counts must be 0).

## W. Rollback Strategy
See `docs/security/phase-0a-lockdown-evidence.md` in the Finance repo. Rollback is operational recovery by granting narrow access to specific internal roles after Phase 0B authorization; restoring the previous wide-open state requires explicit Owner security approval and must not be done automatically. The UI notice can be reverted by setting `PHASE_0A_LOCKDOWN` to false and re-enabling the form, but that would only re-expose a login that cannot work.

## X. Final Verdict
FINANCE SECURITY CONTAINED — PROCEED TO PHASE 0B. Containment is verified from outside; financial data is unchanged; authentication is still legacy and the Finance dashboard is intentionally unavailable.
